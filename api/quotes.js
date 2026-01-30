function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function getStore() {
  globalThis.__elite24_quotes = globalThis.__elite24_quotes || [];
  return globalThis.__elite24_quotes;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default async function handler(req, res) {
  // Optional: handle preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const quotes = getStore();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const leadId = url.searchParams.get('leadId');
  const limit = parseInt(url.searchParams.get('limit') || '200', 10);

  if (req.method === "GET") {
    const filtered = leadId ? quotes.filter(q => q.leadId === leadId) : quotes;
    const sliced = filtered.slice(0, limit);

    res.statusCode = 200;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(sliced));
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await readJson(req);

      if (!body || !body.leadId) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "leadId is required" }));
        return;
      }

      const createdAt = new Date().toISOString();
      const quote = {
        id: makeId(),
        leadId: body.leadId,
        service: body.service || "",
        guardType: body.guardType || "",
        hrsPerWeek: Number(body.hrsPerWeek || 0),
        ratePerHr: Number(body.ratePerHr || 0),
        estimatedMonthly: Number(body.estimatedMonthly || 0),
        status: body.status || "DRAFT",
        createdAt,
      };

      quotes.unshift(quote);

      res.statusCode = 201;
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(quote));
      return;
    } catch (e) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
