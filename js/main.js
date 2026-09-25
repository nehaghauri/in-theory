/* ==========================================================================
   In Theory Studios: main.js
   1. Helpers
   2. Navigation (sliding highlight, compact state, mobile menu)
   3. Hero: Instagram profile -> website, driven by scroll
   4. Small interactions (magnetic buttons, footer year)
   ========================================================================== */
(function () {
  "use strict";

  /* 1. HELPERS ------------------------------------------------------------ */
  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) root.classList.add("reduced");

  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* 2. NAVIGATION --------------------------------------------------------- */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;

    var linkWrap = $(".nav__links");
    var indicator = $(".nav__indicator");
    var links = $$(".nav__list a");
    var menuLinks = $$(".menu__list a");
    var toggle = $(".nav__toggle");
    var toggleLabel = $(".nav__toggle-label");
    var menu = $("#menu");
    var activeId = "";

    /* The dark pill that slides behind the link you're on (or hovering) */
    function moveIndicator(link) {
      if (!indicator) return;
      if (!link) {
        indicator.style.opacity = "0";
        return;
      }
      var wasHidden = indicator.style.opacity !== "1";
      if (wasHidden) indicator.style.transition = "none"; // appear in place, don't slide in from the left
      indicator.style.width = link.offsetWidth + "px";
      indicator.style.transform = "translateX(" + link.offsetLeft + "px)";
      indicator.style.opacity = "1";
      if (wasHidden) {
        void indicator.offsetWidth; // force the browser to apply it before re-enabling the transition
        indicator.style.transition = "";
      }
    }

    function activeLink() {
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === "#" + activeId) return links[i];
      }
      return null;
    }

    function setActive(id) {
      activeId = id;
      nav.classList.toggle("at-contact", id === "contact");
      [links, menuLinks].forEach(function (group) {
        group.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + id;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      });
      moveIndicator(activeLink());
    }

    if (linkWrap) {
      links.forEach(function (a) {
        a.addEventListener("pointerenter", function () { moveIndicator(a); });
        a.addEventListener("focus", function () { moveIndicator(a); });
      });
      linkWrap.addEventListener("pointerleave", function () { moveIndicator(activeLink()); });
      linkWrap.addEventListener("focusout", function () { moveIndicator(activeLink()); });
      window.addEventListener("resize", function () { moveIndicator(activeLink()); });
    }

    /* Which chapter is in the middle of the screen? */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("[data-chapter]").forEach(function (section) { io.observe(section); });
    }

    /* Shrinks slightly once you leave the top of the page */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("is-compact", window.scrollY > 60);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* Mobile menu */
    if (toggle && menu) {
      var isOpen = function () { return root.classList.contains("menu-open"); };
      var setMenu = function (open) {
        root.classList.toggle("menu-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (toggleLabel) toggleLabel.textContent = open ? "Close" : "Menu";
        menu.setAttribute("aria-hidden", String(!open));
        menu.inert = !open;
      };

      toggle.addEventListener("click", function () { setMenu(!isOpen()); });
      $$("a", menu).concat($$(".nav__cta")).forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) {
          setMenu(false);
          toggle.focus();
        }
      });
      window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) {
        if (e.matches) setMenu(false);
      });
    }
  }

  /* 3. HERO ---------------------------------------------------------------
     The mockup is drawn in a fixed "design space". LAYOUTS below lists where
     every piece sits in the phone (feed) and in the website (site), in pixels.
     As you scroll, GSAP moves each piece from its feed spot to its site spot.
     To change the mockup's layout, edit LAYOUTS. To change the timing, edit
     the numbers in buildHero(). */
  function R(x, y, w, h, r) {
    return { x: x, y: y, w: w, h: h, r: r };
  }

  /* Feed: a 3x3 grid of photos, each 92 x 108 with a 2px gap */
  function feedTile(i) {
    return R((i % 3) * 94, 184 + Math.floor(i / 3) * 110, 92, 108, 0);
  }

  var LAYOUTS = {
    /* Desktop: the phone grows into a browser window */
    desktop: {
      device: { feed: { w: 300, h: 600, bw: 10, r: 44 }, site: { w: 660, h: 440, bw: 2, r: 16 } },
      el: {
        avatar: { feed: R(16, 26, 60, 60, 30), site: R(24, 41, 22, 22, 11) },
        name: { feed: { x: 88, y: 41 }, site: { x: 54, y: 45 } },
        handle: { feed: { x: 88, y: 61 } },
        bio: { feed: { x: 16, y: 96 } },
        linkbio: { feed: { x: 16, y: 137 } },
        btn: { feed: R(16, 156, 248, 26, 8), site: R(556, 40, 76, 24, 12) },
        tabbar: { feed: { x: 0, y: 536 } },
        notch: { feed: { x: 95, y: 8 } },
        toolbar: { site: { x: 0, y: 0 } },
        navlinks: { site: { x: 388, y: 46 } },
        sith: { site: { x: 24, y: 88, w: 310 } },
        sitp: { site: { x: 24, y: 158, w: 300 } },
        sitb: { site: R(24, 196, 96, 30, 15) },
        sitl: { site: { x: 24, y: 397 } },
        t1: { feed: feedTile(0), site: R(352, 80, 280, 186, 14) },
        t2: { feed: feedTile(1), site: R(24, 278, 190, 96, 12) },
        t3: { feed: feedTile(2), site: R(233, 278, 190, 96, 12) },
        t4: { feed: feedTile(3), site: R(442, 278, 190, 96, 12) },
        t5: { feed: feedTile(4), site: R(170, 386, 84, 32, 6) },
        t6: { feed: feedTile(5), site: R(264.5, 386, 84, 32, 6) },
        t7: { feed: feedTile(6), site: R(359, 386, 84, 32, 6) },
        t8: { feed: feedTile(7), site: R(453.5, 386, 84, 32, 6) },
        t9: { feed: feedTile(8), site: R(548, 386, 84, 32, 6) }
      }
    },

    /* Mobile: the phone stays a phone and becomes a mobile website */
    mobile: {
      device: { feed: { w: 300, h: 600, bw: 10, r: 44 }, site: { w: 300, h: 600, bw: 10, r: 44 } },
      el: {
        avatar: { feed: R(16, 26, 60, 60, 30), site: R(16, 41, 22, 22, 11) },
        name: { feed: { x: 88, y: 41 }, site: { x: 46, y: 45 } },
        handle: { feed: { x: 88, y: 61 } },
        bio: { feed: { x: 16, y: 96 } },
        linkbio: { feed: { x: 16, y: 137 } },
        btn: { feed: R(16, 156, 248, 26, 8), site: R(196, 40, 68, 24, 12) },
        tabbar: { feed: { x: 0, y: 536 } },
        notch: { feed: { x: 95, y: 8 } },
        toolbar: { site: { x: 0, y: 0 } },
        navlinks: { site: { x: 0, y: 0 } },
        sith: { site: { x: 16, y: 80, w: 248 } },
        sitp: { site: { x: 16, y: 134, w: 248 } },
        sitb: { site: R(16, 156, 96, 28, 14) },
        sitl: { site: { x: 16, y: 470 } },
        t1: { feed: feedTile(0), site: R(16, 196, 248, 150, 14) },
        t2: { feed: feedTile(1), site: R(16, 358, 77, 96, 10) },
        t3: { feed: feedTile(2), site: R(101, 358, 77, 96, 10) },
        t4: { feed: feedTile(3), site: R(186, 358, 77, 96, 10) },
        t5: { feed: feedTile(4), site: R(16, 490, 44, 44, 8) },
        t6: { feed: feedTile(5), site: R(66, 490, 44, 44, 8) },
        t7: { feed: feedTile(6), site: R(116, 490, 44, 44, 8) },
        t8: { feed: feedTile(7), site: R(166, 490, 44, 44, 8) },
        t9: { feed: feedTile(8), site: R(216, 490, 44, 44, 8) }
      }
    }
  };

  /* Turns { x, y, w, h, r } into GSAP properties (skipping anything not set) */
  function props(r) {
    var p = {};
    if (r.x != null) p.x = r.x;
    if (r.y != null) p.y = r.y;
    if (r.w != null) p.width = r.w;
    if (r.h != null) p.height = r.h;
    if (r.r != null) p.borderRadius = r.r + "px"; // explicit px, otherwise GSAP reuses the % from the CSS
    return p;
  }

  function assign(a, b) {
    for (var k in b) a[k] = b[k];
    return a;
  }

  function buildHero(mode) {
    var L = LAYOUTS[mode];
    var F = L.device.feed;
    var S = L.device.site;

    var area = $(".hero__deviceArea");
    var space = $(".device-space");
    var wrap = $(".device-wrap");
    var device = $(".device");
    var track = $(".hero__track");
    var hint = $(".hero__hint");
    var line2 = $(".hero__line--two");
    var barFill = $(".hero__bar i");
    var stepA = $(".hero__step--a");
    var stepB = $(".hero__step--b");
    var live = $(".live-pill");
    var caps = $$(".tile__cap");
    var btnA = $(".btn-mock__a");
    var btnB = $(".btn-mock__b");

    var els = {};
    $$(".device-space [data-el]").forEach(function (e) { els[e.getAttribute("data-el")] = e; });

    /* How big to draw the mockup: fit the phone, then fit the website */
    function scales() {
      var w = area.clientWidth;
      var h = area.clientHeight;
      return {
        phone: Math.min(1.12, (h * 0.94) / F.h, (w * 0.94) / F.w),
        site: Math.min(1.2, (h * 0.94) / S.h, (w * 0.98) / S.w)
      };
    }

    /* Starting positions: everything in its "Instagram" spot */
    Object.keys(L.el).forEach(function (id) {
      var c = L.el[id];
      gsap.set(els[id], props(c.feed || c.site));
    });
    gsap.set([els.toolbar, els.navlinks, els.sith, els.sitp, els.sitb, els.sitl].concat(caps), { opacity: 0 });
    gsap.set(wrap, { width: F.w, height: F.h });
    gsap.set(device, { borderWidth: F.bw, borderRadius: F.r + "px" });

    var tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: reduced ? undefined : {
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (hint) hint.classList.toggle("is-hidden", self.progress > 0.02);
        }
      }
    });

    /* Timeline is 6 units long: 0-1 rest, 1-5 transformation, 5-6 rest */

    /* The device itself: phone body grows into a browser window */
    tl.fromTo(space, { scale: function () { return scales().phone; } },
                     { scale: function () { return scales().site; }, duration: 2.4 }, 1)
      .fromTo(wrap, { width: F.w, height: F.h }, { width: S.w, height: S.h, duration: 2.4 }, 1)
      .fromTo(device, { borderWidth: F.bw, borderRadius: F.r + "px" }, { borderWidth: S.bw, borderRadius: S.r + "px", duration: 2.4 }, 1);

    /* Parts of the Instagram profile that disappear */
    tl.to(els.notch, { opacity: 0, duration: 0.6 }, 1)
      .to([els.handle, els.bio, els.linkbio, els.tabbar], { opacity: 0, duration: 0.7, stagger: 0.05 }, 1);

    /* Parts that carry over: profile picture -> logo, name -> site name, Message button -> Order button */
    tl.fromTo(els.avatar,
      assign(props(L.el.avatar.feed), { boxShadow: "0 0 0 3px rgb(255,250,240), 0 0 0 5px rgb(239,75,43)" }),
      assign(props(L.el.avatar.site), { boxShadow: "0 0 0 0px rgb(255,250,240), 0 0 0 0px rgb(239,75,43)", duration: 2.4 }), 1.2)
      .to(els.name, assign(props(L.el.name.site), { duration: 2.4 }), 1.2)
      .to(els.btn, assign(props(L.el.btn.site), { backgroundColor: "#ef4b2b", duration: 2.4 }), 1.2)
      .to(btnA, { opacity: 0, duration: 0.5 }, 1.4)
      .to(btnB, { opacity: 1, duration: 0.6 }, 2.4);

    /* The nine photos rearrange into the website layout, one after another */
    for (var i = 1; i <= 9; i++) {
      tl.to(els["t" + i], assign(props(L.el["t" + i].site), { duration: 2.6 }), 1.1 + (i - 1) * 0.08);
    }

    /* Website-only parts fade in once there's room for them */
    tl.fromTo(els.toolbar, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.8 }, 2.5);
    if (mode === "desktop") {
      tl.fromTo(els.navlinks, { opacity: 0, y: L.el.navlinks.site.y + 6 }, { opacity: 1, y: L.el.navlinks.site.y, duration: 0.8 }, 2.9);
    }
    tl.fromTo(els.sith, { opacity: 0, y: L.el.sith.site.y + 10 }, { opacity: 1, y: L.el.sith.site.y, duration: 0.9 }, 3.1)
      .fromTo(els.sitp, { opacity: 0, y: L.el.sitp.site.y + 10 }, { opacity: 1, y: L.el.sitp.site.y, duration: 0.9 }, 3.3)
      .fromTo(els.sitb, { opacity: 0, y: L.el.sitb.site.y + 10 }, { opacity: 1, y: L.el.sitb.site.y, duration: 0.9 }, 3.5)
      .to([els.sitl].concat(caps), { opacity: 1, duration: 0.6 }, 3.9);

    /* Headline: "Now give it a home." lights up as the site takes shape */
    tl.to(line2, { opacity: 1, duration: 2.2 }, 1.6);

    /* "Live" badge pops on at the end */
    tl.fromTo(live, { opacity: 0, scale: 0.6, rotation: -12 },
                    { opacity: 1, scale: 1, rotation: 4, duration: 0.7, ease: "back.out(2)" }, 4.3);

    /* Progress line under the mockup */
    tl.fromTo(barFill, { scaleX: 0 }, { scaleX: 1, duration: 3.6, ease: "none" }, 1)
      .to(stepA, { opacity: 0.4, duration: 0.5 }, 2.4)
      .to(stepB, { opacity: 1, duration: 0.5 }, 3.6);

    /* Pad the end so the finished website rests for a moment */
    tl.to({}, { duration: 0.01 }, 6);

    /* Reduced motion: skip straight to the finished website */
    if (reduced) {
      tl.progress(1).pause();
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { tl.invalidate().progress(1); }, 150);
      });
    }
  }

  function initHero() {
    if (!$(".hero__track") || !hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);

    var mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 900px)", mobile: "(max-width: 899.98px)" }, function (ctx) {
      buildHero(ctx.conditions.desktop ? "desktop" : "mobile");
    });

    /* Fonts and images change layout size, so re-measure once they're in */
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }


  /* 5. SERVICES: tabs + replayable mini-animations ------------------------ */
  function initServices() {
    var root = $("[data-services]");
    if (!root) return;

    var tabs = $$(".svc-tab", root);
    var panels = $$(".svc-panel", root);

    function play(panel) {
      var stage = $(".svc-stage", panel);
      if (!stage) return;
      stage.classList.remove("is-playing");
      void stage.offsetWidth;
      if (!reduced) stage.classList.add("is-playing");
      else stage.classList.add("is-playing");
    }

    function show(id) {
      tabs.forEach(function (t) {
        var on = t.id === "tab-" + id;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        var on = p.id === "panel-" + id;
        p.hidden = !on;
        if (on) play(p);
      });
    }

    show("design"); // make sure state matches the markup before anything else runs

    tabs.forEach(function (tab, i) {
      var id = tab.id.replace("tab-", "");
      tab.addEventListener("click", function () { show(id); });
      tab.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        next.click();
      });
    });

    $$(".svc-replay", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        play(btn.closest(".svc-panel"));
      });
    });

    /* Development panel: toggle its own desktop/phone preview */
    var devStage = $("#panel-dev .svc-stage--dev");
    if (devStage) {
      var devBtn = document.createElement("div");
      // simplest control: click the stage to toggle, plus label it for a11y
      devStage.setAttribute("role", "button");
      devStage.setAttribute("tabindex", "0");
      devStage.setAttribute("aria-label", "Toggle between computer and phone preview");
      var toggleDev = function () { devStage.classList.toggle("is-phone"); };
      devStage.addEventListener("click", toggleDev);
      devStage.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDev(); }
      });
    }

    /* Play the first (visible) panel once it scrolls into view */
    if ("IntersectionObserver" in window) {
      var played = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !played) {
            played = true;
            play($(".svc-panel:not([hidden])", root));
          }
        });
      }, { threshold: 0.15 });
      io.observe($("#panel-design .svc-stage"));
    } else {
      play($(".svc-panel:not([hidden])", root));
    }

    /* Redesign: drag-to-compare slider */
    var cmp = $(".cmp", root);
    if (cmp) {
      var range = $(".cmp__range", cmp);
      var after = $(".cmp__after", cmp);
      var line = $(".cmp__line", cmp);
      var grip = $(".cmp__grip", cmp);
      var update = function () {
        var v = range.value;
        after.style.clipPath = "inset(0 0 0 " + v + "%)";
        line.style.left = v + "%";
        grip.style.left = v + "%";
      };
      range.addEventListener("input", update);
      update();
    }
  }

  /* 6. WORK: computer/phone toggle for the NuTreats case study ------------ */
  function initCase() {
    var caseEl = $("[data-case]");
    if (!caseEl) return;
    var buttons = $$(".seg", caseEl);
    var device = $(".case__device", caseEl);
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        device.setAttribute("data-view", btn.getAttribute("data-view"));
      });
    });
  }

  /* 7. HOW WE THINK + HOW WE WORK: reveal on scroll ------------------------ */
  function initReveal() {
    var items = $$(".think__item");
    var steps = $$(".step");
    if (!items.length && !steps.length) return;

    if (!("IntersectionObserver" in window)) {
      items.concat(steps).forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3, rootMargin: "0px 0px -10% 0px" });

    items.forEach(function (el) { io.observe(el); });
    steps.forEach(function (el) { io.observe(el); });

    /* The line down the middle of the steps fills as you scroll past them */
    var wrap = $(".steps");
    if (wrap && hasGsap) {
      var fill = document.createElement("span");
      fill.className = "steps__fill";
      wrap.appendChild(fill);
      gsap.to(fill, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top 70%", end: "bottom 80%", scrub: 0.4 }
      });
    }
  }
  /* 4. SMALL INTERACTIONS ------------------------------------------------- */
  function initMagnetic() {
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasGsap || reduced || !canHover) return;

    $$("[data-magnetic]").forEach(function (btn) {
      var moveX = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      var moveY = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        moveX((e.clientX - (r.left + r.width / 2)) * 0.22);
        moveY((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      btn.addEventListener("pointerleave", function () { moveX(0); moveY(0); });
    });
  }

  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* GO ---------------------------------------------------------------------- */
  initNav();
  initHero();
  initServices();
  initCase();
  initReveal();
  initMagnetic();
  initYear();
})();
