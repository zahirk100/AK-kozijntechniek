/* AK Kozijntechniek: kozijnsamensteller en contactformulier. Geen externe bibliotheken. */
(function () {
  'use strict';

  var PHONE = '31639282968';

  /* ---------- Kozijnsamensteller ---------- */
  var root = document.querySelector('[data-configurator]');
  if (root) {
    var COLORS = [
      { id: 'antraciet', name: 'Antracietgrijs', code: 'RAL 7016', hex: '#383E42', dark: true },
      { id: 'zwart', name: 'Gitzwart', code: 'RAL 9005', hex: '#0B0B0D', dark: true },
      { id: 'kwarts', name: 'Kwartsgrijs', code: 'RAL 7039', hex: '#6C6960', dark: true },
      { id: 'creme', name: 'Crèmewit', code: 'RAL 9001', hex: '#E9E0D2', dark: false },
      { id: 'wit', name: 'Verkeerswit', code: 'RAL 9016', hex: '#F7F9F7', dark: false },
      { id: 'eiken', name: 'Eiken houtnerf', code: 'Houtlook', hex: '#8A5E3C', dark: true }
    ];
    var TYPES = [
      { id: 'draaikiep', name: 'Draai-kiepraam', modes: ['dicht', 'kiep', 'open'] },
      { id: 'vast', name: 'Vast raam', modes: [] },
      { id: 'deuren', name: 'Tuindeuren', modes: ['dicht', 'open'] },
      { id: 'voordeur', name: 'Voordeur', modes: ['dicht', 'open'] }
    ];
    var WALLS = [
      { id: 'baksteen', name: 'Baksteen', css: 'repeating-linear-gradient(180deg, #8E5140 0px, #8E5140 22px, #744033 22px, #744033 24px)' },
      { id: 'stuc', name: 'Wit stucwerk', css: '#ECEAE4' },
      { id: 'donker', name: 'Donkere gevel', css: 'repeating-linear-gradient(90deg, #2F3437 0px, #2F3437 58px, #1F2326 58px, #1F2326 60px)' }
    ];
    var GLASSES = [{ id: 'hr', name: 'HR++ glas' }, { id: 'triple', name: 'Triple glas' }];
    var MODE_NAMES = { dicht: 'Dicht', kiep: 'Kiepstand', open: 'Open' };

    var state = { colors: 'antraciet', types: 'draaikiep', walls: 'baksteen', glasses: 'hr', modes: 'dicht', origin: '0% 50%' };

    var find = function (list, id) {
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return list[0];
    };
    var escapeHtml = function (v) {
      return String(v).replace(/[&<>"]/g, function (ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
      });
    };
    var fill = function (name, items) {
      var tpl = root.querySelector('template[data-tpl="' + name + '"]');
      var slot = root.querySelector('[data-list="' + name + '"]');
      if (!tpl || !slot) return;
      var html = tpl.innerHTML;
      slot.innerHTML = items.map(function (item) {
        return html.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, key) { return escapeHtml(item[key]); });
      }).join('');
    };
    var pill = function (on) {
      return { bg: on ? '#FFFFFF' : 'transparent', fg: on ? '#101315' : '#FFFFFF' };
    };

    var render = function () {
      var color = find(COLORS, state.colors);
      var type = find(TYPES, state.types);
      var wall = find(WALLS, state.walls);
      var glass = find(GLASSES, state.glasses);
      if (type.modes.indexOf(state.modes) < 0) state.modes = 'dicht';
      var mode = state.modes;

      fill('colors', COLORS.map(function (c) {
        var on = c.id === color.id;
        return { id: c.id, name: c.name, hex: c.hex, on: on, ring: on ? '0 0 0 3px #1B1F22, 0 0 0 6px #FFFFFF' : 'none' };
      }));
      [['types', TYPES, type], ['walls', WALLS, wall], ['glasses', GLASSES, glass]].forEach(function (g) {
        fill(g[0], g[1].map(function (x) {
          var on = x.id === g[2].id, p = pill(on);
          return { id: x.id, name: x.name, on: on, bg: p.bg, fg: p.fg };
        }));
      });
      fill('modes', type.modes.map(function (m) {
        var on = m === mode;
        return { id: m, name: MODE_NAMES[m], on: on, bg: on ? '#101315' : '#FFFFFF', fg: on ? '#FFFFFF' : '#101315' };
      }));

      var open = mode === 'open';
      var vars = {
        '--frame': color.hex,
        '--edge': color.dark ? 'rgba(255,255,255,0.24)' : 'rgba(16,19,21,0.26)',
        '--handle': color.dark ? '#D5DADE' : '#2A2F33',
        '--wall': wall.css,
        '--sash-o': state.origin,
        '--sash-t': mode === 'kiep' ? 'rotateX(15deg)' : open ? 'rotateY(62deg)' : 'none',
        '--leaf-l': open ? 'rotateY(66deg)' : 'none',
        '--leaf-r': open ? 'rotateY(-66deg)' : 'none'
      };
      Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });

      var show = {
        isRaam: type.id === 'draaikiep' || type.id === 'vast',
        hasHandle: type.id === 'draaikiep',
        isDeuren: type.id === 'deuren',
        isVoordeur: type.id === 'voordeur'
      };
      Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) {
        el.hidden = !show[el.getAttribute('data-show')];
      });

      var text = { colorName: color.name, colorCode: color.code, typeName: type.name, glassName: glass.name };
      Array.prototype.forEach.call(root.querySelectorAll('[data-t]'), function (el) {
        el.textContent = text[el.getAttribute('data-t')];
      });

      var msg = 'Hallo AK Kozijntechniek, ik wil graag een prijs voor: ' + type.name + ' in ' + color.name +
        ' (' + color.code + '), ' + glass.name + '.';
      var link = root.querySelector('[data-href="waChoice"]');
      if (link) link.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
    };

    root.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-pick]');
      if (!btn || !root.contains(btn)) return;
      var slot = btn.closest('[data-list]');
      if (!slot) return;
      var list = slot.getAttribute('data-list');
      var id = btn.getAttribute('data-pick');
      state[list] = id;
      if (list === 'types') state.modes = 'dicht';
      if (list === 'modes' && id === 'kiep') state.origin = '50% 100%';
      if (list === 'modes' && id === 'open') state.origin = '0% 50%';
      render();
    });

    render();
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
