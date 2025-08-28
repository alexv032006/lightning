import asyncio
import websockets
import json
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="lightning_app")

def decode(b):
    e = {}
    # Если это строка, оставляем как есть
    if isinstance(b, bytes):
        d = list(b.decode())
    else:
        d = list(b)
    c = d[0]
    f = c
    g = [c]
    h = 256
    o = h
    for i in range(1, len(d)):
        a = ord(d[i])
        a = d[i] if h > a else e[a] if e.get(a) else f + c
        g.append(a)
        c = a[0]
        e[o] = f + c
        o += 1
        f = a
    return ''.join(g).encode()

def get_address(lat, lon):
    location = geolocator.reverse((lat, lon), language="ru")
    return location.address if location else None

async def blitzortung_ws():
    url = "wss://ws1.blitzortung.org"
    async with websockets.connect(url) as ws:
        await ws.send(json.dumps({"a": 111}))

        async for message in ws:
            decoded = decode(message)
            data = json.loads(decoded)
            lat = data.get("lat")
            lon = data.get("lon")
            if lat and lon:
                address = get_address(lat, lon)
                print(f"Молния: {lat}, {lon} → {address}")

asyncio.run(blitzortung_ws())
