import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3000";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b0f;
    --surface: #0d1117;
    --surface2: #161b22;
    --border: #21262d;
    --border2: #30363d;
    --text: #e6edf3;
    --muted: #7d8590;
    --accent: #58e6a4;
    --accent2: #1f6feb;
    --danger: #f85149;
    --warn: #e3b341;
    --mono: 'Space Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--mono); }

  .app {
    min-height: 100vh;
    background: var(--bg);
    position: relative;
    overflow-x: hidden;
  }

  /* subtle grid background */
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(88,230,164,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(88,230,164,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .wrap { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 0 24px; }

  /* NAV */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 0; border-bottom: 1px solid var(--border);
    margin-bottom: 64px;
  }
  .nav-logo { font-family: var(--sans); font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
  .nav-logo span { color: var(--accent); }
  .nav-tag {
    font-size: 11px; color: var(--muted); border: 1px solid var(--border2);
    padding: 4px 10px; border-radius: 4px; letter-spacing: 1px;
  }

  /* HERO */
  .hero { text-align: center; margin-bottom: 56px; }
  .hero-label {
    display: inline-block; font-size: 11px; letter-spacing: 2px; color: var(--accent);
    border: 1px solid rgba(88,230,164,0.3); padding: 5px 14px; border-radius: 2px;
    margin-bottom: 24px; text-transform: uppercase;
  }
  .hero h1 {
    font-family: var(--sans); font-weight: 800; font-size: clamp(36px, 6vw, 64px);
    line-height: 1.05; letter-spacing: -2px; margin-bottom: 16px;
  }
  .hero h1 em { color: var(--accent); font-style: normal; }
  .hero p { font-size: 14px; color: var(--muted); line-height: 1.7; max-width: 440px; margin: 0 auto; }

  /* INPUT CARD */
  .input-card {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 8px; padding: 24px; margin-bottom: 48px;
    position: relative; overflow: hidden;
  }
  .input-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .input-row { display: flex; gap: 10px; align-items: stretch; }
  .url-input {
    flex: 1; background: var(--bg); border: 1px solid var(--border2);
    color: var(--text); font-family: var(--mono); font-size: 13px;
    padding: 12px 16px; border-radius: 6px; outline: none;
    transition: border-color 0.2s;
  }
  .url-input::placeholder { color: var(--muted); }
  .url-input:focus { border-color: var(--accent); }
  .shorten-btn {
    background: var(--accent); color: #080b0f; font-family: var(--mono);
    font-size: 13px; font-weight: 700; border: none; cursor: pointer;
    padding: 12px 24px; border-radius: 6px; letter-spacing: 0.5px;
    transition: all 0.15s; white-space: nowrap;
  }
  .shorten-btn:hover { background: #72edba; transform: translateY(-1px); }
  .shorten-btn:active { transform: translateY(0); }
  .shorten-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .options-row { display: flex; gap: 10px; margin-top: 10px; }
  .opt-input {
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text); font-family: var(--mono); font-size: 12px;
    padding: 8px 12px; border-radius: 6px; outline: none; flex: 1;
    transition: border-color 0.2s;
  }
  .opt-input::placeholder { color: var(--muted); }
  .opt-input:focus { border-color: var(--border2); }

  /* RESULT */
  .result-box {
    background: rgba(88,230,164,0.05); border: 1px solid rgba(88,230,164,0.25);
    border-radius: 6px; padding: 14px 16px; margin-top: 14px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    animation: slideIn 0.25s ease;
  }
  @keyframes slideIn { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform:none; } }
  .result-url { font-size: 13px; color: var(--accent); flex: 1; word-break: break-all; }
  .result-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .icon-btn {
    background: var(--surface2); border: 1px solid var(--border2);
    color: var(--muted); cursor: pointer; padding: 6px 10px; border-radius: 4px;
    font-family: var(--mono); font-size: 11px; transition: all 0.15s;
  }
  .icon-btn:hover { color: var(--text); border-color: var(--border); }
  .icon-btn.copied { color: var(--accent); border-color: rgba(88,230,164,0.4); }

  /* ERROR */
  .error-box {
    background: rgba(248,81,73,0.08); border: 1px solid rgba(248,81,73,0.3);
    border-radius: 6px; padding: 12px 16px; margin-top: 12px;
    font-size: 12px; color: var(--danger);
    animation: slideIn 0.2s ease;
  }

  /* TABS */
  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 32px; }
  .tab {
    background: none; border: none; color: var(--muted); font-family: var(--mono);
    font-size: 13px; padding: 10px 20px; cursor: pointer; position: relative;
    transition: color 0.2s; border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tab-count {
    display: inline-block; background: var(--surface2); color: var(--muted);
    font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 6px;
  }

  /* TABLE */
  .table-wrap { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .table-head {
    display: grid; grid-template-columns: 1fr 130px 80px 120px 80px;
    background: var(--surface2); padding: 10px 16px;
    font-size: 10px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase;
    border-bottom: 1px solid var(--border);
  }
  .table-row {
    display: grid; grid-template-columns: 1fr 130px 80px 120px 80px;
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    font-size: 12px; align-items: center; transition: background 0.15s;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--surface2); }
  .cell-url { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 12px; }
  .cell-slug { color: var(--accent); }
  .cell-clicks { color: var(--text); font-weight: 700; }
  .cell-date { color: var(--muted); font-size: 11px; }
  .cell-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .stats-btn {
    background: none; border: 1px solid var(--border2); color: var(--muted);
    font-family: var(--mono); font-size: 10px; cursor: pointer;
    padding: 4px 8px; border-radius: 3px; letter-spacing: 0.5px;
    transition: all 0.15s;
  }
  .stats-btn:hover { color: var(--accent2); border-color: var(--accent2); }
  .del-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    font-family: var(--mono); font-size: 10px; cursor: pointer;
    padding: 4px 8px; border-radius: 3px; transition: all 0.15s;
  }
  .del-btn:hover { color: var(--danger); border-color: var(--danger); }

  .empty-state {
    padding: 48px; text-align: center; color: var(--muted); font-size: 13px;
  }
  .empty-state .big { font-size: 32px; margin-bottom: 12px; }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(8,11,15,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 10px; padding: 28px; width: 90%; max-width: 560px;
    position: relative; max-height: 85vh; overflow-y: auto;
    animation: scaleIn 0.2s ease;
  }
  @keyframes scaleIn { from { opacity:0; transform: scale(0.96); } to { opacity:1; transform:none; } }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .modal-title { font-family: var(--sans); font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
  .modal-slug { font-size: 13px; color: var(--accent); margin-top: 2px; }
  .close-btn {
    background: none; border: 1px solid var(--border); color: var(--muted);
    font-size: 16px; cursor: pointer; width: 32px; height: 32px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .close-btn:hover { color: var(--text); border-color: var(--border2); }

  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 6px; padding: 14px 16px;
  }
  .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .stat-value { font-family: var(--sans); font-weight: 800; font-size: 24px; }
  .stat-value.green { color: var(--accent); }
  .stat-value.blue { color: var(--accent2); }

  .chart-label { font-size: 10px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
  .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bar {
    width: 100%; background: var(--accent2); border-radius: 2px 2px 0 0;
    min-height: 2px; transition: height 0.3s ease; position: relative; cursor: pointer;
  }
  .bar:hover { background: var(--accent); }
  .bar-date { font-size: 9px; color: var(--muted); transform: rotate(-45deg); white-space: nowrap; margin-top: 4px; }

  .original-url {
    background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
    padding: 10px 12px; font-size: 11px; color: var(--muted); margin-top: 16px;
    word-break: break-all; line-height: 1.6;
  }

  /* LOADING */
  .spinner {
    display: inline-block; width: 12px; height: 12px;
    border: 2px solid rgba(88,230,164,0.3); border-top-color: var(--accent);
    border-radius: 50%; animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* FOOTER */
  .footer {
    margin-top: 80px; padding: 24px 0; border-top: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; color: var(--muted);
  }

  @media (max-width: 640px) {
    .table-head, .table-row { grid-template-columns: 1fr 100px 60px; }
    .table-head > *:nth-child(4), .table-head > *:nth-child(5),
    .table-row > *:nth-child(4), .table-row > *:nth-child(5) { display: none; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .input-row { flex-direction: column; }
  }
`;

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}
function fmtUrl(url, max = 42) {
  try { const u = new URL(url); return (u.hostname + u.pathname).slice(0, max) + (url.length > max ? "…" : ""); }
  catch { return url.slice(0, max) + (url.length > max ? "…" : ""); }
}

// ── ANALYTICS MODAL ──────────────────────────────────────────────────────────
function AnalyticsModal({ slug, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/analytics/${slug}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const maxClicks = data?.clicks_by_day?.length
    ? Math.max(...data.clicks_by_day.map(d => Number(d.clicks)), 1)
    : 1;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Analytics</div>
            <div className="modal-slug">/{slug}</div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div className="spinner" />
          </div>
        ) : !data ? (
          <div style={{ color: "var(--danger)", fontSize: "13px" }}>Failed to load analytics.</div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Total Clicks</div>
                <div className="stat-value green">{data.total_clicks ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Unique IPs</div>
                <div className="stat-value blue">{data.unique_ips ?? 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Created</div>
                <div className="stat-value" style={{ fontSize: "15px", marginTop: "4px" }}>
                  {fmtDate(data.url?.created_at)}
                </div>
              </div>
            </div>

            {data.clicks_by_day?.length > 0 && (
              <>
                <div className="chart-label">Daily clicks (last 7 days)</div>
                <div className="bar-chart">
                  {data.clicks_by_day.slice(-7).map((d, i) => (
                    <div className="bar-col" key={i}>
                      <div
                        className="bar"
                        style={{ height: `${(Number(d.clicks) / maxClicks) * 64 + 2}px` }}
                        title={`${d.date}: ${d.clicks} clicks`}
                      />
                      <div className="bar-date">{d.date?.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.url?.original_url && (
              <div className="original-url">
                <span style={{ color: "var(--muted)", marginRight: "8px" }}>→</span>
                {data.url.original_url}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urls, setUrls] = useState([]);
  const [tab, setTab] = useState("urls");
  const [analytics, setAnalytics] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef(null);

  const fetchUrls = () => {
    fetch(`${API}/api/urls?limit=50`)
      .then(r => r.json())
      .then(d => setUrls(Array.isArray(d.urls) ? d.urls : Array.isArray(d) ? d : []))
      .catch(() => { });
  };

  useEffect(() => { fetchUrls(); }, []);

  const shorten = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const body = { url: url.trim() };
      if (customSlug.trim()) body.custom_slug = customSlug.trim();
      const r = await fetch(`${API}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || data.message || "Failed");
      setResult(data);
      fetchUrls();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const deleteUrl = async (slug) => {
    if (!confirm(`Delete /${slug}?`)) return;
    await fetch(`${API}/api/urls/${slug}`, { method: "DELETE" });
    fetchUrls();
    if (result?.slug === slug) setResult(null);
  };

  return (
    <>
      <style>{style}</style>
      <div className="app">
        <div className="wrap">

          {/* NAV */}
          <nav className="nav">
            <div className="nav-logo">url<span>.</span>short</div>
            <div className="nav-tag">API v1.0 · LIVE</div>
          </nav>

          {/* HERO */}
          <div className="hero">
            <div className="hero-label">↗ production ready</div>
            <h1>Shorten.<br /><em>Track.</em> Analyse.</h1>
            <p>A Redis-cached URL shortener with per-click analytics. Built on Node.js, TypeScript & PostgreSQL.</p>
          </div>

          {/* INPUT */}
          <div className="input-card">
            <div className="input-row">
              <input
                ref={inputRef}
                className="url-input"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && shorten()}
                placeholder="https://your-very-long-url.com/paste/here"
              />
              <button
                className="shorten-btn"
                onClick={shorten}
                disabled={loading || !url.trim()}
              >
                {loading ? <span className="spinner" /> : "SHORTEN →"}
              </button>
            </div>

            <div style={{ marginTop: "8px" }}>
              <button
                onClick={() => setShowOptions(v => !v)}
                style={{ background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer", letterSpacing: "0.5px" }}
              >
                {showOptions ? "▾" : "▸"} OPTIONS
              </button>
            </div>

            {showOptions && (
              <div className="options-row">
                <input
                  className="opt-input"
                  value={customSlug}
                  onChange={e => setCustomSlug(e.target.value)}
                  placeholder="custom-slug (optional)"
                  maxLength={10}
                />
              </div>
            )}

            {result && (
              <div className="result-box">
                <div className="result-url">
                  {result.short_url || `${API}/${result.slug}`}
                </div>
                <div className="result-actions">
                  <button
                    className={`icon-btn ${copied ? "copied" : ""}`}
                    onClick={() => copy(result.short_url || `${API}/${result.slug}`)}
                  >
                    {copied ? "✓ COPIED" : "COPY"}
                  </button>
                  <button className="icon-btn" onClick={() => setAnalytics(result.slug)}>
                    STATS
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-box">⚠ {error}</div>}
          </div>

          {/* TABS */}
          <div className="tabs">
            <button className={`tab ${tab === "urls" ? "active" : ""}`} onClick={() => setTab("urls")}>
              ALL URLS <span className="tab-count">{urls.length}</span>
            </button>
            <button className={`tab ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
              HOW IT WORKS
            </button>
          </div>

          {/* TABLE */}
          {tab === "urls" && (
            <div className="table-wrap">
              <div className="table-head">
                <span>ORIGINAL URL</span>
                <span>SHORT LINK</span>
                <span>CLICKS</span>
                <span>CREATED</span>
                <span></span>
              </div>

              {urls.length === 0 ? (
                <div className="empty-state">
                  <div className="big">∅</div>
                  <div>No URLs yet. Shorten one above.</div>
                </div>
              ) : (
                urls.map(u => (
                  <div className="table-row" key={u.slug}>
                    <div className="cell-url" title={u.original_url}>{fmtUrl(u.original_url)}</div>
                    <div className="cell-slug">/{u.slug}</div>
                    <div className="cell-clicks">{u.click_count ?? 0}</div>
                    <div className="cell-date">{fmtDate(u.created_at)}</div>
                    <div className="cell-actions">
                      <button className="stats-btn" onClick={() => setAnalytics(u.slug)}>STATS</button>
                      <button className="del-btn" onClick={() => deleteUrl(u.slug)}>DEL</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HOW IT WORKS */}
          {tab === "about" && (
            <div style={{ display: "grid", gap: "16px" }}>
              {[
                ["01 — SHORTEN", "POST /api/shorten generates a 7-char nanoid slug, stores the mapping in PostgreSQL, and returns the short URL instantly."],
                ["02 — REDIRECT", "GET /:slug checks Redis first (cache hit ~18ms). On miss, queries PostgreSQL, writes back with 24h TTL, then logs the click async."],
                ["03 — ANALYTICS", "GET /api/analytics/:slug returns total clicks, unique IPs, and a daily breakdown — all queried live from PostgreSQL."],
                ["04 — PYTHON SCRIPT", "scripts/bulk_import.py reads a CSV with a 'url' column, hits the shorten endpoint in batches, and writes slugs back to output.csv."],
              ].map(([title, desc]) => (
                <div key={title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px 24px" }}>
                  <div style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "1px", marginBottom: "8px" }}>{title}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.7" }}>{desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className="footer">
            <span>Built with Node.js · TypeScript · PostgreSQL · Redis</span>
            <span>
              <a href="https://github.com/BilliPaul0005/URL_Shortener"
                style={{ color: "var(--accent)", textDecoration: "none" }}
                target="_blank" rel="noreferrer">
                github ↗
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* ANALYTICS MODAL */}
      {analytics && (
        <AnalyticsModal slug={analytics} onClose={() => setAnalytics(null)} />
      )}
    </>
  );
}