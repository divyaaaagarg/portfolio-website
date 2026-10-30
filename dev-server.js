/* Tiny local server: serves the static site and routes /api/chat to api/chat.js.
   Usage:  GEMINI_API_KEY=your_key node dev-server.js     (see README)
   Not used on Vercel; Vercel serves the files and runs api/chat.js itself. */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Optional: load a local .env file (never committed) so the key stays out of the shell history.
try {
  fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch (e) { /* no .env file, that's fine */ }

const chat = require("./api/chat.js");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon"
};
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/chat") {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => {
      try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = null; }
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
      chat(req, res);
    });
    return;
  }

  let file = path.normalize(path.join(__dirname, url.pathname === "/" ? "index.html" : url.pathname));
  const blocked = [".env", ".git", "node_modules"].some((b) => file.includes(path.sep + b));
  if (!file.startsWith(__dirname) || blocked) { res.statusCode = 403; return res.end("Forbidden"); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
});

server.listen(PORT, () => console.log("Portfolio running at http://localhost:" + PORT));
