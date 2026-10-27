# Hugo Flodin — portfolio site

Static site for GitHub Pages: plain HTML, CSS and JavaScript, no build step.

```
index.html     page content
styles.css     all styling (colours are CSS variables at the top)
script.js      settings, YouTube embeds, contact form
images/        portrait, about banner, work-01 … work-06
icons/         social icons (swap for official logos, keep the file names)
```

## 1. Fill in the content

In `index.html`, search for `REPLACE_ME` and `[` to find every placeholder:

- **Work images**: overwrite `images/work-01.jpg` … `work-06.jpg` (4:3 looks best), and update titles, years and `alt` text.
- **About banner**: overwrite `images/about-banner.jpg` with a wide render (at least 2000px wide).
- **Portrait**: `images/hugo-portrait.jpg` (square, any size above about 900px).
- **YouTube**: put each video's ID in `data-youtube-id="…"`. That's the part after `v=` in the URL, for example `dQw4w9WgXcQ`.
- **Social links**: replace `REPLACE_ME` in each profile URL.

The current portrait and temple images were cut from screenshots, so swap in the originals for full sharpness.

## 2. Contact form → webhook

At the top of `script.js`:

```js
webhookUrl: 'https://your-host/webhook/portfolio-contact',
turnstileSiteKey: '0x4AAAA...'   // optional but recommended
```

The form POSTs JSON:

```json
{ "name": "...", "email": "...", "message": "...",
  "turnstileToken": "...", "page": "...", "sentAt": "..." }
```

Your webhook should:

1. **Allow CORS** for the site's origin, for example `Access-Control-Allow-Origin: https://USERNAME.github.io`. It must also answer the `OPTIONS` preflight, because the form sends `Content-Type: application/json`.
2. **Verify the Turnstile token** server-side: POST `secret` and `response` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Reject the message unless the reply has `success: true`. Without this step, Turnstile protects nothing.
3. **Validate**: require all three fields and cap their lengths.
4. **Rate-limit** the endpoint at your reverse proxy.
5. Forward the message wherever you like (email, notifications and so on).

A hidden "website" field catches simple bots in the browser before anything is sent. If the webhook URL is left empty, the form tells visitors to use the social links instead.

## 3. Publish on GitHub Pages

1. Create a repository. If you name it `USERNAME.github.io`, the site lives at `https://USERNAME.github.io`. Any other name puts it at `https://USERNAME.github.io/REPO`.
2. Upload everything in this folder to the repository root, using **Add file → Upload files** in the browser or with git.
3. Go to **Settings → Pages → Build and deployment**, set **Source: Deploy from a branch**, choose **main** and **/ (root)**, then click **Save**.
4. Wait a minute or two, then open the URL shown on that page.

To use a custom domain, add it under **Settings → Pages → Custom domain**.
