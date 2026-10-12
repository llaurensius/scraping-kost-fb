import asyncio
import socket
import logging
from typing import Optional

logger = logging.getLogger("cdp_tunnel")

class WindowsCdpTunnel:
    _server: Optional[asyncio.Server] = None
    _win_proxy_proc = None

    @classmethod
    async def get_windows_gateway_ip(cls) -> str:
        proc = await asyncio.create_subprocess_shell(
            "ip route | grep default | awk '{print $3}'",
            stdout=asyncio.subprocess.PIPE
        )
        stdout, _ = await proc.communicate()
        ip = stdout.decode().strip()
        return ip if ip else "172.23.240.1"

    @classmethod
    async def ensure_tunnel(cls) -> str:
        """
        Pastikan port 9222 di localhost WSL2 di-forward ke Chrome Windows port 9222.
        Menjalankan python proxy ringan di sisi Windows host yang mendengarkan 0.0.0.0:9223.
        """
        # 1. Cek apakah 127.0.0.1:9222 di WSL sudah langsung tembus
        try:
            _, writer = await asyncio.wait_for(asyncio.open_connection("127.0.0.1", 9222), timeout=0.5)
            writer.close()
            await writer.wait_closed()
            return "http://127.0.0.1:9222"
        except Exception:
            pass

        gateway_ip = await cls.get_windows_gateway_ip()

        # 2. Cek apakah proxy 9223 di Windows sudah hidup
        try:
            _, writer = await asyncio.wait_for(asyncio.open_connection(gateway_ip, 9223), timeout=0.5)
            writer.close()
            await writer.wait_closed()
            return f"http://{gateway_ip}:9223"
        except Exception:
            pass

        # 3. Jalankan python proxy di background Windows host via cmd.exe
        # Proxy meneruskan traffic dari 0.0.0.0:9223 -> 127.0.0.1:9222
        proxy_script = """
import socket, threading, sys
def fwd(a, b):
    try:
        while True:
            d = a.recv(8192)
            if not d: break
            b.sendall(d)
    except: pass
    finally:
        try: a.close()
        except: pass
        try: b.close()
        except: pass

def h(c):
    try:
        s = socket.socket()
        s.connect(('127.0.0.1', 9222))
    except:
        c.close(); return
    threading.Thread(target=fwd, args=(c, s), daemon=True).start()
    threading.Thread(target=fwd, args=(s, c), daemon=True).start()

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('0.0.0.0', 9223))
srv.listen(10)
while True:
    cli, _ = srv.accept()
    threading.Thread(target=h, args=(cli,), daemon=True).start()
"""
        cmd = f'python -c "{proxy_script.replace(chr(10), " ")}"'
        proc = await asyncio.create_subprocess_exec(
            "cmd.exe", "/c", "start", "/B", "python", "-c", proxy_script.replace('\n', ' ')
        )
        await asyncio.sleep(1.0)

        return f"http://{gateway_ip}:9223"
