/* ======================================================================
   SETTINGS — fill these in
   ====================================================================== */
const CONFIG = {
  // Your webhook endpoint (must be https and send CORS headers for this site).
  webhookUrl: '',            // e.g. 'https://n8n.example.com/webhook/portfolio-contact'

  // Cloudflare Turnstile site key (public). Leave empty to run without it.
  // Your webhook must verify the token server-side for this to protect anything.
  turnstileSiteKey: ''       // e.g. '0x4AAAAAAA...'
};

/* ======================================================================
   YouTube embeds — reads data-youtube-id on each .video element
   ====================================================================== */
document.querySelectorAll('.video').forEach((el) => {
  const id = (el.dataset.youtubeId || '').trim();
  if (!id || id === 'REPLACE_ME') {
    el.innerHTML = '<div class="video__placeholder">YouTube video — add its ID in index.html (data-youtube-id)</div>';
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0';
  iframe.title = el.dataset.title || 'YouTube video';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  el.appendChild(iframe);
});

/* ======================================================================
   Footer year
   ====================================================================== */
document.getElementById('year').textContent = new Date().getFullYear();

/* ======================================================================
   Contact form → webhook
   ====================================================================== */
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const submitBtn = form.querySelector('button[type="submit"]');
let turnstileWidgetId = null;

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'form__status' + (kind ? ' ' + kind : '');
}

// Load Turnstile only when a site key is configured
if (CONFIG.turnstileSiteKey) {
  window.onTurnstileLoad = function () {
    turnstileWidgetId = window.turnstile.render('#turnstile-slot', {
      sitekey: CONFIG.turnstileSiteKey,
      theme: 'dark'
    });
  };
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('', '');

  const data = Object.fromEntries(new FormData(form).entries());

  // Honeypot filled → silently pretend success
  if (data.website) {
    form.reset();
    setStatus('Thanks — your message has been sent.', 'ok');
    return;
  }

  if (!data.name.trim() || !data.message.trim() || !/^\S+@\S+\.\S+$/.test(data.email)) {
    setStatus('Please fill in your name, a valid email and a message.', 'err');
    return;
  }

  if (!CONFIG.webhookUrl) {
    setStatus('The contact form isn’t set up yet — please use the links above.', 'err');
    return;
  }

  let token = '';
  if (CONFIG.turnstileSiteKey) {
    token = window.turnstile ? window.turnstile.getResponse(turnstileWidgetId) : '';
    if (!token) {
      setStatus('Please complete the check above the button.', 'err');
      return;
    }
  }

  submitBtn.disabled = true;
  setStatus('Sending…', '');

  try {
    const res = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
        turnstileToken: token,
        page: location.href,
        sentAt: new Date().toISOString()
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    form.reset();
    setStatus('Thanks — your message has been sent.', 'ok');
  } catch (err) {
    setStatus('Sorry, that didn’t go through. Please try again, or use the links above.', 'err');
  } finally {
    submitBtn.disabled = false;
    if (CONFIG.turnstileSiteKey && window.turnstile) window.turnstile.reset(turnstileWidgetId);
  }
});
