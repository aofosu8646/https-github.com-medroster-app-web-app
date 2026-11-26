/* MedRoster Help chat widget
   Embed on any page:
   <script src="https://YOUR-BOT-HOST/widget.js" defer></script>
   Optional attributes: data-api="https://YOUR-BOT-HOST"  data-color="#0f5c63"  data-title="MedRoster Help"
*/
(() => {
  if (window.__medrosterWidget) return;
  window.__medrosterWidget = true;

  const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const API = (script?.dataset.api || new URL(script.src).origin).replace(/\/$/, "");
  const COLOR = script?.dataset.color || "#0f5c63";
  const TITLE = script?.dataset.title || "MedRoster Help";
  const GREETING = "Hello. Ask me anything about how MedRoster works, or pick a common question below.";

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function md(t) {
    const lines = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split("\n");
    let out = "", list = false;
    for (const l of lines) {
      const m = l.match(/^\s*[-•]\s+(.*)/);
      if (m) { if (!list) { out += "<ul>"; list = true; } out += `<li>${m[1]}</li>`; continue; }
      if (list) { out += "</ul>"; list = false; }
      if (l.trim()) out += `<p>${l}</p>`;
    }
    return out + (list ? "</ul>" : "");
  }

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483000;right:20px;bottom:20px";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
<style>
*{box-sizing:border-box;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.fab{width:60px;height:60px;border-radius:50%;border:0;background:${COLOR};color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);display:grid;place-items:center;margin-left:auto}
.fab:focus-visible,button:focus-visible,textarea:focus-visible{outline:3px solid ${COLOR};outline-offset:2px}
.panel{position:absolute;right:0;bottom:76px;width:380px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 110px);background:#fff;color:#14110f;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden}
.panel.open{display:flex}
.head{background:${COLOR};color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}
.head b{font-size:16px;flex:1}
.x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;width:36px;height:36px;border-radius:8px}
.log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f6f7f9}
.m{max-width:85%;padding:10px 13px;border-radius:14px;font-size:15px;line-height:1.5;overflow-wrap:anywhere}
.m p{margin:0 0 6px}.m p:last-child{margin:0}.m ul{margin:2px 0 6px;padding-left:18px}
.bot{background:#fff;border:1px solid #e3e5ea;align-self:flex-start;border-top-left-radius:4px}
.me{background:${COLOR};color:#fff;align-self:flex-end;border-top-right-radius:4px}
.dots{display:inline-flex;gap:4px}.dots i{width:6px;height:6px;border-radius:50%;background:#9aa0ab;animation:p 1s infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes p{50%{opacity:.3}}@media(prefers-reduced-motion:reduce){.dots i{animation:none}}
.sugg{display:flex;flex-direction:column;gap:6px;align-self:stretch}
.sugg button{text-align:left;background:#fff;border:1px solid #d9dce3;border-radius:10px;padding:9px 12px;font-size:14px;color:#14110f;cursor:pointer;min-height:40px}
.sugg button:hover{border-color:${COLOR};color:${COLOR}}
form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e5ea;background:#fff}
textarea{flex:1;resize:none;height:44px;max-height:120px;border:1px solid #d9dce3;border-radius:10px;padding:10px 12px;font-size:16px;color:#14110f}
.send{background:${COLOR};color:#fff;border:0;border-radius:10px;padding:0 16px;font-weight:600;font-size:15px;cursor:pointer;min-height:44px}
.send:disabled{opacity:.5}
.foot{font-size:11px;color:#6b7080;text-align:center;padding:0 10px 8px;background:#fff}
@media(max-width:480px){.panel{position:fixed;inset:0;width:auto;max-width:none;height:auto;max-height:none;border-radius:0}}
</style>
<div class="panel" role="dialog" aria-label="${esc(TITLE)}">
  <div class="head"><b>${esc(TITLE)}</b><button class="x" aria-label="Close chat">×</button></div>
  <div class="log" aria-live="polite"></div>
  <form><textarea placeholder="Type your question…" aria-label="Your question"></textarea><button class="send" type="submit">Send</button></form>
  <div class="foot">Automated assistant. Answers may be incomplete; the MedRoster team can confirm details.</div>
</div>
<button class="fab" aria-label="Open MedRoster help chat" aria-expanded="false">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
</button>`;

  const $ = s => root.querySelector(s);
  const panel = $(".panel"), fab = $(".fab"), log = $(".log"), form = $("form"), input = $("textarea"), send = $(".send");
  const history = [];
  let busy = false, started = false;

  function add(cls, html) {
    const d = document.createElement("div");
    d.className = "m " + cls; d.innerHTML = html;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }

  async function start() {
    started = true;
    add("bot", md(GREETING));
    try {
      const faq = await (await fetch(API + "/api/faq")).json();
      const pick = [0, 4, 8, 11, 15, 18].map(i => faq[i]).filter(Boolean);
      const box = document.createElement("div"); box.className = "sugg";
      box.innerHTML = pick.map(f => `<button type="button">${esc(f.q)}</button>`).join("");
      box.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { box.remove(); ask(b.textContent); } });
      log.appendChild(box);
    } catch { /* suggestions are optional */ }
  }

  function toggle(open) {
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", String(open));
    if (open) { if (!started) start(); setTimeout(() => input.focus(), 50); }
  }
  fab.addEventListener("click", () => toggle(!panel.classList.contains("open")));
  $(".x").addEventListener("click", () => { toggle(false); fab.focus(); });
  root.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });

  async function ask(text) {
    text = text.trim(); if (!text || busy) return;
    busy = true; send.disabled = true; input.value = ""; input.style.height = "44px";
    root.querySelector(".sugg")?.remove();
    add("me", esc(text));
    history.push({ role: "user", content: text });
    const d = add("bot", '<span class="dots"><i></i><i></i><i></i></span>');
    try {
      const r = await fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Request failed");
      d.innerHTML = md(j.reply);
      history.push({ role: "assistant", content: j.reply });
    } catch (e) {
      history.pop();
      d.innerHTML = md(e.message && e.message !== "Failed to fetch" ? e.message : "The assistant is unavailable right now. Please try again.");
    } finally {
      busy = false; send.disabled = false; input.focus(); log.scrollTop = log.scrollHeight;
    }
  }

  form.addEventListener("submit", e => { e.preventDefault(); ask(input.value); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  input.addEventListener("input", () => { input.style.height = "44px"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
})();
