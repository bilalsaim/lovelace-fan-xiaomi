import http.server

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow all origins
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == "__main__":
    port = 8000
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, CORSHTTPRequestHandler)
    print(f"Serving on port {port}...")
    httpd.serve_forever()