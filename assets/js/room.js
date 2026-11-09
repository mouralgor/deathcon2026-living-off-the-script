// Turns each page's sections into TryHackMe-style task cards, adds the task list,
// progress ticks, terminal-style code blocks with a copy button, and table touches.
// The pages read fine without it.
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var content = document.querySelector('.content');
  if (!content) return;
  var room = content.closest('.room');
  var numbered = content.getAttribute('data-numbered') === 'true';
  var tracksProgress = content.hasAttribute('data-progress');
  var storeKey = 'lots-progress:' + location.pathname;
  var done = readDone();

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
  var ICON = {
    check: SVG + ' stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>',
    chevron: SVG + ' stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
    copy: SVG + ' stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };
  var ESQL_WORDS = /^(FROM|WHERE|AND|OR|NOT|IN|KEEP|SORT|STATS|BY|DESC|ASC|EVAL|LIMIT|RLIKE|LIKE|COUNT|COUNT_DISTINCT|TO_LOWER)$/;
  var KQL_WORDS = /^(and|or|not)$/;
  var LANG = { esql: 'ES|QL', kql: 'KQL', eql: 'EQL', text: 'Dev Tools', yaml: 'YAML', powershell: 'PowerShell', bash: 'Shell', shell: 'Shell' };

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }
  function readDone() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storeKey) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (e) { return []; }
  }
  function writeDone() {
    try { window.localStorage.setItem(storeKey, JSON.stringify(done)); } catch (e) { /* private mode */ }
  }

  // ---------- Task cards ----------
  var tasks = [];
  var frag = document.createDocumentFragment();
  var intro = el('div', 'intro');
  var current = null;
  Array.prototype.slice.call(content.childNodes).forEach(function (node) {
    if (node.nodeType === 1 && node.tagName === 'H2') {
      current = makeTask(node, tasks.length + 1);
      tasks.push(current);
      frag.appendChild(current.section);
    } else if (current) {
      current.body.appendChild(node);
    } else {
      intro.appendChild(node);
    }
  });
  if (intro.children.length) frag.insertBefore(intro, frag.firstChild);
  content.appendChild(frag);

  function makeTask(h2, n) {
    var label = h2.getAttribute('data-label') || '';
    var match = h2.textContent.trim().match(/^Task\s+(\d+)\s*:\s*(.+)$/i);
    if (match) {
      label = 'Task ' + match[1];
      h2.textContent = match[2];
    } else if (!label && numbered) {
      label = 'Task ' + n;
    }
    if (!h2.id) h2.id = 'task-' + n;

    var section = el('section', 'task');
    section.setAttribute('aria-labelledby', h2.id);
    var head = el('div', 'task-head');
    var marker;
    if (tracksProgress) {
      marker = el('button', 'task-check');
      marker.type = 'button';
      marker.innerHTML = ICON.check;
      marker.setAttribute('aria-label', 'Mark "' + h2.textContent + '" as done');
      marker.setAttribute('aria-pressed', 'false');
    } else {
      marker = el('span', 'task-dot');
      marker.setAttribute('aria-hidden', 'true');
    }
    var title = el('div', 'task-title');
    if (label) title.appendChild(el('span', 'task-num', label));
    title.appendChild(h2);
    var body = el('div', 'task-body');
    body.id = h2.id + '-body';
    var toggle = el('button', 'task-toggle');
    toggle.type = 'button';
    toggle.innerHTML = ICON.chevron;
    toggle.setAttribute('aria-controls', body.id);

    head.appendChild(marker);
    head.appendChild(title);
    head.appendChild(toggle);
    section.appendChild(head);
    section.appendChild(body);

    var task = { id: h2.id, label: label, title: h2.textContent, section: section, body: body, marker: marker, toggle: toggle };
    setOpen(task, true);
    head.addEventListener('click', function (event) {
      if (event.target.closest('.task-check, a')) return;
      setOpen(task, section.classList.contains('collapsed'));
    });
    if (tracksProgress) marker.addEventListener('click', function () { toggleDone(task); });
    return task;
  }

  function setOpen(task, open) {
    task.section.classList.toggle('collapsed', !open);
    task.body.hidden = !open;
    task.toggle.setAttribute('aria-expanded', String(open));
    task.toggle.setAttribute('aria-label', (open ? 'Collapse "' : 'Expand "') + task.title + '"');
  }

  function toggleDone(task) {
    var i = done.indexOf(task.id);
    if (i >= 0) done.splice(i, 1); else done.push(task.id);
    writeDone();
    renderProgress();
  }

  function renderProgress() {
    var count = 0;
    tasks.forEach(function (task) {
      var isDone = done.indexOf(task.id) >= 0;
      if (isDone) count++;
      task.section.classList.toggle('done', isDone);
      if (tracksProgress) task.marker.setAttribute('aria-pressed', String(isDone));
      if (task.link) task.link.classList.toggle('done', isDone);
    });
    var pct = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
    var bar = document.querySelector('[data-progress-bar]');
    var value = document.querySelector('[data-progress-value]');
    if (bar) bar.style.width = pct + '%';
    if (value) value.textContent = pct + '%';
  }

  // ---------- Task list in the sidebar ----------
  var index = document.querySelector('.task-index');
  if (index && room && tasks.length > 1) {
    room.classList.add('has-sidebar');
    tasks.forEach(function (task) {
      var li = el('li');
      var link = el('a');
      link.href = '#' + task.id;
      var dot = el('span', 'ti-dot');
      dot.innerHTML = ICON.check;
      var text = el('span', 'ti-text');
      if (task.label) text.appendChild(el('small', '', task.label));
      text.appendChild(document.createTextNode(task.title));
      link.appendChild(dot);
      link.appendChild(text);
      link.addEventListener('click', function () { setOpen(task, true); });
      li.appendChild(link);
      index.appendChild(li);
      task.link = link;
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tasks.forEach(function (task) { task.link.classList.toggle('active', task.section === entry.target); });
        });
      }, { rootMargin: '-100px 0px -60% 0px' });
      tasks.forEach(function (task) { observer.observe(task.section); });
    }
  }
  renderProgress();

  function openTarget() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    tasks.forEach(function (task) { if (task.section.contains(target)) setOpen(task, true); });
  }
  window.addEventListener('hashchange', openTarget);
  openTarget();

  // ---------- Code blocks as terminal windows ----------
  Array.prototype.forEach.call(content.querySelectorAll('pre'), function (pre) {
    var host = pre.closest('div.highlighter-rouge') || pre;
    var code = pre.querySelector('code') || pre;
    var match = (host.className + ' ' + code.className).match(/language-([\w-]+)/);
    var lang = match ? match[1].toLowerCase() : '';
    var raw = code.textContent.replace(/\n$/, '');
    if ((lang === 'esql' || lang === 'kql') && !code.querySelector('span')) code.innerHTML = highlight(raw, lang);

    var box = el('div', 'terminal');
    var bar = el('div', 'terminal-bar');
    bar.innerHTML = '<span class="terminal-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    bar.appendChild(el('span', 'terminal-lang', LANG[lang] || (lang ? lang.toUpperCase() : 'Code')));
    var button = el('button', 'copy-btn');
    button.type = 'button';
    button.innerHTML = ICON.copy + '<span>Copy</span>';
    button.addEventListener('click', function () { copyText(raw, button, code); });
    bar.appendChild(button);
    host.parentNode.insertBefore(box, host);
    box.appendChild(bar);
    box.appendChild(host);
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function highlight(src, lang) {
    var re = /("(?:[^"\\]|\\.)*")|([@A-Za-z_][\w.@]*)|(\|)|(==|!=|>=|<=|[:<>])/g;
    var out = '';
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      out += escapeHtml(src.slice(last, m.index));
      if (m[1]) {
        out += '<span class="tok-str">' + escapeHtml(m[1]) + '</span>';
      } else if (m[2]) {
        var word = m[2];
        if ((lang === 'esql' ? ESQL_WORDS : KQL_WORDS).test(word)) out += '<span class="tok-kw">' + word + '</span>';
        else if (/[.@]/.test(word)) out += '<span class="tok-field">' + escapeHtml(word) + '</span>';
        else out += escapeHtml(word);
      } else if (m[3]) {
        out += '<span class="tok-pipe">|</span>';
      } else {
        out += '<span class="tok-op">' + escapeHtml(m[4]) + '</span>';
      }
      last = re.lastIndex;
    }
    return out + escapeHtml(src.slice(last));
  }

  function copyText(text, button, code) {
    function flash(label, ok) {
      button.classList.toggle('copied', ok);
      button.lastChild.textContent = label;
      setTimeout(function () {
        button.classList.remove('copied');
        button.lastChild.textContent = 'Copy';
      }, 1800);
    }
    function copied() { flash('Copied', true); }
    function selectForManualCopy() {
      var range = document.createRange();
      range.selectNodeContents(code);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      flash('Selected: press Ctrl+C', false);
    }
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) copied(); else selectForManualCopy();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(copied, fallback);
    else fallback();
  }

  // ---------- Tables ----------
  Array.prototype.forEach.call(content.querySelectorAll('table'), function (table) {
    var head = table.querySelector('thead');
    if (head && !head.textContent.trim()) {
      head.parentNode.removeChild(head);
      table.classList.add('kv');
    }
    var wrap = el('div', 'table-wrap');
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
    Array.prototype.forEach.call(table.querySelectorAll('td'), function (cell) {
      var value = cell.textContent.trim().toLowerCase();
      if (!cell.children.length && /^(critical|high|medium|low|informational)$/.test(value)) {
        cell.textContent = '';
        cell.appendChild(el('span', 'level level-' + value, value));
      }
    });
    Array.prototype.forEach.call(table.querySelectorAll('td > a'), function (link) {
      if (/^R\d+[a-z]?$/.test(link.textContent.trim())) link.classList.add('rule-id');
    });
  });

  // ---------- Question leads in the lab guide ----------
  Array.prototype.forEach.call(content.querySelectorAll('.task-body > p'), function (p) {
    var first = p.firstChild;
    while (first && first.nodeType === 3 && !first.textContent.trim()) first = first.nextSibling;
    if (first && first.nodeType === 1 && first.tagName === 'STRONG' && /\.$/.test(first.textContent.trim())) p.classList.add('lead');
  });
})();
