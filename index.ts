import http from "node:http";

const canvasWidth = 400;
const canvasHeight = 400;

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html" });
  response.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dart Board</title>
        <style>
            canvas {
                border: 1px solid black;
            }
        </style>
    </head>
    <body>
        <canvas id="dartBoard" width="" height="400"></canvas>
        <script>
            const canvas = document.getElementById('dartBoard');
            const ctx = canvas.getContext('2d');

            function drawDartBoard() {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const outerRadius = 150;
                const innerBullRadius = 30;
                const outerBullRadius = 50;
                const tripleRingRadius = 100;
                const doubleRingRadius = 120;

                // Draw the outer circle
                ctx.beginPath();
                ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#FFCC00';
                ctx.fill();
                ctx.stroke();

                // Draw the inner circles
                const segments = 20;
                for (let i = 0; i < segments; i++) {
                    const angle = (i * Math.PI * 2) / segments;

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, outerRadius, angle, angle + (Math.PI * 2) / segments);
                    ctx.lineTo(centerX, centerY);
                    ctx.fillStyle = i % 2 === 0 ? '#FF0000' : '#00FF00';
                    ctx.fill();
                    ctx.stroke();
                }

                // Draw the bullseye
                ctx.beginPath();
                ctx.arc(centerX, centerY, innerBullRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(centerX, centerY, outerBullRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#FF0000';
                ctx.fill();
                ctx.stroke();

                // Draw the triple ring
                ctx.beginPath();
                ctx.arc(centerX, centerY, tripleRingRadius, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#0000FF';
                ctx.stroke();

                // Draw the double ring
                ctx.beginPath();
                ctx.arc(centerX, centerY, doubleRingRadius, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#0000FF';
                ctx.stroke();
            }

            drawDartBoard();
        </script>
    </body>
    </html>
  `);
  response.end();
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
