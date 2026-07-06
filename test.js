(function() {
  console.log('Test script loaded!');
  try {
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
    console.log('Found ' + nodes.length + ' text nodes');
    
    // Create a simple bar
    var bar = document.createElement('div');
    bar.id = 'test-bar';
    bar.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:#007AFF;color:#fff;padding:10px;border-radius:8px;font:14px sans-serif';
    bar.textContent = 'Found ' + nodes.length + ' text nodes';
    document.body.appendChild(bar);
    console.log('Bar created');
  } catch(e) {
    console.error('Error:', e);
  }
})();
