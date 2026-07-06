(function() {
  console.log('Page translate loaded!');
  
  var GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
  var translated = 0;
  var total = 0;
  var origTexts = new Map();
  
  function translateGoogle(text, tl, cb) {
    var directUrl = GOOGLE_ENDPOINT + '?client=gtx&sl=auto&tl=' + (tl === 'ZH' ? 'zh-CN' : tl.toLowerCase()) + '&dt=t&q=' + encodeURIComponent(text);
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(directUrl);
    
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
          } else cb('Empty response');
        } catch(e) { cb('Parse error: ' + e.message); }
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
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }
  
  function translateNode(node, callback) {
    var text = node.textContent.trim();
    if (!text || text.length < 2) { callback(); return; }
    
    translateGoogle(text, 'ZH', function(err, result) {
      if (!err && result) {
        origTexts.set(node, node.textContent);
        node.textContent = node.textContent.replace(text, result);
        translated++;
      }
      callback();
    });
  }
  
  function startTranslate() {
    var nodes = collectTextNodes();
    total = nodes.length;
    translated = 0;
    
    // Create progress bar
    var bar = document.createElement('div');
    bar.id = 'translate-bar';
    bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:linear-gradient(135deg,#0f2b46,#1a4b7a);color:#fff;padding:10px 18px;border-radius:10px;font:14px/1.4 -apple-system,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px';
    bar.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite"></div><span>翻译中 0/' + total + '</span>';
    document.body.appendChild(bar);
    
    // Translate nodes one by one
    var idx = 0;
    function next() {
      if (idx >= nodes.length) {
        bar.innerHTML = '<span>翻译完成 ' + total + ' 段</span>';
        setTimeout(function() { bar.remove(); }, 3000);
        return;
      }
      
      translateNode(nodes[idx], function() {
        idx++;
        bar.querySelector('span').textContent = '翻译中 ' + translated + '/' + total;
        setTimeout(next, 100);
      });
    }
    next();
  }
  
  // Start translation
  startTranslate();
})();
