// Vercel Serverless Function: Forwards requests to n8n webhook with CORS
// Uses env var VITE_N8N_URL if set, otherwise falls back to the provided URL.

const TARGET = process.env.VITE_N8N_URL || "https://ashwindev.app.n8n.cloud/webhook/harbourcare-chat";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = req.body && Object.keys(req.body).length ? req.body : {};

    const upstream = await fetch(TARGET, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader("content-type", contentType);
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: "Upstream error", message: err?.message || String(err) });
  }
}
