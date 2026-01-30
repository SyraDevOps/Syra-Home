
// API MODULE - SORY
// Handles external data fetching (Wiki, Books, Images, Anime, Weather, TV, Market, Reddit)

async function searchWiki(query) {
    try {
        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.status === 404) return { extract: "Conceito não indexado na base Wiki principal.", title: query, type: "not_found" };
        if (!res.ok) return null;
        const data = await res.json();
        return {
            extract: data.extract,
            description: data.description,
            type: data.type,
            title: data.title
        };
    } catch (e) { return null; }
}

async function searchBooks(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "BUSCANDO OBRAS...";

    // Helper for OpenLibrary Fallback
    async function fallbackOpenLibrary(q) {
        try {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) { return {}; }
    }

    try {
        // 1. Try Google Books (Fast, Relevant)
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
        const gRes = await fetch(googleUrl);
        const gData = await gRes.json();

        let books = [];

        if (gData.items && gData.items.length > 0) {
            books = gData.items.map(i => ({
                title: i.volumeInfo.title,
                author: i.volumeInfo.authors ? i.volumeInfo.authors[0] : "Autor desconhecido",
                cover: i.volumeInfo.imageLinks ? (i.volumeInfo.imageLinks.thumbnail || i.volumeInfo.imageLinks.smallThumbnail).replace('http:', 'https:') : null,
                year: i.volumeInfo.publishedDate ? i.volumeInfo.publishedDate.split('-')[0] : 'N/A'
            }));
        }

        // 2. Fallback to OpenLibrary
        if (books.length === 0) {
            const olData = await fallbackOpenLibrary(query);
            if (olData.docs) {
                books = olData.docs.slice(0, 10).map(b => ({
                    title: b.title,
                    author: b.author_name ? b.author_name[0] : "Desconhecido",
                    cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
                    year: b.first_publish_year || 'N/A'
                }));
            }
        }

        // Render Premium Horizontal Gallery
        if (books.length > 0) {
            spheres[0].state = 'response';
            isSynchronized = true;

            const booksHtml = books.filter(b => b.cover).map(b => `
                <div class="book-card glass-card" style="flex: 0 0 auto; width: 160px; padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s; cursor: pointer;" 
                     onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.4)';" 
                     onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 20px rgba(0,0,0,0.2)';">
                    <img src="${b.cover}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px; box-shadow: 0 8px 20px rgba(0,0,0,0.4);">
                    <div style="width: 100%; text-align: center;">
                        <div style="font-size: 0.75rem; font-weight: 600; line-height: 1.3; margin-bottom: 6px; color: var(--text); letter-spacing: 0.5px;">${b.title.substring(0, 45)}${b.title.length > 45 ? '...' : ''}</div>
                        <div style="font-size: 0.65rem; opacity: 0.6; color: var(--accent); font-family: 'Outfit'; text-transform: uppercase; letter-spacing: 1px;">${b.author}</div>
                        <div style="font-size: 0.55rem; opacity: 0.4; margin-top: 4px;">${b.year}</div>
                    </div>
                </div>
            `).join('');

            voxDisplay.innerHTML = `
                <div class="glass-card" style="max-width: 90%; margin: 0 auto; padding: 0; overflow: hidden; animation: fadeUp 0.8s ease;">
                    <div style="padding: 20px; border-bottom: 1px solid rgba(var(--text-rgb), 0.1);">
                        <span style="font-size: 0.75rem; letter-spacing: 3px; color: var(--accent); font-weight: 700;">BIBLIOTECA // ${books.filter(b => b.cover).length} RESULTADOS</span>
                    </div>
                    <div id="book-scroll-container" style="display: flex; gap: 15px; overflow-x: auto; padding: 20px; scroll-behavior: smooth; scrollbar-width: thin;">
                        ${booksHtml}
                    </div>
                    <div style="padding: 10px; text-align: center; font-size: 0.55rem; opacity: 0.3; letter-spacing: 2px;">
                        â† DESLIZE PARA NAVEGAR â†’
                    </div>
                </div>
            `;

            speak(`Encontrei ${books.filter(b => b.cover).length} obras sobre ${query}.`);

            // Log to history
            if (typeof window.logInteraction === 'function') {
                window.logInteraction('book_search', query, books.filter(b => b.cover).length);
            }
        } else {
            throw new Error("No books found anywhere.");
        }

    } catch (err) {
        console.error(err);
        spheres[0].state = 'error';
        userDisplay.textContent = "Busca literária falhou.";
        voxDisplay.innerHTML = `<div style="color:var(--accent); font-size:1.2rem; margin-top:20px; opacity:0.7;">Nenhum registro encontrado.</div>`;
        speak("Não encontrei registros literários disponíveis.");
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

async function searchImages(query, source = 'all') {
    spheres[0].state = 'processing';
    userDisplay.textContent = "BUSCANDO IMAGENS...";

    try {
        let images = [];
        const encodedQ = encodeURIComponent(query);

        const fetchPromises = [];

        fetchPromises.push(
            fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedQ}&gsrlimit=10&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`)
                .then(res => res.json())
                .then(data => {
                    if (data.query && data.query.pages) {
                        return Object.values(data.query.pages)
                            .filter(p => p.imageinfo && p.imageinfo[0].url)
                            .map(p => ({
                                url: p.imageinfo[0].thumburl || p.imageinfo[0].url,
                                fullUrl: p.imageinfo[0].url,
                                title: p.title.replace("File:", "").replace(/\.\w+$/, ""),
                                source: 'WIKI_COMMONS'
                            }));
                    }
                    return [];
                })
                .catch(() => [])
        );

        fetchPromises.push(
            fetch(`https://images-api.nasa.gov/search?q=${encodedQ}&media_type=image`)
                .then(res => res.json())
                .then(data => {
                    if (data.collection && data.collection.items) {
                        return data.collection.items.slice(0, 10).map(item => ({
                            url: item.links && item.links.length > 0 ? item.links[0].href : '',
                            fullUrl: item.links && item.links.length > 0 ? item.links[0].href : '',
                            title: item.data[0].title,
                            source: 'NASA'
                        })).filter(i => i.url);
                    }
                    return [];
                })
                .catch(() => [])
        );

        fetchPromises.push(
            fetch(`https://archive.org/advancedsearch.php?q=${encodedQ} AND mediatype:image&fl[]=identifier&fl[]=title&rows=10&output=json`)
                .then(res => res.json())
                .then(data => {
                    if (data.response && data.response.docs && data.response.docs.length > 0) {
                        return data.response.docs.map(doc => ({
                            url: `https://archive.org/services/img/${doc.identifier}`,
                            fullUrl: `https://archive.org/services/img/${doc.identifier}`,
                            title: doc.title || query,
                            source: 'ARCHIVE.ORG'
                        }));
                    }
                    return [];
                })
                .catch(() => [])
        );

        const results = await Promise.all(fetchPromises);
        images = results.flat();

        if (images.length === 0) {
            const seed = Math.floor(Math.random() * 1000);
            images.push({
                url: `https://image.pollinations.ai/prompt/${encodedQ}?width=800&height=600&seed=${seed}&nologo=true`,
                fullUrl: `https://image.pollinations.ai/prompt/${encodedQ}?width=800&height=600&seed=${seed}&nologo=true`,
                title: `Geração Neural: ${query}`,
                source: 'POLLINATIONS'
            });
        }

        if (images.length > 0) {
            spheres[0].state = 'response';
            isSynchronized = true;
            currentGallery = {
                images: images,
                allImages: images,
                index: 0,
                active: true,
                filter: 'ALL'
            };
            speak(`Encontrei ${images.length} imagens de múltiplas fontes.`);
            if (typeof showGallery === 'function') showGallery();

            if (typeof window.logInteraction === 'function') {
                window.logInteraction('image_search', query, images.length, {
                    sources: [...new Set(images.map(i => i.source))]
                });
            }
        } else {
            throw new Error("No images found");
        }

    } catch (e) {
        console.error(e);
        spheres[0].state = 'error';
        userDisplay.textContent = "Erro na busca visual.";
        speak("Nenhuma imagem encontrada.");
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

async function searchAnime(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "BUSCANDO ANIME...";
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();

        if (data.data && data.data.length > 0) {
            const anime = data.data[0];
            const title = anime.title;
            const synopsis = anime.synopsis ? anime.synopsis.substring(0, 180) + "..." : "Sem sinopse.";
            const score = anime.score || "N/A";
            const img = anime.images.jpg.large_image_url;
            const url = anime.url;

            voxDisplay.innerHTML = `
                <div class="glass-card" style="display:flex; flex-direction: column; align-items: center; gap:20px; max-width:450px; margin:0 auto; margin-bottom: 90px; animation:fadeUp 0.8s ease; text-align: center; padding: 30px;">
                    <img src="${img}" style="height:280px; border-radius:8px; box-shadow:0 15px 50px rgba(0,0,0,0.6); transform: translateY(-10px);">
                    
                    <div style="width:100%;">
                        <h2 style="margin:0; font-size:1.5rem; color:var(--accent); letter-spacing:2px; font-weight:700; text-transform:uppercase;">${title}</h2>
                        <div style="font-size:0.75rem; opacity:0.5; margin:8px 0 20px 0; letter-spacing:1px;">SCORE: ${score} // ${anime.year || 'N/A'}</div>
                        
                        <p style="font-size:0.9rem; line-height:1.6; opacity:0.8; margin-bottom:25px; font-weight:300; font-family:'Inter';">${synopsis}</p>
                        
                        <a href="${url}" target="_blank" style="display:inline-block; font-size:0.7rem; color:var(--text); text-decoration:none; border:1px solid rgba(var(--text-rgb), 0.3); padding:8px 24px; border-radius:50px; transition: all 0.3s; letter-spacing:1px;">MYANIMELIST</a>
                    </div>
                </div>
            `;

            speak(`Encontrei ${title}. Nota ${score}.`);
            spheres[0].state = 'response';
            isSynchronized = true;

            // Log to history
            if (typeof window.logInteraction === 'function') {
                window.logInteraction('anime_search', query, 1, { title, episodes: anime.episodes, rating: score });
            }
        } else {
            throw new Error("Anime not found");
        }
    } catch (e) {
        console.error(e);
        speak("Anime não encontrado.");
        voxDisplay.innerHTML = `<div class="glass-card" style="text-align:center; color:var(--accent);">Anime não encontrado na rede.</div>`;
        spheres[0].state = 'error';
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

async function getWeather(city) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "BUSCANDO CLIMA...";
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) return `Cidade não encontrada: ${city}.`;

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,precipitation_probability,weathercode&timezone=auto`);
        const wData = await weatherRes.json();

        const current = wData.current_weather;
        const hourlyIndex = new Date().getHours();

        const humidity = wData.hourly.relativehumidity_2m[hourlyIndex] || '?';
        const feelsLike = wData.hourly.apparent_temperature[hourlyIndex] || current.temperature;
        const precip = wData.hourly.precipitation_probability[hourlyIndex] || 0;

        const codes = {
            0: 'Céu Limpo', 1: 'Parcialmente Nublado', 2: 'Nublado', 3: 'Encoberto',
            45: 'Nevoeiro', 48: 'Nevoeiro', 51: 'Garoa Leve', 53: 'Garoa', 55: 'Garoa Forte',
            61: 'Chuva Fraca', 63: 'Chuva Moderada', 65: 'Chuva Forte',
            80: 'Pancadas de Chuva', 95: 'Tempestade', 96: 'Tempestade com Granizo'
        };
        const condition = codes[current.weathercode] || 'Indefinido';

        voxDisplay.innerHTML = `
            <div class="glass-card" style="max-width:400px; margin:0 auto; animation:fadeUp 0.8s ease;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:15px;">
                    <div style="text-align:left;">
                        <div style="font-size:3.5rem; font-weight:700; line-height:1; font-family:'Outfit';">${Math.round(current.temperature)}°</div>
                        <div style="font-size:1rem; opacity:0.8; margin-top:5px; font-weight:300;">${condition}</div>
                    </div>
                    <div style="text-align:right;">
                         <div style="font-size:1.2rem; font-weight:600; color:var(--accent);">${name.toUpperCase()}</div>
                         <div style="font-size:0.8rem; opacity:0.5;">${country}</div>
                    </div>
                </div>
                
                <div class="weather-grid">
                    <div class="weather-item">
                        <div class="label">Sensação</div>
                        <div class="value">${Math.round(feelsLike)}°</div>
                    </div>
                    <div class="weather-item">
                        <div class="label">Umidade</div>
                        <div class="value">${humidity}%</div>
                    </div>
                    <div class="weather-item">
                        <div class="label">Vento</div>
                        <div class="value">${current.windspeed} km/h</div>
                    </div>
                    <div class="weather-item">
                        <div class="label">Chuva</div>
                        <div class="value">${precip}%</div>
                    </div>
                </div>
            </div>
        `;

        spheres[0].state = 'response';
        isSynchronized = true;

        // Log to history
        if (typeof window.logInteraction === 'function') {
            window.logInteraction('weather_check', city, 1, { temp: current.temperature, condition });
        }

        return `${Math.round(current.temperature)} graus em ${name}. ${condition}. Sensação de ${Math.round(feelsLike)}.`;

    } catch (e) {
        console.error(e);
        spheres[0].state = 'error';
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

// searchTV removed - CORS issue

async function getMarketData() {
    spheres[0].state = 'processing';
    userDisplay.textContent = "ANALISANDO MERCADO...";

    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=bitcoin,ethereum,solana,ripple,cardano&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h');
        const data = await res.json();

        if (!data || data.length === 0) throw new Error("No data");

        let itemsHtml = data.map(coin => {
            const price = coin.current_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const change = coin.price_change_percentage_24h;
            const isPos = change >= 0;

            const arrowIcon = isPos
                ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>`
                : `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(180deg);"><path d="M12 2L2 22h20L12 2z"/></svg>`;

            const colorVar = isPos ? 'var(--finance-up, #00ff88)' : 'var(--finance-down, #ff4444)';
            const bgHover = isPos ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,68,0.05)';

            return `
                <div class="market-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid rgba(var(--text-rgb), 0.1); transition: background 0.3s;" onmouseover="this.style.background='${bgHover}'" onmouseout="this.style.background='transparent'">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${coin.image}" style="width:24px; height:24px; border-radius:50%;">
                        <div style="text-align:left;">
                            <div style="font-size:0.9rem; font-weight:600; color:var(--text); letter-spacing:1px;">${coin.symbol.toUpperCase()}</div>
                            <div style="font-size:0.65rem; opacity:0.5; font-family:'Outfit'; text-transform:uppercase;">${coin.name}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.9rem; font-weight:300; font-family:'Inter'; color:var(--text);">${price}</div>
                        <div style="font-size:0.75rem; color:${colorVar}; display:flex; align-items:center; justify-content:flex-end; gap:4px; font-weight:600;">
                            ${arrowIcon} ${Math.abs(change).toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        voxDisplay.innerHTML = `
            <div class="glass-card" style="max-width:400px; margin:0 auto; animation: fadeUp 0.8s ease; padding:0; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid rgba(var(--text-rgb), 0.1); display:flex; justify-content:space-between; align-items:center;">
                     <span style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700;">MARKET_PULSE // LIVE</span>
                     <span style="font-size:0.6rem; opacity:0.5;">BRL</span>
                </div>
                <div style="display:flex; flex-direction:column;">
                    ${itemsHtml}
                </div>
                <div style="padding:10px; text-align:center; font-size:0.6rem; opacity:0.3; letter-spacing:2px;">
                    POWERED BY COINGECKO
                </div>
            </div>
        `;

        speak("Cotações atualizadas.");
        spheres[0].state = 'response';
        isSynchronized = true;

        if (typeof window.logInteraction === 'function') {
            window.logInteraction('market_check', 'crypto_top5', data.length);
        }

    } catch (e) {
        console.error(e);
        speak("Não foi possível acessar o mercado.");
    }
}

async function searchReddit(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "BUSCANDO TRENDS...";

    try {
        let subreddit = 'popular';
        let searchQuery = '';

        const parts = query.toLowerCase().trim().split(' ');
        if (parts[0] === 'trends' && parts.length > 1) {
            subreddit = parts.slice(1).join('');
        } else if (parts.length > 0) {
            subreddit = parts[0] === 'trends' ? 'popular' : parts[0];
            searchQuery = parts[0] === 'trends' ? parts.slice(1).join(' ') : parts.slice(1).join(' ');
        }

        const url = searchQuery
            ? `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&sort=top&t=day&limit=10`
            : `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;

        const res = await fetch(url, { headers: { 'User-Agent': 'Sory/2.5' } });
        const data = await res.json();

        if (!data.data || !data.data.children || data.data.children.length === 0) {
            throw new Error('No posts found');
        }

        const posts = data.data.children
            .filter(p => !p.data.stickied)
            .slice(0, 10)
            .map(p => ({
                title: p.data.title,
                subreddit: p.data.subreddit_name_prefixed,
                votes: p.data.ups,
                comments: p.data.num_comments,
                url: `https://reddit.com${p.data.permalink}`,
                created: new Date(p.data.created_utc * 1000)
            }));

        const postsHtml = posts.map((p) => {
            const timeAgo = Math.floor((Date.now() - p.created) / 60000);
            const timeStr = timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo / 60)}h`;

            return `
                <div class="reddit-post glass-card" style="display:flex; gap:12px; padding:15px; align-items:flex-start; transition: all 0.3s; cursor:pointer; background: transparent; border: none; box-shadow: none; border-bottom: 1px solid rgba(var(--text-rgb), 0.1);" 
                     onclick="window.open('${p.url}', '_blank')"
                     onmouseover="this.style.transform='translateX(5px)'; this.style.background='rgba(var(--text-rgb), 0.05)';" 
                     onmouseout="this.style.transform='translateX(0)'; this.style.background='transparent';">
                    
                    <div style="display:flex; flex-direction:column; align-items:center; min-width:45px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)" style="opacity:0.8;"><path d="M12 2L2 12h6v10h8V12h6L12 2z"/></svg>
                        <span style="font-size:0.85rem; font-weight:700; color:var(--accent);">${p.votes >= 1000 ? (p.votes / 1000).toFixed(1) + 'k' : p.votes}</span>
                    </div>
                    
                    <div style="flex:1; overflow:hidden; text-align: left;">
                        <div style="font-size:0.85rem; font-weight:500; color:var(--text); line-height:1.3; margin-bottom:6px;">${p.title}</div>
                        <div style="display:flex; gap:10px; font-size:0.65rem; opacity:0.5;">
                            <span>${p.subreddit}</span>
                            <span>${p.comments} comments</span>
                            <span>${timeStr} ago</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        voxDisplay.innerHTML = `
            <div class="glass-card" style="max-width:500px; margin:0 auto; padding:0; overflow:hidden; animation: fadeUp 0.8s ease;">
                <div style="padding:20px; border-bottom:1px solid rgba(var(--text-rgb), 0.1); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; letter-spacing:3px; color:var(--accent); font-weight:700;">REDDIT // ${subreddit.toUpperCase()}</span>
                    <span style="font-size:0.6rem; opacity:0.5;">TOP 10</span>
                </div>
                <div style="display:flex; flex-direction:column; max-height:400px; overflow-y:auto;">
                    ${postsHtml}
                </div>
                <div style="padding:10px; text-align:center; font-size:0.55rem; opacity:0.3; letter-spacing:2px;">
                    POWERED BY REDDIT API
                </div>
            </div>
        `;

        speak(`Top posts de ${subreddit}.`);
        spheres[0].state = 'response';
        isSynchronized = true;

        if (typeof window.logInteraction === 'function') {
            window.logInteraction('reddit_search', query, posts.length, { subreddit });
        }

    } catch (e) {
        console.error(e);
        speak("Não encontrei posts.");
        voxDisplay.innerHTML = `<div class="glass-card" style="text-align:center; padding:30px; color:var(--accent);">Erro ao acessar Reddit.</div>`;
        spheres[0].state = 'error';
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}


// Gallery Display Functions with Source Filter
function showGallery() {
    if (!currentGallery || !currentGallery.images || currentGallery.images.length === 0) return;

    if (!currentGallery.filter) currentGallery.filter = 'ALL';

    const sources = [...new Set(currentGallery.allImages.map(i => i.source))];

    const filteredImages = currentGallery.filter === 'ALL'
        ? currentGallery.allImages
        : currentGallery.allImages.filter(i => i.source === currentGallery.filter);

    currentGallery.images = filteredImages;

    if (currentGallery.index >= filteredImages.length) currentGallery.index = 0;

    const img = filteredImages[currentGallery.index];

    const filterBadges = ['ALL', ...sources].map(source => {
        const isActive = currentGallery.filter === source;
        const count = source === 'ALL' ? currentGallery.allImages.length : currentGallery.allImages.filter(i => i.source === source).length;

        return `
            <div onclick="filterGalleryBySource('${source}')" 
                 style="
                     padding: 6px 12px; 
                     border-radius: 20px; 
                     font-size: 0.6rem; 
                     letter-spacing: 1px; 
                     cursor: pointer; 
                     transition: all 0.3s;
                     background: ${isActive ? 'var(--accent)' : 'transparent'};
                     color: ${isActive ? '#000' : 'var(--text)'};
                     border: 1px solid ${isActive ? 'var(--accent)' : 'rgba(var(--text-rgb), 0.3)'};
                     font-weight: ${isActive ? '700' : '400'};
                 "
                 onmouseover="if(!${isActive}) this.style.background='rgba(var(--text-rgb), 0.05)'"
                 onmouseout="if(!${isActive}) this.style.background='transparent'">
                ${source} (${count})
            </div>
        `;
    }).join('');

    voxDisplay.innerHTML = `
        <div class="gallery-container" style="position:relative; max-width:90%; margin:0 auto; animation:fadeUp 0.8s ease;">
            <div class="glass-card" style="padding:0; overflow:hidden;">
                <div style="padding:15px; border-bottom:1px solid rgba(var(--text-rgb), 0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-size:0.7rem; letter-spacing:2px; color:var(--accent); font-weight:700;">${img.source}</span>
                        <span style="font-size:0.6rem; opacity:0.5;">${currentGallery.index + 1}/${filteredImages.length}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${filterBadges}
                    </div>
                </div>
                <img src="${img.url}" style="width:100%; max-height:65vh; object-fit:contain; display:block;" onerror="this.src='${img.fullUrl}';">
                <div style="padding:15px; border-top:1px solid rgba(var(--text-rgb), 0.1);">
                    <div style="font-size:0.85rem; font-weight:500; color:var(--text); margin-bottom:8px;">${img.title}</div>
                    <div style="font-size:0.6rem; opacity:0.4; letter-spacing:1px;">  NAVEGAR | ENTER FECHAR</div>
                </div>
            </div>
        </div>
    `;
}

function filterGalleryBySource(source) {
    if (!currentGallery || !currentGallery.active) return;
    currentGallery.filter = source;
    currentGallery.index = 0;
    showGallery();
}

function navGallery(direction) {
    if (!currentGallery || !currentGallery.active) return;
    currentGallery.index += direction;
    if (currentGallery.index < 0) currentGallery.index = currentGallery.images.length - 1;
    if (currentGallery.index >= currentGallery.images.length) currentGallery.index = 0;
    showGallery();
}

function closeGallery() {
    currentGallery.active = false;
    currentGallery.filter = 'ALL';
    voxDisplay.innerHTML = '';
    spheres[0].state = 'idle';
    isSynchronized = false;
}
