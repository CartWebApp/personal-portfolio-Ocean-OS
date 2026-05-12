// @ts-check
const pre = /** @type {HTMLPreElement} */ (document.querySelector('pre'));
/**
 * @param {{ x: number; y: number }} start
 * @param {{ x: number; y: number }} end
 */
function slope(start, end) {
    const delta = {
        x: end.x - start.x,
        y: end.y - start.y
    };
    return delta;
}
/**
 * @param {{ x: number; y: number }} start
 * @param {{ x: number; y: number }} end
 */
function distance(start, end) {
    const { x, y } = slope(start, end);
    return Math.sqrt(x * x + y * y);
}
class Renderer {
    element;
    width;
    height;
    /** @type {(point: { x: number; y: number }) => string} */
    shader = () => '█';
    canvas;
    ctx;
    /**
     * @param {HTMLElement} text
     * @param {{ width: number; height: number }} options
     */
    constructor(text, { width, height }) {
        const canvas = /** @type {HTMLCanvasElement} */ (
            document.createElement('canvas')
        );
        this.ctx = /** @type {CanvasRenderingContext2D} */ (
            canvas.getContext('2d')
        );
        this.canvas = canvas;
        canvas.width = width;
        canvas.height = height;
        this.width = width;
        this.height = height;
        this.element = text;
        this.element.style.fontFamily = 'monospace';
        this.element.textContent = `${' '.repeat(width)}\n`.repeat(height);
    }

    clear() {
        this.element.textContent = `${' '.repeat(this.width)}\n`.repeat(
            this.height
        );
    }

    /**
     * @param {{ x: number; y: number }} start
     * @param {{ x: number; y: number }} end
     */
    #line(start, end) {
        const delta = slope(start, end);
        const data = this.element.textContent
            .split('\n')
            .map(line => line.split(''));
        let { ...curr } = start;
        const dist = distance(start, end);
        while (distance(start, curr) < dist) {
            data[Math.round(curr.y)][Math.round(curr.x)] = this.shader({
                x: Math.round(curr.x),
                y: Math.round(curr.y)
            });
            curr.x += delta.x / dist;
            curr.y += delta.y / dist;
        }
        this.element.textContent = data.map(line => line.join('')).join('\n');
    }

    /**
     * @param {Array<{ x: number; y: number }>} points
     */
    line(...points) {
        for (let i = 0; i < points.length - 1; i++) {
            this.#line(points[i], points[i + 1]);
        }
    }

    /**
     * @param {{ x: number; y: number }} top_left
     * @param {number} width
     * @param {number} height
     */
    rect(top_left, width, height) {
        this.polygon(
            top_left,
            {
                x: top_left.x + width,
                y: top_left.y
            },
            {
                x: top_left.x + width,
                y: top_left.y + height
            },
            {
                x: top_left.x,
                y: top_left.y + height
            }
        );
    }

    /**
     * @param {Array<{ x: number; y: number }>} points
     */
    polygon(...points) {
        for (let i = 0; i < points.length; i++) {
            const line =
                /** @type {[{ x: number; y: number }, { x: number; y: number }]} */ ([
                    points[i],
                    points[i + 1] ?? points[0]
                ]);
            this.#line(...line);
        }
    }

    /**
     * @param {{ x: number; y: number }} center
     * @param {number} radius
     */
    circle(center, radius) {
        const data = this.element.textContent
            .split('\n')
            .map(line => line.split(''));
        for (let x = center.x - radius * 2; x <= center.x + radius * 2; x++) {
            for (
                let y = center.y - radius * 2;
                y <= center.y + radius * 2;
                y++
            ) {
                const point = { x, y };
                const error = Math.abs(radius * 2 - distance(point, center));
                if (error > radius && error < radius * 2.1) {
                    data[y][x] = this.shader(point);
                }
            }
        }
        this.element.textContent = data.map(line => line.join('')).join('\n');
    }

    /** @type {Map<{ text: string; x: number; y: number; size: number }, Array<{ x: number; y: number }>>} */
    text_cache = new Map();

    /**
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {number} size
     */
    text(text, x, y, size) {
        const display = this.element.textContent
            .split('\n')
            .map(line => line.split(''));
        for (const [key, value] of this.text_cache) {
            if (key.text !== text) {
                continue;
            }
            if (key.x !== x || key.y !== y) {
                continue;
            }
            if (key.size !== size) {
                continue;
            }
            for (const { x, y } of value) {
                display[y][x] = this.shader({ x, y });
            }
            this.element.textContent = display
                .map(line => line.join(''))
                .join('\n');
            return;
        }
        // this.offscreen_ctx.clearRect(0, 0, this.offscreen_canvas.width, this.offscreen_canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.font = `${size}px monospace`;
        this.ctx.fillText(text, x, y, this.canvas.width);
        const data = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        const points = [];
        for (let i = 0; i < data.data.length; i += 4) {
            if (data.data[i] < 255) {
                const idx = Math.floor(i / 4);
                const y = Math.floor(idx / this.width);
                const x = idx % this.width;
                const point = { x, y };
                points.push(point);
                display[y][x] = this.shader(point);
            }
        }
        this.element.textContent = display
            .map(line => line.join(''))
            .join('\n');
        this.text_cache.set({ text, x, y, size }, points);
    }
}

const width = parseFloat(getComputedStyle(pre).fontSize);
const height = parseFloat(getComputedStyle(pre).lineHeight);

const renderer = new Renderer(pre, {
    width: innerWidth / (width * 0.5),
    height: innerHeight / (height * 0.6)
});

renderer.shader = (/** @type {{ x: number; y: number }} */ point) => {
    if (point.x > x && point.y > y) {
        return '█';
    }
    if (x - point.x <= radius && y - point.y <= radius) {
        return '▓';
    }
    return '▒';
};
let size = 50;
let x = Math.round(renderer.width * 0.5 - size * 5);
let y = Math.round(renderer.height / 2);
let text = 'Andrew Nolt';
const speed_range = 8;
let delta_x = Math.round(Math.random() * speed_range - speed_range / 2);
let delta_y = Math.round(Math.random() * speed_range - speed_range / 2);
const radius = 200;
let tick = 0;
renderer.shader = () => '░';
renderer.text(text, x, y, size);
renderer.shader = () => '█';
renderer.text(text, x, y, size);
let last_scroll = scrollY;
const shadow = 40;
const abort_controller = new AbortController();
let mouse_x = 0;
let mouse_y = 0;
const path = [];
const rect = pre.getBoundingClientRect();
while (window.screenTop !== 0) {
    scrollTo({
        top: 0,
        behavior: 'instant'
    });
}
addEventListener(
    'mousemove',
    ({ clientX, clientY }) => {
        mouse_x = clientX;
        mouse_y = clientY;
        path.push({ x: mouse_x + rect.left, y: mouse_y + rect.top });
        renderer.clear();
        renderer.shader = () => '░';
        renderer.text(
            text,
            x - ((mouse_x / innerWidth) * shadow - shadow / 2),
            y - ((mouse_y / innerHeight) * shadow - shadow / 2),
            size
        );
        renderer.shader = () => '█';
        renderer.text(text, x, y, size);
        // renderer.line(...path);
    },
    { signal: abort_controller.signal }
);
addEventListener('scroll', () => {
    const data = renderer.element.textContent
        .split('\n')
        .map(line => line.split(''));
    if (abort_controller.signal.aborted || scrollY - last_scroll > 2) {
        abort_controller.abort();
        for (let x = 0; x < renderer.width; x++) {
            for (let y = 0; y < renderer.height; y++) {
                if (Math.random() < 0.15 * ((y * 2) / renderer.height)) {
                    const min_threshold =
                        innerHeight * (0.05 + Math.random() * 0.1);
                    const max_threshold =
                        innerHeight * (0.15 + Math.random() * 0.2);
                    data[y][x] =
                        y < min_threshold || y > innerHeight - min_threshold
                            ? '░'
                            : y < max_threshold ||
                                y > innerHeight - max_threshold
                              ? '▒'
                              : '▓';
                }
            }
        }
        const empty =
            data.map(line => line.filter(char => char === ' ')).flat().length /
            (renderer.width * renderer.height);
        renderer.element.textContent = data
            .map(line => line.join(''))
            .join('\n');
        renderer.shader = () =>
            empty < 0.8 ? ' ' : empty < 0.9 ? '░' : empty < 0.98 ? '▒' : '█';
        renderer.text(text, x, y, size);
        if (empty < 0.9) {
            renderer.text(
                'Software Engineer ◇ Web Developer ◇ Svelte Maintainer',
                x - 175,
                y + 50,
                size * 0.5
            );
        }
    }
    last_scroll = scrollY;
});
// addEventListener('scroll', e => {
//     console.log(e);
//     const data = renderer.element.textContent.split('\n').map(line => line.split(''));
//     for (let y = 0; y < renderer.height; y++) {
//         if ((y % 4) < 3 || (scrollY < last_scroll)) {
//             data[y].shift();
//             data[y].push(data[y][data[y][data[y].length - 1]]);
//         } else {
//             data[y].pop();
//             data[y].unshift(data[y][0]);
//         }
//     }
//     for (let x = 0; x < renderer.width; x += 2) {
//         for (let y = 0; y < renderer.height; y++) {
//             if ((y & 1) !== 0) {
//             } else {
//                 data[y][x - 1] = data[y][x + 1];
//             }
//         }
//     }
//     last_scroll = scrollY;
//     renderer.element.textContent = data.map(line => line.join('')).join('\n');
// });
function loop() {
    if (abort_controller.signal.aborted) return;
    // renderer.clear();
    renderer.shader = () => '░';
    renderer.text(
        text,
        x - ((mouse_x / innerWidth) * shadow - shadow / 2),
        y - ((mouse_y / innerHeight) * shadow - shadow / 2),
        size
    );
    renderer.shader = () => '█';
    renderer.text(text, x, y, size);
    const current = { x, y };
    // if (tick % 5 === 0) {
    //     path.push(current);
    // // }
    // if (path.length >= 40) {
    //     for (let i = 0; i < 40; i += 2) {
    //         path.splice(i, 1);
    //     }
    //     // path.splice(Math.round((0.75 + (Math.random() * 0.25)) * path.length), 1);
    // }
    tick++;
    // renderer.circle(current, radius);
    // renderer.line(...path, current);
    // x += delta_x;
    // y += delta_y;
    // x = Math.round(x);
    // y = Math.round(y);
    // if (x >= renderer.width - radius) {
    //     x = renderer.width - radius;
    //     delta_x = -delta_x;
    //     delta_x *= 1.25;
    // }
    // if (y >= renderer.height - radius) {
    //     y = renderer.height - radius;
    //     delta_y = -delta_y;
    //     delta_y *= 1.25;
    // }
    // if (x <= radius) {
    //     x = radius;
    //     delta_x = -delta_x;
    //     delta_x *= 1.25;
    // }
    // if (y <= radius) {
    //     y = radius;
    //     delta_y = -delta_y;
    //     delta_y *= 1.25;
    // }
    delta_x *= 0.999;
    delta_y *= 0.999;
    delta_x = Math.max(Math.min(delta_x, speed_range / 2), -speed_range / 2);
    delta_y = Math.max(Math.min(delta_y, speed_range / 2), -speed_range / 2);
    return requestAnimationFrame(loop);
}

loop();
