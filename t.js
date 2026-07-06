(function() {
  'use strict';
  
  var GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
  var origTexts = new Map();
  var bar = null;
  
  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  
  function showProgress(msg) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'dl-bar';
      bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:linear-gradient(135deg,#0f2b46,#1a4b7a);color:#fff;padding:10px 18px;border-radius:10px;font:14px/1.4 -apple-system,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px';
      document.body.appendChild(bar);
    }
    bar.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:dl-spin .6s linear infinite"></div><span>' + escHtml(msg) + '</span><button onclick="window._dlRestore()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;color:#fff;margin-left:8px">原文</button>';
  }
  
  function translateGoogle(text, cb) {
    var url = GOOGLE_ENDPOINT + '?client=gtx&sl=auto&tl=zh-CN&dt=t&q=' + encodeURIComponent(text);
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', proxyUrl, true);
    xhr.timeout = 15000;
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data[0]) {
            var result = '';
            for (var i = 0; i < data[0].length; i++) {
              if (data[0][i][0]) result += data[0][i][0];
            }
            cb(null, result);
          } else cb('Empty');
        } catch(e) { cb('Parse error'); }
      } else cb('HTTP ' + xhr.status);
    };
    xhr.onerror = function() { cb('Network error'); };
    xhr.ontimeout = function() { cb('Timeout'); };
    xhr.send();
  }
  
  function collectTextNodes() {
    var nodes = [];
    var skip = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','OBJECT','EMBED','SVG','MATH','CODE','PRE','TEXTAREA','INPUT','SELECT']);
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (skip.has(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        if (node.parentElement.closest('#dl-bar')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }
  
  function translateNodes(nodes, done) {
    var idx = 0;
    var translated = 0;
    
    function next() {
      if (idx >= nodes.length) {
        done(translated);
        return;
      }
      
      var node = nodes[idx];
      var text = node.textContent.trim();
      idx++;
      
      if (!text || text.length < 2) {
        next();
        return;
      }
      
      translateGoogle(text, function(err, result) {
        if (!err && result && result !== text) {
          origTexts.set(node, node.textContent);
          node.textContent = node.textContent.replace(text, result);
          translated++;
        }
        showProgress('翻译中 ' + translated + '/' + nodes.length);
        setTimeout(next, 50);
      });
    }
    
    next();
  }
  
  function restoreOriginal() {
    origTexts.forEach(function(orig, node) {
      try { node.textContent = orig; } catch(e) {}
    });
    origTexts.clear();
    if (bar) { bar.remove(); bar = null; }
  }
  
  // Expose restore function
  window._dlRestore = restoreOriginal;
  
  // Start translation
  showProgress('准备翻译...');
  var nodes = collectTextNodes();
  showProgress('翻译中 0/' + nodes.length);
  
  translateNodes(nodes, function(count) {
    showProgress('翻译完成 ' + count + ' 段');
    setTimeout(function() { if (bar) { bar.remove(); bar = null; } }, 3000);
  });
})();
