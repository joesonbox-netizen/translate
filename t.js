(function() {
  'use strict';
  var API = 'https://translate.googleapis.com/translate_a/single';
  var BATCH_SIZE = 3000;
  var CONCURRENCY = 8;
  var SEP = '🎴🎴🎴';
  var origTexts = new Map();
  var bar = null;

  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

  function showBar(msg){
    if(!bar){bar=document.createElement('div');bar.id='dl-bar';bar.style.cssText='position:fixed;top:12px;right:12px;z-index:2147483647;background:linear-gradient(135deg,#0f2b46,#1a4b7a);color:#fff;padding:10px 18px;border-radius:10px;font:14px/1.4 -apple-system,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px';document.body.appendChild(bar)}
    bar.innerHTML='<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:dl-spin .6s linear infinite"></div><span>'+esc(msg)+'</span><button onclick="window._dlRestore()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;color:#fff;margin-left:8px">原文</button>'
  }

  function translate(text,cb){
    var url=API+'?client=gtx&sl=auto&tl=zh-CN&dt=t&q='+encodeURIComponent(text);
    var proxy='https://api.allorigins.win/raw?url='+encodeURIComponent(url);
    var xhr=new XMLHttpRequest();
    xhr.open('GET',proxy,true);xhr.timeout=20000;
    xhr.onload=function(){
      if(xhr.status===200){try{var d=JSON.parse(xhr.responseText);if(d&&d[0]){var r='';for(var i=0;i<d[0].length;i++)if(d[0][i][0])r+=d[0][i][0];cb(null,r)}else cb('empty')}catch(e){cb('parse')}}
      else cb('http:'+xhr.status)};
    xhr.onerror=function(){cb('net')};xhr.ontimeout=function(){cb('timeout')};xhr.send()
  }

  function collectNodes(){
    var nodes=[],skip=new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','OBJECT','EMBED','SVG','MATH','CODE','PRE','TEXTAREA','INPUT','SELECT']);
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.textContent.trim())return NodeFilter.FILTER_REJECT;
      if(skip.has(n.parentElement.tagName))return NodeFilter.FILTER_REJECT;
      if(n.parentElement.closest&&n.parentElement.closest('#dl-bar'))return NodeFilter.FILTER_REJECT;
      var t=n.textContent.trim();if(t.length<2)return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT}});
    while(w.nextNode())nodes.push(w.currentNode);return nodes
  }

  function buildBatches(nodes){
    var batches=[],cur=[],len=0;
    for(var i=0;i<nodes.length;i++){
      var t=nodes[i].textContent.trim();if(!t)continue;
      if(len+t.length>BATCH_SIZE&&cur.length>0){batches.push(cur);cur=[];len=0}
      cur.push({node:nodes[i],text:t});len+=t.length}
    if(cur.length>0)batches.push(cur);return batches
  }

  function translateBatch(batch,cb){
    var texts=batch.map(function(b){return b.text});
    var combined=texts.join(SEP);
    var retries=0;
    function attempt(){
      translate(combined,function(err,result){
        if(err&&retries<2){retries++;setTimeout(attempt,500);return}
        if(err){cb(err);return}
        var parts=result.split(SEP);
        if(parts.length<batch.length){
          parts=result.split(/\n{2,}/);
          if(parts.length<batch.length){
            for(var j=parts.length;j<batch.length;j++)parts.push(batch[j].text)}}
        cb(null,parts)})}
    attempt()
  }

  window._dlRestore=function(){
    origTexts.forEach(function(orig,n){try{n.textContent=orig}catch(e){}});
    origTexts.clear();if(bar){bar.remove();bar=null}
  };

  showBar('准备翻译...');
  var nodes=collectNodes();
  if(nodes.length===0){showBar('没有可翻译内容');setTimeout(function(){if(bar)bar.remove()},2000);return}
  var batches=buildBatches(nodes);
  var total=batches.length,done=0,fail=0,idx=0,active=0;

  function next(){
    if(idx>=total&&active===0){
      showBar('翻译完成 '+done+'/'+total+' 批');
      setTimeout(function(){if(bar){bar.remove();bar=null}},5000);return}
    while(active<CONCURRENCY&&idx<total){
      (function(bi){
        var batch=batches[bi];active++;
        translateBatch(batch,function(err,parts){
          active--;
          if(err){fail++;done++}
          else{
            for(var i=0;i<batch.length;i++){
              if(parts[i]&&parts[i]!==batch[i].text){
                origTexts.set(batch[i].node,batch[i].node.textContent);
                batch[i].node.textContent=batch[i].node.textContent.replace(batch[i].text,parts[i])}}
            done++}
          showBar('翻译中 '+done+'/'+total+(fail?' ('+fail+'失败)':''));
          setTimeout(next,50)})})(idx);idx++}
  }
  next()
})();
