/* Vatsal Doshi — portfolio interactions
   Lenis smooth scroll + GSAP ScrollTrigger. Everything degrades gracefully. */

document.documentElement.classList.add("js");

const prefersReduced =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(location.search).has("noanim");
const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!prefersReduced && typeof Lenis !== "undefined") {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  window.__lenis = lenis;
  // native smooth-scroll fights Lenis's per-frame scrollTop writes
  document.documentElement.style.scrollBehavior = "auto";
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  // anchor links through lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -60 });
      }
    });
  });
}

/* ---------- char splitting (hero + email) ---------- */
document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.textContent = "";
  [...text].forEach((ch) => {
    const s = document.createElement("span");
    s.className = "char";
    s.textContent = ch;
    el.appendChild(s);
  });
});

/* ---------- gsap animations ---------- */
if (hasGsap && !prefersReduced) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on("scroll", ScrollTrigger.update);

  /* hero load sequence */
  gsap.set("[data-load]", { opacity: 0, y: 24 });
  gsap.set(".hero__word .char", { yPercent: 110 });

  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  intro
    .to('[data-load="1"]', { opacity: 1, y: 0, duration: 0.7 }, 0.15)
    .to(".hero__word .char", {
      yPercent: 0,
      duration: 1.1,
      stagger: 0.045,
      ease: "power4.out",
    }, 0.3)
    .to('[data-load="2"]', { opacity: 1, y: 0, duration: 0.7 }, 0.9)
    .to('[data-load="3"]', { opacity: 1, y: 0, duration: 0.7 }, 1.05);

  /* hero parallax out */
  gsap.to(".hero__title", {
    yPercent: -18,
    opacity: 0.25,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* scroll progress bar */
  gsap.to(".progress", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });

  /* generic reveals */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
  });

  /* big section numbers drift */
  document.querySelectorAll(".section__num").forEach((el) => {
    gsap.fromTo(el, { x: -16 }, {
      x: 0, ease: "none",
      scrollTrigger: { trigger: el, start: "top 95%", end: "top 40%", scrub: true },
    });
  });

  /* stat count-ups */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix ? el.dataset.prefix.replace("&lt;", "<") : "";
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    el.textContent = prefix + "0" + suffix;
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate() {
        el.textContent = prefix + Math.round(obj.v) + suffix;
      },
    });
  });
} else {
  /* no-JS-animation fallback: make everything visible */
  document.querySelectorAll("[data-reveal], [data-load]").forEach((el) => {
    el.style.opacity = 1;
    el.style.transform = "none";
  });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const prefix = el.dataset.prefix ? el.dataset.prefix.replace("&lt;", "<") : "";
    el.textContent = prefix + el.dataset.count + (el.dataset.suffix || "");
  });
}

/* ---------- nav state ---------- */
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
}, { passive: true });

/* ---------- cursor + hero spotlight ---------- */
const cursor = document.querySelector(".cursor");
const hero = document.querySelector(".hero");
const spot = document.querySelector(".hero__spot");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let cx = -100, cy = -100, tx = -100, ty = -100;
  let sx = 0, sy = 0, stx = 0, sty = 0;
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add("is-active");
    if (hero && spot) {
      const r = hero.getBoundingClientRect();
      stx = e.clientX - r.left;
      sty = e.clientY - r.top;
    }
  }, { passive: true });
  (function moveCursor() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx - 14}px, ${cy - 14}px, 0)`;
    if (spot) {
      sx += (stx - sx) * 0.08;
      sy += (sty - sy) * 0.08;
      if (stx || sty) spot.style.transform = `translate3d(${sx - 550}px, ${sy - 550}px, 0)`;
    }
    requestAnimationFrame(moveCursor);
  })();
  document.querySelectorAll("a, .work__item, .stat").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

/* ---------- chicago clock ---------- */
const timeEl = document.getElementById("localtime");
function tick() {
  const t = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  timeEl.textContent = `CHICAGO ${t}`;
}
if (timeEl) { tick(); setInterval(tick, 30000); }

/* ---------- interactive dot grid (hero) ---------- */
(function initDotGrid() {
  const canvas = document.getElementById("dotgrid");
  if (!canvas || prefersReduced) return; // static CSS grid stays as fallback
  const heroEl = document.querySelector(".hero");
  heroEl.classList.add("hero--canvas");
  const ctx = canvas.getContext("2d");
  const GAP = 34, RADIUS = 90;
  let dots = [], W = 0, H = 0;

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = heroEl.clientWidth; H = heroEl.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let x = GAP / 2; x < W; x += GAP)
      for (let y = GAP / 2; y < H; y += GAP)
        dots.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0 });
  }
  build();
  window.addEventListener("resize", build);

  let mx = -1e4, my = -1e4;
  heroEl.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  }, { passive: true });
  heroEl.addEventListener("mouseleave", () => { mx = -1e4; my = -1e4; });

  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(heroEl);

  const t0 = performance.now();
  const rippleCx = () => W * 0.32, rippleCy = () => H * 0.45;

  (function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const t = (now - t0) / 1000;
    const rippleR = t < 1.8 ? (t / 1.8) * Math.hypot(W, H) * 0.72 : -1;

    for (const d of dots) {
      const px = d.x + d.ox, py = d.y + d.oy;
      const dx = px - mx, dy = py - my;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS && dist > 0.01) {
        const f = (1 - dist / RADIUS) * 3.0;
        d.vx += (dx / dist) * f;
        d.vy += (dy / dist) * f;
      }
      if (rippleR > 0) {
        const dc = Math.hypot(d.x - rippleCx(), d.y - rippleCy());
        if (Math.abs(dc - rippleR) < 28) {
          const a = Math.atan2(d.y - rippleCy(), d.x - rippleCx());
          d.vx += Math.cos(a) * 1.2;
          d.vy += Math.sin(a) * 1.2;
        }
      }
      d.vx += -d.ox * 0.06; d.vy += -d.oy * 0.06; // spring home
      d.vx *= 0.86; d.vy *= 0.86;                 // damping
      d.ox += d.vx; d.oy += d.vy;

      const disp = Math.hypot(d.ox, d.oy);
      const near = dist < RADIUS * 1.5 ? 1 - dist / (RADIUS * 1.5) : 0;
      const glow = Math.min(1, near * 0.9 + disp * 0.05);
      if (glow > 0.08) {
        const s = 1.6 + glow * 1.8;
        ctx.fillStyle = `rgba(185,255,44,${0.06 + glow * 0.3})`;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      } else {
        ctx.fillStyle = "rgba(237,237,240,0.07)";
        ctx.fillRect(px - 0.75, py - 0.75, 1.5, 1.5);
      }
    }
  })(t0);
})();

/* ---------- terminal ---------- */
(function initTerminal() {
  const term = document.getElementById("term");
  const out = document.getElementById("termOut");
  const form = document.getElementById("termForm");
  const input = document.getElementById("termInput");
  if (!term || !out || !form || !input) return;

  const MOVIES = [
    "Blade Runner 2049 — an AI that cites its sources. relatable.",
    "Moneyball — the original 'proof, not adjectives'.",
    "The Social Network — required viewing for anyone shipping at a startup.",
    "Spirited Away — palate cleanser between debugging sessions.",
    "Whiplash — for deadline season. not quite my tempo.",
    "Arrival — the best movie ever made about schema mapping.",
  ];

  const print = (text, cls) => {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.innerHTML = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  };

  const COMMANDS = {
    help: () => print(
      "available commands:\n" +
      "  <span class='term__line--accent'>about</span>       who is this guy\n" +
      "  <span class='term__line--accent'>work</span>        the projects\n" +
      "  <span class='term__line--accent'>experience</span>  the day jobs\n" +
      "  <span class='term__line--accent'>stack</span>       tools i reach for\n" +
      "  <span class='term__line--accent'>movie</span>       marquee picks you a film\n" +
      "  <span class='term__line--accent'>contact</span>     get in touch\n" +
      "  <span class='term__line--accent'>clear</span> / <span class='term__line--accent'>exit</span>\n" +
      "<span class='term__line--dim'>(there may be hidden commands.)</span>"
    ),
    about: () => print("vatsal doshi — ai engineer & data analyst.\nbuilds LLM/RAG systems and the analytics that prove they work.\nchicago, il. currently @ connyct. the AI proposes; deterministic code executes."),
    work: () => print(
      "switchboard   — ai data-migration copilot. days → <3 min.\n" +
      "coldopen      — url → tailored sales demo in ~37s.\n" +
      "marquee       — movies+tv tracker with an ai taste engine.\n" +
      "partner-docs  — rag assistant for elastic. 90→95%+ citations."
    ),
    experience: () => print(
      "2026—now  ai engineer @ connyct (rec engine, 50K+ daily queries)\n" +
      "2025      ai engineer @ elastic capstone, umd (hybrid rag)\n" +
      "2025      data analyst intern @ tech turn up (analytics from scratch)"
    ),
    stack: () => print("sql · python/pandas · tableau · langchain · chromadb · hybrid search (bm25+vector) · gcp · flask · react"),
    movie: () => print("<span class='term__line--accent'>marquee recommends:</span> " + MOVIES[Math.floor(Math.random() * MOVIES.length)]),
    contact: () => print(
      "email:    <a href='mailto:vatsal.doshi.cs@gmail.com'>vatsal.doshi.cs@gmail.com</a>\n" +
      "linkedin: <a href='https://www.linkedin.com/in/vatsal-doshi-' target='_blank' rel='noopener'>linkedin.com/in/vatsal-doshi-</a>\n" +
      "github:   <a href='https://github.com/ScriptedShadows' target='_blank' rel='noopener'>github.com/ScriptedShadows</a>"
    ),
    whoami: () => print("vatsal doshi. or, if you're a background-check vendor: yes, it's all true."),
    ls: () => print("proof/  about/  experience/  work/  contact/  <span class='term__line--dim'>taste.db</span>"),
    clear: () => { out.innerHTML = ""; },
    exit: () => close(),
    "sudo hire-vatsal": () => print("<span class='term__line--accent'>permission granted.</span> drafting offer letter... done.\nemail <a href='mailto:vatsal.doshi.cs@gmail.com'>vatsal.doshi.cs@gmail.com</a> to complete the transaction."),
    hire: () => print("usage: hire --reasons", "term__line--dim"),
    "hire --reasons": () => print(
      "1. ships — four products in eighteen months, all demoable\n" +
      "2. measures — every claim on this site has a number behind it\n" +
      "3. translates — consultant's questions, engineer's hands\n" +
      "4. see also: '<span class='term__line--accent'>sudo hire-vatsal</span>'"
    ),
    pwd: () => print("/users/vatsal/chicago"),
    vim: () => print("opening vim... you are now trapped.\ntype '<span class='term__line--accent'>exit</span>' like everyone else."),
    coffee: () => {
      const div = document.createElement("div");
      out.appendChild(div);
      const stages = [
        "brewing [░░░░░░░░░░]",
        "brewing [▓▓▓▓░░░░░░]",
        "brewing [▓▓▓▓▓▓▓▓░░]",
        "brewing [▓▓▓▓▓▓▓▓▓▓] done. back to shipping.",
      ];
      let i = 0;
      (function step() {
        div.textContent = stages[i];
        out.scrollTop = out.scrollHeight;
        if (++i < stages.length) setTimeout(step, 350);
      })();
    },
  };

  let history = [], hIdx = -1;

  function open() {
    term.hidden = false;
    if (!out.childElementCount) {
      print("vatsal.doshi terminal <span class='term__line--dim'>v2.6</span>", "");
      print("type '<span class='term__line--accent'>help</span>' to look around.", "term__line--dim");
    }
    input.focus();
  }
  function close() { term.hidden = true; }

  document.getElementById("termHint").addEventListener("click", open);
  document.getElementById("termClose").addEventListener("click", close);
  const footerEgg = document.getElementById("footerEgg");
  if (footerEgg) footerEgg.addEventListener("click", open);
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && term.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); open();
    } else if (e.key === "Escape" && !term.hidden) close();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); if (history.length) { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx]; } }
    if (e.key === "ArrowDown") { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ""; }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    history.push(raw); hIdx = history.length;
    print("<span class='term__line--dim'>➜  " + raw.replace(/</g, "&lt;") + "</span>");
    const cmd = raw.toLowerCase();
    if (COMMANDS[cmd]) COMMANDS[cmd]();
    else if (/^rm(\s|$)/.test(cmd)) print("nice try. this portfolio ships with a rollback plan. <span class='term__line--dim'>(see: switchboard.)</span>");
    else if (/^cat\s+taste\.db$/.test(cmd)) print("taste.db is a binary file. try '<span class='term__line--accent'>movie</span>' for a human-readable sample.");
    else if (/^cat(\s|$)/.test(cmd)) print("cat: no such file or directory. try 'ls'.", "term__line--dim");
    else if (/^sudo(\s|$)/.test(cmd)) print("sudo: permission denied. unless... try '<span class='term__line--accent'>sudo hire-vatsal</span>'.");
    else if (/^(email|mail)(\s|$)/.test(cmd)) {
      const addr = "vatsal.doshi.cs@gmail.com";
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).catch(() => {});
      print("<a href='mailto:" + addr + "'>" + addr + "</a> — <span class='term__line--accent'>copied to clipboard.</span>\nalso nudging your mail app... <span class='term__line--dim'>(if nothing opens, you've got the address.)</span>");
      window.location.href = "mailto:" + addr + "?subject=re%3A%20completing%20the%20transaction";
    }
    else if (/^echo\s+/.test(cmd)) print(raw.slice(5).replace(/</g, "&lt;"));
    else print("command not found: " + cmd.replace(/</g, "&lt;") + " — try '<span class='term__line--accent'>help</span>'", "term__line--dim");
    input.value = "";
  });
})();

/* ---------- particle name (hero centerpiece) ---------- */
(function initParticleName() {
  if (prefersReduced) return;
  const heroEl = document.querySelector(".hero");
  const title = document.querySelector(".hero__title");
  const words = document.querySelectorAll(".hero__word");
  if (!heroEl || !title || words.length < 2) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero__pcanvas";
  canvas.setAttribute("aria-hidden", "true");
  heroEl.appendChild(canvas);
  document.documentElement.classList.add("particles-on");

  const ctx = canvas.getContext("2d");
  const COLORS = ["rgba(237,237,240,0.92)", "rgba(185,255,44,0.92)"];
  let parts = [[], []], W = 0, H = 0, T0 = performance.now();

  function sample() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const heroRect = heroEl.getBoundingClientRect();
    W = heroEl.clientWidth; H = heroEl.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d", { willReadFrequently: true });
    const fs = parseFloat(getComputedStyle(title).fontSize);
    octx.font = `700 ${fs}px "Space Grotesk", sans-serif`;
    octx.fillStyle = "#fff";
    try { octx.letterSpacing = (-0.03 * fs) + "px"; } catch (e) {}

    words.forEach((w) => {
      const r = w.getBoundingClientRect();
      const text = w.textContent;
      const m = octx.measureText(text);
      const ascent = m.actualBoundingBoxAscent || fs * 0.73;
      const scaleX = m.width > 0 ? r.width / m.width : 1;
      octx.save();
      octx.translate(r.left - heroRect.left, r.top - heroRect.top + ascent);
      octx.scale(scaleX, 1);
      octx.fillText(text, 0, 0);
      octx.restore();
    });

    const data = octx.getImageData(0, 0, W, H).data;
    const countAt = (s) => {
      let c = 0;
      for (let y = 0; y < H; y += s)
        for (let x = 0; x < W; x += s)
          if (data[(y * W + x) * 4 + 3] > 128) c++;
      return c;
    };
    let step = 3;
    while (countAt(step) > 6000 && step < 9) step++;

    const lineSplit = words[0].getBoundingClientRect().bottom - heroRect.top;
    parts = [[], []];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (data[(y * W + x) * 4 + 3] > 128) {
          const sx = Math.random() * W, sy = Math.random() * H;
          parts[y > lineSplit ? 1 : 0].push({
            hx: x, hy: y, x: sx, y: sy, sx, sy, vx: 0, vy: 0,
            d: Math.random() * 0.5 + (x / W) * 0.6,
          });
        }
    T0 = performance.now();
  }

  let mx = -1e4, my = -1e4;
  window.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  }, { passive: true });
  heroEl.addEventListener("mouseleave", () => { mx = -1e4; my = -1e4; });

  let running = true;
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(heroEl);

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const INTRO = 1.1, REPEL = 100, REPEL2 = REPEL * REPEL;

  (function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const t = (now - T0) / 1000;
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = COLORS[c];
      for (const p of parts[c]) {
        if (t < p.d + INTRO) {
          const k = t <= p.d ? 0 : easeOut((t - p.d) / INTRO);
          p.x = p.sx + (p.hx - p.sx) * k;
          p.y = p.sy + (p.hy - p.sy) * k;
        } else {
          const dx = p.x - mx, dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL2 && d2 > 0.01) {
            const dist = Math.sqrt(d2);
            const f = (1 - dist / REPEL) * 7;
            p.vx += (dx / dist) * f;
            p.vy += (dy / dist) * f;
          }
          p.vx += (p.hx - p.x) * 0.06;
          p.vy += (p.hy - p.y) * 0.06;
          p.vx *= 0.82; p.vy *= 0.82;
          p.x += p.vx; p.y += p.vy;
        }
        ctx.fillRect(p.x - 1.1, p.y - 1.1, 2.2, 2.2);
      }
    }
  })(T0);

  let rto;
  window.addEventListener("resize", () => { clearTimeout(rto); rto = setTimeout(sample, 200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sample);
  else sample();
})();

/* ---------- skill ball pit (Matter.js) ---------- */
(function initSkillPit() {
  const pit = document.getElementById("pit");
  if (!pit || prefersReduced || typeof Matter === "undefined") return;
  document.documentElement.classList.add("pit-on");

  const ITEMS = [
    ["SQL", "data"], ["PYTHON / PANDAS", "data"], ["TABLEAU", "data"], ["POWER BI", "data"],
    ["A/B TESTING", "data"], ["GCP / BIGQUERY", "data"], ["REGRESSION", "data"],
    ["RAG", "ai"], ["LLM EVALS", "ai"], ["PROMPT ENGINEERING", "ai"], ["LANGCHAIN", "ai"],
    ["LANGGRAPH", "ai"], ["CHROMADB", "ai"], ["HYBRID SEARCH", "ai"], ["STRUCTURED OUTPUTS", "ai"],
    ["FINE-TUNING (LORA)", "ai"], ["MCP", "ai"], ["REC SYSTEMS", "ai"],
    ["FASTAPI / FLASK", "eng"], ["REACT", "eng"], ["DOCKER", "eng"], ["CI/CD", "eng"], ["GIT", "eng"],
    ["CINEPHILE", "hobby"], ["FORMULA 1", "hobby"], ["TRAVEL", "hobby"],
    ["ROLLER COASTERS", "hobby"], ["BOBA", "hobby"],
  ];

  const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter;
  let started = false;

  function start() {
    if (started) return;
    started = true;
    const W = pit.clientWidth, H = pit.clientHeight;
    const engine = Engine.create();
    engine.gravity.y = 1.1;

    const wallOpts = { isStatic: true, restitution: 0.4 };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + 30, W + 200, 60, wallOpts),      // floor
      Bodies.rectangle(-30, H / 2, 60, H * 4, wallOpts),           // left
      Bodies.rectangle(W + 30, H / 2, 60, H * 4, wallOpts),        // right
      Bodies.rectangle(W / 2, -1900, W + 200, 60, wallOpts),       // ceiling far above the spawn column
    ]);

    const balls = [];
    ITEMS.forEach(([label, kind], i) => {
      const el = document.createElement("span");
      el.className = "pit__ball pit__ball--" + kind;
      el.textContent = label;
      pit.appendChild(el);
      let bw, bh, body;
      const x = 60 + ((i * 137) % Math.max(60, W - 180));
      const y = -80 - i * 64;
      const opts = { restitution: 0.35, friction: 0.25, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.5 };
      if (kind === "hobby") {
        // shiyunlu-style orb: a real circle, sized to its label
        const d = Math.max(el.offsetWidth * 0.78, 76);
        el.style.width = el.style.height = d + "px";
        bw = bh = d;
        body = Bodies.circle(x, y, d / 2, { ...opts, restitution: 0.55 });
      } else {
        bw = el.offsetWidth; bh = el.offsetHeight;
        body = Bodies.rectangle(x, y, bw, bh, { ...opts, chamfer: { radius: bh / 2 } });
      }
      Composite.add(engine.world, body);
      balls.push({ el, body, bw, bh });
    });

    const mouse = Mouse.create(pit);
    const mc = MouseConstraint.create(engine, {
      mouse, constraint: { stiffness: 0.15, damping: 0.1, render: { visible: false } },
    });
    Composite.add(engine.world, mc);
    // Matter's mouse hijacks wheel + touch scroll — give scrolling back to the page
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    mouse.element.removeEventListener("touchstart", mouse.mousedown);
    mouse.element.removeEventListener("touchmove", mouse.mousemove);
    mouse.element.removeEventListener("touchend", mouse.mouseup);

    Runner.run(Runner.create(), engine);
    (function sync() {
      requestAnimationFrame(sync);
      for (const b of balls) {
        const { x, y } = b.body.position;
        b.el.style.transform =
          `translate(${x - b.bw / 2}px, ${y - b.bh / 2}px) rotate(${b.body.angle}rad)`;
        // rescue escapees
        if (y > H + 300) {
          Body.setPosition(b.body, { x: 80 + Math.random() * (W - 160), y: -60 });
          Body.setVelocity(b.body, { x: 0, y: 0 });
        }
      }
    })();
  }

  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) start();
  }, { threshold: 0.3 }).observe(pit);
})();

/* ---------- taste test ---------- */
(function initTasteTest() {
  const gate = document.getElementById("tasteGate");
  const cta = document.getElementById("tasteCta");
  const board = document.getElementById("tasteBoard");
  const opts = document.getElementById("tasteOptions");
  const out = document.getElementById("tasteResult");
  const posterEl = document.getElementById("tastePoster");
  const shuffle = document.getElementById("tasteShuffle");
  if (!gate || !board || !opts || !out) return;

  // [title, poster, recTitle, recPoster, read]
  const POOL = [
    ["BLADE RUNNER 2049","blade-runner-2049","ARRIVAL","arrival","you want sci-fi that aches, not explodes. (and Dark, if you have 26 hours.)"],
    ["WHIPLASH","whiplash","THE BEAR S1","the-bear","same tempo, swap drumsticks for knives. not quite my tempo either."],
    ["SPIRITED AWAY","spirited-away","THE BOY AND THE HERON","boy-heron","and if you've finished Ghibli: Wolf Children. bring tissues."],
    ["THE SOCIAL NETWORK","social-network","MONEYBALL","moneyball","talky, numbers-drunk, quietly ruthless. proof, not adjectives: the movie."],
    ["INTERSTELLAR","interstellar","CONTACT","contact","faith vs math, twenty years earlier. same tears, more radio."],
    ["PARASITE","parasite","SHOPLIFTERS","shoplifters","the gentler knife. class warfare where nobody raises their voice."],
    ["OPPENHEIMER","oppenheimer","THE LIVES OF OTHERS","lives-of-others","men crushed by the machines they built. quieter bomb, same fallout."],
    ["DUNE: PART TWO","dune-2","LAWRENCE OF ARABIA","lawrence-of-arabia","the desert epic Villeneuve keeps quoting. see it huge or not at all."],
    ["THE DARK KNIGHT","dark-knight","HEAT","heat","the DNA. the diner scene is the interrogation scene."],
    ["INCEPTION","inception","PAPRIKA","paprika","the dream heist, animated, four years earlier."],
    ["PULP FICTION","pulp-fiction","JACKIE BROWN","jackie-brown","QT's most grown-up film and his least logged. fix that."],
    ["FIGHT CLUB","fight-club","AMERICAN PSYCHO","american-psycho","unreliable men, reliable satire. you already quote both wrong."],
    ["THE SHAWSHANK REDEMPTION","shawshank","A PROPHET","a-prophet","prison, but France, but colder. hope optional."],
    ["GOODFELLAS","goodfellas","UNCUT GEMS","uncut-gems","the last 20 minutes of Goodfellas, stretched to feature length."],
    ["THE GODFATHER","godfather","THE CONFORMIST","the-conformist","where the look of every gangster film you love was invented."],
    ["LA LA LAND","la-la-land","THE UMBRELLAS OF CHERBOURG","umbrellas-cherbourg","the technicolor heartbreak Chazelle is covering. all sung, all devastating."],
    ["EVERYTHING EVERYWHERE ALL AT ONCE","eeaao","SWISS ARMY MAN","swiss-army-man","same lunatics, weirder corpse. commit."],
    ["HER","her","PAST LIVES","past-lives","longing, minus the operating system. somehow lonelier."],
    ["MAD MAX: FURY ROAD","fury-road","SORCERER","sorcerer","trucks, nitroglycerin, zero irony. the original white-knuckle."],
    ["NO COUNTRY FOR OLD MEN","no-country","SICARIO","sicario","the border again, scored by pure dread. Villeneuve heard the silence and raised it."],
    ["GET OUT","get-out","THE INVITATION","the-invitation","another dinner party you should have left an hour ago."],
    ["HEREDITARY","hereditary","THE WAILING","the-wailing","grief horror, Korean, longer, worse. (complimentary.)"],
    ["THE GRAND BUDAPEST HOTEL","grand-budapest","PLAYTIME","playtime","Wes's whole grid was invented by Tati in 1967. see the blueprint."],
    ["KNIVES OUT","knives-out","THE LAST OF SHEILA","last-of-sheila","the puzzle box Rian Johnson keeps citing in interviews. written by Sondheim, yes that one."],
    ["DRIVE","drive","THIEF","thief","Mann's neon original. the jacket is a lineage."],
    ["THE TRUMAN SHOW","truman-show","PLEASANTVILLE","pleasantville","the same year, the same cage, in color. criminally underlogged."],
    ["GONE GIRL","gone-girl","PRISONERS","prisoners","the other great 2010s missing-person nightmare. bring a flashlight."],
    ["12 ANGRY MEN","twelve-angry-men","ANATOMY OF A FALL","anatomy-of-a-fall","the jury is you now. verdict optional, doubt guaranteed."],
    ["CASINO ROYALE","casino-royale","MISSION: IMPOSSIBLE — FALLOUT","mi-fallout","the other best action film of the century. the bathroom fight says hi."],
    ["INTO THE SPIDER-VERSE","spider-verse","THE MITCHELLS VS. THE MACHINES","mitchells-machines","same brushes, family chaos. the dog is a good boy."],
    ["TOY STORY 3","toy-story-3","PADDINGTON 2","paddington-2","engineered joy, zero cynicism. the sequel that shouldn't work and does."],
    ["THE SILENCE OF THE LAMBS","silence-lambs","ZODIAC","zodiac","procedural dread perfected. nobody gets caught, everybody's ruined."],
    ["SE7EN","se7en","MEMORIES OF MURDER","memories-of-murder","the ending Fincher wishes he wrote. Bong got there first."],
    ["ETERNAL SUNSHINE","eternal-sunshine","SYNECDOCHE, NEW YORK","synecdoche","Kaufman with the safety off. bring a helmet and a will to live."],
    ["GOOD WILL HUNTING","good-will-hunting","DEAD POETS SOCIETY","dead-poets","the other Williams masterclass. it's not your fault you haven't logged it."],
    ["RATATOUILLE","ratatouille","CHEF","chef","the same food-joy, live action, more tacos. anyone can cook."],
    ["THE WOLF OF WALL STREET","wolf-wall-street","THE BIG SHORT","big-short","the hangover after the party. same money, funnier math."],
    ["AMÉLIE","amelie","PATERSON","paterson","small joys, catalogued daily. a bus driver instead of a waitress."],
    ["COCO","coco","KUBO AND THE TWO STRINGS","kubo","family, memory, strings. stop-motion that shouldn't be possible."],
    ["TITANIC","titanic","PORTRAIT OF A LADY ON FIRE","portrait-lady-fire","doomed romance, better painting. the last shot outlives you."],
  ];
  const OUTRO = ' <span class="dim">— hardcoded party trick; the real engine reads your whole diary.</span> <a href="https://github.com/ScriptedShadows/marquee" target="_blank" rel="noopener">VIA MARQUEE ↗</a>';

  let hand = [], timer = null;

  function deal() {
    clearInterval(timer);
    if (posterEl) posterEl.hidden = true;
    out.innerHTML = '<span class="dim">four films, one diagnosis. choose.</span>';
    const idx = new Set();
    while (idx.size < 4) idx.add(Math.floor(Math.random() * POOL.length));
    hand = [...idx];
    opts.innerHTML = "";
    hand.forEach((poolIdx, i) => {
      const [title, poster] = POOL[poolIdx];
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.pick = i;
      b.innerHTML = `<img src="assets/posters/${poster}.jpg" alt="${title}" loading="lazy"><span class="mono">${title}</span>`;
      opts.appendChild(b);
    });
  }

  cta.addEventListener("click", () => {
    gate.hidden = true;
    board.hidden = false;
    deal();
  });
  if (shuffle) shuffle.addEventListener("click", deal);

  opts.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-pick]");
    if (!btn) return;
    opts.querySelectorAll("button").forEach((b) => b.classList.remove("is-picked"));
    btn.classList.add("is-picked");
    const [, , recT, recP, read] = POOL[hand[+btn.dataset.pick]];
    if (posterEl) {
      posterEl.src = `assets/posters/${recP}.jpg`;
      posterEl.hidden = false;
    }
    const full = `→ WATCH NEXT: <b>${recT}</b> — ${read}`;
    clearInterval(timer);
    if (prefersReduced) { out.innerHTML = full + OUTRO; return; }
    let i = 0;
    const plain = full.replace(/<[^>]+>/g, "");
    out.textContent = "";
    timer = setInterval(() => {
      i += 2;
      out.textContent = plain.slice(0, i);
      if (i >= plain.length) {
        clearInterval(timer);
        out.innerHTML = full + OUTRO;
      }
    }, 14);
  });
})();
