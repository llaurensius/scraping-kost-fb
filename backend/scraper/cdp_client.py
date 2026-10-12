import subprocess
from typing import Optional, Tuple
import httpx

def get_wsl_gateway_ips() -> list[str]:
    ips = []
    # 1. Dari default route IP
    try:
        out = subprocess.check_output("ip route show | awk '/default/ {print $3}'", shell=True, text=True)
        route_ip = out.strip()
        if route_ip:
            ips.append(route_ip)
    except Exception:
        pass

    # 2. Dari resolv.conf
    try:
        with open("/etc/resolv.conf", "r") as f:
            for line in f:
                if line.startswith("nameserver"):
                    parts = line.split()
                    if len(parts) >= 2 and parts[1] not in ips:
                        ips.append(parts[1])
    except Exception:
        pass

    # 3. Fallback IP standar WSL
    for fallback in ["172.23.240.1", "127.0.0.1"]:
        if fallback not in ips:
            ips.append(fallback)

    return ips

async def check_cdp_connection() -> Tuple[bool, Optional[str], Optional[dict]]:
    gateway_ips = get_wsl_gateway_ips()

    candidate_urls = []
    # Coba port 9223 (proxy bridge Windows) dulu, lalu port 9222
    for ip in gateway_ips:
        candidate_urls.append(f"http://{ip}:9223")
    for ip in gateway_ips:
        candidate_urls.append(f"http://{ip}:9222")

    async with httpx.AsyncClient(timeout=1.0) as client:
        for url in candidate_urls:
            try:
                res = await client.get(f"{url}/json/version")
                if res.status_code == 200:
                    data = res.json()
                    return True, url, data
            except Exception:
                continue

    return False, None, None

if __name__ == "__main__":
    import asyncio
    c, u, d = asyncio.run(check_cdp_connection())
    print(f"Status: connected={c}, url={u}")
    if d:
        print(f"Browser: {d.get('Browser')}")
