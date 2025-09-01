import WebSocket from 'ws';
import fetch from 'node-fetch';
import { TextDecoder, TextEncoder } from 'util';

// Декодирование Blitzortung
function decode(b) {
    const e = {};
    const d = Array.from(new TextDecoder().decode(b));
    let c = d[0];
    let f = c;
    const g = [c];
    let h = 256;
    let o = h;

    for (let i = 1; i < d.length; i++) {
        let a = d[i].charCodeAt(0);
        if (h <= a) a = e[a] || f + c;
        else a = d[i];
        g.push(a);
        c = a[0];
        e[o] = f + c;
        o++;
        f = a;
    }
    return new TextEncoder().encode(g.join(''));
}

// Обратное геокодирование: страна, город, улица, номер дома
let lastRequestTime = 0;
const requestInterval = 2000;

async function fullReverseGeocode(lat, lon) {
    const now = Date.now();
    if (now - lastRequestTime < requestInterval) return null;
    lastRequestTime = now;

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'BlitzortungClient/1.0',
                'Referer': 'https://yourdomain.com'
            },
            timeout: 5000
        });
        const data = await res.json();
        const addr = data.address || {};

        const country = addr.country || '';
        const city = addr.city || addr.town || addr.village || '';
        const road = addr.road || '';
        const house_number = addr.house_number || '';

        const parts = [country, city, road, house_number].filter(Boolean);
        return parts.join(', ') || 'Unknown location';
    } catch {
        return 'Unknown location';
    }
}

// WebSocket подключение
let ws;
const currentSocketUrl = 'wss://ws1.blitzortung.org';
const reconnectInterval = 60 * 1000;

function connect(url) {
    ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.on('open', () => ws.send(JSON.stringify({ a: 111 })));

    ws.on('message', async (message) => {
        try {
            const decoded = decode(new Uint8Array(message));
            const jsonStr = new TextDecoder().decode(decoded);
            const data = JSON.parse(jsonStr);

            const lat = data.lat || data.lt;
            const lon = data.lon || data.ln;

            if (lat && lon) {
                const address = await fullReverseGeocode(lat, lon);
                console.log(`${lat}, ${lon} — ${address}`);
            }
        } catch {}
    });
}

// Автоматическая смена сокета
function scheduleSocketSwitch() {
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
        connect(currentSocketUrl);
    }, reconnectInterval);
}

// Запуск
connect(currentSocketUrl);
scheduleSocketSwitch();
