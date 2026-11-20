/*
  GA4 com consentimento (LGPD). O gtag.js só é carregado depois que o visitante aceita.
  Publicidade e personalização ficam sempre negadas (Consent Mode v2).
  Também registra cliques em contato como eventos de lead.
*/
(function () {
  var cfg = window.SHOPPLOSION_CONFIG || {};
  var id = (cfg.ga4Id || '').trim();
  if (!/^G-[A-Z0-9]+$/.test(id)) return; // sem ID valido: nada carrega

  var KEY = 'shopplosion-consent';
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', wait_for_update: 500
  });

  var loaded = false;
  function load() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', id);
  }
  function revoke() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0) {
        var d = location.hostname.replace(/^www\./, '');
        ['', '; domain=' + location.hostname, '; domain=.' + d].forEach(function (dom) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + dom;
        });
      }
    });
  }

  /* aviso de cookies */
  var css = '.ck-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:560px;margin-inline:auto;background:#0b1730;color:#fff;border-radius:14px;padding:18px 20px;border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.35);font:inherit;font-size:.9375rem;line-height:1.5}' +
    '.ck-banner p{margin:0 0 14px}.ck-banner a{color:#fff;text-decoration:underline;text-underline-offset:3px}' +
    '.ck-actions{display:flex;gap:10px;flex-wrap:wrap}.ck-actions button{font:inherit;font-weight:650;min-height:44px;padding:10px 18px;border-radius:10px;cursor:pointer;touch-action:manipulation}' +
    '.ck-accept{background:#c8185f;color:#fff;border:0}.ck-accept:hover{background:#a8124f}' +
    '.ck-decline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.55)}.ck-decline:hover{border-color:#fff}' +
    '.ck-banner button:focus-visible,.ck-prefs:focus-visible{outline:3px solid #ffc400;outline-offset:3px}' +
    '.ck-prefs{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;min-height:44px}' +
    '@media (prefers-reduced-motion:no-preference){.ck-banner{animation:ck-in .3s ease-out}}@keyframes ck-in{from{opacity:0;transform:translateY(12px)}}';
  function styles() {
    if (document.getElementById('ck-style')) return;
    var st = document.createElement('style'); st.id = 'ck-style'; st.textContent = css; document.head.appendChild(st);
  }
  var privacy = /privacidade\.html$/.test(location.pathname) ? '#dados' : 'privacidade.html';
  function banner(returnFocus) {
    styles();
    var old = document.querySelector('.ck-banner'); if (old) old.remove();
    var b = document.createElement('section');
    b.className = 'ck-banner';
    b.setAttribute('aria-label', 'Aviso de cookies');
    b.innerHTML = '<p>Usamos cookies de análise (Google Analytics) para entender como o site é usado, sempre de forma agregada. ' +
      'Nada é ativado sem a sua escolha. <a href="' + privacy + '">Saiba mais</a>.</p>' +
      '<div class="ck-actions"><button type="button" class="ck-accept">Aceitar</button><button type="button" class="ck-decline">Recusar</button></div>';
    function close(v) {
      save(v); b.remove();
      if (v === 'granted') load(); else revoke();
      if (returnFocus) returnFocus.focus();
    }
    b.querySelector('.ck-accept').addEventListener('click', function () { close('granted'); });
    b.querySelector('.ck-decline').addEventListener('click', function () { close('denied'); });
    document.body.appendChild(b);
    if (returnFocus) b.querySelector('.ck-accept').focus();
  }

  /* link para mudar a escolha, ao lado da Politica de Privacidade */
  function prefsLink() {
    var anchor = document.querySelector('footer a[href="privacidade.html"]') || document.querySelector('p > a[href="./"]');
    var host = anchor ? anchor.parentNode : document.body;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ck-prefs'; btn.textContent = 'Preferências de cookies';
    btn.addEventListener('click', function () { banner(btn); });
    host.appendChild(document.createTextNode(' '));
    host.appendChild(btn);
  }

  /* leads: cliques nos canais de contato */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !loaded) return;
    var h = a.getAttribute('href') || '';
    var m = h.indexOf('mailto:') === 0 ? 'email' : /wa\.me|whatsapp/.test(h) ? 'whatsapp' : h.indexOf('tel:') === 0 ? 'telefone' : null;
    if (m) { gtag('event', 'generate_lead', { method: m, link_url: h }); return; }
    var s = /linkedin\.com/.test(h) ? 'linkedin' : /instagram\.com/.test(h) ? 'instagram' : /orcid\.org/.test(h) ? 'orcid' : null;
    if (s) gtag('event', 'select_content', { content_type: 'perfil_social', item_id: s });
  });

  function init() {
    styles(); prefsLink();
    var c = read();
    if (c === 'granted') load();
    else if (c !== 'denied') banner(null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
