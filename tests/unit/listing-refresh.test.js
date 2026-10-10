/* İlan yenilemesi: filtrelerin birlikte çalışması ve teklif işleminin korunması */
module.exports = function register({ run }) {
  run("Güzergâh filtresi ve kaldırılabilir etiketler", (r, ok) => {
    r("F=F0();F.from='İstanbul';F.to='Ankara';F.veh=['Tır'];tab='list';mode='load';render()");
    let h = r("return main()");
    ok(h.includes('id="route-from"') && h.includes('value="İstanbul" selected'), "arama alanı mevcut filtreden değer alır");
    ok(h.includes('data-id="1"') && !h.includes('data-id="2"'), "güzergâh ve araç filtresi birlikte uygulanır");
    r("rmF('from','')");
    ok(r("return F.from===''&&F.to==='Ankara'&&F.veh[0]==='Tır'"), "tek etiket kaldırılınca diğer filtreler korunur");
    r("el('#route-swap').onclick()");
    ok(r("return F.from==='Ankara'&&F.to===''"), "güzergâh değişimi gerçek filtreyi günceller");
    r("q='Sonuçsuz';nearOn=true;render();el('#rs').onclick()");
    ok(r("return q===''&&!nearOn&&fcount()===0"), "boş sonuçtan sıfırlama arama ve yakınlığı da temizler");
  });
  run("İlan önceliği ve demo açıklaması", (r, ok) => {
    r("tab='list';mode='load';render()");
    const h = r("return main()"), card = r("return lCard(loads.find(x=>x.date==='Bugün'))");
    ok(h.indexOf('route-search') < h.indexOf('class="seg"') && h.indexOf('market-stats') > h.indexOf('data-id="1"'), "arama başta, istatistik ilanlardan sonra");
    ok(!h.includes('id="fc"') && h.includes('Demo modu'), "yakıt kartı listeden kalkar, demo açıklaması görünür");
    ok(card.includes('Bugün') && !card.includes('Acil'), "Bugün ayrı aciliyet verisi olmadan Acil olmaz");
    ok(card.indexOf('listing-price') < card.indexOf('cargo-line'), "ücret yük özelliklerinden önce gelir");
    r("cloud=true;render()");
    ok(!r("return main()").includes('Demo modu'), "bulut modunda demo açıklaması görünmez");
  });
  run("Yük detayından teklif gönderme ve kalıcılık", (r, ok) => {
    r("openLoad(1)");
    const h = r("return sheet()");
    ok(['Yük bilgileri','Taşıma ve ödeme','Yük sahibi','Tahmini mesafe','Yakıt sonrası tahmini kazanç'].every(t=>h.includes(t)), "okunabilir bilgi grupları ve tahmin açıklamaları");
    ok(h.includes('offer-dock') && ['cc','sh','call','pf','cp2','rp','close'].every(id=>h.includes('id=\"'+id+'\"')), "teklif alanı ve ikincil işlemler korunur");
    r("el('#o').value='0';el('#send').onclick()");
    ok(r("return offers.length")===0, "geçersiz tutar teklif oluşturmaz");
    r("el('#o').value='27000';el('#send').onclick();tab='mine';render()");
    ok(r("return offers[0].offer===27000&&offers[0].loadId===1&&offers[0].status==='wait'"), "teklif doğru tutar ve ilanla kaydedilir");
    ok(r("return JSON.parse(localStorage.getItem('yy2')).offers[0].offer")===27000, "yerel saklama anahtarı ve teklif kaydı korunur");
  });
};
