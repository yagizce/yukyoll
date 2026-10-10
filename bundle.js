#!/usr/bin/env node
/* Depo kökündeki şablon ve NN-*.js/css kaynaklarından index.html üretir.
   Kullanım: node bundle.js veya node bundle.js --check.
   Dosya adındaki sayı yükleme sırasıdır. */
const fs = require("fs"), path = require("path");
const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const list = ext => fs.readdirSync(root).filter(f => /^\d{2}-/.test(f) && f.endsWith(ext)).sort();

function build() {
  const tpl = read("index.template.html");
  for (const k of ["/*@CSS@*/", "/*@JS@*/"]) if (!tpl.includes(k)) throw new Error("Şablonda " + k + " yok");
  const css = list(".css").map(f => read(f).trim()).join("\n\n");
  const js = list(".js").map(f => read(f).trim()).join("\n\n");
  if (/<\/script/i.test(js)) throw new Error("JS içinde </script> geçemez");
  return tpl.replace("/*@CSS@*/", () => css).replace("/*@JS@*/", () => js);
}

if (require.main === module) {
  const out = build(), target = path.join(root, "index.html");
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (cur !== out) { console.error("index.html kaynaklarla uyumsuz. `npm run bundle` çalıştır."); process.exit(1); }
    console.log("index.html güncel");
  } else {
    fs.writeFileSync(target, out);
    console.log("index.html üretildi (" + Math.round(out.length / 1024) + " KB, " + list(".js").length + " JS + " + list(".css").length + " CSS modülü)");
  }
}
module.exports = { build };
