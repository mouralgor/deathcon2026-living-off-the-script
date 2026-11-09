// Small extras: the current page's sections in the sidebar, a copy button on code
// blocks, and scrollable tables on small screens. The pages read fine without it.
(function () {
  'use strict';
  var content = document.querySelector('.content');
  if (!content) return;

  // Sections of this page in the sidebar
  var toc = document.querySelector('[data-toc]');
  var headings = Array.prototype.slice.call(content.querySelectorAll('h2[id]'));
  if (toc && headings.length) {
    var links = headings.map(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
      return a;
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = headings.indexOf(entry.target);
          links.forEach(function (a, j) { a.classList.toggle('active', i === j); });
        });
      }, { rootMargin: '-60px 0px -70% 0px' });
      headings.forEach(function (h) { observer.observe(h); });
    }
  }

  // Code blocks: language label and copy button
  var names = { esql: 'es|ql', kql: 'kql', text: 'dev tools', yaml: 'yaml' };
  Array.prototype.forEach.call(content.querySelectorAll('pre'), function (pre) {
    var host = pre.closest('div.highlighter-rouge') || pre;
    var code = pre.querySelector('code') || pre;
    var match = (host.className + ' ' + code.className).match(/language-([\w-]+)/);
    var lang = match ? match[1].toLowerCase() : '';
    var box = document.createElement('div');
    box.className = 'code';
    var bar = document.createElement('div');
    bar.className = 'code-bar';
    var label = document.createElement('span');
    label.textContent = names[lang] || lang || 'code';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = '[copy]';
    button.addEventListener('click', function () { copy(code, button); });
    bar.appendChild(label);
    bar.appendChild(button);
    host.parentNode.insertBefore(box, host);
    box.appendChild(bar);
    box.appendChild(host);
  });

  function copy(code, button) {
    var text = code.textContent.replace(/\n$/, '');
    function show(label, ok) {
      button.textContent = label;
      button.classList.toggle('done', ok);
      setTimeout(function () { button.textContent = '[copy]'; button.classList.remove('done'); }, 1800);
    }
    function select() {
      var range = document.createRange();
      range.selectNodeContents(code);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      show('[selected: ctrl+c]', false);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { show('[copied]', true); }, select);
    } else {
      select();
    }
  }

  // Tables scroll sideways on small screens; an empty header row is dropped
  Array.prototype.forEach.call(content.querySelectorAll('table'), function (table) {
    var head = table.querySelector('thead');
    if (head && !head.textContent.trim()) head.parentNode.removeChild(head);
    var wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();
