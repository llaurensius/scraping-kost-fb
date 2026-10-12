import asyncio
import sys

async def forward(reader, writer):
    try:
        while True:
            data = await reader.read(4096)
            if not data:
                break
            writer.write(data)
            await writer.drain()
    except Exception:
        pass
    finally:
        writer.close()

async def handle_client(local_reader, local_writer, target_host, target_port):
    try:
        remote_reader, remote_writer = await asyncio.open_connection(target_host, target_port)
    except Exception as e:
        local_writer.close()
        return

    await asyncio.gather(
        forward(local_reader, remote_writer),
        forward(remote_reader, local_writer)
    )

async def start_bridge(local_port=9222, target_host="127.0.0.1", target_port=9222):
    server = await asyncio.start_server(
        lambda r, w: handle_client(r, w, target_host, target_port),
        "127.0.0.1",
        local_port
    )
    async with server:
        await server.serve_forever()

if __name__ == "__main__":
    asyncio.run(start_bridge())
