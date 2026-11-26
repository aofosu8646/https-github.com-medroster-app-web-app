# Handoff: set up and run the MedRoster chatbot on this Mac

Paste this whole file as the first message to a Claude agent running on the Mac (Claude desktop app → Claude Code, or `claude` in Terminal). That agent needs permission to run commands on this computer.

---

Goal: get the MedRoster FAQ chatbot running locally on this Mac (macOS) at http://localhost:3000.

## Background
- Repo: https://github.com/aofosu8646/https-github.com-medroster-app-web-app, branch `claude/quirky-turing-vhc46r`. It is a Node/Express server (`server.js`) that calls the OpenAI API, plus a chat widget (`public/widget.js`) and FAQ data (`faq.js`). Its settings come from a `.env` file; the template is in `.env.example`. Requires Node >= 18.
- The user installed the Node.js LTS .pkg from nodejs.org, but `node` and `npm` are still "command not found". `brew` is also not installed. Homebrew is not needed; don't install it.
- The user is not technical. Explain each step in one plain line.

## Steps
1. **Diagnose Node.** Run `ls -l /usr/local/bin/node /usr/local/bin/npm`, `echo $SHELL`, `echo $PATH`.
   - If the binaries exist but aren't on PATH: add `export PATH="/usr/local/bin:$PATH"` to `~/.zshrc` (or `~/.bash_profile` if the shell is bash). Don't add it twice.
   - If they don't exist, install Node from the terminal:
     - `cd ~/Downloads`
     - `PKG=$(curl -s https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt | awk '/\.pkg$/{print $2}')`
     - `curl -fO "https://nodejs.org/dist/latest-v24.x/$PKG"`
     - `sudo installer -pkg "$PKG" -target /`
     - `sudo` needs the user's Mac password. If you can't answer the password prompt, give the user the exact command to run in Terminal themselves and wait for them.
   - Confirm with `node -v` and `npm -v`, using `/usr/local/bin/node` and `/usr/local/bin/npm` explicitly if PATH hasn't refreshed in your shell.
2. **Get the code.** If this session is already in a clone of the repo, run `git fetch origin claude/quirky-turing-vhc46r && git checkout claude/quirky-turing-vhc46r`. Otherwise clone it into `~/Desktop` and check out that branch. If `git` triggers the Xcode Command Line Tools prompt, tell the user to click Install, wait, then retry.
3. **Install dependencies.** Run `npm install` in the repo root.
4. **Create `.env` without handling the key yourself.** Never ask the user to paste their OpenAI API key into the chat, and never print or read the key. Have the user run these two lines in their own Terminal, in the repo folder. The first prompts for the key with hidden input; the second writes `.env`:
   ```
   read -rsp "OpenAI API key: " KEY; echo
   printf 'OPENAI_API_KEY=%s\nALLOWED_ORIGINS=\nMODEL=gpt-5.4-mini\nREASONING_EFFORT=low\nMAX_OUTPUT_TOKENS=1200\nPORT=3000\n' "$KEY" > .env; unset KEY
   ```
   Then confirm only that the key is present, without showing it: `grep -c '^OPENAI_API_KEY=.\+' .env` should print `1`.
5. **Start and verify.** Run `npm start` in the background, then check `curl -s localhost:3000/api/health`; it should include `"live":true`. Send one test message:
   `curl -s -X POST localhost:3000/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"What is MedRoster?"}]}'`
   - Expected: a JSON `reply`.
   - If it returns an "unavailable" error, read the server log for the OpenAI error (bad key, no billing, unknown model). If the model name is rejected, set `MODEL=gpt-4.1-mini` and `REASONING_EFFORT=` (empty) in `.env` and restart.
6. Tell the user to open http://localhost:3000, click the chat bubble in the bottom-right corner, and stop the server with Ctrl+C when done.

## Done when
`node -v` and `npm -v` work in a new Terminal window, `/api/health` shows `"live":true`, and a test chat message gets a real answer.

## Constraints
Don't commit `.env`; it is already in `.gitignore`. Don't push anything or change code unless a step fails and the user agrees.
