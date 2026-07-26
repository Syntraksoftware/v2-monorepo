/* ============================================================
   SYNTRAK — Landing page behaviour
   Inline SVG icons · scroll reveals · count-up stats ·
   nav theme switching · sticky edge-angle scroll sequence.
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
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
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

  /* ---------- nav: scrolled state + light/dark theme by section underneath ---------- */
  var nav = document.getElementById("nav");
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  function updateNav() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle("scrolled", y > 24);
  }
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });
  window.addEventListener("resize", updateNav);

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

  /* ---------- thermal reveal (hover mask on desktop, scroll on touch) ---------- */
  (function () {
    var section = document.getElementById("performance");
    var wrap = document.getElementById("th-img-wrap");
    var top = document.getElementById("th-top");
    var cur = document.getElementById("th-cursor");
    if (!section || !wrap || !top) return;

    var touchMq = window.matchMedia("(max-width: 768px)");

    /* Touch/mobile: fade the plain layer out when the image scrolls into view */
    if ("IntersectionObserver" in window) {
      var thObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && touchMq.matches) {
            section.classList.add("th-revealed");
            thObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.45 });
      thObs.observe(wrap);
    } else {
      section.classList.add("th-revealed");
    }

    /* Desktop: cursor-following mask */
    var R = 200;
    function setMask(x, y) {
      var s1 = Math.round(R * .55), s2 = Math.round(R * .72), s3 = Math.round(R * .92);
      var m = "radial-gradient(circle " + R + "px at " + x + "px " + y + "px, transparent 0%, transparent " + s1 + "px, rgba(0,0,0,.55) " + s2 + "px, black " + s3 + "px)";
      top.style.webkitMaskImage = m; top.style.maskImage = m;
      if (cur) { cur.style.left = x + "px"; cur.style.top = y + "px"; }
    }
    wrap.addEventListener("mousemove", function (e) {
      if (touchMq.matches) return;
      var b = wrap.getBoundingClientRect();
      setMask(e.clientX - b.left, e.clientY - b.top);
      if (cur) { cur.style.transform = "translate(-50%,-50%) scale(1)"; cur.style.opacity = "1"; }
    });
    wrap.addEventListener("mouseleave", function () {
      setMask(-9999, -9999);
      if (cur) { cur.style.transform = "translate(-50%,-50%) scale(0)"; cur.style.opacity = "0"; }
    });
  })();

  /* ---------- sticky edge-angle scroll sequence ---------- */
  var seq = document.getElementById("data-seq");
  if (seq) {
    var track = seq.querySelector(".track");
    var seqItems = Array.prototype.slice.call(seq.querySelectorAll(".seq-item"));
    var pathYou = document.getElementById("path-you");
    var pathTarget = document.getElementById("path-target");
    var marker = document.getElementById("marker");
    var roNum = document.getElementById("ro-num");
    var roDtext = document.getElementById("ro-dtext");
    var legendTarget = document.getElementById("legend-target");

    var youLen = pathYou.getTotalLength();
    pathYou.style.strokeDasharray = youLen;
    pathYou.style.strokeDashoffset = youLen;

    var DIRECTIVES = [
      "“Hold the edge longer through the fall line.”",
      "“You're carving 6° under target on the steep.”",
      "“Shift your weight forward to initiate the edge earlier.”"
    ];
    var PEAK = [42, 42, 48]; // readout peak per phase

    var lastPhase = -1;
    function setPhase(p) {
      if (p === lastPhase) return;
      lastPhase = p;
      seqItems.forEach(function (item, i) {
        item.classList.toggle("active", i === p);
        item.classList.toggle("done", i < p);
      });
      if (roDtext) roDtext.textContent = DIRECTIVES[p];
    }

    function onScroll() {
      var rect = seq.getBoundingClientRect();
      var total = track.offsetHeight - window.innerHeight;
      var prog = Math.min(Math.max(-rect.top / total, 0), 1); // 0..1 through the pinned track

      // draw "your" line across the full scroll
      pathYou.style.strokeDashoffset = youLen * (1 - prog);

      // marker rides along the path
      var pt = pathYou.getPointAtLength(youLen * prog);
      marker.setAttribute("cx", pt.x);
      marker.setAttribute("cy", pt.y);

      // three phases across the track
      var phase = prog < 0.34 ? 0 : prog < 0.68 ? 1 : 2;
      setPhase(phase);

      // target line + legend fade in during phase 1+
      var tgtOpacity = Math.min(Math.max((prog - 0.34) / 0.18, 0), 1);
      pathTarget.style.opacity = tgtOpacity;
      legendTarget.style.opacity = tgtOpacity;

      // readout counts with progress toward the phase peak
      var peak = PEAK[phase];
      roNum.textContent = Math.round(peak * prog);
    }

    var seqMq = window.matchMedia("(max-width: 767px)");

    // static end-state on mobile/reduced-motion: all items visible, line fully drawn
    function seqStatic() {
      pathYou.style.strokeDashoffset = 0;
      pathTarget.style.opacity = 1;
      legendTarget.style.opacity = 1;
      seqItems.forEach(function (item, i) {
        item.classList.toggle("done", i < seqItems.length - 1);
        item.classList.toggle("active", i === seqItems.length - 1);
      });
      var end = pathYou.getPointAtLength(youLen);
      marker.setAttribute("cx", end.x);
      marker.setAttribute("cy", end.y);
      if (roNum) roNum.textContent = 48;
      if (roDtext) roDtext.textContent = DIRECTIVES[2];
      lastPhase = 2;
    }

    if (reduce) {
      seqStatic();
    } else {
      var ticking = false;
      window.addEventListener("scroll", function () {
        // mobile CSS unpins the track, so the desktop progress math is invalid there
        if (seqMq.matches) return;
        if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
      }, { passive: true });

      function applySeqMode() {
        if (seqMq.matches) { seqStatic(); }
        else { lastPhase = -1; onScroll(); }
      }
      if (seqMq.addEventListener) seqMq.addEventListener("change", applySeqMode);
      else if (seqMq.addListener) seqMq.addListener(applySeqMode); // older Safari
      applySeqMode();
    }
  }

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