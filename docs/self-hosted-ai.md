# Using your own model server

Ditto can generate step descriptions from a model you run yourself instead of a hosted
API. Anything that speaks the OpenAI chat-completions API works: Ollama or LM Studio on
your laptop, or vLLM, llama.cpp or a LiteLLM gateway on a machine you control.

Nothing about this sends your guides to a third party. The screenshots never leave the
browser either way — only a short text snippet of the clicked element's DOM context is
sent to the model.

## The short version

1. Start your server and load a model.
2. Allow the extension's origin if the server filters on it (see each server below).
3. In Ditto: **Settings → AI Descriptions → Provider → Your own server**.
4. Set **Server URL** to the server's OpenAI-compatible base, ending in `/v1`.
5. Type the **Model** name exactly as the server reports it.
6. Leave **API Key** empty unless your server requires one, then press **Check**.

**Check** asks the server for its model list and runs one tiny completion. On success it
shows the models your server actually has, which is the fastest way to find the right
name for step 5.

## The origin problem, once

Ditto calls your server from the extension, so the request carries an `Origin` header
like `chrome-extension://<id>` rather than a website. Several servers refuse unknown
origins and answer `403` before the model is ever reached. The browser is not the
obstacle here — extension requests are exempt from CORS enforcement — so no amount of
permission granting helps. The server has to be told.

Test any server in one command:

```bash
curl -i -H "Origin: chrome-extension://test" http://localhost:11434/v1/models
```

`200` with a JSON model list means you are fine. `403` means the origin is being
filtered. Connection refused means the server is not running or is on another port.

## Ollama

Default base URL: `http://localhost:11434/v1`

Ollama allows cross-origin requests from `127.0.0.1` and `0.0.0.0` only, and browser
extensions need their origin pattern allowed explicitly. Without this, Ditto's requests
come back `403`.

macOS:

```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*,moz-extension://*"
# then quit and reopen Ollama
```

Linux (systemd):

```bash
sudo systemctl edit ollama
# [Service]
# Environment="OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*"
sudo systemctl daemon-reload && sudo systemctl restart ollama
```

Windows: set `OLLAMA_ORIGINS` as a user environment variable, then restart Ollama.

The wildcard is deliberate: an unpacked development build has a different extension ID
than a store install, so pinning one exact ID works in one and breaks in the other. The
tradeoff is that any installed extension can then reach your Ollama. Narrow it to the
published ID once you are installing from the store.

**Model name:** whatever `ollama list` shows, e.g. `llama3.1` or `qwen2.5:7b`.
**API key:** leave empty.

## LM Studio

Default base URL: `http://localhost:1234/v1`

Open the **Server** tab (the plug icon in the left rail), turn on the **CORS** toggle —
browser extensions need it — and press **Start Server**.

**Model name:** the identifier LM Studio lists, not the hosted name it resembles. Press
**Check** in Ditto and use what comes back.
**API key:** leave empty. LM Studio's server does not check it unless you switch on its
API-token option.

## LiteLLM

Default base URL: `http://localhost:4000/v1`, or `https://your-gateway/v1` if hosted.

LiteLLM itself does not filter on `Origin`, so a direct connection usually works. What
does filter is whatever sits in front of it — nginx, Cloudflare, an API gateway, a
corporate proxy. Run the `curl` above against the real public URL, not localhost, to
find out.

If that layer rejects the extension origin, prefer removing the `Origin` filter for the
completions route over allowlisting an extension ID. An `Origin` header offers no real
protection against a non-browser client — the `curl` above forges it in one flag — and
the bearer token is what is actually authenticating you.

**Model name:** the `model_name` from your LiteLLM config, not the upstream name.
**API key:** your virtual key (`sk-...`). LiteLLM does check it.

## vLLM

Default base URL: `http://localhost:8000/v1`

```bash
vllm serve <model> --port 8000
```

vLLM's server takes an allowed-origins flag if you need to widen it; check
`vllm serve --help` on your version rather than assuming the default.

**Model name:** the value passed to `--served-model-name`, or the model path if you did
not set one.
**API key:** empty, unless you started vLLM with `--api-key`.

## llama.cpp

Default base URL: `http://localhost:8080/v1`

```bash
llama-server -m model.gguf --port 8080
```

**Model name:** any non-empty string — `llama-server` serves the single model it loaded
and ignores the field.
**API key:** empty, unless you passed `--api-key`.

## Any other OpenAI-compatible server

The requirements are only these:

- `GET {base}/models` returns a JSON list — this is what **Check** reads.
- `POST {base}/chat/completions` accepts the standard body.
- The base URL ends in `/v1` (or wherever those two routes live).
- The server does not reject the extension's `Origin`.

Ditto always uses the chat-completions route for your own server, never the newer
responses API, so a server that implements only chat completions is fine.

## When it does not work

**403 from Check** — the origin is being filtered. See above for your server.

**401 from Check** — the server wants a key. Put it in the API Key field.

**"Model required"** — Check could reach the server but needs a model name before it can
run a completion. The list it shows is what the server has; copy one in.

**"Model invalid"** — the name is not in the server's list. Names are exact, including
tags like `:7b`.

**Connection refused** — wrong port, or the server is bound to `127.0.0.1` while you
typed a LAN address. Confirm with the `curl` above first.

**Nothing happens while recording** — descriptions are generated in the background
worker. Open the extension's service worker console from the extensions page to see the
error.

**Firefox asks for permission** — Firefox treats host access as optional and prompts the
first time Ditto contacts your server. Accept it, or the request never leaves the
browser.

## Picking a model

Step descriptions are short and the prompt is small, so a 7-8B instruction-tuned model
is usually enough and fast enough to keep up with recording. Larger models mostly buy
better phrasing, not better accuracy about what you clicked. If descriptions lag behind
your clicks, drop to a smaller model before changing anything else.

## Voice narration on your own server

Transcription is a separate provider from descriptions, under **Settings → Voice
Narration**. Pick **Your own server** there and set its own Server URL and model — voice
and descriptions can point at different machines, and a keyless transcription server
never borrows the key from the descriptions provider.

Ditto needs `POST {base}/audio/transcriptions` returning `verbose_json` **with word-level
timestamps**. This is not optional: narration is matched to steps by when each word was
spoken, so a server that returns plain text or segment-only timing will fail with a
"response has no segments" error rather than silently producing bad guides.

Known-good options, all OpenAI-compatible:

- **Speaches** (formerly faster-whisper-server) — `http://localhost:8000/v1`,
  model `Systran/faster-whisper-small` or similar.
- **LocalAI** — `http://localhost:8080/v1`, whichever whisper model you configured.
- **whisper.cpp server** — check your build supports word timestamps before relying on it.

Default in Ditto is `http://localhost:8000/v1` with model `whisper-1`; change the model
to whatever your server reports from `/v1/models`.

The origin rule from the top of this page applies here too — if the transcription server
filters on `Origin`, allow the extension.
