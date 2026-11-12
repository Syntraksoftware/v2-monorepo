/* ============================================================
   SYNTRAK — Landing page behaviour
   Inline SVG icons · scroll reveals · count-up stats ·
   nav theme switching · recognition bar · how-it-works cards + gallery.
   Vanilla JS, no dependencies. Respects reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- inline stroke icons (single weight, outline only) ---------- */
  var ICONS = {
    radio: '<circle cx="12" cy="12" r="2"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4m8.4 0a6 6 0 0 1 0 8.4m2.9 2.9a10 10 0 0 0 0-14.2"/>',
    thermometer: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    partial: '<line x1="6" y1="12" x2="18" y2="12"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
  }
  document.querySelectorAll("[data-icon]").forEach(function (el) { el.innerHTML = svg(el.getAttribute("data-icon")); });
  document.querySelectorAll("[data-icon-check]").forEach(function (el) { el.insertAdjacentHTML("afterbegin", svg("check")); });

  /* ---------- scroll reveals — IntersectionObserver (reliable on iOS) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    // Fallback for very old browsers
    var checkReveals = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = revealEls.length - 1; i >= 0; i--) {
        var r = revealEls[i].getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          revealEls[i].classList.add("in");
          revealEls.splice(i, 1);
        }
      }
    };
    checkReveals();
    window.addEventListener("scroll", checkReveals, { passive: true });
    window.addEventListener("load", checkReveals);
    setTimeout(checkReveals, 300);
  }

  /* ---------- count-up stats — IntersectionObserver ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (reduce) { el.textContent = target.toFixed(dec); return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });
  } else {
    var counted = [];
    document.querySelectorAll("[data-count]").forEach(function (el) { counted.push(el); });
    var checkCounts = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = counted.length - 1; i >= 0; i--) {
        var r = counted[i].getBoundingClientRect();
        if (r.top < vh * 0.85 && r.bottom > 0) { animateCount(counted[i]); counted.splice(i, 1); }
      }
    };
    checkCounts();
    window.addEventListener("scroll", checkCounts, { passive: true });
    window.addEventListener("load", checkCounts);
  }

  /* ---------- nav: transparent over the hero -> frosted navy through the navy-to-sky run
     -> frosted light from the app card (step 3) on. Both switches are IntersectionObservers
     that watch a 1px line at the nav's bottom edge, so a class flips exactly when a section
     edge crosses it, in both scroll directions. ---------- */
  var nav = document.getElementById("nav");
  var hero = document.getElementById("hero");
  var lightStart = document.getElementById("hiw-gallery-wrap");   // first light section
  function navTick() {
    var nh = nav.offsetHeight;
    nav.classList.toggle("past-hero", (window.scrollY || window.pageYOffset) > 24 || hero.getBoundingClientRect().bottom <= nh);
    nav.classList.toggle("on-light", lightStart.getBoundingClientRect().top <= nh);
  }
  if (nav && hero && lightStart) {
    navTick();   // synchronous first, so a mid-page load never shows the wrong bar
    if ("IntersectionObserver" in window) {
      var navObs = [];
      var watchNav = function () {
        navObs.forEach(function (o) { o.disconnect(); }); navObs = [];
        // root = a 1px line at the nav's bottom edge; a section "intersects" while it spans that line
        var nh = nav.offsetHeight, below = Math.max(window.innerHeight - nh - 1, 0);
        [hero, lightStart].forEach(function (el) {
          var o = new IntersectionObserver(function () { navTick(); }, { rootMargin: "-" + nh + "px 0px -" + below + "px 0px", threshold: 0 });
          o.observe(el); navObs.push(o);
        });
      };
      watchNav();
      var navRaf = 0;
      window.addEventListener("scroll", function () { if (!navRaf) navRaf = requestAnimationFrame(function () { navRaf = 0; navTick(); }); }, { passive: true });
      var navResizeT;
      window.addEventListener("resize", function () { clearTimeout(navResizeT); navResizeT = setTimeout(function () { watchNav(); navTick(); }, 150); });
    } else {
      window.addEventListener("scroll", navTick, { passive: true });
    }
  }

  /* ---------- hero video parallax ---------- */
  var heroVideo = document.getElementById('hero-video');
  if (heroVideo && !reduce) {
    var heroParallax = function() {
      var y = window.scrollY || window.pageYOffset || 0;
      heroVideo.style.transform = 'translateY(' + (y * 0.3).toFixed(1) + 'px)';
    };
    heroParallax();
    window.addEventListener('scroll', heroParallax, { passive: true });
  }

  /* ---------- card 1: the thermal. Two views, one control ----------
     Fabric: the garment as worn, with a lens under the mouse that opens onto the sensor layer.
     Sensors: the sensor layer everywhere. The control works by mouse, touch and keyboard; on a device
     with no hover it starts on Sensors, so the layer is visible without any gesture. */
  (function () {
    var frame = document.getElementById("th-img-wrap");
    var top = document.getElementById("th-top");
    var cur = document.getElementById("th-cursor");
    var btns = Array.prototype.slice.call(document.querySelectorAll(".seg-btn"));
    if (!frame || !top) return;
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function setView(v) {
      frame.setAttribute("data-view", v);
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
      if (v !== "fabric") hideLens();
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { setView(b.getAttribute("data-view")); }); });
    setView(canHover ? "fabric" : "sensors");

    var R = 200;
    function setMask(x, y) {
      var s1 = Math.round(R * .55), s2 = Math.round(R * .72), s3 = Math.round(R * .92);
      var m = "radial-gradient(circle " + R + "px at " + x + "px " + y + "px, transparent 0%, transparent " + s1 + "px, rgba(0,0,0,.55) " + s2 + "px, black " + s3 + "px)";
      top.style.webkitMaskImage = m; top.style.maskImage = m;
      if (cur) { cur.style.left = x + "px"; cur.style.top = y + "px"; }
    }
    function hideLens() {
      setMask(-9999, -9999);
      if (cur) { cur.style.transform = "translate(-50%,-50%) scale(0)"; cur.style.opacity = "0"; }
    }
    frame.addEventListener("mousemove", function (e) {
      if (!canHover || frame.getAttribute("data-view") !== "fabric") return;
      var b = frame.getBoundingClientRect();
      setMask(e.clientX - b.left, e.clientY - b.top);
      if (cur) { cur.style.transform = "translate(-50%,-50%) scale(1)"; cur.style.opacity = "1"; }
    });
    frame.addEventListener("mouseleave", hideLens);
  })();

  /* ---------- shared helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function placeholderFor(src) {
    var d = document.createElement("div");
    d.className = "ph";
    d.innerHTML = "<span></span>";
    d.firstChild.textContent = src;
    return d;
  }
  // swap a broken <img> for the neutral placeholder (handles errors that fired before this ran)
  function guardImg(img, src, extraClass) {
    function swap() {
      if (!img.parentNode) return;
      var ph = placeholderFor(src);
      if (extraClass) ph.classList.add(extraClass);
      img.parentNode.replaceChild(ph, img);
    }
    img.addEventListener("error", swap);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap();
  }
  var navEl = document.getElementById("nav");
  function setNavH() { if (navEl) document.documentElement.style.setProperty("--nav-h", navEl.offsetHeight + "px"); }
  setNavH();
  window.addEventListener("resize", setNavH);

  /* ---------- recognition bar ---------- */
  (function () {
    var list = document.getElementById("rb-list");
    if (!list) return;
    var track = list.parentNode;
    var AWARDS = [
      { file: "cyberport",   org: "Cyberport",                      cap: "Cyberport Incubation Programme" },
      { file: "hkstp",       org: "HKSTP",                          cap: "Top 20 · HK Techathon+" },
      { file: "hkstp",       org: "HKSTP",                          cap: "Co-Ideation Programme · HKSTP" },
      { file: "ydc",         org: "Young Entrepreneurs Development Council", cap: "Gold Award · Dare to Change" },
      { file: "innobay",     org: "InnoBay",                        cap: "Youngest Startup Admittee · InnoBay" },
      { file: "usel",        org: "USEL",                           cap: "Gold Award · USEL Competition" },
      { file: "one-million", org: "HKUST-SINO One Million",         cap: "Silver + 2 Awards · HKUST-SINO One Million" },
      { file: "hkust-ec",    org: "HKUST Entrepreneurship Center",  cap: "Dream Builder Award · Entrepreneurship Center" },
      { file: "aspa",        org: "ASPA",                           cap: "Startup of the Month · ASPA" },
      { file: "hk-uni-iec",  org: "HK University Student I&E Competition", cap: "Top 12 Finalist · HK University Student I&E Competition" },
      { file: "hkgcc",       org: "HKGCC",                          cap: "Innovation, Creativity & Entrepreneurship Award · HKGCC" }
    ];
    /* TODO(press links): paste each outlet's article URL into href. An empty href means the logo is shown without a link
       (never a dead "#" link). Links open in a new tab with rel="noopener". */
    var PRESS = [
      { file: "wenweipo",     org: "文匯報",    href: "" },   // TODO: article URL, Wen Wei Po
      { file: "hkej",         org: "信報",      href: "" },   // TODO: article URL, Hong Kong Economic Journal
      { file: "singtao",      org: "星島頭條",  href: "" },   // TODO: article URL, Sing Tao Headline
      { file: "bastillepost", org: "巴士的報",  href: "" },   // TODO: article URL, Bastille Post
      { file: "capital",      org: "資本雜誌",  href: "" },   // TODO: article URL, Capital
      { file: "ejtech",       org: "EJ Tech",   href: "" },   // TODO: article URL, EJ Tech
      { file: "kinliu",       org: "堅料網",    href: "" },   // TODO: article URL, Kin Liu
      { file: "invest360",    org: "INVEST360", href: "" }    // TODO: article URL, INVEST360
    ];
    var pending = 0;
    window.__rbMissing = [];
    function logo(dir, item, alt) {
      var box = document.createElement("span");
      box.className = "rb-logo";
      var img = document.createElement("img");
      img.alt = alt; img.height = 36; img.decoding = "async";
      var exts = ["svg", "png"], k = 0;
      pending++;
      img.addEventListener("load", settle);
      img.addEventListener("error", function () {
        k++;
        if (k < exts.length) { img.src = dir + item.file + "." + exts[k]; return; }
        var t = document.createElement("span");
        t.className = "rb-fallback"; t.setAttribute("role", "img"); t.setAttribute("aria-label", alt);
        t.textContent = item.org;
        box.replaceChild(t, img);
        window.__rbMissing.push(dir + item.file + ".svg / .png");
        settle();
      });
      img.src = dir + item.file + "." + exts[0];
      box.appendChild(img);
      return box;
    }
    AWARDS.forEach(function (a) {
      var li = document.createElement("li"); li.className = "rb-item";
      li.appendChild(logo("assets/recognition/", a, a.org + ", " + a.cap.split(" · ")[0]));
      var cap = document.createElement("span"); cap.className = "rb-cap"; cap.setAttribute("aria-hidden", "true"); cap.textContent = a.cap;
      li.appendChild(cap); list.appendChild(li);
    });
    var div = document.createElement("li"); div.className = "rb-divider"; div.textContent = "In the press"; list.appendChild(div);
    PRESS.forEach(function (pr) {
      var li = document.createElement("li"); li.className = "rb-item rb-item--press";
      var box = logo("assets/recognition/press/", pr, pr.org + ", press coverage");
      if (pr.href) {
        var link = document.createElement("a");
        link.className = "rb-link"; link.href = pr.href; link.target = "_blank"; link.rel = "noopener";
        link.setAttribute("aria-label", pr.org + ", read the article (opens in a new tab)");
        link.appendChild(box); li.appendChild(link);
      } else { li.appendChild(box); }
      list.appendChild(li);
    });

    var cloned = false;
    function setDuration() {
      if (!cloned) return;
      var half = track.scrollWidth / 2;          // one copy incl. its trailing gap
      track.style.setProperty("--rb-dur", (half / 40).toFixed(2) + "s");   // ~40 px/s
    }
    function settle() {
      pending--;
      if (pending > 0 || cloned || reduce) return;
      var copy = list.cloneNode(true);
      copy.removeAttribute("id");
      copy.setAttribute("aria-hidden", "true");
      copy.querySelectorAll("a, button, [tabindex]").forEach(function (el) { el.setAttribute("tabindex", "-1"); });
      track.appendChild(copy);
      cloned = true;
      track.classList.add("is-running");
      setDuration();
    }
    var rbT;
    window.addEventListener("resize", function () { clearTimeout(rbT); rbT = setTimeout(setDuration, 150); });
  })();

  /* ---------- how it works: stacking cards + step-3 gallery ---------- */
  (function () {
    var section = document.getElementById("how-it-works");
    if (!section) return;
    var stack = document.getElementById("hiw-stack");
    var wraps = Array.prototype.slice.call(stack.querySelectorAll(".hiw-wrap"));
    var cards = wraps.map(function (w) { return w.querySelector(".hiw-card"); });
    var galWrap = document.getElementById("hiw-gallery-wrap");
    var card3 = document.getElementById("hiw-card-3");
    var restBox = card3.querySelector(".hiw-media--window");
    var strip = document.getElementById("gal-strip");
    var viewport = document.getElementById("gal-viewport");
    var countEl = document.getElementById("gal-count");
    var barFill = document.getElementById("gal-bar-fill");
    var dotsEl = document.getElementById("gal-dots");

    section.querySelectorAll(".hiw-img").forEach(function (img) { guardImg(img, img.getAttribute("data-placeholder"), "hiw-img"); });

    /* card 2: full-bleed video. Missing file -> placeholder; reduced motion -> no playback */
    section.querySelectorAll(".hiw-video").forEach(function (v) {
      var src = v.getAttribute("data-placeholder");
      var sources = v.querySelectorAll("source");
      function swap() { if (!v.parentNode) return; v.parentNode.replaceChild(placeholderFor(src), v); }
      if (sources.length) sources[sources.length - 1].addEventListener("error", swap);
      v.addEventListener("error", swap);
      if (v.networkState === 3) swap();             // NETWORK_NO_SOURCE: failed before this ran
      if (reduce) return;
      // play only while card 2 is on screen; start from the beginning the first time it arrives
      var started = false;
      function play() { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { if (!started) { started = true; try { v.currentTime = 0; } catch (e) {} } play(); }
          else v.pause();
        }, { threshold: 0.15 }).observe(v.closest(".hiw-card") || v);
      } else play();
    });

    /* gallery data: add, remove or reorder screenshots here only */
    var GALLERY = [
      { src: "assets/app/01-ski-index.webp",     title: "Score every run out of 100.",    body: "The Ski Index rates a run across legs, posture, coordination and rhythm, and lists the findings behind the number." },
      { src: "assets/app/02-3d-replay.webp",     title: "Replay every turn in 3D.",       body: "Watch a run from a chase, side, front or top camera, from quarter speed to 2x, with edge angle and knee flexion alongside." },
      { src: "assets/app/03-turn-library.webp",  title: "Search every turn in every run.", body: "Filter by direction and carved or glided, rank turns by edge against knee flex, and pin a model turn to copy." },
      { src: "assets/app/04-compare.webp",       title: "Compare two turns side by side.", body: "Set two turns or two runs next to each other, see what differs, and read a short verdict on why." }
    ];
    var N = GALLERY.length;
    section.style.setProperty("--gal-n", N);

    function windowFrame(item, eager) {
      var w = document.createElement("div");
      w.className = "win";
      w.innerHTML = '<div class="win-bar" aria-hidden="true"><span class="win-dot win-dot--r"></span><span class="win-dot win-dot--y"></span><span class="win-dot win-dot--g"></span><span class="win-title">Syntrak</span></div><div class="win-screen"></div>';
      var img = document.createElement("img");
      img.alt = "Syntrak desktop app: " + item.title.replace(/\.$/, "");
      img.width = 2000; img.height = 1250; img.decoding = "async";
      img.loading = eager ? "eager" : "lazy";
      img.src = item.src;
      w.lastChild.appendChild(img);
      guardImg(img, item.src);
      return w;
    }
    var items = GALLERY.map(function (g, i) {
      var li = document.createElement("li");
      li.className = "gal-item";
      li.setAttribute("aria-roledescription", "slide");
      li.setAttribute("aria-label", (i + 1) + " of " + N);
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "gal-frame";
      btn.setAttribute("aria-label", "Open screenshot full size: " + g.title);
      btn.appendChild(windowFrame(g, i === 0));
      btn.addEventListener("click", function () { openLightbox(i, btn); });
      var tx = document.createElement("div"); tx.className = "gal-text";
      tx.innerHTML = '<p class="gal-title"></p><p class="gal-body"></p>';
      tx.firstChild.textContent = g.title; tx.lastChild.textContent = g.body;
      li.appendChild(btn); li.appendChild(tx);
      strip.appendChild(li);
      // keyboard in pinned mode: bring the focused frame to the centre by scrolling the page
      btn.addEventListener("focus", function () {
        if (mode !== "pinned" || !btn.matches(":focus-visible")) return;
        var dist = galWrap.offsetHeight - window.innerHeight;
        var g2 = 0.2 + 0.8 * (N > 1 ? i / (N - 1) : 0);
        var top = galWrap.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, Math.round(top + g2 * dist));
      });
      return li;
    });
    var dots = GALLERY.map(function (g, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "gal-dot";
      b.setAttribute("aria-label", "Go to screenshot " + (i + 1) + ": " + g.title);
      b.addEventListener("click", function () { goTo(i); });
      dotsEl.appendChild(b);
      return b;
    });

    /* ----- lightbox ----- */
    var lb = document.getElementById("lightbox");
    var lbMedia = document.getElementById("lb-media");
    var opener = null;
    function openLightbox(i, from) {
      if (mode === "pinned" && from && Math.abs(i - lastC) > 0.5) { /* a neighbour was clicked: just open it */ }
      opener = from;
      lbMedia.innerHTML = "";
      lbMedia.appendChild(windowFrame(GALLERY[i], true));
      document.getElementById("lb-title").textContent = GALLERY[i].title;
      document.getElementById("lb-body").textContent = GALLERY[i].body;
      document.documentElement.classList.add("lb-open");
      if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    }
    document.getElementById("lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });   // click on backdrop
    lb.addEventListener("close", function () {
      document.documentElement.classList.remove("lb-open");
      if (opener) opener.focus({ preventScroll: true });
    });

    /* ----- carousel (phones) ----- */
    var activeSlide = 0;
    function goTo(i) {
      i = clamp(i, 0, N - 1);
      var it = items[i], vr = viewport.getBoundingClientRect(), ir = it.getBoundingClientRect();
      var left = viewport.scrollLeft + (ir.left - vr.left) - (vr.width - ir.width) / 2;
      viewport.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
    }
    document.getElementById("gal-prev").addEventListener("click", function () { goTo(activeSlide - 1); });
    document.getElementById("gal-next").addEventListener("click", function () { goTo(activeSlide + 1); });
    viewport.addEventListener("keydown", function (e) {
      if (mode !== "carousel") return;
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(activeSlide + 1); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(activeSlide - 1); }
    });
    var carT = false;
    viewport.addEventListener("scroll", function () {
      if (mode !== "carousel" || carT) return;
      carT = true;
      requestAnimationFrame(function () {
        carT = false;
        var vr = viewport.getBoundingClientRect(), mid = vr.left + vr.width / 2, best = 0, bd = 1e9;
        items.forEach(function (it, i) { var r = it.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
        setActiveDot(best);
      });
    }, { passive: true });
    function setActiveDot(i) {
      activeSlide = i;
      dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
      document.getElementById("gal-prev").disabled = i === 0;
      document.getElementById("gal-next").disabled = i === N - 1;
    }

    /* ----- modes ----- */
    var mode = "";
    var geo = null, lastC = 0;
    var card1Pinned = true;   // false on phones, where card 1 scrolls normally
    function getMode() { return reduce ? "grid" : (window.innerWidth < 768 ? "carousel" : "pinned"); }
    function resetInline() {
      cards.forEach(function (c) { ["--s", "--r", "--o", "--z", "--e"].forEach(function (k) { c.style.removeProperty(k); }); });
      items.forEach(function (it) { it.style.opacity = ""; it.style.transform = ""; it.style.visibility = ""; it.firstChild.style.transform = ""; it.lastChild.style.opacity = ""; });
      strip.style.removeProperty("--tx");
    }
    function measure() {
      if (mode !== "pinned") { geo = null; return; }
      var W = window.innerWidth, H = window.innerHeight, navH = navEl ? navEl.offsetHeight : 80;
      var fw = Math.min(0.62 * W, (H - navH - 96 - 110 - 56) * 1.5);
      card3.style.setProperty("--fw", Math.round(fw) + "px");
      card3.style.setProperty("--gap", Math.round(0.04 * W) + "px");
      // natural box of frame 1 (strip at rest, no FLIP) vs. the rest-state media box, both card-relative
      var f0 = items[0].firstChild;
      var prevT = f0.style.transform; f0.style.transform = "none";
      strip.style.setProperty("--tx", "0px");
      var cr = card3.getBoundingClientRect(), a = restBox.getBoundingClientRect(), b = f0.getBoundingClientRect();
      f0.style.transform = prevT;
      geo = { fx: a.left - b.left, fy: a.top - b.top, fs: a.width / b.width, step: Math.round(fw) + Math.round(0.04 * W) };
    }
    function applyMode() {
      var m = getMode();
      if (m !== mode) { mode = m; section.setAttribute("data-gal", mode); resetInline(); }
      viewport.setAttribute("tabindex", mode === "carousel" ? "0" : "-1");
      setNavH();
      card1Pinned = getComputedStyle(wraps[0]).position === "sticky";
      measure();
      if (mode === "carousel") setActiveDot(activeSlide);
      update();
    }

    /* ----- the one scroll handler ----- */
    function update() {
      if (mode === "grid") return;
      var H = window.innerHeight, small = window.innerWidth < 768;
      // ---- reads ----
      var sTop = stack.getBoundingClientRect().top;
      var land = galWrap.offsetTop;                         // card 3 lands when the stack has scrolled this far
      var wTops = wraps.map(function (w) { return w.getBoundingClientRect().top; });
      var gRect = mode === "pinned" ? galWrap.getBoundingClientRect() : null;
      var dist = mode === "pinned" ? galWrap.offsetHeight - H : 0;
      // ---- writes ----
      var p = clamp(-sTop / land, 0, 1);
      var k1 = card1Pinned ? easeInOut(p) : 0, k2 = easeInOut(clamp((p - 0.5) / 0.5, 0, 1));
      var mins = small ? [0.94, 0.97] : [0.90, 0.95];
      [k1, k2].forEach(function (k, i) {
        var c = cards[i];
        c.style.setProperty("--s", (1 - (1 - mins[i]) * k).toFixed(4));
        c.style.setProperty("--r", (24 * k).toFixed(1) + "px");
        c.style.setProperty("--o", (0.35 * k).toFixed(3));
      });
      wraps.forEach(function (w, i) {
        var q = clamp(1 - wTops[i] / H, 0, 1);
        cards[i].style.setProperty("--z", (1.15 - 0.15 * easeOutCubic(q)).toFixed(4));
      });
      if (mode !== "pinned" || !geo) return;
      var g = clamp(-gRect.top / dist, 0, 1);
      var e = easeInOut(clamp(g / 0.2, 0, 1));
      var t = clamp((g - 0.2) / 0.8, 0, 1);
      var c = t * (N - 1); lastC = c;
      card3.style.setProperty("--e", e.toFixed(4));
      strip.style.setProperty("--tx", (c * geo.step).toFixed(1) + "px");
      items.forEach(function (it, i) {
        var d = Math.min(Math.abs(i - c), 1);
        var op = (1 - 0.4 * d) * (i === 0 ? 1 : e);
        it.style.opacity = op.toFixed(3);
        it.style.visibility = op < 0.01 ? "hidden" : "";
        it.style.transform = "scale(" + (1 - 0.08 * d).toFixed(4) + ")";
        it.lastChild.style.opacity = e.toFixed(3);
      });
      var r = 1 - e;
      items[0].firstChild.style.transform = "translate(" + (geo.fx * r).toFixed(1) + "px," + (geo.fy * r).toFixed(1) + "px) scale(" + (1 + (geo.fs - 1) * r).toFixed(4) + ")";
      var idx = Math.round(c) + 1;
      countEl.textContent = (idx < 10 ? "0" : "") + idx + " / " + (N < 10 ? "0" : "") + N;
      barFill.style.transform = "scaleX(" + t.toFixed(4) + ")";
    }

    var active = false, ticking = false;
    function onScroll() {
      if (!active || ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        active = en[0].isIntersecting;
        if (active) update();
      }, { rootMargin: "100% 0px 100% 0px" }).observe(section);
    } else { active = true; }
    window.addEventListener("scroll", onScroll, { passive: true });
    var rT;
    window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(applyMode, 120); });
    window.addEventListener("load", applyMode);
    applyMode();
  })();

  /* ---------- comparison: right-edge fade until scrolled to the end ---------- */
  (function () {
    var sc = document.getElementById("cmp-scroll"), fr = document.getElementById("cmp-frame");
    if (!sc || !fr) return;
    function chk() { fr.classList.toggle("at-end", sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2); }
    sc.addEventListener("scroll", chk, { passive: true });
    window.addEventListener("resize", chk);
    chk();
  })();

  /* ---------- contact form (Formspree Ajax) ---------- */
  window.formspree = window.formspree || function () { (formspree.q = formspree.q || []).push(arguments); };
  formspree('initForm', { formElement: '#contact-form', formId: 'xaqgbqrd' });

  /* ── hero beams canvas ─────────────────────────────────────── */
  (function () {
    var cvs = document.getElementById('hero-beams');
    if (!cvs || reduce) return;
    var ctx = cvs.getContext('2d');
    var W = 0, H = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cvs.offsetWidth;
      H = cvs.offsetHeight;
      cvs.width  = Math.round(W * dpr);
      cvs.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* Beam definition — positions in normalised [0-1] x-space */
    var isMobile = window.innerWidth < 768;
    var N = isMobile ? 5 : 10;
    var beams = [];
    for (var i = 0; i < N; i++) {
      /* alternate powder-blue (#C1D7EB) and slate-blue (#5969AC) */
      var pb = (i % 2 === 0);
      beams.push({
        cx:    Math.random(),                       /* centre x (0-1) */
        w:     90 + Math.random() * 160,            /* half-width px   */
        tilt:  (Math.random() - 0.5) * 0.18,        /* shear factor    */
        drift: (Math.random() - 0.5) * 0.00004,     /* drift per frame */
        ph:    Math.random() * Math.PI * 2,
        spd:   0.006 + Math.random() * 0.008,
        peak:  pb ? (0.055 + Math.random() * 0.07)
                  : (0.04  + Math.random() * 0.055),
        r: pb ? 193 : 89,
        g: pb ? 215 : 105,
        b: pb ? 235 : 172
      });
    }

    var raf;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';

      for (var i = 0; i < beams.length; i++) {
        var bm = beams[i];
        bm.ph += bm.spd;
        bm.cx += bm.drift;
        if (bm.cx >  1.25) bm.cx = -0.25;
        if (bm.cx < -0.25) bm.cx =  1.25;

        var op = bm.peak * Math.abs(Math.sin(bm.ph));
        if (op < 0.003) continue;

        var x  = bm.cx * W;
        var hw = bm.w * 0.5;

        /* Horizontal bell-curve gradient (beam width) */
        var hg = ctx.createLinearGradient(x - hw, 0, x + hw, 0);
        hg.addColorStop(0,    'rgba('+bm.r+','+bm.g+','+bm.b+',0)');
        hg.addColorStop(0.35, 'rgba('+bm.r+','+bm.g+','+bm.b+','+(op*0.55)+')');
        hg.addColorStop(0.5,  'rgba('+bm.r+','+bm.g+','+bm.b+','+op+')');
        hg.addColorStop(0.65, 'rgba('+bm.r+','+bm.g+','+bm.b+','+(op*0.55)+')');
        hg.addColorStop(1,    'rgba('+bm.r+','+bm.g+','+bm.b+',0)');

        /* Apply slight diagonal shear via context transform */
        ctx.save();
        ctx.transform(1, 0, bm.tilt, 1, 0, 0);
        ctx.fillStyle = hg;
        ctx.fillRect(x - hw + bm.tilt * H * 0.5, 0, bm.w, H);
        ctx.restore();
      }

      /* Vertical vignette — fade beams at very top and bottom */
      ctx.globalCompositeOperation = 'destination-in';
      var vg = ctx.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0,    'rgba(0,0,0,0)');
      vg.addColorStop(0.10, 'rgba(0,0,0,1)');
      vg.addColorStop(0.88, 'rgba(0,0,0,1)');
      vg.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(tick);
    }

    resize();
    tick();
    window.addEventListener('resize', function () {
      resize();
    }, { passive: true });
  })();



})();