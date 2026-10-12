import asyncio
import subprocess
import json
import logging
from typing import Optional

logger = logging.getLogger("wsl_bridge")

class WindowsCdpBridge:
    _process: Optional[asyncio.subprocess.Process] = None

    @classmethod
    async def get_version_json(cls) -> Optional[dict]:
        """
        Ambil json/version langsung via powershell host Windows jika port belum forward.
        """
        try:
            proc = await asyncio.create_subprocess_exec(
                "powershell.exe", "-NoProfile", "-Command",
                "(Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -UseBasicParsing).Content",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=3.0)
            if proc.returncode == 0 and stdout:
                text = stdout.decode().strip()
                # Parse JSON
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    return json.loads(text[start:end+1])
        except Exception as e:
            logger.debug(f"PowerShell bridge check error: {e}")
        return None
