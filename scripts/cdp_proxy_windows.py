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

def handle_client(client_socket):
    try:
        chrome_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        chrome_socket.connect(('127.0.0.1', 9222))
    except Exception:
        client_socket.close()
        return

    t1 = threading.Thread(target=forward, args=(client_socket, chrome_socket), daemon=True)
    t2 = threading.Thread(target=forward, args=(chrome_socket, client_socket), daemon=True)
    t1.start()
    t2.start()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 9223))
    server.listen(10)
    print("CDP Proxy aktif di 0.0.0.0:9223 -> 127.0.0.1:9222")
    sys.stdout.flush()

    while True:
        client_sock, _ = server.accept()
        threading.Thread(target=handle_client, args=(client_sock,), daemon=True).start()

if __name__ == '__main__':
    main()
