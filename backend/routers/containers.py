from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json, asyncio, datetime

router = APIRouter()

# ── Try real Docker, fall back to demo data ───────────────────────────────────
def _docker_client():
    try:
        import docker
        client = docker.from_env()
        client.ping()
        return client
    except Exception:
        return None


DEMO_CONTAINERS = [
    {
        "id": "a1b2c3d4e5f6",
        "name": "fastapi-backend",
        "image": "tiangolo/uvicorn-gunicorn-fastapi:python3.11",
        "status": "running",
        "cpu_percent": 12.4,
        "mem_mb": 148.2,
        "ports": "0.0.0.0:8000->8000/tcp",
        "uptime": "2 hours",
    },
    {
        "id": "b2c3d4e5f6a1",
        "name": "redis-cache",
        "image": "redis:7-alpine",
        "status": "running",
        "cpu_percent": 0.3,
        "mem_mb": 8.1,
        "ports": "0.0.0.0:6379->6379/tcp",
        "uptime": "2 hours",
    },
    {
        "id": "c3d4e5f6a1b2",
        "name": "postgres-db",
        "image": "postgres:16-alpine",
        "status": "running",
        "cpu_percent": 2.1,
        "mem_mb": 32.5,
        "ports": "0.0.0.0:5432->5432/tcp",
        "uptime": "2 hours",
    },
    {
        "id": "d4e5f6a1b2c3",
        "name": "nginx-proxy",
        "image": "nginx:alpine",
        "status": "exited",
        "cpu_percent": 0.0,
        "mem_mb": 0.0,
        "ports": "",
        "uptime": "stopped",
    },
]


def _get_containers():
    client = _docker_client()
    if client:
        result = []
        for c in client.containers.list(all=True):
            stats = {}
            try:
                if c.status == "running":
                    raw = c.stats(stream=False)
                    cpu_delta = raw["cpu_stats"]["cpu_usage"]["total_usage"] - \
                                raw["precpu_stats"]["cpu_usage"]["total_usage"]
                    sys_delta = raw["cpu_stats"]["system_cpu_usage"] - \
                                raw["precpu_stats"]["system_cpu_usage"]
                    num_cpus  = raw["cpu_stats"].get("online_cpus", 1)
                    cpu_pct   = round((cpu_delta / sys_delta) * num_cpus * 100, 2) if sys_delta > 0 else 0
                    mem_mb    = round(raw["memory_stats"].get("usage", 0) / 1e6, 2)
                else:
                    cpu_pct = 0.0
                    mem_mb  = 0.0
            except Exception:
                cpu_pct = 0.0
                mem_mb  = 0.0

            ports = ", ".join(
                f"{v[0]['HostIp']}:{v[0]['HostPort']}->{k}"
                for k, v in (c.ports or {}).items() if v
            ) or ""

            result.append({
                "id":          c.short_id,
                "name":        c.name,
                "image":       c.image.tags[0] if c.image.tags else c.image.short_id,
                "status":      c.status,
                "cpu_percent": cpu_pct,
                "mem_mb":      mem_mb,
                "ports":       ports,
                "uptime":      "",
            })
        return result, True
    else:
        import random
        demo = []
        for ct in DEMO_CONTAINERS:
            d = dict(ct)
            if d["status"] == "running":
                d["cpu_percent"] = round(d["cpu_percent"] + random.uniform(-1, 1), 2)
                d["mem_mb"]      = round(d["mem_mb"]      + random.uniform(-2, 2), 2)
            demo.append(d)
        return demo, False


@router.get("")
def list_containers():
    containers, live = _get_containers()
    return {"containers": containers, "live": live}


@router.post("/{name}/start")
def start_container(name: str):
    client = _docker_client()
    if not client:
        return {"ok": True, "message": f"[demo] {name} started", "demo": True}
    try:
        c = client.containers.get(name)
        c.start()
        return {"ok": True, "message": f"{name} started"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{name}/stop")
def stop_container(name: str):
    client = _docker_client()
    if not client:
        return {"ok": True, "message": f"[demo] {name} stopped", "demo": True}
    try:
        c = client.containers.get(name)
        c.stop()
        return {"ok": True, "message": f"{name} stopped"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{name}/logs")
def container_logs(name: str, tail: int = 50):
    client = _docker_client()
    if not client:
        now = datetime.datetime.now()
        fake = [
            f"{(now - datetime.timedelta(seconds=i)).strftime('%H:%M:%S')}  INFO  [{name}] heartbeat ok"
            for i in range(tail, 0, -1)
        ]
        return {"logs": fake, "demo": True}
    try:
        c = client.containers.get(name)
        raw = c.logs(tail=tail, timestamps=True).decode("utf-8", errors="replace")
        return {"logs": raw.strip().split("\n"), "demo": False}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stream")
async def containers_stream():
    async def generate():
        while True:
            containers, live = _get_containers()
            yield f"data: {json.dumps({'containers': containers, 'live': live})}\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )