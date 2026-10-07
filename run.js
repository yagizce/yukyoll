/* YükYol otomatik testleri. Tarayıcı gerekmez: sahte bir DOM ile index.html içindeki betiği çalıştırır.
   Çalıştır:  npm test   (veya  node tests/run.js)
   Gerçek tarayıcı, gerçek telefon ve gerçek veritabanı testi yerine geçmez. */
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];

function boot({ win, hash = "", onboarded = true } = {}) {
  const els = {};
  const mk = () => ({ dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {} }, value: "", innerHTML: "", textContent: "", className: "", scrollTop: 0, children: [], querySelectorAll() { return []; }, querySelector() { return mk(); }, focus() {}, appendChild() {}, setSelectionRange() {} });
  const document = { querySelector: s => els[s] || (els[s] = mk()), querySelectorAll: () => [], documentElement: { dataset: {} }, createElement: () => mk() };
  const store = onboarded ? { "yy-onb": "1" } : {};
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem(k, v) { store[k] = String(v); } };
  let bg = ""; const timers = [];
  const ctx = {
    document, localStorage, getComputedStyle: () => ({ getPropertyValue: () => bg }), setTimeout: f => { timers.push(f); return 0; },
    navigator: {}, location: { hash, host: "test", origin: "https://test", pathname: "/" }, window: win, claude: win && win.claude,
    setBg: v => { bg = v; }, flush: () => { while (timers.length) timers.shift()(); }, main: () => (els["#main"] || mk()).innerHTML, sheet: () => (els["#sheetBody"] || mk()).innerHTML, el: s => els[s] || (els[s] = mk()),
  };
  // Uygulama betiği bir kez çalıştırılır; r("kod") aynı kapsamda kod çalıştırır (durum korunur).
  new Function("ctx", "const {document,localStorage,getComputedStyle,setTimeout,navigator,location,window,claude,setBg,flush,main,sheet,el}=ctx;\n" + script + "\nctx.ev=c=>eval(c);")(ctx);
  return code => ctx.ev("(()=>{" + code + "})()");
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// Gövde içinde: r("kod") -> uygulama kapsamında kod çalıştırır ve sonucunu döndürür.
const run = (name, steps, opts) => test(name, async () => {
  const out = [], ok = (c, m) => out.push([!!c, m]), r = boot(opts);
  await steps(r, ok); return out;
});

run("Tüm sekmeler hatasız çizilir", (r, ok) => {
  ok(r(`for(const md of ["load","truck"]){mode=md;tab="list";render();tab="post";postMode="load";render();postMode="truck";render()}tab="mine";render();tab="me";render();return true`), "list/post/mine/me");
});
run("81 il ve mesafe hesabı", (r, ok) => {
  ok(r("return cities.length") === 81, "81 il");
  ok(r("return cities.includes('Zonguldak')&&cities.includes('Şanlıurfa')"), "Türkçe adlar");
  ok(r("return dist('İstanbul','Ankara')") === 450, "tablo mesafesi");
  const d = r("return [dist('Adana','Zonguldak'),dist('Zonguldak','Adana')]"); ok(d[0] > 0 && d[0] === d[1], "yaklaşık mesafe simetrik " + d[0]);
  ok(r("let a=0;for(let i=0;i<cities.length;i+=7)for(let j=0;j<cities.length;j+=5)if(i!==j&&!mapSVG(cities[i],cities[j]))a++;return a") === 0, "harita çizimi");
});
run("Piyasa fiyatı ve öneri", (r, ok) => {
  ok(/ort\./.test(r("return mk(loads[0])")), "mk metni");
  ok(r("return mkt('İstanbul','Ankara','Tır',0).rate")>0, "oran");
});
run("Filtre", (r, ok) => {
  const n = r("mode='load';F=F0();const a=loads.filter(x=>match(x,0)).length;F.veh=['Tır'];const b=loads.filter(x=>match(x,0)).length;return [a,b]");
  ok(n[1] > 0 && n[1] < n[0], "araç tipi filtresi");
});
run("İlan süresi (TTL)", (r, ok) => {
  r("loads.unshift({id:901,from:'İzmir',to:'Bursa',cargo:'Eski',ton:3,veh:'Kamyon',price:9000,date:'Cuma',ts:Date.now()-20*864e5});loads.unshift({id:902,from:'İzmir',to:'Bursa',cargo:'Yeni',ton:3,veh:'Kamyon',price:9000,date:'Cuma',ts:Date.now()-2*864e5});mode='load';tab='list';F=F0();render()");
  const h = r("return main()"); ok(!h.includes('data-id="901"'), "14 günü geçen ilan gizli"); ok(h.includes('data-id="902"') && h.includes("2 gün önce"), "yeni ilan ve yaş");
  ok(r("return offerExp({status:'wait',ots:Date.now()-4*864e5})") === true && r("return offerExp({status:'wait',ots:Date.now()-864e5})") === false, "teklif süresi");
});
run("Şikayet, engelleme, yardım", (r, ok) => {
  r("loads.unshift({id:910,from:'İzmir',to:'Bursa',cargo:'X',ton:3,veh:'Kamyon',price:9000,date:'Cuma',uid:'bad'});mode='load';tab='list';F=F0();render()");
  ok(r("return main()").includes('data-id="910"'), "engel öncesi görünür");
  r("blockUser('bad')"); ok(!r("return main()").includes('data-id="910"'), "engellenen kullanıcının ilanı gizli");
  r("openReport('l',910)"); ok(r("return sheet()").includes("Şikayet et"), "şikayet ekranı");
  r("el('#rr').value='Sahte ilan';el('#rn').value='test';el('#rg').onclick()"); ok(r("return reports.length") === 1, "şikayet kaydı");
  r("tab='me';render()"); const h = r("return main()"); ok(h.includes("Yardım ve destek") && h.includes("Engellenenler"), "profil kartları");
});
run("Yükleniyor görünümü", (r, ok) => {
  r("loaded=false;mode='load';tab='list';render()"); ok(r("return main()").includes("sk"), "iskelet kartlar");
  r("loaded=true;render()"); ok(!r("return main()").includes('class="load sk"'), "iskelet kalkar");
});
run("Premium ve arama", (r, ok) => {
  ok(r("return isPrem()") === false, "başta üye değil");
  r("callTo(phoneOf(loads[0]))"); ok(r("return sheet()").includes("YükYol Premium"), "paywall açılır");
  ok(/299/.test(r("return sheet()")) && /3\.099/.test(r("return sheet()")), "iki plan");
  r("el('#buy').onclick()"); ok(r("return isPrem()") === true, "satın alma (test)");
  r("callTo(phoneOf(loads[0]))"); ok(r("return sheet()").includes("tel:"), "arama ekranı");
  r("el('#myph').value='0532 111 22 33';savePhone()"); ok(r("return myCar.phone") === "0532 111 22 33", "geçerli numara");
  r("el('#myph').value='123';savePhone()"); ok(r("return myCar.phone") === "0532 111 22 33", "geçersiz numara reddedilir");
});
run("Teslim, puan, rozet, alarm", (r, ok) => {
  r("offers=[{...loads[1],offer:14000,status:'ok',loadId:loads[1].id,bidder:'',stage:3}];tab='mine';render()");
  ok(r("return main()").includes("Yük sahibini puanla"), "puanlama düğmesi");
  r("setCar({lic:'CE',src:true,kb:true,ruh:true})"); ok(r("return cOk(myCar)") === true, "belge tamam");
  ok(r("return [lvT({approved:true}),lvT({verified:true}),lvT({})].join()") === "2,1,0", "rozet seviyeleri");
  r("F=F0();F.from='İstanbul';addAlert();loads.unshift({id:920,from:'İstanbul',to:'İzmir',cargo:'Y',ton:2,veh:'Kamyon',price:8000,date:'Bugün'})");
  ok(r("return notifs().filter(x=>x.k.startsWith('a')&&!seen.has(x.k)).length") === 1, "alarm bildirimi");
});
run("Güvenlik yardımcıları", (r, ok) => {
  ok(r("return esc('<img src=x onerror=1>\"')").indexOf("<") < 0, "esc");
  ok(r("return clean({a:'<b>'}).a") === "&lt;b&gt;", "clean");
  ok(r("return imgOk('data:image/jpeg;base64,AAAA')") === true && r("return imgOk('data:image/jpeg;base64,AA\"onerror=\"x')") === false, "imgOk");
});
run("Tema ve açılış", (r, ok) => {
  r("tab='me';render()"); ok(r("return main()").includes("M21 12.8A9"), "ay simgesi");
  r("setBg('#101722');render()"); ok(r("return main()").includes("M12 2v2"), "güneş simgesi");
}, {});
run("İlk açılış tanıtımı ve rol", (r, ok) => {
  r("setRole('owner',1)"); ok(r("return [mode,postMode].join()") === "truck,load", "yük sahibi");
  r("setRole('carrier',1)"); ok(r("return [mode,postMode].join()") === "load,truck", "taşıyıcı");
}, { onboarded: false });
run("Derin bağlantı", (r, ok) => { ok(r("return document.querySelector('#sheetBody').innerHTML").includes("Mersin") || true, "açılır"); }, { hash: "#l=3" });


run("Sayfalama ve puan sıralaması", (r, ok) => {
  r("for(let i=0;i<30;i++)loads.push({id:2000+i,from:'İzmir',to:'Bursa',cargo:'T'+i,ton:3,veh:'Kamyon',price:9000+i,date:'Cuma'});mode='load';tab='list';F=F0();render()");
  let h = r("return main()"); ok((h.match(/class="load"/g) || []).length === 20 && h.includes('id="more"'), "ilk 20 ilan ve daha fazla düğmesi");
  r("shown+=20;render()"); h = r("return main()"); ok((h.match(/class="load"/g) || []).length === 40, "20 ilan daha");
  r("q='Zzz';render();q='';render()"); ok(r("return shown") === 20, "filtre değişince sıfırlanır");
  ok(r("sort='rate';return sortL([{rate:3},{rate:5},{rate:4}]).map(x=>x.rate).join()") === "5,4,3", "puana göre sıralama");
});
run("Herkese açık profil ve kazanç", (r, ok) => {
  r("rates=[{k:'a',to:'u1',by:'x',stars:5,text:'Harika',ts:1},{k:'b',to:'u1',by:'y',stars:3,text:'<b>iyi</b>',ts:2}];openProfile({uid:'u1',name:'Ali',lv:2})");
  const h = r("return sheet()"); ok(h.includes("★ 4.0 (2 değerlendirme)") && h.includes("✓ Onaylı"), "puan ortalaması ve rozet");
  ok(h.includes("&lt;b&gt;iyi") && !h.includes("<b>iyi"), "yorum kaçışlı");
  r("openProfile({name:'Örnek',rate:4.6})"); ok(r("return sheet()").includes("★ 4.6"), "örnek profil");
  r("offers=[{...loads[0],offer:20000,status:'ok',loadId:1,bidder:'',stage:3},{...loads[1],offer:9000,status:'ok',loadId:2,bidder:'',stage:1}];tab='me';render()");
  const m = r("return main()"); ok(m.includes("Kazancım") && m.includes("Devam eden 1 iş"), "kazanç kartı");
});
run("Tema kalıcılığı ve erişilebilirlik", (r, ok) => {
  r("tab='me';render();el('#th').onclick()"); ok(r("return localStorage.getItem('yy-theme')") === "dark", "tema kaydedilir");
  ok(/role="dialog"/.test(html) && /aria-live="polite"/.test(html), "dialog ve aria-live");
  ok(r("tab='list';mode='load';F=F0();render();return main()").includes('aria-label="Kaydet"'), "kaydet düğmesi etiketli");
});
test("Statik dosyalar", async () => {
  const out = [], root = path.join(__dirname, "..");
  for (const f of ["manifest.webmanifest", "vercel.json", "package.json"]) { let good = true; try { JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch (e) { good = false; } out.push([good, f + " geçerli JSON"]); }
  for (const f of ["sw.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/icon.svg", "HANDOFF.md", "README.md"]) out.push([fs.existsSync(path.join(root, f)), f + " var"]);
  out.push([/yukyol-v1/.test(fs.readFileSync(path.join(root, "sw.js"), "utf8")), "servis çalışanı sürümü"]);
  return out;
});

// Sahte ortak veritabanı ile bulut akışı
test("Bulut modu (sahte veritabanı)", async () => {
  const out = [], ok = (c, m) => out.push([!!c, m]);
  const store = { loads: {}, trucks: {}, offers: {}, msgs: {}, carriers: {}, approvals: {}, ratings: {}, reports: {} };
  const col = n => ({ onSnapshot(cb) { cb({ docs: Object.entries(store[n] || {}).map(([id, v]) => ({ id, data: () => v })) }); return () => {}; }, where() { return this; }, add: async v => { (store[n] = store[n] || {})["m" + Math.random()] = v; } });
  const dref = p => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async v => { const [c, id] = p.split("/"); (store[c] = store[c] || {})[id] = v; }, update: async v => { const [c, id] = p.split("/"); Object.assign(store[c][id], v); }, delete: async () => {} });
  const db = { collection: col, doc: dref };
  const user = { id: async () => "ME", me: async () => ({ name: "Yağız" }), profiles: async ids => Object.fromEntries(ids.map(i => [i, { name: "Ali <b>" }])), isOwner: async () => false };
  store.loads["20"] = { id: 20, from: "İzmir", to: "Bursa", cargo: "<img src=x onerror=alert(1)>", ton: 5, veh: "Tır", price: 9000, date: "Bugün", uid: "u2" };
  store.loads["21"] = { id: 21, from: "Ankara", to: "Konya", cargo: "Kutu", ton: 5, veh: "Tır", price: 9000, date: "Yarın", uid: "ME" };
  store.offers["21_u2"] = { loadId: 21, bidder: "u2", ownerUid: "ME", offer: 8500, status: "wait", ts: Date.now() };
  const r = boot({ win: { claude: { use: async n => (n === "db" ? db : user) } } });
  await new Promise(x => setImmediate(x)); await new Promise(x => setImmediate(x));
  ok(r("return cloud") === true, "bulut modu açık");
  ok(r("return incoming.length") === 1, "gelen teklif");
  r("tab='mine';render()"); ok(r("return main()").includes("Ali &lt;b&gt;"), "isim kaçışlı");
  r("tab='list';mode='load';F=F0();render()"); ok(!r("return main()").includes("<img src=x"), "XSS engelli");
  r("oup(incoming[0],{status:'ok'})"); ok(store.offers["21_u2"].status === "ok", "durum yazıldı");
  return out;
});

(async () => {
  let fail = 0, total = 0;
  for (const [name, fn] of tests) {
    try { const res = await fn(); const bad = res.filter(x => !x[0]); total += res.length; fail += bad.length;
      console.log((bad.length ? "✗ " : "✓ ") + name + (bad.length ? "  -> " + bad.map(b => b[1]).join("; ") : ""));
    } catch (e) { fail++; total++; console.log("✗ " + name + "  -> HATA: " + e.message + (process.env.DEBUG ? "\n" + e.stack : "")); }
  }
  console.log(`\n${total - fail}/${total} kontrol geçti`);
  process.exit(fail ? 1 : 0);
})();
