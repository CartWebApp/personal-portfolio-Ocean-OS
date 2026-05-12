import * as v from 'valibot';
import { config as configure_dotenv } from 'dotenv';
configure_dotenv();

const message = v.object({
    name: v.pipe(v.string(), v.maxLength(100)),
    email: v.pipe(v.string(), v.email()),
    subject: v.pipe(v.string(), v.maxLength(100)),
    body: v.string()
});

const encoded = v.object({
    json: v.string(),
    uuid: v.string()
});

const env_schema = v.object({
    CONTACT_ENDPOINT: v.pipe(v.string(), v.url())
});

const encrypted = v.object({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    body: v.string()
});

const env = v.parse(env_schema, process.env);

/**
 * @param {string} data
 * @param {string} uuid
 */
function decrypt(data, uuid) {
    const res = [];
    for (let i = 0; i < data.length; i++) {
        const uuid_char = uuid.charCodeAt(i % uuid.length);
        res.push(String.fromCharCode(data.charCodeAt(i) - uuid_char));
    }
    return res.join('');
}

/**
 * @param {Request} request
 */
export default async function (request) {
    try {
        const json = await request.json();
        const validated_encoded = v.parse(encoded, json);
        const parsed = v.parse(encrypted, JSON.parse(validated_encoded.json));
        const validated = v.parse(message, {
            name: decrypt(parsed.name, validated_encoded.uuid),
            email: decrypt(parsed.email, validated_encoded.uuid),
            subject: decrypt(parsed.subject, validated_encoded.uuid),
            body: decrypt(parsed.body, validated_encoded.uuid)
        });
        const url = new URL(env.CONTACT_ENDPOINT);
        const { searchParams: params } = url;
        params.append('name', validated.name);
        params.append('email', validated.email);
        params.append('subject', validated.subject);
        params.append('body', validated.body);
        await fetch(url, {
            method: 'POST',
            body: ''
        });
        return Response.json({
            success: true
        });
    } catch (err) {
        console.log(err);
        return Response.json({
            success: false
        });
    }
}

export const config = {
    path: '/contact'
};
