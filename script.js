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
        this.ctx.font = `${size}px cursive`;
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

const renderer = new Renderer(pre, {
    width: Math.round(innerWidth / 2.23),
    height: Math.round(innerHeight * 0.75)
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
let x = Math.round(renderer.width * 0.35);
let y = Math.round(renderer.height / 2.25);
let size = 50;
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
    if (abort_controller.signal.aborted) return;
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
                        innerHeight * (0.25 + Math.random() * 0.1);
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
    x += delta_x;
    y += delta_y;
    x = Math.round(x);
    y = Math.round(y);
    if (x >= renderer.width - radius) {
        x = renderer.width - radius;
        delta_x = -delta_x;
        delta_x *= 1.25;
    }
    if (y >= renderer.height - radius) {
        y = renderer.height - radius;
        delta_y = -delta_y;
        delta_y *= 1.25;
    }
    if (x <= radius) {
        x = radius;
        delta_x = -delta_x;
        delta_x *= 1.25;
    }
    if (y <= radius) {
        y = radius;
        delta_y = -delta_y;
        delta_y *= 1.25;
    }
    delta_x *= 0.999;
    delta_y *= 0.999;
    delta_x = Math.max(Math.min(delta_x, speed_range / 2), -speed_range / 2);
    delta_y = Math.max(Math.min(delta_y, speed_range / 2), -speed_range / 2);
    return requestAnimationFrame(loop);
}

function animate() {
    const data = renderer.element.textContent
        .split('\n')
        .map(line => line.split(''));
    for (let x = 0; x < renderer.width; x++) {
        for (let y = 0; y < renderer.height; y++) {
            if (Math.random() > 0.5) continue;
            data[y][x] = [...' ░▒'][Math.round(Math.random() * 2)];
        }
    }
    renderer.element.textContent = data
        .map(line => line.join(''))
        .join('\n');
    return requestAnimationFrame(animate);
}

// animate();

function garble() {
    const data = renderer.element.textContent
        .split('\n')
        .map(line => line.split(''));
        for (let x = 0; x < renderer.width; x++) {
            for (let y = 0; y < renderer.height; y++) {
                if (Math.random() > 0.5) continue;
                data[y][x] = Math.random() > 0.4 ? String.fromCharCode(Math.round(Math.random() * 52) + 65) : ' ';
            }
        }
        
        renderer.element.textContent = data
            .map(line => line.join(''))
            .join('\n');
        return requestAnimationFrame(garble);
    
}

abort_controller.abort();
// garble();
// import 'https://josephg.com/perlin/3/perlin.js';
//////////////////////////////////////////////////////////////

// http://mrl.nyu.edu/~perlin/noise/
// Adapting from PApplet.java
// which was adapted from toxi
// which was adapted from the german demo group farbrausch
// as used in their demo "art": http://www.farb-rausch.de/fr010src.zip

// someday we might consider using "improved noise"
// http://mrl.nyu.edu/~perlin/paper445.pdf
// See: https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/
//      blob/main/introduction/Noise1D/noise.js

/**
 * @module Math
 * @submodule Noise
 * @for p5
 * @requires core
 */

const PERLIN_YWRAPB = 4;
const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
const PERLIN_ZWRAPB = 8;
const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
const PERLIN_SIZE = 4095;

let perlin_octaves = 4; // default to medium smooth
let perlin_amp_falloff = 0.5; // 50% reduction/octave

const scaled_cosine = i => 0.5 * (1.0 - Math.cos(i * Math.PI));

let perlin; // will be initialized lazily by noise() or noiseSeed()

/**
 * Returns random numbers that can be tuned to feel organic.
 *
 * Values returned by <a href="#/p5/random">random()</a> and
 * <a href="#/p5/randomGaussian">randomGaussian()</a> can change by large
 * amounts between function calls. By contrast, values returned by `noise()`
 * can be made "smooth". Calls to `noise()` with similar inputs will produce
 * similar outputs. `noise()` is used to create textures, motion, shapes,
 * terrains, and so on. Ken Perlin invented `noise()` while animating the
 * original <em>Tron</em> film in the 1980s.
 *
 * `noise()` always returns values between 0 and 1. It returns the same value
 * for a given input while a sketch is running. `noise()` produces different
 * results each time a sketch runs. The
 * <a href="#/p5/noiseSeed">noiseSeed()</a> function can be used to generate
 * the same sequence of Perlin noise values each time a sketch runs.
 *
 * The character of the noise can be adjusted in two ways. The first way is to
 * scale the inputs. `noise()` interprets inputs as coordinates. The sequence
 * of noise values will be smoother when the input coordinates are closer. The
 * second way is to use the <a href="#/p5/noiseDetail">noiseDetail()</a>
 * function.
 *
 * The version of `noise()` with one parameter computes noise values in one
 * dimension. This dimension can be thought of as space, as in `noise(x)`, or
 * time, as in `noise(t)`.
 *
 * The version of `noise()` with two parameters computes noise values in two
 * dimensions. These dimensions can be thought of as space, as in
 * `noise(x, y)`, or space and time, as in `noise(x, t)`.
 *
 * The version of `noise()` with three parameters computes noise values in
 * three dimensions. These dimensions can be thought of as space, as in
 * `noise(x, y, z)`, or space and time, as in `noise(x, y, t)`.
 *
 * @method noise
 * @param  {Number} x   x-coordinate in noise space.
 * @param  {Number} [y] y-coordinate in noise space.
 * @param  {Number} [z] z-coordinate in noise space.
 * @return {Number}     Perlin noise value at specified coordinates.
 *
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   describe('A black dot moves randomly on a gray square.');
 * }
 *
 * function draw() {
 *   background(200);
 *
 *   // Calculate the coordinates.
 *   let x = 100 * noise(0.005 * frameCount);
 *   let y = 100 * noise(0.005 * frameCount + 10000);
 *
 *   // Draw the point.
 *   strokeWeight(5);
 *   point(x, y);
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   describe('A black dot moves randomly on a gray square.');
 * }
 *
 * function draw() {
 *   background(200);
 *
 *   // Set the noise level and scale.
 *   let noiseLevel = 100;
 *   let noiseScale = 0.005;
 *
 *   // Scale the input coordinate.
 *   let nt = noiseScale * frameCount;
 *
 *   // Compute the noise values.
 *   let x = noiseLevel * noise(nt);
 *   let y = noiseLevel * noise(nt + 10000);
 *
 *   // Draw the point.
 *   strokeWeight(5);
 *   point(x, y);
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   describe('A hilly terrain drawn in gray against a black sky.');
 * }
 *
 * function draw() {
 *   // Set the noise level and scale.
 *   let noiseLevel = 100;
 *   let noiseScale = 0.02;
 *
 *   // Scale the input coordinate.
 *   let x = frameCount;
 *   let nx = noiseScale * x;
 *
 *   // Compute the noise value.
 *   let y = noiseLevel * noise(nx);
 *
 *   // Draw the line.
 *   line(x, 0, x, y);
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   describe('A calm sea drawn in gray against a black sky.');
 * }
 *
 * function draw() {
 *   background(200);
 *
 *   // Set the noise level and scale.
 *   let noiseLevel = 100;
 *   let noiseScale = 0.002;
 *
 *   // Iterate from left to right.
 *   for (let x = 0; x < width; x += 1) {
 *     // Scale the input coordinates.
 *     let nx = noiseScale * x;
 *     let nt = noiseScale * frameCount;
 *
 *     // Compute the noise value.
 *     let y = noiseLevel * noise(nx, nt);
 *
 *     // Draw the line.
 *     line(x, 0, x, y);
 *   }
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   background(200);
 *
 *   // Set the noise level and scale.
 *   let noiseLevel = 255;
 *   let noiseScale = 0.01;
 *
 *   // Iterate from top to bottom.
 *   for (let y = 0; y < height; y += 1) {
 *     // Iterate from left to right.
 *     for (let x = 0; x < width; x += 1) {
 *       // Scale the input coordinates.
 *       let nx = noiseScale * x;
 *       let ny = noiseScale * y;
 *
 *       // Compute the noise value.
 *       let c = noiseLevel * noise(nx, ny);
 *
 *       // Draw the point.
 *       stroke(c);
 *       point(x, y);
 *     }
 *   }
 *
 *   describe('A gray cloudy pattern.');
 * }
 * </code>
 * </div>
 *
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   describe('A gray cloudy pattern that changes.');
 * }
 *
 * function draw() {
 *   // Set the noise level and scale.
 *   let noiseLevel = 255;
 *   let noiseScale = 0.009;
 *
 *   // Iterate from top to bottom.
 *   for (let y = 0; y < height; y += 1) {
 *     // Iterate from left to right.
 *     for (let x = 0; x < width; x += 1) {
 *       // Scale the input coordinates.
 *       let nx = noiseScale * x;
 *       let ny = noiseScale * y;
 *       let nt = noiseScale * frameCount;
 *
 *       // Compute the noise value.
 *       let c = noiseLevel * noise(nx, ny, nt);
 *
 *       // Draw the point.
 *       stroke(c);
 *       point(x, y);
 *     }
 *   }
 * }
 * </code>
 * </div>
 */

const noise = function(x, y = 0, z = 0) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (let i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = Math.random();
    }
  }

  if (x < 0) {
    x = -x;
  }
  if (y < 0) {
    y = -y;
  }
  if (z < 0) {
    z = -z;
  }

  let xi = Math.floor(x),
    yi = Math.floor(y),
    zi = Math.floor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  let rxf, ryf;

  let r = 0;
  let ampl = 0.5;

  let n1, n2, n3;

  for (let o = 0; o < perlin_octaves; o++) {
    let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);

    rxf = scaled_cosine(xf);
    ryf = scaled_cosine(yf);

    n1 = perlin[of & PERLIN_SIZE];
    n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
    n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
    n1 += ryf * (n2 - n1);

    of += PERLIN_ZWRAP;
    n2 = perlin[of & PERLIN_SIZE];
    n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
    n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
    n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
    n2 += ryf * (n3 - n2);

    n1 += scaled_cosine(zf) * (n2 - n1);

    r += n1 * ampl;
    ampl *= perlin_amp_falloff;
    xi <<= 1;
    xf *= 2;
    yi <<= 1;
    yf *= 2;
    zi <<= 1;
    zf *= 2;

    if (xf >= 1.0) {
      xi++;
      xf--;
    }
    if (yf >= 1.0) {
      yi++;
      yf--;
    }
    if (zf >= 1.0) {
      zi++;
      zf--;
    }
  }
  return r;
};

/**
 * Adjusts the character of the noise produced by the
 * <a href="#/p5/noise">noise()</a> function.
 *
 * Perlin noise values are created by adding layers of noise together. The
 * noise layers, called octaves, are similar to harmonics in music. Lower
 * octaves contribute more to the output signal. They define the overall
 * intensity of the noise. Higher octaves create finer-grained details.
 *
 * By default, noise values are created by combining four octaves. Each higher
 * octave contributes half as much (50% less) compared to its predecessor.
 * `noiseDetail()` changes the number of octaves and the falloff amount. For
 * example, calling `noiseDetail(6, 0.25)` ensures that
 * <a href="#/p5/noise">noise()</a> will use six octaves. Each higher octave
 * will contribute 25% as much (75% less) compared to its predecessor. Falloff
 * values between 0 and 1 are valid. However, falloff values greater than 0.5
 * might result in noise values greater than 1.
 *
 * @method noiseDetail
 * @param {Number} lod number of octaves to be used by the noise.
 * @param {Number} falloff falloff factor for each octave.
 *
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   // Set the noise level and scale.
 *   let noiseLevel = 255;
 *   let noiseScale = 0.02;
 *
 *   // Iterate from top to bottom.
 *   for (let y = 0; y < height; y += 1) {
 *     // Iterate from left to right.
 *     for (let x = 0; x < width / 2; x += 1) {
 *       // Scale the input coordinates.
 *       let nx = noiseScale * x;
 *       let ny = noiseScale * y;
 *
 *       // Compute the noise value with six octaves
 *       // and a low falloff factor.
 *       noiseDetail(6, 0.25);
 *       let c = noiseLevel * noise(nx, ny);
 *
 *       // Draw the left side.
 *       stroke(c);
 *       point(x, y);
 *
 *       // Compute the noise value with four octaves
 *       // and a high falloff factor.
 *       noiseDetail(4, 0.5);
 *       c = noiseLevel * noise(nx, ny);
 *
 *       // Draw the right side.
 *       stroke(c);
 *       point(x + 50, y);
 *     }
 *   }
 *
 *   describe('Two gray cloudy patterns. The pattern on the right is cloudier than the pattern on the left.');
 * }
 * </code>
 * </div>
 */
const noiseDetail = function(lod, falloff) {
  if (lod > 0) {
    perlin_octaves = lod;
  }
  if (falloff > 0) {
    perlin_amp_falloff = falloff;
  }
};

/**
 * Sets the seed value for the <a href="#/p5/noise">noise()</a> function.
 *
 * By default, <a href="#/p5/noise">noise()</a> produces different results
 * each time a sketch is run. Calling `noiseSeed()` with a constant argument,
 * such as `noiseSeed(99)`, makes <a href="#/p5/noise">noise()</a> produce the
 * same results each time a sketch is run.
 *
 * @method noiseSeed
 * @param {Number} seed   seed value.
 *
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100);
 *
 *   background(200);
 *
 *   // Set the noise seed for consistent results.
 *   noiseSeed(99);
 *
  *   describe('A black rectangle that grows randomly, first to the right and then to the left.');
 * }
 *
 * function draw() {
 *   // Set the noise level and scale.
 *   let noiseLevel = 100;
 *   let noiseScale = 0.005;
 *
 *   // Scale the input coordinate.
 *   let nt = noiseScale * frameCount;
 *
 *   // Compute the noise value.
 *   let x = noiseLevel * noise(nt);
 *
 *   // Draw the line.
 *   line(x, 0, x, height);
 * }
 * </code>
 * </div>
 */
const noiseSeed = function(seed) {
  // Linear Congruential Generator
  // Variant of a Lehman Generator
  const lcg = (() => {
    // Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
    // m is basically chosen to be large (as it is the max period)
    // and for its relationships to a and c
    const m = 4294967296;
    // a - 1 should be divisible by m's prime factors
    const a = 1664525;
    // c and m should be co-prime
    const c = 1013904223;
    let seed, z;
    return {
      setSeed(val) {
        // pick a random seed if val is undefined or null
        // the >>> 0 casts the seed to an unsigned 32-bit integer
        z = seed = (val == null ? Math.random() * m : val) >>> 0;
      },
      getSeed() {
        return seed;
      },
      rand() {
        // define the recurrence relationship
        z = (a * z + c) % m;
        // return a float in [0, 1)
        // if z = m then z / m = 0 therefore (z % m) / m < 1 always
        return z / m;
      }
    };
  })();

  lcg.setSeed(seed);
  perlin = new Array(PERLIN_SIZE + 1);
  for (let i = 0; i < PERLIN_SIZE + 1; i++) {
    perlin[i] = lcg.rand();
  }
};

// import { noise } from './noise.js'

function p() {
    noiseSeed(Date.now());
    const data = renderer.element.textContent
        .split('\n')
        .map(line => line.split(''));
    for (let x = 0; x < renderer.width; x++) {
        for (let y = 0; y < renderer.height; y++) {
            // console.log(PerlinNoise.noise(x, y, 0));
            data[y][x] = [...' ░▒'][Math.round((noise(x, y) * 3))];
        }
    }
    renderer.element.textContent = data
        .map(line => line.join(''))
        .join('\n');
    return requestAnimationFrame(p);

}

p();

// animate();

// loop();
// renderer.circle({ x: 50, y: 50 }, 20);
