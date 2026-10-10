/**
 * Teklifler ve işler ekranı
 * Klasik uygulama kapsamında yüklenir; sıra tools/project.js içinde tanımlıdır.
 */

function renderOffers(m) {
        m.innerHTML = screenHeading("Teklifler ve işler", "Yanıtları takip et, taşımanı ve teslim belgelerini yönet.") + demoNotice() + incHTML() + (offers.length ? offers.map(o => `<div class="load" style="cursor:default">${routeTitle(o)}
    <div class="meta"><span class="st ${o.status === "ok" ? "ok" : o.status === "no" ? "no" : ""}">${offerExp(o) ? "Süresi doldu" : STT[o.status]}${o.status === "counter" ? ": " + fmt(o.counter) : ""}</span><span class="price">${fmt(o.offer)}</span></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">${o.status === "counter" ? `<button class="chip on" data-ca="${o.id}">Karşı teklifi kabul et</button>` : ""}${o.status === "wait" || o.status === "counter" ? `<button class="chip" data-c="${o.id}">Geri çek</button>` : ""}<button class="chip" data-chat="o${o.id}_${o.bidder || ""}" data-who="${o.owner || (o.uid ? nm(o.uid) : "Yük sahibi")}">Mesaj</button>${callChip('data-cl="' + o.id + '"')}</div>${o.status === "ok" ? stageUI(o) + retHTML(o) : ""}</div>`).join("") : `<div class="empty">Henüz teklif vermedin. İlanlar sekmesinden bir yük seç.</div>`);
        m.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
            const o0 = offers.find(o => o.id === +b.dataset.c);
            offers = offers.filter(o => o.id !== +b.dataset.c);
            if (cloud && o0)
                dbw(db.doc(opath(o0)).delete());
            render();
            toast("Teklif geri çekildi");
        });
        m.querySelectorAll("[data-ca]").forEach(b => b.onclick = () => {
            const o = offers.find(x => x.id === +b.dataset.ca);
            oup(o, { status: "ok", offer: o.counter });
            toast("Anlaşma sağlandı");
        });
        m.querySelectorAll("[data-chat]").forEach(b => b.onclick = () => openChat(b.dataset.chat, b.dataset.who));
        m.querySelectorAll("[data-ia]").forEach(b => b.onclick = () => {
            oup(incoming[+b.dataset.ia], { status: "ok" });
            toast("Teklif kabul edildi");
        });
        m.querySelectorAll("[data-ir]").forEach(b => b.onclick = () => {
            oup(incoming[+b.dataset.ir], { status: "no" });
            toast("Teklif reddedildi");
        });
        m.querySelectorAll("[data-ik]").forEach(b => b.onclick = () => openCounter(incoming[+b.dataset.ik]));
        m.querySelectorAll("[data-rl]").forEach(b => b.onclick = () => openLoad(+b.dataset.rl));
        m.querySelectorAll("[data-sg]").forEach(b => {
            const [id, n] = b.dataset.sg.split("|");
            b.onclick = () => setStage(offers.find(o => o.id === +id), +n);
        });
        m.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => sendPod(offers.find(o => o.id === +b.dataset.sp)));
        m.querySelectorAll("[data-sv]").forEach(b => b.onclick = () => showPod(offers.find(o => o.id === +b.dataset.sv)));
        m.querySelectorAll("[data-ic]").forEach(b => b.onclick = () => setStage(incoming[+b.dataset.ic], 3));
        m.querySelectorAll("[data-iv]").forEach(b => b.onclick = () => showPod(incoming[+b.dataset.iv]));
        m.querySelectorAll("[data-cl]").forEach(b => b.onclick = () => {
            const o = offers.find(x => x.id === +b.dataset.cl);
            callTo(o && phoneOf(o));
        });
        m.querySelectorAll("[data-cli]").forEach(b => b.onclick = () => {
            const o = incoming[+b.dataset.cli];
            callTo(o && carrierPhone(o.bidder));
        });
        m.querySelectorAll("[data-bp]").forEach(b => b.onclick = () => {
            const o = incoming[+b.dataset.bp];
            if (o)
                openProfile({ uid: o.bidder, name: nm(o.bidder), lv: lvU(o.bidder) });
        });
        m.querySelectorAll("[data-bu]").forEach(b => b.onclick = () => blockUser((incoming[+b.dataset.bu] || {}).bidder));
        m.querySelectorAll("[data-rt]").forEach(b => b.onclick = () => openRate(offers.find(o => o.id === +b.dataset.rt), "carrier"));
        m.querySelectorAll("[data-ir2]").forEach(b => b.onclick = () => openRate(incoming[+b.dataset.ir2], "owner"));
}
