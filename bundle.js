#!/usr/bin/env node
/* src/ klasöründen index.html üretir.
   Kullanım:  node tools/bundle.js           (index.html'i yazar)
              node tools/bundle.js --check   (index.html güncel değilse hata verir, test sırasında kullanılır)
   Sıra: src/css/*.css ve src/js/*.js dosyaları ad sırasıyla birleştirilir. Dosya adındaki sayı yükleme sırasıdır. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const list = (dir, ext) => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith(ext)).sort();

function build() {
  const tpl = read("src/index.template.html");
  for (const k of ["/*@CSS@*/", "/*@JS@*/"]) if (!tpl.includes(k)) throw new Error("Şablonda " + k + " yok");
  const css = list("src/css", ".css").map(f => read("src/css/" + f).trim()).join("\n\n");
  const js = list("src/js", ".js").map(f => read("src/js/" + f).trim()).join("\n\n");
  if (/<\/script/i.test(js)) throw new Error("JS içinde </script> geçemez");
  return tpl.replace("/*@CSS@*/", () => css).replace("/*@JS@*/", () => js);
}

if (require.main === module) {
  const out = build(), target = path.join(root, "index.html");
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (cur !== out) { console.error("index.html src/ ile uyumsuz. `npm run bundle` çalıştır."); process.exit(1); }
    console.log("index.html güncel");
  } else {
    fs.writeFileSync(target, out);
    console.log("index.html üretildi (" + Math.round(out.length / 1024) + " KB, " + list("src/js", ".js").length + " JS + " + list("src/css", ".css").length + " CSS modülü)");
  }
}
module.exports = { build };
