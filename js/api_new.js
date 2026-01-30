// API MODULE - SORY
// Handles external data fetching (Wiki, Books, Images, Anime, Weather, Market, Reddit)

async function searchWiki(query) {
    try {
        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.status === 404) return { extract: 'Conceito não indexado na base Wiki principal.', title: query, type: 'not_found' };
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
