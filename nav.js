(function(){
  // 방문 기록 — 모든 페이지 공통. 기기마다 랜덤 ID를 두고, 하루(KST) 한 번만 서버에 보낸다. (functions/api/visit.js)
  function kstDay(){ return new Date(Date.now()+9*3600*1000).toISOString().slice(0,10); }
  function getVid(){
    var v=localStorage.getItem('bj_vid');
    if(!v){
      v=(window.crypto&&crypto.randomUUID)?crypto.randomUUID()
        :'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (c==='x'?r:(r&3|8)).toString(16);});
      localStorage.setItem('bj_vid',v);
    }
    return v;
  }
  // needCounts=true면 집계를 받아 온다(메인 표시용). 오늘 이미 기록했고 집계도 필요 없으면 요청하지 않는다.
  window.bjVisit=function(needCounts){
    var day=kstDay(), vid=null, recorded=false;
    try{ vid=getVid(); recorded=localStorage.getItem('bj_vday')===day; }catch(e){}
    var record=!!vid&&!recorded;
    if(!record&&!needCounts) return Promise.resolve(null);
    var req=record
      ?fetch('/api/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vid:vid})})
      :fetch('/api/visit');
    return req.then(function(r){
      if(!r.ok) throw new Error('visit '+r.status);
      if(record){ try{ localStorage.setItem('bj_vday',day); }catch(e){} }
      return r.json();
    });
  };

  var p=location.pathname;
  if(p==='/'||p==='/index.html')return; // 메인은 집계 표시와 함께 직접 호출한다
  window.bjVisit(false).catch(function(){});

  var btn=document.createElement('button');
  btn.textContent='🏠 처음으로';
  btn.style.cssText='position:fixed;bottom:28px;right:28px;z-index:9999;background:#3b5998;color:#fff;border:none;cursor:pointer;padding:10px 18px;border-radius:24px;font-size:.88rem;font-weight:bold;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,.25);transition:opacity .2s';
  btn.onmouseover=function(){this.style.opacity='.82';};
  btn.onmouseout=function(){this.style.opacity='1';};
  btn.onclick=function(){location.href='/';};
  document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(btn);});
  if(document.readyState!=='loading')document.body.appendChild(btn);
})();
