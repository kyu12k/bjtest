(function(){
  var p=location.pathname;
  if(p==='/'||p==='/index.html')return;
  var btn=document.createElement('button');
  btn.textContent='🏠 처음으로';
  btn.style.cssText='position:fixed;bottom:28px;right:28px;z-index:9999;background:#3b5998;color:#fff;border:none;cursor:pointer;padding:10px 18px;border-radius:24px;font-size:.88rem;font-weight:bold;font-family:inherit;box-shadow:0 4px 12px rgba(0,0,0,.25);transition:opacity .2s';
  btn.onmouseover=function(){this.style.opacity='.82';};
  btn.onmouseout=function(){this.style.opacity='1';};
  btn.onclick=function(){location.href='/';};
  document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(btn);});
  if(document.readyState!=='loading')document.body.appendChild(btn);
})();
