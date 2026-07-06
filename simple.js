(function() {
  console.log('Simple translate loaded!');
  
  // Test Google Translate API with proxy
  var url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=Hello');
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = 10000;
  xhr.onload = function() {
    console.log('API response: ' + xhr.status);
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        console.log('Translation result: ' + JSON.stringify(data));
        
        // Create bar
        var bar = document.createElement('div');
        bar.id = 'simple-bar';
        bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:#007AFF;color:#fff;padding:10px;border-radius:8px;font:14px sans-serif';
        bar.textContent = 'Translation: ' + (data[0][0][0] || 'No result');
        document.body.appendChild(bar);
      } catch(e) {
        console.error('Parse error:', e);
      }
    }
  };
  xhr.onerror = function(e) {
    console.error('Network error:', e);
  };
  xhr.send();
})();
