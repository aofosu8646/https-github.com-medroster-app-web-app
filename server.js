import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import { FAQ, systemPrompt } from "./faq.js";

const PORT = process.env.PORT || 3000;
const MODEL = process.env.MODEL || "gpt-5.4-mini";
// Reasoning effort for reasoning models (none|minimal|low|medium|high). Set empty for non-reasoning models (e.g. gpt-4.1-mini).
const EFFORT = process.env.REASONING_EFFORT ?? "low";
const MAX_OUTPUT = Number(process.env.MAX_OUTPUT_TOKENS) || 1200; // includes reasoning tokens
const ALLOWED = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const MAX_TURNS = 12;          // messages kept per request
const MAX_CHARS = 1000;        // per user message
const RATE = { windowMs: 60_000, max: 20 }; // per IP

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
app.use(express.static("public", { maxAge: "1h" }));

// CORS: allow only the listed site origins (empty list = allow all, for local testing)
app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED.length === 0 || ALLOWED.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  } else if (origin && ALLOWED.length) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Simple in-memory rate limit
const hits = new Map();
setInterval(() => hits.clear(), RATE.windowMs).unref();
function limited(ip) {
  const n = (hits.get(ip) || 0) + 1;
  hits.set(ip, n);
  return n > RATE.max;
}

const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const SYSTEM = systemPrompt();

app.get("/api/faq", (_req, res) => {
  res.json(FAQ.map(({ category, q }) => ({ category, q })));
});

app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL, live: !!client }));

app.post("/api/chat", async (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: "Too many requests. Try again in a minute." });

  const raw = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!raw || !raw.length) return res.status(400).json({ error: "messages required" });

  const messages = raw.slice(-MAX_TURNS)
    .filter(m => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1).role !== "user") return res.status(400).json({ error: "last message must be from user" });

  if (!client) return res.status(503).json({ error: "Assistant not configured (missing OPENAI_API_KEY)." });

  try {
    const r = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: MAX_OUTPUT,
      ...(EFFORT ? { reasoning_effort: EFFORT } : {}),
      messages: [{ role: "developer", content: SYSTEM }, ...messages],
    });
    const text = (r.choices[0]?.message?.content || "").trim();
    res.json({ reply: text || "I don't have that information. The MedRoster team can help." });
  } catch (e) {
    console.error("OpenAI error:", e?.status, e?.message);
    res.status(502).json({ error: "The assistant is unavailable right now. Please try again." });
  }
});

app.listen(PORT, () => console.log(`MedRoster FAQ bot on http://localhost:${PORT} (model ${MODEL}, live=${!!client})`));
