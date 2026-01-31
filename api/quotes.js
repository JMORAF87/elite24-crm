// api/quotes.js (Vercel Node Serverless Function)

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getQuery(req) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  return url.searchParams;
}

function makeId(prefix = "quote") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default async function handler(req, res) {
  try {
    if (!globalThis.__elite24_quotes) globalThis.__elite24_quotes = [];
    const quotes = globalThis.__elite24_quotes;

    const method = req.method || "GET";
    const q = getQuery(req);

    if (method === "GET") {
      const leadId = q.get("leadId");
      const out = leadId ? quotes.filter((x) => x.leadId === leadId) : quotes;
      return sendJson(res, 200, out);
    }

    if (method === "POST") {
      const body = await readJson(req);
      const { leadId, service, guardType, hoursPerWeek, ratePerHour, notes } = body || {};

      if (!leadId) return sendJson(res, 400, { error: "leadId is required" });

      const hrs = Number(hoursPerWeek || 0);
      const rate = Number(ratePerHour || 0);
      const estimatedMonthly = Math.round(((hrs * rate) * 4.33) * 100) / 100;

      const quote = {
        id: makeId("quote"),
        leadId,
        service: service || "Unknown",
        guardType: guardType || "Unspecified",
        hoursPerWeek: hrs,
        ratePerHour: rate,
        estimatedMonthly,
        notes: notes || "",
        status: "DRAFT",
        createdAt: new Date().toISOString(),
      };

      quotes.unshift(quote);
      return sendJson(res, 201, quote);
    }

    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("api/quotes error:", err);
    return sendJson(res, 500, { error: "Internal Server Error" });
  }
}
