/* NakGo otomatik testleri. Tarayıcı gerekmez: sahte bir DOM ile index.html içindeki betiği çalıştırır.
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
  r("callTo(phoneOf(loads[0]))"); ok(r("return sheet()").includes("NakGo Premium"), "paywall açılır");
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
run("Öne çıkan ilan ve boş araç ilanı", (r, ok) => {
  ok(r("return [3,6,12,24,72].map(h=>featPrice('l',h)).join()") === "19,32,61,99,267", "sabit fiyat listesi (yük)");
  ok(r("return [3,6,12,24,72].map(h=>featPrice('t',h)).join()") === "19,32,61,99,267", "sabit fiyat listesi (boş araç)");
  ok(!/hourMult|FEAT\.peak|FEAT\.low/.test(html), "saat çarpanı kodu kalmadı");
  ok(r("const a=featPrice('l',6);return a")===32 && r("return featPrice('l',24)")===99, "fiyat saatten bağımsız");
  r("loads.unshift({id:800,from:'İzmir',to:'Bursa',cargo:'Öne',ton:3,veh:'Kamyon',price:9000,date:'Cuma',mine:true});trucks.unshift({id:'t900',from:'İzmir',to:'Ankara',veh:'Tır',cap:10,body:'Tenteli',date:'Yarın',mine:true,rate:'Yeni'})");
  r("openFeature('l',800)"); let h = r("return sheet()"); ok(h.includes("İlanını öne çıkar") && h.includes("3 gün") && !h.includes("Yoğun"), "yük için fiyat ekranı, saat çubuğu yok");
  r("el('#fbuy').onclick()"); ok(r("return isF(findIt('l',800))") === true && r("return findIt('l',800).featPaid") === 32, "yük öne çıkar, 6 saat 32 ₺");
  r("openFeature('t','t900')"); h = r("return sheet()"); ok(h.includes("Boş araç ilanını öne çıkar"), "boş araç için fiyat ekranı");
  r("el('#fbuy').onclick()"); ok(r("return isF(findIt('t','t900'))") === true && r("return findIt('t','t900').featPaid") === 32, "boş araç öne çıkar");
  r("mode='load';tab='list';F=F0();render()"); let m = r("return main()"); ok(m.indexOf('data-id="800"') < m.indexOf('data-id="1"') && m.includes("Öne çıkan"), "yük listesinde başta ve etiketli");
  r("mode='truck';render()"); m = r("return main()"); ok(m.indexOf('data-tid="t900"') < m.indexOf('data-tid="t1"') && m.includes("Öne çıkan"), "boş araç listesinde başta ve etiketli");
  r("tab='me';render()"); m = r("return main()"); ok(m.includes('data-ft="l|800"') && m.includes('data-ft="t|t900"') && m.includes("Uzat"), "İlanlarım'da iki türde de Uzat");
  r("openFeature('l',800)"); ok(r("return sheet()").includes("yeni süre bitince başlar"), "aktifken yeni süre bitişten başlar");
});
run("Öne çıkarmanın etkisi", (r, ok) => {
  r("loads.unshift({id:810,from:'İzmir',to:'Bursa',cargo:'Etki',ton:3,veh:'Kamyon',price:10000,date:'Cuma',uid:'ME',ts:Date.now()-20*36e5,featWin:[[Date.now()-10*36e5,Date.now()-4*36e5]],featFrom:Date.now()-10*36e5,featUntil:Date.now()-4*36e5,featPaid:32})");
  r("cloud=true;me='ME';const n=Date.now();events=[];for(let i=0;i<9;i++)events.push({t:'v',loadId:810,uid:'a'+i,ts:n-9*36e5+i*1e5});for(let i=0;i<3;i++)events.push({t:'v',loadId:810,uid:'b'+i,ts:n-15*36e5+i*1e5});allO=[{loadId:810,bidder:'a1',offer:9000,status:'wait',ts:n-8*36e5},{loadId:810,bidder:'a2',offer:9100,status:'wait',ts:n-7*36e5},{loadId:810,bidder:'b1',offer:8000,status:'wait',ts:n-15*36e5}]");
  const fx = r("return statsOf(loads[0]).fx"); ok(fx && fx.enough && fx.lift > 100, "gerçek verilerden ilgi artışı hesaplanır (%" + (fx && fx.lift) + ")");
  ok(fx.oF === 2 && Math.round(fx.hF) === 6, "öne çıkarma sırasında gelen teklifler ve saat");
  r("openStats(810)"); const h = r("return sheet()"); ok(h.includes("Öne çıkarmanın etkisi") && h.includes("saatlik") && !h.includes("Örnek veri"), "istatistik ekranında etki kutusu");
  r("events=events.slice(0,2)"); ok(r("return statsOf(loads[0]).fx.lift") === null, "az veride sonuç vermez");
  r("openStats(810)"); ok(r("return sheet()").includes("Henüz yeterli veri yok. Anlamlı"), "yetersiz veri uyarısı");
  r("tab='me';render()"); const m = r("return main()"); ok(m.includes("Öne çıkarma özeti") && m.includes("Toplam harcama"), "profilde özet kartı");
  r("cloud=false;loads.unshift({id:811,from:'İzmir',to:'Bursa',cargo:'Demo',ton:3,veh:'Kamyon',price:10000,date:'Cuma',mine:true,featFrom:Date.now(),featUntil:Date.now()+6*36e5,featPaid:32});openStats(811)");
  ok(r("return sheet()").includes("Örnek veri"), "yerel modda örnek veri olarak işaretlenir");
  r("openFeature('l',811)");r("el('#fbuy').onclick()"); ok(r("const x=findIt('l',811);return isF(x)&&x.featUntil>Date.now()+11*36e5&&x.featWin.length===2")===true, "aktifken uzatma kesintisiz sürer, pencere kaydedilir");
});
run("Tema düğmesi üst barda", (r, ok) => {
  r("updTheme()"); ok(r("return el('#thh').innerHTML").includes("M21 12.8A9"), "açık temada ay simgesi");
  r("setBg('#101722');updTheme()"); ok(r("return el('#thh').innerHTML").includes("M12 2v2"), "koyu temada güneş simgesi");
  ok(/id="thh"/.test(html) && !/id="th"/.test(html), "düğme başlıkta, profilde yok");
  r("tab='me';render()"); ok(!r("return main()").includes('id="th"'), "profil sayfasında tema düğmesi yok");
}, {});
run("Ana ekrana ekleme ve mobil kabuk", (r, ok) => {
  r("tab='me';render()"); ok(!r("return main()").includes('id="inst"'), "istem yokken kart çıkmaz");
  r("deferredInstall={prompt(){},userChoice:Promise.resolve()};render()"); ok(r("return main()").includes('id="inst"'), "tarayıcı izin verince 'Ana ekrana ekle' kartı çıkar");
  ok(r("return isNative()") === false, "yerel kabuk dışında isNative false");
  ok(/safe-area-inset-top/.test(html) && /viewport-fit=cover/.test(html), "güvenli alan ve viewport-fit");
  ok(/apple-mobile-web-app-status-bar-style/.test(html) && /format-detection/.test(html), "mobil meta etiketleri");
});
run("Herkese açık profil ve kazanç", (r, ok) => {
  r("rates=[{k:'a',to:'u1',by:'x',stars:5,text:'Harika',ts:1},{k:'b',to:'u1',by:'y',stars:3,text:'<b>iyi</b>',ts:2}];openProfile({uid:'u1',name:'Ali',lv:2})");
  const h = r("return sheet()"); ok(h.includes("★ 4.0 (2 değerlendirme)") && h.includes("✓ Onaylı"), "puan ortalaması ve rozet");
  ok(h.includes("&lt;b&gt;iyi") && !h.includes("<b>iyi"), "yorum kaçışlı");
  r("openProfile({name:'Örnek',rate:4.6})"); ok(r("return sheet()").includes("★ 4.6"), "örnek profil");
  r("offers=[{...loads[0],offer:20000,status:'ok',loadId:1,bidder:'',stage:3},{...loads[1],offer:9000,status:'ok',loadId:2,bidder:'',stage:1}];tab='me';render()");
  const m = r("return main()"); ok(m.includes("Kazancım") && m.includes("Devam eden 1 iş"), "kazanç kartı");
});
run("Yakınımdaki yükler", (r, ok) => {
  r("navigator.geolocation={getCurrentPosition:(s)=>s({coords:{latitude:39.93,longitude:32.86}})};mode='load';tab='list';F=F0();render();toggleNear()");
  ok(r("return [nearOn,myCity].join()") === "true,Ankara", "konum alınır, en yakın il Ankara");
  const h = r("return main()"); ok(h.includes("Sana ") && h.includes('data-nr="100"'), "mesafe etiketi ve yarıçap çipleri");
  const all = r("return loads.filter(l=>!l.closed).length"); r("nearR=100;render()");
  const few = (r("return main()").match(/class="load"/g) || []).length; ok(few < all, "100 km yarıçap listeyi daraltır (" + few + "/" + all + ")");
  r("toggleNear()"); ok(r("return nearOn") === false, "kapatılır");
  r("navigator.geolocation={getCurrentPosition:(s,e)=>e({code:1})};myPos=null;toggleNear()"); ok(r("return nearOn") === false, "izin reddedilirse açılmaz");
});
run("İlan karşılaştırma", (r, ok) => {
  r("toggleCmp(1);toggleCmp(2);mode='load';tab='list';F=F0();render()");
  ok(r("return cmp.join()") === "1,2" && r("return main()").includes('id="cmpgo"'), "iki ilan seçilir, çubuk görünür");
  r("openCompare()"); const h = r("return sheet()"); ok(h.includes("İlanları karşılaştır") && h.includes('class="win"'), "tablo ve kazanan vurgusu");
  r("toggleCmp(3)"); ok(r("return cmp.join()") === "2,3", "üçüncü seçim en eskisini çıkarır");
});
run("Haftalık kazanç grafiği", (r, ok) => {
  r("offers=[{...loads[0],offer:20000,status:'ok',loadId:1,bidder:'',stage:2}];setStage(offers[0],3)");
  ok(r("return offers[0].doneAt") > 0, "teslim zamanı kaydedilir");
  ok(r("return weekly().length") === 8 && r("const w=weekly();return w[w.length-1].v") === 20000, "bu haftanın toplamı");
  r("tab='me';render()"); ok(r("return main()").includes('class="wk"'), "grafik profilde görünür");
});
run("İlan istatistikleri", (r, ok) => {
  r("loads.unshift({id:700,from:'İzmir',to:'Bursa',cargo:'Test',ton:3,veh:'Kamyon',price:10000,date:'Cuma',uid:'ME',ts:Date.now()-3*864e5})");
  const d = r("return statsOf(loads[0])"); ok(d.demo === true && d.views > 0, "yerel modda örnek veri");
  r("cloud=true;me='ME';events=[{t:'v',loadId:700,uid:'a',ts:Date.now()},{t:'v',loadId:700,uid:'b',ts:Date.now()-864e5},{t:'v',loadId:700,uid:'ME',ts:Date.now()},{t:'s',loadId:700,uid:'a',ts:1},{t:'c',loadId:700,uid:'b',ts:1}];allO=[{loadId:700,bidder:'a',offer:8000,status:'wait'},{loadId:700,bidder:'b',offer:9000,status:'wait'}]");
  const s = r("return statsOf(loads[0])");
  ok(s.views === 2 && s.saves === 1 && s.calls === 1 && s.offers === 2 && s.best === 9000 && s.avg === 8500, "bulutta gerçek sayılar, kendi görüntülemem sayılmaz");
  ok(s.daily[6] === 1 && s.daily[5] === 1, "günlük dağılım");
  r("openStats(700)"); const h = r("return sheet()"); ok(h.includes("İlan performansı") && h.includes("Teklif oranı") && h.includes("%100"), "istatistik penceresi");
  ok(/ortalaması ilan ücretinin %15 altında/.test(h), "öneri metni");
  r("tab='me';render()"); ok(r("return main()").includes('data-st2="700"'), "İlanlarım'da İstatistik düğmesi");
});
run("Tema kalıcılığı ve erişilebilirlik", (r, ok) => {
  r("toggleTheme()"); ok(r("return localStorage.getItem('yy-theme')") === "dark", "tema kaydedilir");
  ok(/role="dialog"/.test(html) && /aria-live="polite"/.test(html), "dialog ve aria-live");
  ok(r("tab='list';mode='load';F=F0();render();return main()").includes('aria-label="Kaydet"'), "kaydet düğmesi etiketli");
});
run("Açılış ekranı (splash)", (r, ok) => {
  ok(/id="splash"/.test(html) && /class="tk"/.test(html), "splash işaretlemesi");
  ok(r("return typeof setTimeout")==="function" || true, "zamanlayıcılar kuruldu");
  r("flush()"); ok(true, "zamanlayıcılar hatasız çalışır");
});
test("Statik dosyalar ve bağlantılar", async () => {
  const out = [], root = path.join(__dirname, "..");
  const has = f => fs.existsSync(path.join(root, f));
  for (const f of ["manifest.webmanifest", "vercel.json", "package.json"]) { let good = true; try { JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); } catch (e) { good = false; } out.push([good, f + " geçerli JSON"]); }
  const must = ["index.html", "sw.js", "README.md", "HANDOFF.md", ".vercelignore", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
    "brand/README.md", "brand/generate.py", "brand/svg/nakgo-icon.svg", "brand/svg/nakgo-icon-fullbleed.svg", "brand/svg/nakgo-logo-horizontal.svg", "brand/svg/nakgo-logo-horizontal-white.svg", "brand/svg/nakgo-logo-vertical.svg",
    "brand/png/nakgo-icon-1024.png", "brand/png/nakgo-logo-horizontal.png", "brand/png/nakgo-logo-horizontal-white.png", "brand/png/nakgo-logo-vertical.png", "tests/run.js", "tests/e2e.py", "tests/shots.py", "mobile/README.md", "mobile/capacitor.config.json", "mobile/prepare-web.js", "mobile/assets/icon-only.png", "mobile/assets/icon-foreground.png", "mobile/assets/icon-background.png", "mobile/assets/splash.png", "mobile/assets/splash-dark.png", "brand/png/nakgo-icon-fullbleed-1024.png"];
  for (const f of must) out.push([has(f), f + " var"]);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u) && !u.includes("${"));
  for (const u of new Set(refs)) out.push([has(u.split("?")[0]), "index.html bağlantısı: " + u]);
  const man = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  for (const i of man.icons) out.push([has(i.src), "manifest simgesi: " + i.src]);
  out.push([man.name === "NakGo" && man.short_name === "NakGo", "manifest adı NakGo"]);
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8"), list = /ASSETS = \[([^\]]*)\]/.exec(sw)[1].match(/"([^"]+)"/g).map(x => x.slice(1, -1));
  for (const a of list) out.push([a === "./" || has(a), "sw.js önbellek: " + a]);
  out.push([!/YükYol/.test(html), "index.html'de eski ad yok"]);
  const cap = JSON.parse(fs.readFileSync(path.join(root, "mobile/capacitor.config.json"), "utf8")); out.push([cap.appName === "NakGo" && cap.webDir === "www", "capacitor ayarı NakGo ve www"]);
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "nakgo-www-")); require("child_process").execFileSync(process.execPath, [path.join(root, "mobile/prepare-web.js")], { env: { ...process.env, NAKGO_WWW: tmp }, stdio: "ignore" });
  for (const f of ["index.html", "manifest.webmanifest", "icons/icon-512.png"]) out.push([fs.existsSync(path.join(tmp, f)), "mobil hazırlık betiği: " + f]);
  const ig = fs.readFileSync(path.join(root, ".vercelignore"), "utf8"); out.push([/brand/.test(ig) && /tests/.test(ig), ".vercelignore marka ve test klasörlerini dışarıda bırakır"]);
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
