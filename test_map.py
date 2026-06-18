import asyncio
from fastapi import FastAPI
from backend.main import lifespan, app_data

async def test():
    app = FastAPI()
    async with lifespan(app):
        events = app_data.get('map_events', [])
        print(f"Total events: {len(events)}")
        buckets = [e.get('severity_bucket') for e in events]
        from collections import Counter
        print(Counter(buckets))

if __name__ == '__main__':
    asyncio.run(test())
