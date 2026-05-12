export {};

const name = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (
    document.querySelector('input#name')
);
const email = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (
    document.querySelector('input#email')
);
const subject = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (
    document.querySelector('input#subject')
);
const body = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (
    document.querySelector('textarea#body')
);
const submit = /** @type {HTMLButtonElement} */ (
    document.querySelector('.send')
);

/**
 * @param {number[]} nums
 * @returns {string}
 */
function hash(nums) {
    let hash = 1469598103934665603n;
    const prime = 1099511628211n;
    const mask = (1n << 64n) - 1n;

    for (const num of nums) {
        const bigint = BigInt(num);
        hash ^= bigint & mask;
        hash = (hash * prime) & mask;
    }

    return hash.toString(16).padStart(16, '0');
}

/**
 * @returns {{ get(): Promise<string | undefined>; set(value: string): Promise<void> }}
 */
function determine_storage_method() {
    if (navigator.hardwareConcurrency < 4) {
        return {
            get() {
                return Promise.resolve(localStorage.uuid);
            },
            set(value) {
                localStorage.uuid = value;
                return Promise.resolve();
            }
        };
    }
    return {
        async get() {
            const entry = await cookieStore.get('uuid');
            return entry?.value;
        },
        async set(value) {
            await cookieStore.set('uuid', value);
        }
    };
}

addEventListener('load', async () => {
    const method = determine_storage_method();
    const value = await method.get();
    if (value === undefined || value === '') {
        const display = screen;
        const values = [
            display.width,
            display.height,
            display.colorDepth,
            display.pixelDepth,
            navigator.maxTouchPoints
        ];
        const hashed = hash(values);
        await method.set(hashed);
    }
});

/**
 * @param {string} data
 * @param {string} uuid
 */
function encrypt(data, uuid) {
    const res = [];
    for (let i = 0; i < data.length; i++) {
        const uuid_char = uuid.charCodeAt(i % uuid.length);
        res.push(String.fromCharCode(data.charCodeAt(i) + uuid_char));
    }
    return res.join('');
}

async function send() {
    const { get } = determine_storage_method();
    const uuid = /** @type {string} */ (await get());
    const data = {
        json: JSON.stringify({
            name: encrypt(name.value, uuid),
            email: encrypt(email.value, uuid),
            subject: encrypt(subject.value, uuid),
            body: encrypt(body.value, uuid)
        }),
        uuid
    };
    name.value = '';
    email.value = '';
    subject.value = '';
    body.value = '';
    const request = await fetch('./contact', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await request.json();
    if (json.success) {
        return;
    }
    throw new Error('invalid');
}

submit.addEventListener('click', send);
