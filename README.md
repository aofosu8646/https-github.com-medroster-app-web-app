# MedRoster FAQ chatbot

A chat bubble for the MedRoster website. It answers common questions about MedRoster and nothing else. It does not discuss pricing, does not answer clinical questions, and says "the MedRoster team can help" when the answer is not in the FAQ.

## Files

| File | What it does |
|---|---|
| `faq.js` | The questions and answers. **Edit this file to change what the bot knows.** |
| `server.js` | Small Node server. Holds the API key and calls Claude. |
| `public/widget.js` | The chat bubble that goes on the website. |
| `public/index.html` | Demo page showing the bubble. |
| `.env.example` | Settings template. |

## Run locally

```bash
npm install
cp .env.example .env        # paste your Anthropic API key into .env
# for local testing, set ALLOWED_ORIGINS= (empty)
npm start
```

Open http://localhost:3000 and click the bubble in the bottom-right corner.

## Deploy

Any Node host works: Render, Railway, Fly.io, a VPS.

1. Push this folder to a GitHub repo.
2. Create a new web service from it. Build: `npm install`. Start: `npm start`.
3. Set environment variables:
   - `ANTHROPIC_API_KEY`: from console.anthropic.com
   - `ALLOWED_ORIGINS`: your website address(es), comma-separated, e.g. `https://yoursite.com,https://www.yoursite.com`
4. Check `https://YOUR-BOT-HOST/api/health` shows `"live":true`.

## Add to the website

Paste before `</body>` on every page that should show the bubble:

```html
<script src="https://YOUR-BOT-HOST/widget.js" defer></script>
```

Optional: `data-color="#0f5c63"` (brand colour), `data-title="MedRoster Help"`.

On Wix, Squarespace, WordPress or Webflow, use the site's "custom code" / "footer code" setting.

## Change the answers

Edit `faq.js`, then redeploy. Each entry has a category, a question and an answer. The first six questions shown in the bubble are picked in `public/widget.js` (`[0, 4, 8, 11, 15, 18]` — positions in the FAQ list).

## Safeguards built in

- API key stays on the server; the browser never sees it.
- Only the sites in `ALLOWED_ORIGINS` can use the bot.
- 20 messages per minute per visitor; messages capped at 1,000 characters; last 12 messages kept per request.
- Answers capped at 400 tokens. Model: `claude-haiku-5-5` (fast, low cost). Change with `MODEL`.
- No chat history is stored.
