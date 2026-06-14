const urlForm = document.getElementById('url-form');
const urlInput = document.getElementById('url-input');
const statusEl = document.getElementById('status');

const mobileView = document.getElementById('mobile-view');
const desktopView = document.getElementById('desktop-view');
const views = [mobileView, desktopView];

const backBtn = document.getElementById('back');
const forwardBtn = document.getElementById('forward');
const reloadBtn = document.getElementById('reload');

const phoneArea = document.getElementById('phone-area');
const phoneScaler = document.getElementById('phone-scaler');
const phoneFrame = document.getElementById('phone-frame');
const paneMobile = document.querySelector('.pane-mobile');
const divider = document.getElementById('divider');

/* ---------- Normalizar y cargar URL ---------- */
function normalizeUrl(value) {
  let url = value.trim();
  if (!url) return null;
  // Si no tiene protocolo, asumimos https
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  // Allowlist de esquemas: solo http/https. Esto bloquea intentos de cargar
  // file:///, javascript:, data:, etc. en las vistas.
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function loadUrl(value) {
  const url = normalizeUrl(value);
  if (!url) {
    statusEl.textContent = 'URL no válida';
    return;
  }
  urlInput.value = url;
  views.forEach((v) => v.loadURL(url));
}

urlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loadUrl(urlInput.value);
});

/* ---------- Botones de navegación (afectan a ambas vistas) ---------- */
backBtn.addEventListener('click', () => {
  views.forEach((v) => v.canGoBack() && v.goBack());
});
forwardBtn.addEventListener('click', () => {
  views.forEach((v) => v.canGoForward() && v.goForward());
});
reloadBtn.addEventListener('click', () => {
  views.forEach((v) => v.reload());
});

/* ---------- Estado de carga (lo lleva la vista de escritorio) ---------- */
desktopView.addEventListener('did-start-loading', () => {
  statusEl.textContent = 'Cargando…';
});
desktopView.addEventListener('did-stop-loading', () => {
  statusEl.textContent = 'Listo';
});
desktopView.addEventListener('did-fail-load', (e) => {
  // -3 = ERR_ABORTED (navegación cancelada), se ignora
  if (e.errorCode && e.errorCode !== -3) {
    statusEl.textContent = 'Error al cargar';
  }
});
desktopView.addEventListener('did-navigate', (e) => {
  if (e.url && e.url !== 'about:blank') urlInput.value = e.url;
});

/* ---------- Scroll unificado entre móvil y escritorio ---------- */
// Se inyecta en cada página un listener de scroll que reporta su posición
// como PORCENTAJE (0..1) mediante console.log con un prefijo. El host lo
// recibe por el evento 'console-message' y reposiciona la otra vista.
// Por porcentaje porque móvil y escritorio tienen alturas distintas.
const SCROLL_SYNC = `
(function () {
  if (window.__scrollSyncInstalled) return;
  window.__scrollSyncInstalled = true;
  window.__suppress = false;
  var releaseTimer, ticking = false;

  function maxScroll() {
    var d = document.documentElement, b = document.body;
    var sh = Math.max(d ? d.scrollHeight : 0, b ? b.scrollHeight : 0);
    return Math.max(sh - window.innerHeight, 0);
  }

  window.addEventListener('scroll', function () {
    if (window.__suppress || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var m = maxScroll();
      console.log('__SCROLL__' + (m > 0 ? window.scrollY / m : 0));
    });
  }, { passive: true });

  // Llamado por el host para alinear esta vista con la otra.
  window.__setScroll = function (p) {
    window.__suppress = true;
    var m = maxScroll();
    window.scrollTo(0, m * p);
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(function () { window.__suppress = false; }, 150);
  };
})();
`;

const PREFIX = '__SCROLL__';

function otherView(v) {
  return v === mobileView ? desktopView : mobileView;
}

function installScrollSync(view) {
  view.addEventListener('dom-ready', () => {
    view.executeJavaScript(SCROLL_SYNC).catch(() => {});
  });
  view.addEventListener('console-message', (e) => {
    const msg = e.message;
    if (typeof msg === 'string' && msg.startsWith(PREFIX)) {
      const pct = parseFloat(msg.slice(PREFIX.length));
      if (!Number.isNaN(pct)) {
        otherView(view)
          .executeJavaScript(`window.__setScroll && window.__setScroll(${pct})`)
          .catch(() => {});
      }
    }
  });
}
installScrollSync(mobileView);
installScrollSync(desktopView);

/* ---------- Ocultar la barra de scroll de la vista móvil ---------- */
// El scroll sigue funcionando (rueda + sincronización), solo se oculta
// la barra para que estéticamente quede limpio dentro del teléfono.
mobileView.addEventListener('dom-ready', () => {
  mobileView.insertCSS(
    '::-webkit-scrollbar{width:0!important;height:0!important;background:transparent!important}' +
    'html{scrollbar-width:none!important;-ms-overflow-style:none!important}'
  );
});

/* ---------- Escalar el marco del teléfono para que quepa ---------- */
function fitPhone() {
  // Tamaño real (sin escalar) del marco. offsetWidth/Height NO se ven
  // afectados por el transform, así que siempre miden 375x812 + padding.
  const frameW = phoneFrame.offsetWidth;
  const frameH = phoneFrame.offsetHeight;
  if (!frameW || !frameH) return;

  const style = getComputedStyle(phoneArea);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

  const availW = phoneArea.clientWidth - padX;
  const availH = phoneArea.clientHeight - padY;
  if (availW <= 0 || availH <= 0) return;

  // Escala que hace que el teléfono quepa entero respetando el margen.
  const scale = Math.max(Math.min(availW / frameW, availH / frameH), 0.05);

  phoneFrame.style.transform = `scale(${scale})`;
  // El wrapper adopta el tamaño YA escalado -> el layout (centrado y
  // márgenes) refleja el tamaño visual real, así nunca se desborda.
  phoneScaler.style.width = frameW * scale + 'px';
  phoneScaler.style.height = frameH * scale + 'px';
}

window.addEventListener('resize', fitPhone);
window.addEventListener('DOMContentLoaded', fitPhone);
// Primer ajuste tras pintar
setTimeout(fitPhone, 50);

/* ---------- Divisor arrastrable ---------- */
let dragging = false;

divider.addEventListener('mousedown', () => {
  dragging = true;
  document.body.classList.add('dragging');
});

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const splitWidth = document.querySelector('.split').clientWidth;
  // Limitar el ancho de la columna móvil entre 12% y 60%
  let pct = (e.clientX / splitWidth) * 100;
  pct = Math.min(Math.max(pct, 12), 60);
  paneMobile.style.flexBasis = pct + '%';
  fitPhone();
});

window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  document.body.classList.remove('dragging');
  fitPhone();
});
