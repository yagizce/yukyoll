/**
 * Profil ekranı
 * Klasik uygulama kapsamında yüklenir; sıra tools/project.js içinde tanımlıdır.
 */

function renderProfile(m) {

        m.innerHTML = `<div style="display:flex;gap:14px;align-items:center"><div class="avatar">${(myName || "Y")[0].toUpperCase()}</div><div><b style="font-size:18px">${myName || "Yağız"}${vbadge(appr[me || "local"] === true ? 2 : cOk(myCar) ? 1 : 0)}</b><div style="color:var(--mute);font-size:14px">Taşıyıcı ve yük sahibi${myRate()}</div></div></div>
    <div class="stat"><div><b>${loads.length}</b><span>Açık ilan</span></div><div><b>${offers.length}</b><span>Verdiğim teklif</span></div></div>
    ${demoNotice()}<div class="profile-grid"><section class="profile-group"><h2>İlanlarım ve hareketlerim</h2>${myListHTML()}${featSumCard()}${alertsCard()}${earnCard()}</section><section class="profile-group"><h2>Üyelik</h2>${premCard()}<details class="profile-panel"><summary>İletişim ve tercihler</summary>${phoneCard()}${roleCard()}</details><details class="profile-panel"><summary>Araç ve belgeler</summary>${carCard()}</details><details class="profile-panel"><summary>Güvenlik ve destek</summary>${adminCard()}${reportsCard()}${blockedCard()}${installCard()}${helpCard()}</details></section></div>`;
        carBind();
        listBind();

}
