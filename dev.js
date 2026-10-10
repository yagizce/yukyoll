#!/usr/bin/env node
/* Geliştirme araçları (bağımlılıksız). Kullanım:  node dev.js <komut>
     lint                      kaynak denetimi: dosya adları, başlıklar, ad çakışmaları, yasaklı ifadeler, sözdizimi
     map [--write]             dosya ve işlev haritasını yazdırır (--write: docs/CODEMAP.md, git dışında tutulur)
     new <ad> "Başlık" "Açıklama"   yeni özellik modülü ve test iskeleti
     www                       web dosyalarını mobil kabuk için www/ klasörüne kopyalar (NAKGO_WWW ile değiştirilir)
   npm kısayolları package.json içindedir (npm run lint, map, new, mobile:prepare). */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), "utf8").replace(/\r\n/g, "\n");
const list = e => fs.readdirSync(root).filter(f => /^\d{2}-/.test(f) && f.endsWith(e)).sort();

// ---------- lint ----------
const RUNNING = new Set(["01-state.js", "02-core.js", "99-init.js"]);   // üst düzeyde çalışan kod yazılabilen modüller
function lint() {
    const errors = [], warns = [];
  const RUNNING = new Set(["01-state.js", "02-core.js", "99-init.js"]);   // üst düzeyde çalışan kod yazılabilen modüller
  
  const js = list(".js"), css = list(".css");
  if (js.length < 5) errors.push("Depo kökünde modül bulunamadı");
  const names = {};
  for (const f of js) {
    const s = read(f), where = f;
    if (!/^\d{2}-[a-z0-9-]+\.js$/.test(f)) errors.push(`${where}: ad "NN-ad.js" biçiminde olmalı`);
    if (!/^\/\*\*\n \* .+\n \* .+\n \*\//.test(s)) errors.push(`${where}: başlık yorumu yok (/** Başlık, Açıklama */)`);
    if (/<\/script/i.test(s)) errors.push(`${where}: </script> içeremez`);
    if (/\bdebugger\b|\bconsole\.(log|debug)\(/.test(s)) errors.push(`${where}: debugger/console.log kalmış`);
    if (/Yük[Yy]ol/.test(s)) errors.push(`${where}: eski ad (YükYol) kalmış`);
    s.split("\n").forEach((line, i) => {
      const m = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)|^(?:const|let|var)\s+([A-Za-z0-9_$]+)/.exec(line);
      if (m) { const n = m[1] || m[2]; if (names[n]) errors.push(`${where}:${i + 1}: "${n}" zaten ${names[n]} içinde tanımlı (aynı betik kapsamında çakışır)`); else names[n] = `${f}:${i + 1}`; }
      if (!RUNNING.has(f) && /^(try\b|if\s*\(|for\s*\(|while\s*\(|\$\(|document\.|window\.)/.test(line)) warns.push(`${where}:${i + 1}: üst düzeyde çalışan kod. Yalnızca ${[...RUNNING].join(", ")} içinde olmalı`);
    });
    if (s.split("\n").length > 900) warns.push(`${where}: ${s.split("\n").length} satır, bölmeyi düşün`);
  }
  for (const f of css) {
    const s = read(f), where = f;
    if (!/^\/\* .+ \*\/\n/.test(s)) errors.push(`${where}: başlık yorumu yok (/* Açıklama */)`);
    if ((s.match(/\{/g) || []).length !== (s.match(/\}/g) || []).length) errors.push(`${where}: süslü parantezler dengesiz`);
    if (/!important/.test(s) && !/motion/.test(f)) warns.push(`${where}: !important kullanılmış`);
  }
  if (!fs.existsSync(path.join(root, "index.template.html"))) errors.push("index.template.html yok");
  try { new vm.Script(js.map(f => read(f)).join("\n\n"), { filename: "bundle.js" }); } catch (e) { errors.push("Birleşik betikte sözdizimi hatası: " + e.message); }
  
  warns.slice(0, 15).forEach(w => console.warn("uyarı: " + w));
  if (warns.length > 15) console.warn(`... ve ${warns.length - 15} uyarı daha`);
  if (errors.length) { errors.forEach(e => console.error("hata: " + e)); console.error(`\n${errors.length} hata`); return 1; }
  console.log(`lint temiz: ${js.length} JS ve ${css.length} CSS modülü, ${Object.keys(names).length} üst düzey ad${warns.length ? ", " + warns.length + " uyarı" : ""}`);
}

// ---------- map ----------
function map() {
  let out = "# Kod haritası\n\nBu çıktı `npm run map` ile üretilir. Mimari için `ARCHITECTURE.md`.\n\n## JavaScript modülleri (yükleme sırasıyla)\n\n";
  const keys = new Set(), colls = new Set();
  for (const f of list(".js")) {
    const s = read(f), h = /^\/\*\*\n \* (.+)\n \* (.+)\n \*\//.exec(s);
    out += `### \`${f}\`: ${h ? h[1] : ""}\n\n${h ? h[2] : ""}\n\n`;
    const fns = [], vars = [];
    s.split("\n").forEach(line => {
      let m = /^(async\s+)?function\s+([A-Za-z0-9_$]+)\(([^)]*)\)/.exec(line);
      if (m) fns.push(`\`${m[2]}(${m[3].replace(/\s+/g, " ").trim()})\``);
      m = /^(const|let)\s+([A-Za-z0-9_$]+)\b/.exec(line);
      if (m) vars.push(`\`${m[2]}\``);
    });
    if (fns.length) out += `İşlevler: ${fns.join(", ")}\n\n`;
    if (vars.length) out += `Değişken ve sabitler: ${vars.join(", ")}\n\n`;
    for (const m of s.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\("([^"]+)"/g)) keys.add(m[1]);
    for (const m of s.matchAll(/db\.(?:doc|collection)\("([A-Za-z]+)/g)) colls.add(m[1]);
  }
  out += "## Tarayıcı depolama anahtarları\n\n" + [...keys].sort().map(k => `- \`${k}\``).join("\n") + "\n\n";
  out += "## Veritabanı koleksiyonları (bulut modu)\n\n" + [...colls].sort().map(k => `- \`${k}\``).join("\n") + "\n\n## CSS dosyaları\n\n";
  for (const f of list(".css")) { const m = /^\/\* (.+) \*\//.exec(read(f)); out += `- \`${f}\`: ${m ? m[1] : ""}\n`; }
  if (process.argv.includes("--write")) { fs.mkdirSync(path.join(root, "docs"), { recursive: true }); fs.writeFileSync(path.join(root, "docs/CODEMAP.md"), out); console.log("docs/CODEMAP.md yazıldı"); }
  else process.stdout.write(out);
}

// ---------- new ----------
function newModule() {
  const [name, title, desc] = process.argv.slice(3);
  if (!name || !/^[a-z0-9-]+$/.test(name) || !title || !desc) { console.error('Kullanım: npm run new -- ad "Başlık" "Açıklama"  (ad küçük harf, rakam ve tire)'); process.exit(1); }
  const dir = root, used = fs.readdirSync(dir).map(f => +f.slice(0, 2)).filter(n => n >= 10 && n < 20);
  let n = 10; while (used.includes(n)) n++;
  if (n >= 20) { console.error("10-19 arasında boş numara kalmadı"); process.exit(1); }
  if (fs.readdirSync(dir).some(f => f.slice(3) === name + ".js")) { console.error("Bu adla bir modül zaten var"); process.exit(1); }
  const file = `${n}-${name}.js`;
  fs.writeFileSync(path.join(dir, file), `/**\n * ${title}\n * ${desc}\n */\n\n// Yalnızca function ve const tanımla. Çalışan kod 01-state, 02-core ve 99-init içinde olmalı.\n`);
  fs.writeFileSync(path.join(root, name + ".test.js"), `/* ${title} */\nmodule.exports = function register({ run }) {\n  run("${title}", (r, ok) => {\n    ok(true, "TODO: testi yaz");\n  });\n};\n`);
  console.log(`Oluşturuldu: ${file} ve ${name}.test.js\nSonra: npm run bundle && npm test`);
}

// ---------- www ----------
function www() {
  const out = process.env.NAKGO_WWW || path.join(root, "www");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (const f of ["index.html", "manifest.webmanifest"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
  fs.cpSync(path.join(root, "icons"), path.join(out, "icons"), { recursive: true });
  console.log("Hazır:", out);
}

const cmd = process.argv[2];
if (cmd === "lint") process.exit(lint() || 0);
else if (cmd === "map") map();
else if (cmd === "new") newModule();
else if (cmd === "www") www();
else { console.error("Komutlar: lint | map [--write] | new <ad> \"Başlık\" \"Açıklama\" | www"); process.exit(1); }
