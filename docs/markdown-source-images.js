(function (root) {
    'use strict';
    function compact(markdown, previousImages) {
        const images = new Map(previousImages || []);
        const original = String(markdown || '');
        const text = original.replace(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, data => {
            for (const [token, image] of images) if (image === data) return token;
            let number = 1, token;
            do { token = 'werkplaats-afbeelding:' + number++; }
            while (images.has(token) || original.includes(token));
            images.set(token, data);
            return token;
        });
        return { text, images };
    }
    function expand(markdown, images) {
        return String(markdown || '').replace(/werkplaats-afbeelding:\d+/g, token => images?.get(token) || token);
    }
    const api = { compact, expand };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MarkdownSourceImages = api;
})(typeof window === 'undefined' ? globalThis : window);
