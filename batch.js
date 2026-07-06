(function() {
  console.log('Batch test loaded!');
  
  var GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
  
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
  
  // Test with a simple batch
  var SEP = '\n\n|||---|||\n\n';
  var texts = ['Hello', 'World', 'Test'];
  var combined = texts.join(SEP);
  
  console.log('Combined text: ' + combined);
  
  translateGoogle(combined, 'ZH', function(err, result) {
    console.log('Translation result: ' + result);
    
    if (err) {
      console.error('Error: ' + err);
      return;
    }
    
    // Try to split the result
    var parts = result.split(/\n\s*\|\|\|---\|\|\|\s*\n/);
    console.log('Parts after split: ' + parts.length);
    
    if (parts.length < texts.length) {
      parts = result.split(/\n{2,}/);
      console.log('Parts after second split: ' + parts.length);
    }
    
    // Create bar
    var bar = document.createElement('div');
    bar.id = 'batch-bar';
    bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:#007AFF;color:#fff;padding:10px;border-radius:8px;font:14px sans-serif';
    bar.innerHTML = 'Result: ' + parts.join(' | ');
    document.body.appendChild(bar);
  });
})();
