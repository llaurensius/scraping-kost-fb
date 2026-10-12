import socket
import threading
import sys

def forward(src, dst):
    try:
        while True:
            data = src.recv(8192)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def handle(client):
    try:
        chrome = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        chrome.connect(('127.0.0.1', 9222))
    except Exception:
        client.close()
        return

    t1 = threading.Thread(target=forward, args=(client, chrome), daemon=True)
    t2 = threading.Thread(target=forward, args=(chrome, client), daemon=True)
    t1.start()
    t2.start()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('0.0.0.0', 9223))
    except OSError as e:
        print(f"Bind failed or port in use: {e}")
        return
    server.listen(10)
    print("CDP Proxy listening on 0.0.0.0:9223...")
    sys.stdout.flush()
    while True:
        cli, _ = server.accept()
        threading.Thread(target=handle, args=(cli,), daemon=True).start()

if __name__ == '__main__':
    main()
