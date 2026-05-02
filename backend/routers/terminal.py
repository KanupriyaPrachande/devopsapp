"""
terminal.py — Real terminal for admin, safe sandboxed demo for demo users
"""
import asyncio, sys, threading, os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

router = APIRouter()

# Commands demo users are allowed to run
DEMO_ALLOWED = {
    "help", "dir", "ls", "pwd", "whoami", "hostname",
    "python --version", "python3 --version",
    "node --version", "npm --version",
    "docker ps", "docker images", "docker --version",
    "git --version", "echo", "date", "time",
    "ipconfig", "ifconfig", "uname", "uname -a",
    "cat requirements.txt", "cat package.json",
    "pip list", "pip --version",
}

DEMO_BANNER = (
    "\r\n\x1b[1;34m╔══════════════════════════════════════════════════════╗\x1b[0m\r\n"
    "\x1b[1;34m║\x1b[0m  \x1b[1;37m⬡ DevOpsApp\x1b[0m \x1b[36mSandboxed Demo Terminal\x1b[0m             \x1b[1;34m║\x1b[0m\r\n"
    "\x1b[1;34m║\x1b[0m  \x1b[33mRead-only mode — safe commands only\x1b[0m              \x1b[1;34m║\x1b[0m\r\n"
    "\x1b[1;34m╚══════════════════════════════════════════════════════╝\x1b[0m\r\n"
    "\r\n\x1b[2mAllowed: dir, docker ps, python --version, pip list...\x1b[0m\r\n"
    "\x1b[2mType 'help' for the full list of allowed commands.\x1b[0m\r\n\r\n"
    "\x1b[32m$\x1b[0m "
)

HELP_TEXT = (
    "\r\n\x1b[1;34mAllowed commands in demo mode:\x1b[0m\r\n"
    "  \x1b[32mdir / ls\x1b[0m          — list files\r\n"
    "  \x1b[32mpwd\x1b[0m               — current directory\r\n"
    "  \x1b[32mwhoami / hostname\x1b[0m — system info\r\n"
    "  \x1b[32mdocker ps\x1b[0m         — running containers\r\n"
    "  \x1b[32mdocker images\x1b[0m     — docker images\r\n"
    "  \x1b[32mpython --version\x1b[0m  — python version\r\n"
    "  \x1b[32mpip list\x1b[0m          — installed packages\r\n"
    "  \x1b[32mgit --version\x1b[0m     — git version\r\n"
    "  \x1b[32mecho <text>\x1b[0m       — print text\r\n"
    "  \x1b[32mclear\x1b[0m             — clear screen\r\n"
    "\r\n"
)


@router.websocket("/ws")
async def terminal_ws(websocket: WebSocket, role: str = Query(default="demo")):
    await websocket.accept()

    if role == "admin":
        # Real shell for admin
        if sys.platform == "win32":
            await _real_shell_windows(websocket)
        else:
            await _real_shell_unix(websocket)
    else:
        # Safe sandboxed terminal for demo
        await _demo_shell(websocket)


# ── DEMO SANDBOX ──────────────────────────────────────────────────────────────
async def _demo_shell(websocket: WebSocket):
    await websocket.send_text(DEMO_BANNER)
    buffer = ""

    try:
        while True:
            data = await websocket.receive_text()

            for char in data:
                if char == '\r':
                    # Execute command
                    cmd = buffer.strip()
                    buffer = ""
                    await websocket.send_text("\r\n")

                    if not cmd:
                        await websocket.send_text("\x1b[32m$\x1b[0m ")
                        continue

                    if cmd == "clear":
                        await websocket.send_text("\x1b[2J\x1b[H\x1b[32m$\x1b[0m ")
                        continue

                    if cmd == "help":
                        await websocket.send_text(HELP_TEXT)
                        await websocket.send_text("\x1b[32m$\x1b[0m ")
                        continue

                    # Check if allowed
                    allowed = any(
                        cmd == a or cmd.startswith(a + " ")
                        for a in DEMO_ALLOWED
                    )

                    if not allowed:
                        await websocket.send_text(
                            f"\x1b[31m✕ '{cmd}' is not allowed in demo mode.\x1b[0m\r\n"
                            f"\x1b[2m  Type 'help' to see allowed commands.\x1b[0m\r\n"
                        )
                        await websocket.send_text("\x1b[32m$\x1b[0m ")
                        continue

                    # Run it safely
                    try:
                        result = await asyncio.wait_for(
                            asyncio.create_subprocess_shell(
                                cmd,
                                stdout=asyncio.subprocess.PIPE,
                                stderr=asyncio.subprocess.STDOUT,
                            ),
                            timeout=0.1
                        )
                        proc = result
                        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=8)
                        output = stdout.decode("utf-8", errors="replace")
                        # Convert newlines to \r\n for terminal
                        output = output.replace("\n", "\r\n")
                        await websocket.send_text(output)
                    except asyncio.TimeoutError:
                        await websocket.send_text("\x1b[31mTimeout\x1b[0m\r\n")
                    except Exception as e:
                        await websocket.send_text(f"\x1b[31mError: {e}\x1b[0m\r\n")

                    await websocket.send_text("\x1b[32m$\x1b[0m ")

                elif char == '\x7f' or char == '\b':
                    # Backspace
                    if buffer:
                        buffer = buffer[:-1]
                        await websocket.send_text("\b \b")
                elif char == '\x03':
                    # Ctrl+C
                    buffer = ""
                    await websocket.send_text("^C\r\n\x1b[32m$\x1b[0m ")
                elif ord(char) >= 32:
                    buffer += char
                    await websocket.send_text(char)

    except WebSocketDisconnect:
        pass


# ── REAL SHELL (ADMIN) ────────────────────────────────────────────────────────
async def _real_shell_windows(websocket: WebSocket):
    import subprocess
    proc = subprocess.Popen(
        ["powershell.exe", "-NoLogo", "-NoProfile"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=0,
    )
    loop = asyncio.get_event_loop()
    q    = asyncio.Queue()

    def read():
        while True:
            try:
                chunk = proc.stdout.read(256)
                if not chunk:
                    break
                loop.call_soon_threadsafe(q.put_nowait, chunk.decode("utf-8", errors="replace"))
            except Exception:
                break
        loop.call_soon_threadsafe(q.put_nowait, None)

    threading.Thread(target=read, daemon=True).start()

    async def send():
        while True:
            chunk = await q.get()
            if chunk is None:
                break
            try:
                await websocket.send_text(chunk)
            except Exception:
                break

    sender = asyncio.create_task(send())
    try:
        while True:
            data = await websocket.receive_text()
            if proc.poll() is not None:
                break
            data = data.replace('\r', '\r\n')
            proc.stdin.write(data.encode("utf-8"))
            proc.stdin.flush()
    except WebSocketDisconnect:
        pass
    finally:
        sender.cancel()
        try:
            proc.terminate()
        except Exception:
            pass


async def _real_shell_unix(websocket: WebSocket):
    import pty, subprocess
    shell = os.environ.get("SHELL", "/bin/bash")
    master_fd, slave_fd = pty.openpty()
    proc = subprocess.Popen(
        [shell, "--login"],
        stdin=slave_fd, stdout=slave_fd, stderr=slave_fd,
        close_fds=True,
        env={**os.environ, "TERM": "xterm-256color", "COLUMNS": "200", "LINES": "50"},
    )
    os.close(slave_fd)
    loop = asyncio.get_event_loop()
    q    = asyncio.Queue()

    def read():
        while True:
            try:
                data = os.read(master_fd, 1024)
                if data:
                    loop.call_soon_threadsafe(q.put_nowait, data)
            except OSError:
                break
        loop.call_soon_threadsafe(q.put_nowait, None)

    threading.Thread(target=read, daemon=True).start()

    async def send():
        while True:
            chunk = await q.get()
            if chunk is None:
                break
            try:
                await websocket.send_bytes(chunk)
            except Exception:
                break

    sender = asyncio.create_task(send())
    try:
        while True:
            data = await websocket.receive_text()
            os.write(master_fd, data.encode())
    except WebSocketDisconnect:
        pass
    finally:
        sender.cancel()
        try:
            proc.terminate()
            os.close(master_fd)
        except Exception:
            pass