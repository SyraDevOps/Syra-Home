// API SERVICES - External Fetchers (Refined Error Handling)

async function searchWiki(query) {
    try {
        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.status === 404) return { extract: "Conceito não localizado nos arquivos.", title: query, type: "not_found" };
        if (!res.ok) throw new Error("Wiki Unreachable");
        const data = await res.json();
        return {
            extract: data.extract,
            description: data.description,
            type: data.type,
            title: data.title
        };
    } catch (e) {
        console.warn("[API] Wiki Error:", e);
        return null;
    }
}

async function searchBooks(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "CONSULTANDO BIBLIOTECA...";

    async function fallbackOpenLibrary(q) {
        try {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`;
            const res = await fetch(url);
            return await res.json();
        } catch (e) { return {}; }
    }

    try {
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
                        â†  DESLIZE PARA NAVEGAR â†’
                    </div>
                </div>
            `;

            speak(`Localizei ${books.filter(b => b.cover).length} obras.`);
        } else {
            throw new Error("No books found anywhere.");
        }

    } catch (err) {
        console.error(err);
        spheres[0].state = 'error';
        userDisplay.textContent = "SEM DADOS.";
        speak("Registros literários indisponíveis no momento.");
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

async function searchImages(query) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "VARREDURA VISUAL...";

    try {
        let images = [];
        const encodedQ = encodeURIComponent(query);
        const fetchPromises = [];

        // Wiki Commons
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
                }).catch(() => [])
        );

        // NASA API
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
                }).catch(() => [])
        );

        const results = await Promise.all(fetchPromises);
        images = results.flat();

        // Fallback: Pollinations AI Generation
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
            speak(`Visualização compilada. ${images.length} ativos.`);
            if (typeof showGallery === 'function') showGallery();
        } else {
            throw new Error("No images found");
        }

    } catch (e) {
        console.error(e);
        spheres[0].state = 'error';
        userDisplay.textContent = "FALHA VISUAL.";
        speak("Não foi possível gerar ou recuperar imagens.");
        setTimeout(() => spheres[0].state = 'idle', 3000);
    }
}

async function getWeather(city) {
    spheres[0].state = 'processing';
    userDisplay.textContent = "CONECTANDO SATÉLITE...";
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            speak(`Localização não identificada: ${city}.`);
            return null;
        }

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
        return `${Math.round(current.temperature)} graus em ${name}. ${condition}.`;

    } catch (e) {
        console.error(e);
        spheres[0].state = 'error';
        speak("Dados atmosféricos indisponíveis.");
        setTimeout(() => spheres[0].state = 'idle', 3000);
        return null;
    }
}
