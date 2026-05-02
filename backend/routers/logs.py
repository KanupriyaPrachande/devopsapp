from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json, asyncio, datetime, random

router = APIRouter()

LOG_TEMPLATES = [
    ("INFO",  "GET /api/health → 200 OK ({ms}ms)"),
    ("INFO",  "GET /api/metrics → 200 OK ({ms}ms)"),
    ("INFO",  "POST /api/deploy → 202 Accepted"),
    ("WARN",  "High memory usage detected: {mem}%"),
    ("INFO",  "Container fastapi-backend heartbeat ok"),
    ("INFO",  "Scheduler tick #{tick}"),
    ("ERROR", "Connection timeout on redis (retry {r}/3)"),
    ("INFO",  "GET /api/containers → 200 OK ({ms}ms)"),
    ("WARN",  "CPU spike detected: {cpu}%"),
    ("INFO",  "Health check passed for all containers"),
    ("INFO",  "postgres-db: checkpoint complete"),
    ("ERROR", "nginx-proxy: upstream timed out"),
    ("INFO",  "redis-cache: keyspace hit ratio 94%"),
    ("INFO",  "Deploy pipeline triggered by push to main"),
    ("INFO",  "Build step 1/4: installing dependencies"),
    ("INFO",  "Build step 2/4: running tests"),
    ("INFO",  "Build step 3/4: building docker image"),
    ("INFO",  "Build step 4/4: pushing to registry"),
    ("INFO",  "Deployment complete in {ms}s"),
]

_log_buffer = []
_tick = 0


def _gen_log():
    global _tick
    _tick += 1
    tmpl_level, tmpl_msg = random.choice(LOG_TEMPLATES)
    msg = tmpl_msg.format(
        ms=random.randint(1, 120),
        mem=random.randint(70, 95),
        cpu=random.randint(60, 99),
        tick=_tick,
        r=random.randint(1, 3),
    )
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    entry = {"ts": ts, "level": tmpl_level, "msg": msg, "tick": _tick}
    _log_buffer.append(entry)
    if len(_log_buffer) > 500:
        _log_buffer.pop(0)
    return entry


@router.get("")
def get_logs(limit: int = 50):
    return {"logs": _log_buffer[-limit:]}


@router.get("/stream")
async def logs_stream():
    async def generate():
        while True:
            log = _gen_log()
            yield f"data: {json.dumps(log)}\n\n"
            await asyncio.sleep(random.uniform(0.8, 2.5))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )