document.addEventListener('DOMContentLoaded', () => {
  const btn=document.getElementById('hamburger-btn'); const menu=document.getElementById('hamburger-menu');
  if(btn&&menu){btn.addEventListener('click',e=>{e.stopPropagation();menu.classList.toggle('open')});document.addEventListener('click',()=>menu.classList.remove('open'));}
  const clock=document.getElementById('footer-clock');
  const tick=()=>{if(!clock)return; const d=new Date(); clock.textContent=d.toLocaleString('en-US',{weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});};
  tick(); setInterval(tick,1000);
});
