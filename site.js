// Shared page behavior: scroll reveals, Fairbanks clock, typing terminal, travel map.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onVisible(el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); }
      });
    }, { threshold: threshold || 0.15 });
    io.observe(el);
  }

  // Scroll reveals
  document.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) {
    onVisible(el, function (t) { t.classList.add('in'); });
  });

  // Current time in Fairbanks
  var clock = document.getElementById('local-time');
  if (clock && window.Intl) {
    var tick = function () {
      try {
        var t = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Anchorage', hour: 'numeric', minute: '2-digit'
        }).format(new Date()).toLowerCase();
        clock.textContent = '. It’s ' + t + ' here.';
      } catch (e) { clock.textContent = ''; }
    };
    tick();
    setInterval(tick, 30000);
  }

  // Terminal that types its commands out once it scrolls into view
  document.querySelectorAll('[data-typing]').forEach(function (pre) {
    var lines = pre.textContent.replace(/^\n+|\s+$/g, '').split('\n');
    if (reduce) { return; }
    pre.setAttribute('aria-label', lines.join('\n'));
    pre.textContent = '';

    onVisible(pre, function () {
      var caret = document.createElement('span');
      caret.className = 'caret';
      var li = 0;

      function nextLine() {
        if (li >= lines.length) { pre.appendChild(caret); return; }
        var line = lines[li++];
        if (line.trim() === '' || line.trim().charAt(0) === '#') {
          var span = document.createElement('span');
          if (line.trim()) span.className = 'c';
          span.textContent = line + '\n';
          pre.appendChild(span);
          setTimeout(nextLine, line.trim() ? 160 : 60);
          return;
        }
        var prompt = document.createElement('span');
        prompt.className = 'p';
        prompt.textContent = '$ ';
        var cmd = document.createElement('span');
        pre.appendChild(prompt);
        pre.appendChild(cmd);
        pre.appendChild(caret);
        var ci = 0;
        (function typeChar() {
          if (ci < line.length) {
            cmd.textContent += line.charAt(ci++);
            setTimeout(typeChar, 22 + Math.random() * 38);
          } else {
            cmd.textContent += '\n';
            setTimeout(nextLine, 380);
          }
        })();
      }
      nextLine();
    }, 0.4);
  });

  // Travel map: play the sequence on view, highlight a place on hover/focus
  var map = document.querySelector('.map');
  if (map) {
    onVisible(map, function () { map.classList.add('play'); }, 0.3);

    var setFocus = function (id) {
      map.classList.toggle('focus', !!id);
      map.querySelectorAll('[data-place]').forEach(function (n) {
        n.classList.toggle('on', n.getAttribute('data-place') === id);
      });
      document.querySelectorAll('.places [data-place]').forEach(function (n) {
        n.classList.toggle('on', n.getAttribute('data-place') === id);
      });
    };
    var bind = function (el) {
      var id = el.getAttribute('data-place');
      el.addEventListener('mouseenter', function () { setFocus(id); });
      el.addEventListener('mouseleave', function () { setFocus(null); });
      el.addEventListener('focus', function () { setFocus(id); });
      el.addEventListener('blur', function () { setFocus(null); });
    };
    document.querySelectorAll('.places [data-place], .map .pin').forEach(bind);
  }
})();
