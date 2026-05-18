// Themable via CSS custom properties:
//   --weather-bg, --weather-surface, --weather-border
//   --weather-text, --weather-text-muted, --weather-accent
//   --weather-font-sans, --weather-font-mono

const AIRPORTS = [
    { code: 'KSAN', name: 'San Diego Intl' },
    { code: 'KMYF', name: 'Montgomery' },
    { code: 'KSEE', name: 'Gillespie' }
];

const REFRESH_MS = 5 * 60 * 1000;
const API_URL = 'https://aviationweather.gov/api/data/metar';

const TEMPLATE = `
    <style>
        :host {
            display: block;
            font-family: var(--weather-font-sans, system-ui, sans-serif);
            color: var(--weather-text, #e6f1ff);
        }

        .panel {
            border: 1px solid var(--weather-border, #1e3a52);
            border-radius: 2px;
            padding: 1.5rem;
            background: var(--weather-surface, transparent);
        }

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--weather-border, #1e3a52);
            gap: 1rem;
            flex-wrap: wrap;
        }

        .panel-title {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--weather-text-muted, #8ba3c7);
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin: 0;
        }

        .panel-meta {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.75rem;
            color: var(--weather-text-muted, #8ba3c7);
            letter-spacing: 0.08em;
            margin: 0;
        }

        .airports {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }

        .airport {
            border: 1px solid var(--weather-border, #1e3a52);
            border-radius: 2px;
            padding: 1rem;
            background: var(--weather-bg, transparent);
        }

        .airport-code {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 1rem;
            font-weight: 600;
            color: var(--weather-accent, #64ffda);
            letter-spacing: 0.1em;
            margin: 0 0 0.25rem 0;
        }

        .airport-name {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.6875rem;
            color: var(--weather-text-muted, #8ba3c7);
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin: 0 0 1rem 0;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 0.375rem 0;
            border-bottom: 1px dashed var(--weather-border, #1e3a52);
        }

        .stat:last-child {
            border-bottom: none;
        }

        .stat-label {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.6875rem;
            color: var(--weather-text-muted, #8ba3c7);
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }

        .stat-value {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.875rem;
            color: var(--weather-text, #e6f1ff);
            font-weight: 500;
        }

        .status {
            font-family: var(--weather-font-mono, ui-monospace, monospace);
            font-size: 0.8125rem;
            color: var(--weather-text-muted, #8ba3c7);
            letter-spacing: 0.08em;
            text-align: center;
            padding: 2rem 1rem;
            margin: 0;
        }

        .status.error {
            color: var(--weather-accent, #64ffda);
        }

        @media (max-width: 640px) {
            .airports {
                grid-template-columns: 1fr;
            }
        }
    </style>

    <div class="panel" role="region" aria-label="Aviation weather status">
        <header class="panel-header">
            <p class="panel-title">// Operational Status · Live</p>
            <p class="panel-meta" data-role="meta">Loading...</p>
        </header>
        <div data-role="content" aria-live="polite">
            <p class="status">Fetching atmospheric data...</p>
        </div>
    </div>
`;

class WeatherStatus extends HTMLElement {
    constructor() {
        super();
        this.refreshHandle = null;
        this.abortController = null;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = TEMPLATE;

        this.contentEl = shadow.querySelector('[data-role="content"]');
        this.metaEl    = shadow.querySelector('[data-role="meta"]');

        this.load();
        this.refreshHandle = setInterval(() => this.load(), REFRESH_MS);
    }

    disconnectedCallback() {
        if (this.refreshHandle) clearInterval(this.refreshHandle);
        if (this.abortController) this.abortController.abort();
    }

    async load() {
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        try {
            const codes = AIRPORTS.map(a => a.code).join(',');
            const url   = `${API_URL}?ids=${codes}&format=json`;

            const response = await fetch(url, { signal: this.abortController.signal });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.renderSuccess(data);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('Weather fetch failed:', err);
            this.renderError();
        }
    }

    renderSuccess(data) {
        const byCode = {};
        for (const metar of data) {
            if (metar.icaoId) byCode[metar.icaoId] = metar;
        }

        const cards = AIRPORTS.map(airport => {
            const metar = byCode[airport.code];
            return metar ? this.renderCard(airport, metar) : this.renderEmptyCard(airport);
        }).join('');

        this.contentEl.innerHTML = `<div class="airports">${cards}</div>`;
        this.metaEl.textContent  = `Updated ${this.formatTime(new Date())}`;
    }

    renderCard(airport, metar) {
        return `
            <div class="airport">
                <p class="airport-code">${airport.code}</p>
                <p class="airport-name">${airport.name}</p>
                <div class="stat">
                    <span class="stat-label">Wind</span>
                    <span class="stat-value">${this.formatWind(metar)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Visibility</span>
                    <span class="stat-value">${this.formatVisibility(metar)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Ceiling</span>
                    <span class="stat-value">${this.formatCeiling(metar)}</span>
                </div>
            </div>
        `;
    }

    renderEmptyCard(airport) {
        return `
            <div class="airport">
                <p class="airport-code">${airport.code}</p>
                <p class="airport-name">${airport.name}</p>
                <p class="status">No data</p>
            </div>
        `;
    }

    renderError() {
        this.contentEl.innerHTML = `<p class="status error">Data unavailable</p>`;
        this.metaEl.textContent  = 'Error';
    }

    formatWind(metar) {
        if (metar.wdir === null || metar.wdir === undefined) return '--';
        if (!metar.wspd || metar.wspd === 0) return 'Calm';

        const dir = (metar.wdir === 'VRB' || metar.wdir === 0)
            ? 'VRB'
            : `${String(metar.wdir).padStart(3, '0')}`;

        return `${dir} @ ${metar.wspd}kt`;
    }

    formatVisibility(metar) {
        if (metar.visib === null || metar.visib === undefined) return '--';
        return `${metar.visib} sm`;
    }

    formatCeiling(metar) {
        if (!metar.clouds || metar.clouds.length === 0) return 'Clear';

        const ceiling = metar.clouds.find(c => c.cover === 'BKN' || c.cover === 'OVC');

        if (!ceiling) {
            const lowest = metar.clouds[0];
            return (lowest.base !== null && lowest.base !== undefined)
                ? `${lowest.cover} ${(lowest.base * 100).toLocaleString()}ft`
                : 'Clear';
        }

        return `${ceiling.cover} ${(ceiling.base * 100).toLocaleString()}ft`;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
}

customElements.define('weather-status', WeatherStatus);
