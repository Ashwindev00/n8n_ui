import { useState } from "react";

// Extract a readable text message from various n8n response shapes
function extractTextFromResponse(data) {
  if (data == null) return "";
  if (typeof data === "string") return data;

  // Common fields
  if (typeof data === "object") {
    if (typeof data.reply === "string") return data.reply;
    if (typeof data.output === "string") return data.output;
  }

  // Arrays like: [{ output: "..." }] or mixed
  if (Array.isArray(data)) {
    const parts = data
      .map((item) => extractTextFromResponse(item))
      .filter((s) => typeof s === "string" && s.trim().length > 0);
    if (parts.length) return parts.join("\n\n");
  }

  // Nested objects: try common keys first
  const preferredKeys = ["message", "text", "content", "result", "data", "value"];
  for (const k of preferredKeys) {
    if (data && typeof data === "object") {
      const v = data[k];
      const s = extractTextFromResponse(v);
      if (s) return s;
    }
  }

  // Fallback: first string anywhere in the object
  if (data && typeof data === "object") {
    for (const v of Object.values(data)) {
      const s = extractTextFromResponse(v);
      if (s) return s;
    }
  }

  return "";
}

export default function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canSend = input.trim().length > 0 && !loading;

  const endpoint = import.meta.env.PROD
    ? import.meta.env.VITE_N8N_URL
    : "/api/agent";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Failed to connect to agent");

      const data = await res.json();
      const text = extractTextFromResponse(data);
      if (!text) {
        // Keep UI clean; only log unexpected shapes
        console.debug("Unparsed agent response:", data);
      }
      setResponse(text || "");
    } catch (err) {
      setResponse("⚠️ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
          <h1 className="text-sm font-medium tracking-tight text-zinc-700">n8n Agent</h1>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white/90 shadow-sm">
          <div className="p-5 md:p-6">
            <h2 className="text-lg font-medium tracking-tight mb-1">Ask</h2>
            <p className="text-sm text-zinc-500 mb-5">Type a question and get a response from your n8n workflow.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                rows={3}
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) handleSubmit(e);
                  }
                }}
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-[15px] shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400"
              />
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
                      </svg>
                      Sending
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>

            {response && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    <span className="text-xs font-medium">Response</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(response);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      } catch (_) {
                        /* noop */
                      }
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                    aria-label="Copy response"
                    title={copied ? "Copied" : "Copy"}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-[14px] leading-relaxed text-zinc-800">{response}</pre>
              </div>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-zinc-500">Minimal UI · Vite + React · Tailwind</p>
      </main>
    </div>
  );
}
