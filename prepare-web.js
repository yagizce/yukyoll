/* Web dosyalarını mobil kabuk (Capacitor) için www/ klasörüne kopyalar.
   Çalıştır:  npm run mobile:prepare      (başka klasör için: NAKGO_WWW=/yol node mobile/prepare-web.js) */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), out = process.env.NAKGO_WWW || path.join(root, "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ["index.html", "manifest.webmanifest"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, "icons"), path.join(out, "icons"), { recursive: true });
console.log("Hazır:", out);
