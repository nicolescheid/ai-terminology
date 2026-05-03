// Site-wide navigation menu. Auto-injects a small pill into the top-right
// corner of every page that includes this script; clicking it opens a
// floating panel of links. Vanilla DOM, no framework dep — works on the
// React-rendered atlas, the static manager dashboard, and the Almanac
// alike.
//
// Behavior:
//   - Click pill → toggle panel
//   - Click outside panel → close
//   - Escape key → close
//   - Marks the link matching the current path as `is-current`
//
// Pages opt out by setting `window.SITE_MENU_DISABLED = true` before loading
// this script (the splash uses this — see comment in index.html).

(function () {
  if (typeof window === "undefined") return;
  if (window.SITE_MENU_DISABLED) return;
  if (document.querySelector(".site-menu")) return; // already injected

  // Order chosen by Nicole: Graph → Almanac → Lexi's List → Spec → Repo.
  // Manager (/manager/) is intentionally NOT listed — the page is reachable
  // by direct URL or bookmark but isn't advertised. Notes for Nicole is
  // operationally sensitive (it's where Lexi flags suspicious sources,
  // contested-cluster omissions, default-deny events) and shouldn't be one
  // click off every public page. The page itself is tagged noindex,nofollow
  // so it doesn't appear in search. Real auth (Pages Functions Basic Auth
  // or Cloudflare Access) is queued for Phase 4 — until then, the URL
  // remains fetchable, but unlinked.
  var LINKS = [
    { label: "Graph",        href: "/",                                                                    match: ["/", "/index.html"] },
    { label: "Almanac",      href: "/almanac/",                                                            match: ["/almanac/", "/almanac"] },
    { label: "Lexi's List",  href: "/lexis-list/",                                                         match: ["/lexis-list/", "/lexis-list"] },
    { label: "Spec",         href: "https://github.com/nicolescheid/ai-terminology/blob/main/lexi-spec.md", external: true },
    { label: "Repo",         href: "https://github.com/nicolescheid/ai-terminology",                       external: true }
  ];

  function buildMenu() {
    var root = document.createElement("div");
    root.className = "site-menu";

    var pill = document.createElement("button");
    pill.className = "site-menu__pill";
    pill.type = "button";
    pill.setAttribute("aria-haspopup", "true");
    pill.setAttribute("aria-expanded", "false");
    pill.setAttribute("aria-controls", "site-menu-panel");
    pill.innerHTML =
      '<span class="site-menu__bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '<span>Menu</span>';
    root.appendChild(pill);

    var panel = document.createElement("div");
    panel.className = "site-menu__panel";
    panel.id = "site-menu-panel";
    panel.setAttribute("role", "menu");
    panel.hidden = true;

    var path = (window.location.pathname || "/").replace(/\/+$/, "/") || "/";

    LINKS.forEach(function (link) {
      var a = document.createElement("a");
      a.className = "site-menu__link";
      a.href = link.href;
      a.setAttribute("role", "menuitem");
      if (link.external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      // Highlight current page
      if (link.match) {
        var here = path;
        if (link.match.indexOf(here) !== -1 ||
            link.match.indexOf(here.replace(/\/$/, "")) !== -1) {
          a.classList.add("is-current");
        }
      }
      var label = document.createElement("span");
      label.textContent = link.label;
      a.appendChild(label);
      if (link.hint) {
        var hint = document.createElement("span");
        hint.className = "site-menu__hint";
        hint.textContent = link.hint;
        a.appendChild(hint);
      } else if (link.external) {
        var hint2 = document.createElement("span");
        hint2.className = "site-menu__hint";
        hint2.textContent = "↗";
        a.appendChild(hint2);
      }
      panel.appendChild(a);
    });

    root.appendChild(panel);

    // Build stamp footer — fetched once on first open. Tells you which
    // commit is currently deployed (saves the "is it live yet?" round-trip).
    var stampFetched = false;
    function loadBuildStamp() {
      if (stampFetched) return;
      stampFetched = true;
      fetch("/build.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (stamp) {
          if (!stamp || !stamp.shortSha) return;
          var footer = document.createElement("a");
          footer.className = "site-menu__build";
          footer.href = "https://github.com/nicolescheid/ai-terminology/commit/" + stamp.commit;
          footer.target = "_blank";
          footer.rel = "noopener noreferrer";
          var date = (stamp.generatedAt || "").slice(0, 10);
          footer.textContent = "build · " + stamp.shortSha + (date ? " · " + date : "");
          panel.appendChild(footer);
        })
        .catch(function () { /* fail silently — stamp is informational */ });
    }

    function open()  { panel.hidden = false; pill.setAttribute("aria-expanded", "true"); loadBuildStamp(); }
    function close() { panel.hidden = true;  pill.setAttribute("aria-expanded", "false"); }
    function toggle() { if (panel.hidden) open(); else close(); }

    pill.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener("click", function (e) {
      if (!panel.hidden && !root.contains(e.target)) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        close();
        pill.focus();
      }
    });

    document.body.appendChild(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildMenu);
  } else {
    buildMenu();
  }
})();
