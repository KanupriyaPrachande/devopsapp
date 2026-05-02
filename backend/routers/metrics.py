from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import psutil, json, asyncio, datetime

router = APIRouter()


def get_metrics():
    cpu    = psutil.cpu_percent(interval=0.1)
    mem    = psutil.virtual_memory()
    disk   = psutil.disk_usage("/")
    net    = psutil.net_io_counters()
    boot   = datetime.datetime.fromtimestamp(psutil.boot_time())
    uptime = str(datetime.datetime.now() - boot).split(".")[0]

    return {
        "cpu":    round(cpu, 1),
        "mem":    round(mem.percent, 1),
        "mem_used_gb": round(mem.used / 1e9, 2),
        "mem_total_gb": round(mem.total / 1e9, 2),
        "disk":   round(disk.percent, 1),
        "disk_used_gb": round(disk.used / 1e9, 1),
        "disk_total_gb": round(disk.total / 1e9, 1),
        "net_sent_mb": round(net.bytes_sent / 1e6, 1),
        "net_recv_mb": round(net.bytes_recv / 1e6, 1),
        "uptime": uptime,
        "timestamp": datetime.datetime.now().isoformat(),
    }


@router.get("")
def metrics_snapshot():
    return get_metrics()


@router.get("/stream")
async def metrics_stream():
    """SSE stream — pushes metrics every second."""
    async def generate():
        while True:
            data = get_metrics()
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )