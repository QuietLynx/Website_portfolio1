// Small UI interactions: nav toggle, smooth scroll, form handling
document.addEventListener('DOMContentLoaded', ()=>{
  // Year in footer
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  const menuBtn = document.getElementById('menu-btn');
  const siteNav = document.getElementById('site-nav');
  if(menuBtn && siteNav){
    menuBtn.addEventListener('click', ()=>{
      siteNav.classList.toggle('open');
      // simple inline style toggle for small screens
      if(siteNav.classList.contains('open')){
        siteNav.style.display = 'block';
      } else {
        siteNav.style.display = '';
      }
    });
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href.length>1 && document.querySelector(href)){
        e.preventDefault();
        document.querySelector(href).scrollIntoView({behavior:'smooth', block:'start'});
        // close nav on small screens after selection
        if(siteNav && siteNav.classList.contains('open')){
          siteNav.classList.remove('open');
          siteNav.style.display = '';
        }
      }
    })
  });

  // Simple client-side contact form handling (no backend)
  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if(!name || !email || !message){
        alert('Please complete all fields.');
        return;
      }
      // In real site you'd POST to a server or use an email service.
      alert('Thanks, ' + name + '! Your message was received (demo).');
      form.reset();
    });
  }
});