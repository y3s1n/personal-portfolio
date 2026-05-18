// atc-weather-proxy
// Proxies the FAA aviation weather API and adds CORS headers.

const API_BASE = 'https://aviationweather.gov/api/data/metar';

const ALLOWED_ORIGINS = [
    'https://my-portfolio-dzn.pages.dev',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:5500'
];

export default {
    async fetch(request) {
        const requestOrigin = request.headers.get('Origin') || '';
        const allowOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : '';

        // Preflight (OPTIONS) requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(allowOrigin)
            });
        }

        // Only allow GET
        if (request.method !== 'GET') {
            return new Response('Method not allowed', {
                status: 405,
                headers: corsHeaders(allowOrigin)
            });
        }

        // Forward the query string to the real API
        const url = new URL(request.url);
        const upstreamUrl = `${API_BASE}${url.search}`;

        try {
            const upstream = await fetch(upstreamUrl, {
                cf: { cacheTtl: 300, cacheEverything: true }
            });

            const body = await upstream.text();

            return new Response(body, {
                status: upstream.status,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(allowOrigin)
                }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(allowOrigin)
                }
            });
        }
    }
};

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}