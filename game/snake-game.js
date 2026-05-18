// Themable via CSS:
//   --snake-bg, --snake-grid, --snake-snake, --snake-food
//   --snake-text, --snake-text-muted, --snake-accent, --snake-border
//   --snake-font-sans, --snake-font-mono

const TEMPLATE = `
    <style>
        :host {
            display: block;
            font-family: var(--snake-font-sans, system-ui, sans-serif);
            color: var(--snake-text, #e6f1ff);
        }

        .game-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }

        .game-hud {
            display: flex;
            gap: 3rem;
            font-family: var(--snake-font-mono, ui-monospace, monospace);
            width: 100%;
            max-width: 400px;
            justify-content: space-between;
            font-size: 0.875rem;
        }

        .game-stat {
            margin: 0;
            color: var(--snake-text-muted, #8ba3c7);
            letter-spacing: 0.08em;
        }

        .game-stat-label {
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-right: 0.5rem;
        }

        .game-stat-value {
            color: var(--snake-accent, #64ffda);
            font-weight: 600;
            font-size: 1rem;
        }

        canvas {
            display: block;
            background: var(--snake-bg, #0a1929);
            border: 1px solid var(--snake-border, #64ffda);
            border-radius: 2px;
            max-width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
        }

        .game-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            min-height: 4rem;
        }

        .start-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: var(--snake-font-mono, ui-monospace, monospace);
            font-size: 0.875rem;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            padding: 0.75rem 1.5rem;
            border-radius: 2px;
            border: 1px solid currentColor;
            background: transparent;
            color: var(--snake-accent, #64ffda);
            cursor: pointer;
            transition: color 0.2s ease, background-color 0.2s ease;
        }

        .start-btn:hover {
            background: var(--snake-accent, #64ffda);
            color: var(--snake-bg, #0a1929);
        }

        .game-status {
            margin: 0;
            font-family: var(--snake-font-mono, ui-monospace, monospace);
            font-size: 0.875rem;
            color: var(--snake-text-muted, #8ba3c7);
            letter-spacing: 0.08em;
            text-align: center;
        }

        .game-status.game-over {
            color: var(--snake-accent, #64ffda);
        }

        @media (max-width: 768px) {
            canvas {
                width: min(90vw, 400px);
            }
        }
    </style>

    <div class="game-section">
        <div class="game-hud">
            <p class="game-stat">
                <span class="game-stat-label">Score</span>
                <span class="game-stat-value" data-role="score">0</span>
            </p>
            <p class="game-stat">
                <span class="game-stat-label">Best</span>
                <span class="game-stat-value" data-role="best">0</span>
            </p>
        </div>

        <canvas width="400" height="400" aria-label="Snake game grid" role="img"></canvas>

        <div class="game-controls">
            <button type="button" class="start-btn" data-role="start">
                Start <span aria-hidden="true">&rarr;</span>
            </button>
            <p class="game-status" data-role="status" aria-live="polite"></p>
        </div>
    </div>
`;

class SnakeGame extends HTMLElement {
    constructor() {
        super();

        this.GRID_SIZE = 20;
        this.CELL_PIXELS = 20;
        this.TICK_MS = 100;
        this.STORAGE_KEY = 'snake-best';

        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.pendingDirection = { x: 1, y: 0 };
        this.food = { x: 10, y: 10 };
        this.score = 0;
        this.best = parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10);
        this.running = false;
        this.tickHandle = null;

        this.onKeyDown = this.onKeyDown.bind(this);
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = TEMPLATE;

        this.canvas = shadow.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = shadow.querySelector('[data-role="score"]');
        this.bestEl = shadow.querySelector('[data-role="best"]');
        this.startBtn = shadow.querySelector('[data-role="start"]');
        this.statusEl = shadow.querySelector('[data-role="status"]');

        this.bestEl.textContent = this.best;

        this.startBtn.addEventListener('click', () => this.start());
        document.addEventListener('keydown', this.onKeyDown);

        this.reset();
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this.onKeyDown);
        if (this.tickHandle) {
            clearInterval(this.tickHandle);
        }
    }

    getColors() {
        const styles = getComputedStyle(this);
        return {
            bg:    styles.getPropertyValue('--snake-bg').trim()    || '#0a1929',
            snake: styles.getPropertyValue('--snake-snake').trim() || '#64ffda',
            food:  styles.getPropertyValue('--snake-food').trim()  || '#a3ffe4',
            grid:  styles.getPropertyValue('--snake-grid').trim()  || '#1e3a52'
        };
    }

    draw() {
        const { bg, snake, food, grid } = this.getColors();

        this.ctx.fillStyle = bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = grid;
        this.ctx.lineWidth = 1;
        for (let i = 1; i < this.GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.CELL_PIXELS, 0);
            this.ctx.lineTo(i * this.CELL_PIXELS, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.CELL_PIXELS);
            this.ctx.lineTo(this.canvas.width, i * this.CELL_PIXELS);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = snake;
        for (const seg of this.snake) {
            this.ctx.fillRect(
                seg.x * this.CELL_PIXELS + 1,
                seg.y * this.CELL_PIXELS + 1,
                this.CELL_PIXELS - 2,
                this.CELL_PIXELS - 2
            );
        }

        this.ctx.fillStyle = food;
        this.ctx.fillRect(
            this.food.x * this.CELL_PIXELS + 3,
            this.food.y * this.CELL_PIXELS + 3,
            this.CELL_PIXELS - 6,
            this.CELL_PIXELS - 6
        );
    }

    reset() {
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.pendingDirection = { x: 1, y: 0 };
        this.score = 0;
        this.scoreEl.textContent = '0';
        this.placeFood();
        this.draw();
    }

    placeFood() {
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
            valid = !this.snake.some((seg) => seg.x === this.food.x && seg.y === this.food.y);
        }
    }

    tick() {
        this.direction = this.pendingDirection;
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        if (head.x < 0 || head.x >= this.GRID_SIZE || head.y < 0 || head.y >= this.GRID_SIZE) {
            return this.gameOver();
        }

        if (this.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
            return this.gameOver();
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.scoreEl.textContent = this.score;
            this.placeFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    gameOver() {
        this.running = false;
        clearInterval(this.tickHandle);

        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem(this.STORAGE_KEY, this.best);
            this.bestEl.textContent = this.best;
            this.statusEl.textContent = `Game over new best: ${this.score}.`;
        } else {
            this.statusEl.textContent = `Game over score: ${this.score}.`;
        }

        this.statusEl.classList.add('game-over');
        this.startBtn.textContent = 'Play again';
    }

    start() {
        if (this.running) return;
        this.reset();
        this.running = true;
        this.statusEl.textContent = '';
        this.statusEl.classList.remove('game-over');
        this.startBtn.textContent = 'Restart';
        this.tickHandle = setInterval(() => this.tick(), this.TICK_MS);
    }

    setDirection(dx, dy) {
        if (dx === -this.direction.x && dy === -this.direction.y) return;
        this.pendingDirection = { x: dx, y: dy };
    }

    onKeyDown(e) {
        if (!this.running) return;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.setDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.setDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.setDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.setDirection(1, 0);
                break;
        }
    }
}

customElements.define('snake-game', SnakeGame);
