/* ============================================================
   0. CONFIG
   ============================================================ */
const BIRTHDAY_MONTH = 9; // September
const BIRTHDAY_DAY = 8;

const WISHES = [
  "Don’t overthink what you can’t control..",
  "Choose peace over unnecessary worries.",
  "Thank you for being my personal hype committee.",
  "You've got the kind of honesty I actually trust.",
  "Every plan is better when you're in it.",
  "You make ordinary days feel like an event.",
  "Keep your heart kind and your mind calm",
  "Here's to more chaos, more inside jokes, more us.",
];

// positions in an 800x500 canvas — the first 5 trace an "M"
const STAR_POINTS = [
  { x: 110, y: 430 },
  { x: 110, y: 90 },
  { x: 400, y: 380 },
  { x: 690, y: 90 },
  { x: 690, y: 430 },
  { x: 260, y: 200 },
  { x: 540, y: 250 },
  { x: 400, y: 60 },
];
const CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
];

/* ============================================================
   1. SIGNATURE GATE — she has to sign/trace her name to open
   ============================================================ */
(function signatureGate() {
  const gate = document.getElementById("gate");
  const canvas = document.getElementById("gate-canvas");
  const ctx = canvas.getContext("2d");
  const ghost = document.getElementById("gate-ghost");
  const hint = document.getElementById("gate-hint");
  const clearBtn = document.getElementById("gate-clear");
  const site = document.getElementById("site");
  const body = document.body;

  const MIN_LENGTH = 480; // roughly how much "ink" she needs to lay down
  const MIN_SPREAD = 0.45; // and it has to stretch across at least ~45% of the box

  let drawing = false;
  let unlocked = false;
  let lastPoint = null;
  let minX = Infinity,
    maxX = -Infinity,
    totalLength = 0;
  let hintTimer = null;

  function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = "#e6c17c";
  }

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function scheduleHint() {
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (!unlocked) hint.classList.add("show");
    }, 4500);
  }

  function startStroke(e) {
    if (unlocked) return;
    drawing = true;
    const p = pointFromEvent(e);
    lastPoint = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    clearTimeout(hintTimer);
    hint.classList.remove("show");
  }

  function moveStroke(e) {
    if (!drawing || unlocked) return;
    const p = pointFromEvent(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    totalLength += Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    lastPoint = p;

    const progress = Math.min(1, totalLength / MIN_LENGTH);
    ghost.style.opacity = (0.15 + progress * 0.35).toFixed(2);
  }

  function endStroke() {
    if (!drawing) return;
    drawing = false;
    checkUnlock();
    scheduleHint();
  }

  function checkUnlock() {
    if (unlocked) return;
    const wrapWidth = canvas.getBoundingClientRect().width;
    const spread = wrapWidth > 0 ? (maxX - minX) / wrapWidth : 0;
    if (totalLength >= MIN_LENGTH && spread >= MIN_SPREAD) {
      openGate();
    }
  }

  function openGate() {
    unlocked = true;
    clearTimeout(hintTimer);
    gate.classList.add("unlocked");
    body.classList.remove("locked");
    site.classList.add("revealed");
    setTimeout(() => {
      gate.style.display = "none";
    }, 1100);
  }

  function clearCanvas() {
    setupCanvas();
    minX = Infinity;
    maxX = -Infinity;
    totalLength = 0;
    ghost.style.opacity = "0.15";
    scheduleHint();
  }

  canvas.addEventListener("pointerdown", startStroke);
  canvas.addEventListener("pointermove", moveStroke);
  window.addEventListener("pointerup", endStroke);
  clearBtn.addEventListener("click", clearCanvas);
  window.addEventListener("resize", () => {
    if (!unlocked) setupCanvas();
  });

  setupCanvas();
  scheduleHint();
})();

/* ============================================================
   2. AMBIENT STARFIELD + SHOOTING STARS
   ============================================================ */
(function ambientSky() {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let w,
    h,
    stars,
    shootingStars = [];
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.body.scrollHeight;
    const count = Math.floor((w * h) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.005,
    }));
  }

  function maybeSpawnShootingStar() {
    if (reduceMotion) return;
    if (shootingStars.length < 3 && Math.random() < 0.018) {
      const goingRight = Math.random() < 0.5;
      shootingStars.push({
        x: goingRight ? Math.random() * w * 0.3 : w - Math.random() * w * 0.3,
        y: Math.random() * h * 0.35,
        vx: (goingRight ? 1 : -1) * (7 + Math.random() * 5),
        vy: 3.5 + Math.random() * 2.5,
        life: 1,
      });
    }
  }

  function drawShootingStar(ss) {
    const tailX = ss.x - ss.vx * 13;
    const tailY = ss.y - ss.vy * 13;
    const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grad.addColorStop(0, "rgba(230,193,124,0)");
    grad.addColorStop(0.5, `rgba(230,193,124,${0.45 * ss.life})`);
    grad.addColorStop(1, `rgba(245,241,230,${ss.life})`);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${ss.life})`;
    ctx.shadowColor = "rgba(230,193,124,0.95)";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.phase += s.speed;
      const twinkle = 0.4 + Math.sin(s.phase) * 0.35;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,241,230,${Math.max(0, twinkle)})`;
      ctx.fill();
    }

    maybeSpawnShootingStar();
    shootingStars.forEach((ss) => {
      drawShootingStar(ss);
      ss.x += ss.vx;
      ss.y += ss.vy;
      if (ss.y > h * 0.55) ss.life -= 0.03;
    });
    shootingStars = shootingStars.filter(
      (ss) => ss.life > 0 && ss.x < w + 100 && ss.y < h + 100 && ss.x > -100
    );

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

/* ============================================================
   3. GALAXY — fades in and drifts closer as you scroll
   ============================================================ */
(function galaxyOnScroll() {
  const canvas = document.getElementById("galaxy");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let w,
    h,
    arms,
    blobs,
    t = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    buildGalaxy();
  }

  function buildGalaxy() {
    const cx = w * 0.5;
    const cy = h * 0.42;
    const armCount = 4;
    const pointsPerArm = 90;
    const maxRadius = Math.min(w, h) * 0.55;
    const palette = ["#e6c17c", "#a99bd6", "#d9a9a3", "#f5f1e6"];

    arms = [];
    for (let a = 0; a < armCount; a++) {
      const armOffset = (Math.PI * 2 * a) / armCount;
      for (let i = 0; i < pointsPerArm; i++) {
        const frac = i / pointsPerArm;
        const angle = armOffset + frac * Math.PI * 2.2;
        const radius = frac * maxRadius;
        const jitter = (Math.random() - 0.5) * 14 * frac;
        arms.push({
          baseAngle: angle,
          radius: radius + jitter,
          cx,
          cy,
          size: (1 - frac) * 1.8 + 0.4,
          color: palette[Math.floor(Math.random() * palette.length)],
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    }

    blobs = [
      { x: cx, y: cy, r: maxRadius * 0.55, color: "169,155,214" },
      {
        x: cx - maxRadius * 0.2,
        y: cy + maxRadius * 0.15,
        r: maxRadius * 0.4,
        color: "230,193,124",
      },
      {
        x: cx + maxRadius * 0.25,
        y: cy - maxRadius * 0.1,
        r: maxRadius * 0.35,
        color: "217,169,163",
      },
    ];
  }

  function scrollFraction() {
    const max = document.body.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  function draw() {
    const frac = scrollFraction();
    ctx.clearRect(0, 0, w, h);

    if (frac > 0.01) {
      const opacity = Math.pow(frac, 1.3);
      const scale = 0.75 + frac * 0.45;
      const rotation = frac * 0.6 + (reduceMotion ? 0 : t * 0.0006);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(w * 0.5, h * 0.42);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.translate(-w * 0.5, -h * 0.42);

      blobs.forEach((b) => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${b.color},0.16)`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      arms.forEach((p) => {
        const angle = p.baseAngle + (reduceMotion ? 0 : t * 0.00015);
        const x = p.cx + Math.cos(angle) * p.radius;
        const y = p.cy + Math.sin(angle) * p.radius * 0.55;
        const twinkle = reduceMotion
          ? 1
          : 0.6 + Math.sin(t * 0.002 + p.twinklePhase) * 0.4;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity * twinkle;
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    t += 16;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

/* ============================================================
   4. SCROLL PROGRESS BAR
   ============================================================ */
(function scrollProgress() {
  const fill = document.getElementById("progress-fill");
  let ticking = false;

  function update() {
    const max = document.body.scrollHeight - window.innerHeight;
    const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.width = frac * 100 + "%";
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
  window.addEventListener("resize", update);
  update();
})();

/* ============================================================
   5. SCROLL-REVEAL (fade + rise, once per element)
   ============================================================ */
(function scrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
})();

/* ============================================================
   6. COUNTDOWN
   ============================================================ */
(function countdown() {
  function nextBirthday() {
    const now = new Date();
    const year = now.getFullYear();
    let target = new Date(year, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0);
    if (target <= now)
      target = new Date(year + 1, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0);
    return target;
  }

  const target = nextBirthday();
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins: document.getElementById("cd-mins"),
    secs: document.getElementById("cd-secs"),
  };

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      els.days.textContent = "00";
      els.hours.textContent = "00";
      els.mins.textContent = "00";
      els.secs.textContent = "00";
      unlockReveal();
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    els.days.textContent = String(d).padStart(2, "0");
    els.hours.textContent = String(h).padStart(2, "0");
    els.mins.textContent = String(m).padStart(2, "0");
    els.secs.textContent = String(s).padStart(2, "0");
    setTimeout(tick, 250);
  }
  tick();

  document.getElementById("scroll-cue").addEventListener("click", () => {
    document.getElementById("wishes").scrollIntoView({ behavior: "smooth" });
  });
})();

/* ============================================================
   7. WISH STARS / CONSTELLATION
   ============================================================ */
const STAR_SVG =
  '<svg viewBox="0 0 24 24"><path d="M12 0l2.5 7.9L22 8.5l-6.2 5 2.2 8L12 17l-6 4.5 2.2-8L2 8.5l7.5-.6z"/></svg>';

(function wishStars() {
  const field = document.getElementById("star-field");
  const linesSvg = document.getElementById("constellation-lines");
  const card = document.getElementById("wish-card");
  const cardText = document.getElementById("wish-text");
  const closeBtn = document.getElementById("wish-close");
  const countLabel = document.getElementById("found-count");
  const found = new Set();

  const lineEls = CONNECTIONS.map(([a, b]) => {
    const p1 = STAR_POINTS[a],
      p2 = STAR_POINTS[b];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    linesSvg.appendChild(line);
    return { el: line, a, b };
  });

  STAR_POINTS.forEach((pt, i) => {
    const btn = document.createElement("button");
    btn.className = "wish-star";
    btn.style.left = (pt.x / 800) * 100 + "%";
    btn.style.top = (pt.y / 500) * 100 + "%";
    btn.style.animationDelay = Math.random() * 3 + "s";
    btn.setAttribute("aria-label", "Reveal a star");
    btn.innerHTML = STAR_SVG;

    btn.addEventListener("click", () => {
      if (!found.has(i)) {
        found.add(i);
        btn.classList.add("found");
        countLabel.textContent = found.size;
        lineEls.forEach((l) => {
          if (found.has(l.a) && found.has(l.b)) l.el.classList.add("lit");
        });
      }
      cardText.textContent = WISHES[i];
      card.hidden = false;
    });

    field.appendChild(btn);
  });

  closeBtn.addEventListener("click", () => {
    card.hidden = true;
  });
})();

/* ============================================================
   8. REVEAL (locked -> unlocked)
   ============================================================ */
function unlockReveal() {
  const locked = document.getElementById("locked-state");
  const unlocked = document.getElementById("unlocked-state");
  if (unlocked.hidden === false) return;
  locked.hidden = true;
  unlocked.hidden = false;
  unlocked.classList.add("in-view");
  spawnBurst();
}

function spawnBurst() {
  const burst = document.getElementById("burst");
  burst.innerHTML = "";
  const colors = ["#e6c17c", "#a99bd6", "#d9a9a3", "#f5f1e6"];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 24;
    const dist = 60 + Math.random() * 70;
    p.style.position = "absolute";
    p.style.width = "5px";
    p.style.height = "5px";
    p.style.borderRadius = "50%";
    p.style.background = colors[i % colors.length];
    p.style.left = "0";
    p.style.top = "0";
    p.style.opacity = "1";
    p.style.transition =
      "transform 1s cubic-bezier(.2,.8,.2,1), opacity 1s ease";
    burst.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(${Math.cos(angle) * dist}px, ${
        Math.sin(angle) * dist
      }px)`;
      p.style.opacity = "0";
    });
  }
}

document.getElementById("unlock-early").addEventListener("click", unlockReveal);

/* ============================================================
   9. INTERACTIVE FLOURISHES
   ============================================================ */

// cursor trail
(function cursorTrail() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  if (reduceMotion || isTouch) return;

  const colors = ["#e6c17c", "#a99bd6", "#f5f1e6"];
  let lastSpawn = 0;

  window.addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (now - lastSpawn < 45) return;
    lastSpawn = now;

    const dot = document.createElement("span");
    dot.className = "trail-dot";
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove());
  });
})();

// hero title tilts toward the cursor
(function heroTilt() {
  const title = document.querySelector(".hero-title");
  const hero = document.getElementById("hero");
  if (!title || !hero) return;

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    title.style.transform = `perspective(600px) rotateX(${
      py * -6
    }deg) rotateY(${px * 8}deg)`;
  });
  hero.addEventListener("pointerleave", () => {
    title.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
  });
})();

// magnetic buttons
(function magneticButtons() {
  const targets = document.querySelectorAll(".ghost-btn, #note-add");
  const RADIUS = 70;
  const STRENGTH = 0.35;

  targets.forEach((el) => {
    el.classList.add("magnetic");
    window.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        el.style.transform = `translate(${dx * STRENGTH}px, ${
          dy * STRENGTH
        }px)`;
      } else {
        el.style.transform = "translate(0, 0)";
      }
    });
  });
})();

// gallery frame 3D tilt
(function frameTilt() {
  document.querySelectorAll(".frame-inner").forEach((frame) => {
    frame.addEventListener("pointermove", (e) => {
      const rect = frame.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = `perspective(700px) rotateX(${
        py * -10
      }deg) rotateY(${px * 10}deg) scale(1.03)`;
    });
    frame.addEventListener("pointerleave", () => {
      frame.style.transform =
        "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  });
})();

/* ============================================================
   10. LEAVE-A-WISH FLOATING NOTES
   ============================================================ */
(function floatingNotes() {
  const input = document.getElementById("note-input");
  const btn = document.getElementById("note-add");

  function addNote() {
    const text = input.value.trim();
    if (!text) return;
    const note = document.createElement("div");
    note.className = "floating-note";
    note.textContent = "✦ " + text;
    note.style.left = Math.random() * 70 + 10 + "vw";
    note.style.bottom = "0";
    document.body.appendChild(note);
    note.addEventListener("animationend", () => note.remove());
    input.value = "";

    try {
      const saved = JSON.parse(localStorage.getItem("muskan-notes") || "[]");
      saved.push(text);
      localStorage.setItem("muskan-notes", JSON.stringify(saved));
    } catch (e) {
      /* localStorage unavailable, skip silently */
    }
  }

  btn.addEventListener("click", addNote);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addNote();
  });
})();
