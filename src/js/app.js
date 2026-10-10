/**
 * Başlatma
 * Olay bağlama, açılış ekranı, tema ve kısayollar. Her şey tanımlandıktan sonra en sonda çalışır.
 */

try {
    const hm = /^#l=(\d+)$/.exec(location.hash || "");
    deepId = hm ? +hm[1] : 0;
}
catch (e) { }

$("#sheet").onclick = e => {
    if (e.target.id === "sheet") {
        closeSheet();
        render();
    }
};

document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
    capturePostDraft();
    tab = b.dataset.t;
    setNav();
    render();
    $("#main").scrollTop = 0;
});

try {
    window.addEventListener("online", netUI);
    window.addEventListener("offline", netUI);
    window.addEventListener("error", () => {
        const t = Date.now();
        if (t - (window.__et || 0) > 4000) {
            window.__et = t;
            toast("Bir şeyler ters gitti. Sorun sürerse sayfayı yenile.");
        }
    });
}
catch (e) { }

try {
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncDetailViewport);
        window.visualViewport.addEventListener("scroll", syncDetailViewport);
    }
}
catch (e) { }

netUI();

try {
    const th = localStorage.getItem("yy-theme");
    if (th)
        document.documentElement.dataset.theme = th;
}
catch (e) { }

try {
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && $("#sheet").classList.contains("open")) {
            closeSheet();
            render();
        }
        if ((e.key === "Enter" || e.key === " ") && e.target && e.target.dataset && e.target.dataset.fav !== undefined) {
            e.preventDefault();
            e.target.click();
        }
    });
}
catch (e) { }

try {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && !/claude/.test(location.host) && !isNative())
        navigator.serviceWorker.register("sw.js").catch(() => { });
}
catch (e) { }

{
    const sp = $("#splash");
    if (sp) {
        let again = false;
        try {
            again = !!sessionStorage.getItem("ng-splash");
            sessionStorage.setItem("ng-splash", "1");
        }
        catch (e) { }
        if (again)
            sp.style.display = "none";
        else {
            let t = 1500;
            try {
                if (matchMedia("(prefers-reduced-motion: reduce)").matches)
                    t = 500;
            }
            catch (e) { }
            if (isNative())
                t = 600;
            setTimeout(() => sp.classList.add("hide"), t);
            setTimeout(() => {
                sp.style.display = "none";
            }, t + 450);
        }
    }
}

try {
    window.addEventListener("beforeinstallprompt", e => {
        e.preventDefault();
        deferredInstall = e;
        if (tab === "me")
            render();
    });
    window.addEventListener("appinstalled", () => {
        deferredInstall = null;
        if (tab === "me")
            render();
    });
}
catch (e) { }

try {
    const sh = $("#sheet");
    new MutationObserver(() => {
        try {
            const o = sh.classList.contains("open");
            if (o && !sheetPushed) {
                sheetPushed = true;
                history.pushState({ ng: "sheet" }, "");
            }
            else if (!o && sheetPushed) {
                sheetPushed = false;
                if (history.state && history.state.ng === "sheet")
                    history.back();
            }
        }
        catch (e) { }
    }).observe(sh, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("popstate", () => {
        if (sheetPushed && sh.classList.contains("open")) {
            sheetPushed = false;
            closeSheet();
            render();
        }
    });
}
catch (e) { }

try {
    const go = new URLSearchParams(location.search).get("go");
    if (go === "post") {
        tab = "post";
        setNav();
    }
    else if (go === "mine") {
        tab = "mine";
        setNav();
    }
    else if (go === "near") {
        tab = "list";
        setNav();
        setTimeout(() => {
            try {
                toggleNear();
            }
            catch (e) { }
        }, 900);
    }
}
catch (e) { }

$("#thh").onclick = toggleTheme;

updTheme();

$("#bell").onclick = openBell;

if (role === "owner") {
    mode = "truck";
    postMode = "load";
}
else if (role === "carrier") {
    postMode = "truck";
}

try {
    const savedPostMode=localStorage.getItem("ng-post-mode");
    if(savedPostMode === "load" || savedPostMode === "truck") postMode=savedPostMode;
} catch(e) { }

render();

deep();

try {
    if (!localStorage.getItem("yy-onb"))
        openOnb();
}
catch (e) { }

// Ortak veritabanı varsa bağlan (yoksa uygulama yerel modda kalır).
initCloud();

// Pencere açılışında odağı içeride tut; kapanışta çağıran düğmeye geri dön.
try {
    const sh = $("#sheet"), body = $("#sheetBody");
    let previousFocus = null, wasOpen = false;
    new MutationObserver(() => {
        const open = sh.classList.contains("open");
        if (open && !wasOpen) {
            previousFocus = document.activeElement;
            body.setAttribute("aria-label", body.querySelector("h2,b,.detail-top")?.textContent || "NakGo penceresi");
            body.setAttribute("tabindex", "-1");
            (body.querySelector("#close,#cx,button,input") || body).focus();
        } else if (!open && wasOpen && previousFocus?.isConnected) previousFocus.focus();
        wasOpen = open;
    }).observe(sh, {attributes:true,attributeFilter:["class"]});
    document.addEventListener("keydown", e => {
        if(e.key !== "Tab" || !sh.classList.contains("open")) return;
        const focusables=[...body.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.disabled);
        if(!focusables.length){e.preventDefault();body.focus();return;}
        const first=focusables[0],last=focusables.at(-1);
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===body)){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
} catch(e) { }
