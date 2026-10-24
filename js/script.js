let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
let sections = document.querySelectorAll('section[id]');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
  sections.forEach(sec => {
    let top = window.scrollY;
    let offset = sec.offsetTop - 150;
    let height = sec.offsetHeight;
    let id = sec.getAttribute('id');

    if (top >= offset && top < offset + height) {
      let link = document.querySelector('header nav a[href="#' + id + '"]');
      if (link) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
};

menuIcon.onclick = () => {
  menuIcon.classList.toggle('bx-x');
  navbar.classList.toggle('active');
};

// close the mobile menu after tapping a link
navLinks.forEach(l => l.onclick = () => {
  menuIcon.classList.remove('bx-x');
  navbar.classList.remove('active');
});

(function () {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const carousel = document.querySelector('.carousel');
  const bar = document.querySelector('.carousel-bar');
  const thumb = document.querySelector('.carousel-thumb');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const playBtn = document.querySelector('.carousel-btn.play');

  const AUTO_SPEED = 0.04;

  track.style.scrollBehavior = 'auto';

  const originals = Array.from(track.children);
  const count = originals.length;

  function makeClones() {
    return originals.map(card => {
      const c = card.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
      return c;
    });
  }
  makeClones().forEach(c => track.insertBefore(c, originals[0]));
  makeClones().forEach(c => track.appendChild(c));

  const cards = Array.from(track.children);
  const firstOriginal = cards[count];
  const firstAfter = cards[count * 2];

  let W = 0;
  let cw = 0;

  // state flags (autoplay only runs when all of these are false)
  let userPaused = false, focused = false, touching = false, dragging = false;
  let thumbDragging = false, animating = false, inView = true;
  let holdUntil = 0, idleTimer = null;

  function measure() {
    W = firstAfter.offsetLeft - firstOriginal.offsetLeft;
    cw = track.clientWidth;
  }

  function wrap() {
    const lo = W - cw / 2;
    const hi = lo + W;
    const sl = track.scrollLeft;
    if (sl >= hi) { track.scrollLeft = sl - W; return -W; }
    if (sl < lo)  { track.scrollLeft = sl + W; return W; }
    return 0;
  }

  function scheduleWrap() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!touching && !animating && !dragging && !thumbDragging) wrap();
    }, 150);
  }

  function hold(ms) {
    holdUntil = performance.now() + ms;
  }

  function getPhase() {
    const p = ((track.scrollLeft - W) % W + W) % W;
    return p / W;
  }

  function setPhase(p) {
    p = Math.max(0, Math.min(0.999, p));
    const lo = W - cw / 2;
    const hi = lo + W;
    let s = W + p * W;
    if (s >= hi) s -= W;
    track.scrollLeft = s;
  }

  function updateThumb() {
    if (!bar || !thumb || !W) return;
    const barW = bar.clientWidth;
    const tw = Math.max(48, Math.min(barW * 0.6, barW * cw / W));
    const x = getPhase() * (barW - tw);
    thumb.style.width = tw + 'px';
    thumb.style.transform = 'translateX(' + x + 'px)';
  }

  thumb.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    thumbDragging = true;
    thumb.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startPhase = getPhase();

    const move = ev => {
      const range = bar.clientWidth - thumb.offsetWidth;
      if (range > 0) setPhase(startPhase + (ev.clientX - startX) / range);
    };
    const up = () => {
      thumbDragging = false;
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', up);
      thumb.removeEventListener('pointercancel', up);
      hold(2500);
    };
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', up);
    thumb.addEventListener('pointercancel', up);
  });

  bar.addEventListener('pointerdown', e => {
    if (e.target === thumb) return;
    const rect = bar.getBoundingClientRect();
    const range = bar.clientWidth - thumb.offsetWidth;
    if (range <= 0) return;
    setPhase((e.clientX - rect.left - thumb.offsetWidth / 2) / range);
    hold(2500);
  });

  track.addEventListener('scroll', () => {
    updateThumb();
    if (!animating) scheduleWrap();
  }, { passive: true });

  function glide(dx) {
    if (animating) return;
    wrap();
    animating = true;
    const start = track.scrollLeft;
    const t0 = performance.now();
    const dur = 450;
    (function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      track.scrollLeft = start + dx * ease;
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        animating = false;
        wrap();
        hold(3000);
      }
    })(t0);
  }

  function stepSize() {
    return cards[count + 1].offsetLeft - firstOriginal.offsetLeft;
  }
  prevBtn.addEventListener('click', () => glide(-stepSize()));
  nextBtn.addEventListener('click', () => glide(stepSize()));

  playBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    playBtn.querySelector('i').className = userPaused ? 'bx bx-play' : 'bx bx-pause';
    playBtn.setAttribute('aria-label', userPaused ? 'Play auto-scroll' : 'Pause auto-scroll');
  });

  let startX = 0, startScroll = 0, dragMoved = false;

  track.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add('dragging');
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) dragMoved = true;
    track.scrollLeft = startScroll - dx;
    startScroll += wrap();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    hold(1500);
  });
  // don't trigger a link/button click when the user was dragging
  track.addEventListener('click', e => {
    if (dragMoved) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved = false;
    }
  }, true);
  track.addEventListener('dragstart', e => e.preventDefault());

  carousel.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) focused = true; });
  carousel.addEventListener('focusout', () => { focused = false; });

  track.addEventListener('touchstart', () => { touching = true; }, { passive: true });
  const touchDone = () => { touching = false; hold(2500); scheduleWrap(); };
  track.addEventListener('touchend', touchDone, { passive: true });
  track.addEventListener('touchcancel', touchDone, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }).observe(carousel);
  }

  /* ---------- autoplay ---------- */
  function canAuto() {
    return inView && !userPaused && !focused && !touching &&
      !dragging && !thumbDragging && !animating &&
      !document.body.classList.contains('modal-open') &&
      performance.now() >= holdUntil;
  }

  let last = performance.now();
  let pos = 0;
  let lastSeen = 0;
  function tick(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    if (canAuto()) {
      if (Math.abs(track.scrollLeft - lastSeen) > 1.5) {
        pos = track.scrollLeft;
        lastSeen = pos;
        hold(1500);
      } else {
        pos += AUTO_SPEED * dt;
        track.scrollLeft = pos;
        const shift = wrap();
        if (shift) pos += shift;
        lastSeen = track.scrollLeft;
      }
    } else {
      pos = track.scrollLeft;
      lastSeen = pos;
    }
    requestAnimationFrame(tick);
  }

  function refresh() {
    const phase = W ? getPhase() : 0;
    measure();
    setPhase(phase);
    updateThumb();
  }

  measure();
  track.scrollLeft = W;
  pos = lastSeen = track.scrollLeft;
  updateThumb();
  window.addEventListener('load', refresh);
  window.addEventListener('resize', refresh);
  requestAnimationFrame(tick);
})();


(function () {
  const modal = document.getElementById('pdfModal');
  if (!modal) return;

  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const canvas = document.getElementById('pdfCanvas');
  const ctx = canvas.getContext('2d');
  const viewer = document.getElementById('pdfViewer');
  const statusEl = document.getElementById('pdfStatus');
  const titleEl = document.getElementById('pdfTitle');
  const pageNumEl = document.getElementById('pdfPageNum');
  const pageCountEl = document.getElementById('pdfPageCount');
  const zoomLabel = document.getElementById('pdfZoomLabel');
  const prevBtn = document.getElementById('pdfPrev');
  const nextBtn = document.getElementById('pdfNext');
  const zoomInBtn = document.getElementById('pdfZoomIn');
  const zoomOutBtn = document.getElementById('pdfZoomOut');
  const closeBtn = document.getElementById('pdfClose');
  const downloadLink = document.getElementById('pdfDownload');

  let pdfDoc = null;
  let pageNo = 1;
  let zoom = 1;
  let rendering = false;
  let pendingRender = false;
  let lastFocus = null;
  let loadToken = 0;

  function updateUI() {
    const total = pdfDoc ? pdfDoc.numPages : 1;
    pageNumEl.textContent = pageNo;
    pageCountEl.textContent = total;
    zoomLabel.textContent = Math.round(zoom * 100) + '%';
    prevBtn.disabled = !pdfDoc || pageNo <= 1;
    nextBtn.disabled = !pdfDoc || pageNo >= total;
    zoomOutBtn.disabled = !pdfDoc || zoom <= 0.5;
    zoomInBtn.disabled = !pdfDoc || zoom >= 3;
  }

  async function renderPage() {
    if (!pdfDoc) return;
    if (rendering) { pendingRender = true; return; }
    rendering = true;
    try {
      const page = await pdfDoc.getPage(pageNo);
      const base = page.getViewport({ scale: 1 });
      const avail = Math.max(viewer.clientWidth - 32, 200);
      const scale = (avail / base.width) * zoom;
      const dpr = window.devicePixelRatio || 1;
      const cssVp = page.getViewport({ scale: scale });
      const hiVp = page.getViewport({ scale: scale * dpr });

      canvas.width = Math.floor(hiVp.width);
      canvas.height = Math.floor(hiVp.height);
      canvas.style.width = cssVp.width + 'px';
      canvas.style.height = cssVp.height + 'px';

      await page.render({ canvasContext: ctx, viewport: hiVp }).promise;
    } catch (err) {
      console.error('PDF render error:', err);
    }
    rendering = false;
    if (pendingRender) {
      pendingRender = false;
      renderPage();
    }
  }

  function showError(url) {
    canvas.style.display = 'none';
    statusEl.style.display = 'block';
    statusEl.textContent = 'Sorry, the PDF could not be loaded here. ';
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open it in a new tab';
    statusEl.appendChild(a);
    statusEl.appendChild(document.createTextNode('.'));
  }

  async function openPdf(url, title) {
    lastFocus = document.activeElement;
    titleEl.textContent = title || 'Document';
    downloadLink.href = url;
    pageNo = 1;
    zoom = 1;
    pdfDoc = null;
    canvas.style.display = 'none';
    statusEl.style.display = 'block';
    statusEl.textContent = 'Loading…';
    pageCountEl.textContent = '1';
    updateUI();

    modal.classList.add('open');
    document.body.classList.add('modal-open');
    closeBtn.focus();
    viewer.scrollTop = 0;

    if (!window.pdfjsLib) { showError(url); return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;

    const token = ++loadToken;
    try {
      const doc = await pdfjsLib.getDocument(url).promise;
      if (token !== loadToken) { doc.destroy(); return; }
      pdfDoc = doc;
      statusEl.style.display = 'none';
      canvas.style.display = 'block';
      updateUI();
      renderPage();
    } catch (err) {
      console.error('PDF load error:', err);
      if (token === loadToken) showError(url);
    }
  }

  function closePdf() {
    loadToken++;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function goTo(n) {
    if (!pdfDoc) return;
    pageNo = Math.max(1, Math.min(pdfDoc.numPages, n));
    viewer.scrollTop = 0;
    updateUI();
    renderPage();
  }

  function setZoom(z) {
    zoom = Math.max(0.5, Math.min(3, z));
    updateUI();
    renderPage();
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('.open-pdf');
    if (!link) return;
    e.preventDefault();
    openPdf(link.getAttribute('href'), link.dataset.title);
  });

  closeBtn.addEventListener('click', closePdf);
  modal.querySelector('.pdf-backdrop').addEventListener('click', closePdf);
  prevBtn.addEventListener('click', () => goTo(pageNo - 1));
  nextBtn.addEventListener('click', () => goTo(pageNo + 1));
  zoomInBtn.addEventListener('click', () => setZoom(zoom + 0.25));
  zoomOutBtn.addEventListener('click', () => setZoom(zoom - 0.25));

  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closePdf();
    else if (e.key === 'ArrowLeft') goTo(pageNo - 1);
    else if (e.key === 'ArrowRight') goTo(pageNo + 1);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (modal.classList.contains('open')) renderPage();
    }, 150);
  });
})();

(function () {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const icon = btn.querySelector('i');
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    icon.className = theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('contactSubmit');
  const statusEl = document.getElementById('formStatus');

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));

    if (!data.access_key || data.access_key === 'YOUR_ACCESS_KEY_HERE') {
      setStatus('The form isn\u2019t connected yet. Add your Web3Forms access key in index.html.', 'error');
      return;
    }

    const originalLabel = submitBtn.value;
    submitBtn.disabled = true;
    submitBtn.value = 'Sending\u2026';
    setStatus('', '');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setStatus('Thank you! Your message was sent. I\u2019ll get back to you soon.', 'success');
        form.reset();
      } else {
        setStatus(json.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      setStatus('Couldn\u2019t send your message. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.value = originalLabel;
    }
  });
})();
