/* ==========================================================================
   Realität als Zustand — i18n runtime (append-only, changes nothing existing)
   --------------------------------------------------------------------------
   Finds "translation units" (leaf text blocks) with the SAME rule the Python
   extractor uses, so unit i in the DOM lines up with RAZ_I18N.units[i].
   German = the original text already in the page. RU/EN swapped in on click.
   ========================================================================== */
(function () {
  "use strict";

  /* RAZ_I18N and RAZ_CFG are injected right before this script. */
  var DATA = (typeof RAZ_I18N !== "undefined") ? RAZ_I18N : { units: [], title: null };
  var CFG  = (typeof RAZ_CFG  !== "undefined") ? RAZ_CFG  : { place: "float", pos: "top-right" };
  var LS_KEY = "raz_lang";

  /* ---- element classification (must match the Python extractor) ---------- */
  var INLINE = {
    A:1, ABBR:1, B:1, BDI:1, BDO:1, BR:1, CITE:1, CODE:1, DATA:1, DFN:1, EM:1,
    I:1, KBD:1, MARK:1, Q:1, RP:1, RT:1, RUBY:1, S:1, SAMP:1, SMALL:1, SPAN:1,
    STRONG:1, SUB:1, SUP:1, TIME:1, U:1, VAR:1, WBR:1, DEL:1, INS:1
  };
  /* tags we never treat as text and never descend into.
     Note: SVG is intentionally NOT opaque — we DO translate <text>/<tspan> labels
     inside inline SVG. Opaque tags inside SVG (script/style/title/desc) still skipped. */
  var OPAQUE = {
    SCRIPT:1, STYLE:1, CANVAS:1, IFRAME:1, NOSCRIPT:1, TEMPLATE:1,
    IMG:1, VIDEO:1, AUDIO:1, INPUT:1, TEXTAREA:1, OBJECT:1,
    TITLE:1, HEAD:1, META:1, LINK:1, BASE:1, DESC:1, DEFS:1, SYMBOL:1
  };

  function TAG(el) { return (el.tagName || "").toUpperCase(); }
  function isOpaque(el) { return OPAQUE[TAG(el)] === 1; }

  function hasNonWsText(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeValue && /\S/.test(n.nodeValue)) return true;
    }
    return false;
  }

  /* true if some descendant ELEMENT is block-level (i.e. not inline & not opaque-inline) */
  function hasBlockDesc(el) {
    var kids = el.getElementsByTagName("*");
    for (var i = 0; i < kids.length; i++) {
      if (INLINE[TAG(kids[i])] !== 1) return true; /* non-inline => block => won't wrap */
    }
    return false;
  }

  function inSkippedZone(el) {
    var p = el;
    while (p && p.nodeType === 1) {
      if (p.id === "raz-langbar") return true;
      if (p.getAttribute && p.getAttribute("data-raz-skip") !== null &&
          p.getAttribute("data-raz-skip") !== undefined &&
          p.hasAttribute("data-raz-skip")) return true;
      p = p.parentNode;
    }
    return false;
  }

  /* collect units top-down, in document order; do not descend into a found unit */
  function collectUnits(root) {
    var out = [];
    (function walk(el) {
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
        if (isOpaque(c)) continue;
        if (c.id === "raz-langbar") continue;
        if (c.hasAttribute && c.hasAttribute("data-raz-skip")) continue;
        if (hasNonWsText(c) && !hasBlockDesc(c)) {
          out.push(c);            /* c is a translation unit */
        } else {
          walk(c);                /* descend */
        }
      }
    })(root);
    return out;
  }

  var units = collectUnits(document.body);
  var originals = units.map(function (el) { return el.innerHTML; });
  try { window.__RAZ__ = { n: units.length, o: originals }; } catch (e) {}
  var origTitle = document.title;

  var countOk = (DATA.units && DATA.units.length === units.length);
  if (!countOk && DATA.units && DATA.units.length) {
    /* Safety: never show a misaligned page. Stay German, warn in console. */
    console.warn("[raz-i18n] unit count mismatch: DOM=" + units.length +
                 " dict=" + DATA.units.length + " — staying DE.");
  }

  function apply(lang) {
    if (lang !== "de" && countOk) {
      for (var i = 0; i < units.length; i++) {
        var tr = DATA.units[i] && DATA.units[i][lang];
        units[i].innerHTML = (tr != null && tr !== "") ? tr : originals[i];
      }
    } else {
      for (var j = 0; j < units.length; j++) units[j].innerHTML = originals[j];
      lang = (lang === "de") ? "de" : "de";
    }
    /* title + <html lang> */
    document.documentElement.setAttribute("lang", lang);
    if (lang !== "de" && DATA.title && DATA.title[lang]) document.title = DATA.title[lang];
    else document.title = origTitle;

    /* remember + reflect in buttons */
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
    var btns = document.querySelectorAll("#raz-langbar [data-lang]");
    for (var k = 0; k < btns.length; k++) {
      var on = btns[k].getAttribute("data-lang") === lang;
      btns[k].setAttribute("aria-pressed", on ? "true" : "false");
      btns[k].className = on ? "raz-lb-btn raz-on" : "raz-lb-btn";
    }
    /* broadcast to any iframes (hub -> models) */
    var frames = document.getElementsByTagName("iframe");
    for (var f = 0; f < frames.length; f++) {
      try { frames[f].contentWindow.postMessage({ razLang: lang }, "*"); } catch (e) {}
    }
    if (typeof window.RAZ_onLang === "function") { try { window.RAZ_onLang(lang); } catch (e) {} }
  }

  function getInitial() {
    try {
      var s = localStorage.getItem(LS_KEY);
      if (s === "ru" || s === "en" || s === "de") return s;
    } catch (e) {}
    return "de";
  }

  /* ---- switcher UI ------------------------------------------------------- */
  function buildBar() {
    var style = document.createElement("style");
    style.id = "raz-lang-style";
    style.textContent =
      "#raz-langbar{position:fixed;z-index:2147483000;display:inline-flex;gap:2px;" +
      "padding:3px;border-radius:999px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "font-size:12px;font-weight:700;letter-spacing:.02em;line-height:1;" +
      "background:rgba(20,21,29,.72);border:1px solid rgba(150,150,180,.28);" +
      "box-shadow:0 6px 22px rgba(0,0,0,.35);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);}" +
      "#raz-langbar.raz-nav{position:static;box-shadow:none;background:transparent;border:1px solid var(--edge,rgba(150,150,180,.3));backdrop-filter:none;}" +
      "#raz-langbar .raz-lb-btn{appearance:none;border:0;background:transparent;cursor:pointer;" +
      "color:#c9cee0;border-radius:999px;padding:.4em .62em;font:inherit;transition:background .15s,color .15s;}" +
      "#raz-langbar.raz-nav .raz-lb-btn{color:var(--ink2,#7a7f90);}" +
      "#raz-langbar .raz-lb-btn:hover{color:#fff;}" +
      "#raz-langbar.raz-nav .raz-lb-btn:hover{color:var(--ink,#111);}" +
      "#raz-langbar .raz-lb-btn.raz-on{background:rgba(230,181,74,.92);color:#141019;}" +
      "@media (prefers-color-scheme:light){#raz-langbar:not(.raz-nav){background:rgba(250,248,242,.86);border-color:rgba(60,60,80,.18);}" +
      "#raz-langbar:not(.raz-nav) .raz-lb-btn{color:#43485a;} #raz-langbar:not(.raz-nav) .raz-lb-btn:hover{color:#111;}}";
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.id = "raz-langbar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Sprache / Language / Язык");
    var langs = [["de", "DE"], ["ru", "RU"], ["en", "EN"]];
    for (var i = 0; i < langs.length; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "raz-lb-btn";
      b.setAttribute("data-lang", langs[i][0]);
      b.setAttribute("aria-pressed", "false");
      b.title = { de: "Deutsch (Original)", ru: "Русский", en: "English" }[langs[i][0]];
      b.textContent = langs[i][1];
      (function (code) {
        b.addEventListener("click", function () { apply(code); });
      })(langs[i][0]);
      bar.appendChild(b);
    }

    if (CFG.place === "nav") {
      var host = document.querySelector(CFG.navSelector || ".nav-in");
      if (host) { bar.className = "raz-nav"; host.appendChild(bar); }
      else { placeFloat(bar); }
    } else {
      placeFloat(bar);
    }
    return bar;
  }

  function placeFloat(bar) {
    var pos = CFG.pos || "top-right";
    var top = "max(12px, env(safe-area-inset-top))";
    var side = "max(12px, env(safe-area-inset-right))";
    if (pos.indexOf("bottom") === 0) { bar.style.bottom = "max(12px, env(safe-area-inset-bottom))"; }
    else { bar.style.top = CFG.top || top; }
    if (pos.indexOf("left") >= 0) { bar.style.left = CFG.side || "max(12px, env(safe-area-inset-left))"; }
    else { bar.style.right = CFG.side || side; }
    document.body.appendChild(bar);
  }

  buildBar();

  /* listen for parent broadcast (models embedded as iframes) */
  window.addEventListener("message", function (e) {
    if (e && e.source === window.parent && e.origin === window.location.origin && e.data && (e.data.razLang === "de" || e.data.razLang === "ru" || e.data.razLang === "en")) {
      apply(e.data.razLang);
    }
  });

  /* initial language */
  apply(getInitial());
})();
