(function(){var b=document.getElementById('theme');if(!b)return;var r=document.documentElement;
function cur(){return r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
function lab(){b.setAttribute('aria-label','Switch to '+(cur()==='dark'?'light':'dark')+' theme');}
lab();b.addEventListener('click',function(){var t=cur()==='dark'?'light':'dark';r.dataset.theme=t;try{localStorage.setItem('jm-theme',t);}catch(e){}lab();});})();
