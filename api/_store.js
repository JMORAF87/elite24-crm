// api/_store.js (CommonJS)
function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  
  function getStore() {
    if (!globalThis.__elite24_store) {
      globalThis.__elite24_store = {
        leads: [],       // only useful if your leads endpoint uses this too
        tasks: [],
        quotes: [],
        activities: [],
        emails: [],
      };
    }
    return globalThis.__elite24_store;
  }
  
  function readJson(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        if (!data) return resolve({});
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on("error", reject);
    });
  }
  
  function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
  }
  
  function handleOptions(req, res) {
    if (req.method === "OPTIONS") {
      sendJson(res, 200, { ok: true });
      return true;
    }
    return false;
  }
  
  module.exports = { makeId, getStore, readJson, sendJson, handleOptions };
  