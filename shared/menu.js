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

  // Order chosen by Nicole: Graph → Almanac → Spec → Repo → Manager.
  // Manager has a `private` hint until Pages Functions auth ships in Phase 4.
  var LINKS = [
    { label: "Graph",    href: "/",                                                                    match: ["/", "/index.html"] },
    { label: "Almanac",  href: "/almanac/",                                                            match: ["/almanac/", "/almanac"] },
    { label: "Spec",     href: "https://github.com/nicolescheid/ai-terminology/blob/main/lexi-spec.md", external: true },
    { label: "Repo",     href: "https://github.com/nicolescheid/ai-terminology",                       external: true },
    { label: "Manager",  href: "/manager/", match: ["/manager/", "/manager"], hint: "private" }
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

    function open()  { panel.hidden = false; pill.setAttribute("aria-expanded", "true"); }
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
