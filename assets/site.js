/* AK Kozijntechniek: mobiel menu, contactformulier en het laden van de kozijnsamensteller. */
(function () {
  'use strict';

  var PHONE = '31639282968';

  /* ---------- Kozijnsamensteller: pas laden als de bezoeker in de buurt komt ---------- */
  var cfg = document.querySelector('[data-configurator]');
  if (cfg) {
    var loaded = false;
    var load = function () {
      if (loaded) return;
      loaded = true;
      import(new URL('assets/configurator.js', document.baseURI).href)
        .then(function (mod) { mod.init(cfg); })
        .catch(function () {
          var side = cfg.querySelector('[data-cfg-side]');
          if (side) side.innerHTML = '<p class="cfg-loading">De samensteller kon niet worden geladen. <a href="#offerte" style="color:#fff">Vraag direct een offerte aan</a>.</p>';
        });
    };
    if ('IntersectionObserver' in window) {
      /* de contactbalk onderaan wijkt zolang de samensteller in beeld is */
      new IntersectionObserver(function (entries) {
        document.documentElement.classList.toggle('cfg-active', entries[0].isIntersecting);
      }, { rootMargin: '-35% 0px -35% 0px' }).observe(cfg);
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
      }, { rootMargin: '800px 0px' });
      io.observe(cfg);
    } else {
      load();
    }
  }

  /* ---------- Contactformulier: opent WhatsApp met de ingevulde aanvraag ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var data = new FormData(form);
      var lines = [
        'Hallo AK Kozijntechniek, ik wil graag een offerte.',
        'Het gaat om: ' + (data.get('dienst') || 'Plaatsen'),
        'Naam: ' + (data.get('naam') || ''),
        'Telefoon: ' + (data.get('telefoon') || '')
      ];
      var note = (data.get('bericht') || '').trim();
      if (note) lines.push('Toelichting: ' + note);
      window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* ---------- Mobiel menu: sluit na een keuze of met Escape ---------- */
  var menu = document.querySelector('details.mnav');
  if (menu) {
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) menu.open = false;
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') menu.open = false;
    });
  }
})();
