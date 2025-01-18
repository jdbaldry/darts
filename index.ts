import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const server = http.createServer((request, response) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      response.writeHead(500);
      return response.end('Error loading index.html');
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(data);
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
