import json
from typing import Any, Optional, Dict
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RedisClient:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._memory_store: Dict[str, str] = {}
        self._is_mock = False

    async def connect(self):
        try:
            self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            await self._redis.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis not available ({e}) — using in-memory cache/pubsub fallback.")
            self._is_mock = True

    async def disconnect(self):
        if self._redis:
            await self._redis.close()

    async def get(self, key: str) -> Optional[str]:
        if self._is_mock:
            return self._memory_store.get(key)
        if not self._redis: return None
        return await self._redis.get(key)

    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        if self._is_mock:
            self._memory_store[key] = value
            return
        if not self._redis: return
        await self._redis.set(key, value, ex=ttl)

    async def delete(self, key: str):
        if self._is_mock:
            self._memory_store.pop(key, None)
            return
        if not self._redis: return
        await self._redis.delete(key)

    async def publish(self, channel: str, message: str):
        if self._is_mock:
            return
        if not self._redis: return
        await self._redis.publish(channel, message)

    async def subscribe(self, channel: str):
        if self._is_mock or not self._redis:
            return None
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(channel)
        return pubsub

    async def get_json(self, key: str) -> Optional[Any]:
        val = await self.get(key)
        if val:
            return json.loads(val)
        return None

    async def set_json(self, key: str, data: Any, ttl: Optional[int] = None):
        await self.set(key, json.dumps(data), ttl)

    async def increment(self, key: str) -> int:
        if self._is_mock:
            current = int(self._memory_store.get(key, 0)) + 1
            self._memory_store[key] = str(current)
            return current
        if not self._redis: return 0
        return await self._redis.incr(key)

    async def expire(self, key: str, seconds: int):
        if self._is_mock or not self._redis: return
        await self._redis.expire(key, seconds)

redis_client = RedisClient()
