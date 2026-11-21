(()=>{
 const logo=document.querySelector('.official-logo');const fallback=document.querySelector('.brand-fallback');if(logo){const show=()=>{logo.hidden=false;if(fallback)fallback.hidden=true;};if(logo.complete&&logo.naturalWidth>0)show();else logo.addEventListener('load',show,{once:true});}
 const header=document.querySelector('.site-header');
 const toggle=document.querySelector('.menu-toggle');
 const mobile=document.querySelector('.mobile-nav');
 const scroll=()=>header?.classList.toggle('is-scrolled',window.scrollY>30);
 scroll();addEventListener('scroll',scroll,{passive:true});
 toggle?.addEventListener('click',()=>{
  const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');mobile.hidden=!open;document.body.classList.toggle('menu-open',open);
 });
 mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;document.body.classList.remove('menu-open');toggle?.setAttribute('aria-expanded','false');}));
 const targets=document.querySelectorAll('.reveal');
 if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}}, {threshold:.08,rootMargin:'0px 0px -30px 0px'});targets.forEach(t=>obs.observe(t));}else targets.forEach(t=>t.classList.add('visible'));
 const search=document.getElementById('article-search');const filters=document.querySelectorAll('.filter-btn');let category='all';
 const apply=()=>{let visible=0;document.querySelectorAll('.filterable').forEach(item=>{let q=(search?.value||'').trim().toLocaleLowerCase('es');let ok=(category==='all'||item.dataset.category===category)&&(!q||item.dataset.title.includes(q));item.hidden=!ok;if(ok)visible++;});const empty=document.getElementById('no-results');if(empty)empty.hidden=visible!==0;};
 search?.addEventListener('input',apply);filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;filters.forEach(x=>{let on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});apply();}));
 const form=document.getElementById('contact-form');const status=document.getElementById('form-status');
 form?.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const button=form.querySelector('button[type=submit]');const payload=Object.fromEntries(new FormData(form));payload.privacy=Boolean(form.querySelector('[name=privacy]').checked);
  button.disabled=true;status.className='form-status';status.textContent='Enviando tu consulta...';
  try{const res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let data={};try{data=await res.json();}catch{};
   if(!res.ok)throw new Error(data.error||'No se pudo enviar. Prueba de nuevo o escribe al correo indicado.');
   status.className='form-status success';status.textContent=data.confirmationSent?'Consulta enviada. Te hemos enviado un correo de confirmación.':'Consulta recibida. No ha sido posible enviar el correo de confirmación, pero Fernando tiene tu mensaje.';form.reset();
  }catch(e){status.className='form-status error';status.textContent=e.message||'No se pudo enviar la consulta.';}
  finally{button.disabled=false;}
 });
})();
