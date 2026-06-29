// eXcent brand runtime: theme enforcement + GSAP micro-interactions.

const BRAND = {
  red: '#ed1c24',
  blue: '#70c8ec',
  green: '#74c476',
  orange: '#f3662f',
  yellow: '#fdbb3d',
  graphite: '#101820',
  slate: '#2b3036',
  grey: '#85878a',
  mist: '#f4f7f9',
  paper: '#ffffff',
};

const TOKENS = {
  '--bg': BRAND.mist,
  '--fg': '#17202a',
  '--panel': BRAND.paper,
  '--border': '#d8e0e6',
  '--red': BRAND.red,
  '--green': BRAND.green,
  '--warn': BRAND.yellow,
  '--accent': BRAND.blue,
  '--accent-primary': BRAND.red,
  '--accent-error': BRAND.red,
  '--brand-color': BRAND.red,
  '--sidebar-bg': BRAND.graphite,
  '--hamburger-color': '#ffffff',
  '--input-bg': '#ffffff',
  '--input-border': '#c8d4dc',
  '--send-btn-bg': BRAND.red,
  '--send-btn-hover': '#c9151b',
  '--user-bubble-bg': '#eef8fc',
  '--ai-bubble-bg': '#ffffff',
  '--bubble-border': '#d8e0e6',
  '--toggle-active': BRAND.red,
  '--code-bg': BRAND.graphite,
  '--code-fg': '#eaf2f7',
  '--font-family': '"Inter", "Raleway", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

let applyingTokens = false;

function applyBrandTokens() {
  applyingTokens = true;
  const root = document.documentElement;
  root.classList.add('excent-brand');
  for (const [key, value] of Object.entries(TOKENS)) {
    root.style.setProperty(key, value, 'important');
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BRAND.graphite);
  applyingTokens = false;
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

function updateBrandText() {
  document.title = 'eXcent AI Workspace';
  setText('main.chat-container h1.a11y-visually-hidden', 'eXcent AI Workspace');
  setText('#current-meta', 'eXcent Workspace');

  const message = document.getElementById('message');
  if (message) message.setAttribute('placeholder', 'Message eXcent Workspace...');

  const setup = document.getElementById('welcome-sub');
  if (setup && !setup.dataset.excentCopy) {
    setup.dataset.excentCopy = '1';
    setup.innerHTML = 'Bienvenue dans votre espace IA eXcent. <span class="setup-trigger-link" title="Click to launch setup">/setup</span> pour configurer vos modèles.';
  }

  const loginTitle = document.querySelector('title');
  if (loginTitle && /Login/i.test(loginTitle.textContent || '')) {
    loginTitle.textContent = 'eXcent — Connexion';
  }
}

function updateIcons() {
  const href = '/static/assets/Excent_Logo_Groupe-GRIS-A3.png';
  let icon = document.querySelector("link[rel='icon']");
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.type = 'image/png';
  icon.href = href;

  let apple = document.querySelector("link[rel='apple-touch-icon']");
  if (!apple) {
    apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    document.head.appendChild(apple);
  }
  apple.href = href;
}

let gsapPromise;
function loadGsap() {
  if (window.gsap) return Promise.resolve(window.gsap);
  if (gsapPromise) return gsapPromise;
  gsapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    script.async = true;
    script.onload = () => window.gsap ? resolve(window.gsap) : reject(new Error('GSAP unavailable'));
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return gsapPromise;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fallbackReveal(nodes) {
  nodes.forEach((el, idx) => {
    el.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 280, delay: idx * 25, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' },
    );
  });
}

async function animateInitialBrand() {
  if (prefersReducedMotion()) return;
  const nodes = [
    document.querySelector('.sidebar-brand'),
    document.querySelector('.card'),
    document.querySelector('.excent-login-logo'),
    document.querySelector('#welcome-screen'),
    document.querySelector('.chat-input-bar'),
    ...document.querySelectorAll('.icon-rail-btn'),
  ].filter(Boolean);

  try {
    const gsap = await loadGsap();
    gsap.fromTo('.sidebar-brand', { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: .55, ease: 'power3.out' });
    gsap.fromTo('.card', { opacity: 0, y: 18, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .62, ease: 'power3.out' });
    gsap.fromTo('.excent-login-logo', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .55, delay: .08, ease: 'power3.out' });
    gsap.fromTo('#welcome-screen', { opacity: 0, y: 18, scale: .98 }, { opacity: 1, y: 0, scale: 1, duration: .72, delay: .08, ease: 'power3.out' });
    gsap.fromTo('.chat-input-bar', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .55, delay: .16, ease: 'power3.out' });
    gsap.fromTo('.icon-rail-btn', { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .35, stagger: .025, ease: 'power2.out' });
  } catch (_) {
    fallbackReveal(nodes);
  }
}

function animateNewElement(el) {
  if (!el || prefersReducedMotion()) return;
  loadGsap().then((gsap) => {
    if (el.classList.contains('msg')) {
      gsap.fromTo(el, { opacity: 0, y: 8, scale: .992 }, { opacity: 1, y: 0, scale: 1, duration: .24, ease: 'power2.out' });
    } else {
      gsap.fromTo(el, { opacity: 0, y: 10, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .28, ease: 'power2.out' });
    }
  }).catch(() => fallbackReveal([el]));
}

function watchDynamicUI() {
  const seen = new WeakSet();
  const obs = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || seen.has(node)) continue;
        const target = node.matches('.msg, .modal-content, .dropdown, .toast, .search-popup')
          ? node
          : node.querySelector?.('.msg, .modal-content, .dropdown, .toast, .search-popup');
        if (!target || seen.has(target)) continue;
        seen.add(target);
        animateNewElement(target);
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

function protectTokensFromSavedThemes() {
  const root = document.documentElement;
  let scheduled = false;
  const needsBrandTokens = () => {
    if (!root.classList.contains('excent-brand')) return true;
    for (const [key, value] of Object.entries(TOKENS)) {
      if ((root.style.getPropertyValue(key) || '').trim() !== value) return true;
    }
    return false;
  };
  const obs = new MutationObserver(() => {
    if (applyingTokens || scheduled || !needsBrandTokens()) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      if (needsBrandTokens()) applyBrandTokens();
    });
  });
  obs.observe(root, { attributes: true, attributeFilter: ['style', 'class'] });
}

function init() {
  applyBrandTokens();
  updateIcons();
  updateBrandText();
  protectTokensFromSavedThemes();
  window.requestAnimationFrame(() => {
    applyBrandTokens();
    updateBrandText();
    animateInitialBrand();
    watchDynamicUI();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
