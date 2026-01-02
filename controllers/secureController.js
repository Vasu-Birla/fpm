import * as url from 'url';
import * as path from 'path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import dotenv from 'dotenv';
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../middleware/s3bucketuploader_V4.js';
import mime from 'mime-types';
import { signAssetPayload, verifyAssetToken } from '../utils/assetToken.js';

// Optional (you had these)
import exportDb from '../scripts/export_db_data.js';
import importDb from '../scripts/import_db_data.js';
import freshSync from '../scripts/fresh_sync.js';


//============== Start S3 Bucket Stream ===================================

const ALLOWED_PREFIXES = ['images/profiles/', 'uploads/', 'receipts/', 'invoices/'];
const Bucket = process.env.AWS_S3_BUCKET_NAME;

/** RFC 5987 filename* encoding for non-ASCII safe download names */
function contentDispositionFilename(name = '') {
  const ascii = String(name || '').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  return `filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function okPrefix(key = '') {
  return ALLOWED_PREFIXES.some(p => key.startsWith(p));
}


const cdFilename = (name='') => {
  const ascii = String(name || '').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  return `filename="${ascii}"; filename*=UTF-8''${encoded}`;
};



export const file_stream_working_but_expose_bucketinfor  = async (req, res) => {
  try {
    const s3key = req.query.s3key || '';
    if (!s3key) return res.status(400).send('Missing s3key');

    // Security: allow only expected prefixes (adjust to your structure)
    const allowedPrefixes = ['images/profiles/', 'uploads/' ,'receipts/','invoices/'];
    const ok = allowedPrefixes.some(p => s3key.startsWith(p));
    if (!ok) return res.status(400).send('Invalid key');

    // Optional: you can verify the firm ownership/tenant here if needed

    const Bucket = process.env.AWS_S3_BUCKET_NAME;
    const command = new GetObjectCommand({ Bucket, Key: s3key });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60s URL

    // force new tab download/view behavior by redirect
    return res.redirect(url);
  } catch (err) {
    console.error('viewFirmAsset error:', err);
    return res.status(500).send('Unable to generate file URL');
  }
};



export const file_stream = async (req, res) => {
  try {
    // 1) If s3key present: mint 30-min token and redirect to self with ?t=
    const s3key = req.query.s3key ? String(req.query.s3key) : '';
    if (s3key) {
      if (!okPrefix(s3key)) return res.status(400).send('Invalid key');
      // (Optional) tenancy/ownership checks here

      const token = signAssetPayload({
        key: s3key,
        exp: Date.now() + 30 * 60 * 1000, // 30 minutes
      });
      // Redirect to the same endpoint but opaque now
      return res.redirect(302, `/secure/file_stream?t=${token}`);
    }

    // 2) If token present: verify and stream from S3 (no bucket/key leak)
    const token = req.query.t ? String(req.query.t) : '';
    if (!token) return res.status(400).send('Missing s3key or token');

    const { key } = verifyAssetToken(token);
    if (!okPrefix(key)) return res.status(400).send('Invalid key');

    const range = req.headers.range;
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    const getParams = { Bucket, Key: key, ...(range ? { Range: range } : {}) };
    const s3Resp = await s3.send(new GetObjectCommand(getParams));

    const type = s3Resp.ContentType || head.ContentType || mime.lookup(key) || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (range && s3Resp.ContentRange) {
      res.status(206);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', s3Resp.ContentRange);
      if (s3Resp.ContentLength != null) res.setHeader('Content-Length', s3Resp.ContentLength);
    } else {
      if (head.ContentLength != null) res.setHeader('Content-Length', head.ContentLength);
      res.setHeader('Accept-Ranges', 'bytes');
    }

    const fname = path.basename(key);
    res.setHeader('Content-Disposition', `inline; ${cdFilename(fname)}`);

    s3Resp.Body.on('error', (e) => {
      console.error('S3 stream error:', e);
      if (!res.headersSent) res.status(500).end('Stream error');
      else res.destroy(e);
    });
    s3Resp.Body.pipe(res);
  } catch (err) {
    const code = err?.$metadata?.httpStatusCode;
    if (code === 404) return res.status(404).send('File not found');
    console.error('file_stream error:', err);
    return res.status(400).send('Invalid or expired token');
  }
};




//======================= END S3 BUcket Stream ===================================



export const export_db_data = async (req, res) => {

    try {
    const { tables, exclude, name } = req.body || {};
    const out = await exportDb({
      includeTables: Array.isArray(tables) ? tables : undefined,
      excludeTables: Array.isArray(exclude) ? exclude : undefined,
      filename: name || 'db_seed.json',
    });
    res.json({ success:true, ...out });
  } catch (e) {
    res.status(500).json({ success:false, message:e.message });
  }


};


export const import_db_data = async (req, res) => {

  try {
    const { file, tables, exclude, truncate, yes } = req.body || {};
    const out = await importDb({
      jsonPath: file || undefined,
      includeTables: Array.isArray(tables) ? tables : undefined,
      excludeTables: Array.isArray(exclude) ? exclude : undefined,
      truncate: !!truncate,
      allowProd: !!yes,
    });
    res.json({ success:true, ...out });
  } catch (e) {
    res.status(500).json({ success:false, message:e.message });
  }


};






let running = false;

// tiny HTML escaper to avoid XSS from log text
const hEsc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function classifyLog(line='') {
  const l = line.toLowerCase();
  if (l.includes('error') || l.includes('fail') || l.includes('could not')) return 'error';
  if (l.includes('dropped index') || l.includes('ensured') || l.includes('inserted')) return 'action';
  if (l.includes('role "') || l.includes('admin account')) return 'seed';
  if (l.includes('tables synchronized')) return 'sync';
  return 'info';
}

function renderSyncReport({ ok, logs, startedAt, endedAt, env }) {
  const durMs = endedAt - startedAt;
  const started = new Date(startedAt).toLocaleString();
  const ended = new Date(endedAt).toLocaleString();

  const items = (logs || []).map((ln, i) => {
    const kind = classifyLog(ln);
    const icon =
      kind === 'error'  ? '⛔' :
      kind === 'action' ? '🛠️' :
      kind === 'seed'   ? '🌱' :
      kind === 'sync'   ? '🔄' :
                          'ℹ️';
    return `<li class="log ${kind}"><span class="icon">${icon}</span><span class="txt">${hEsc(ln)}</span></li>`;
  }).join('');

  const statusIcon = ok ? '✅' : '❌';
  const statusText = ok ? 'Fresh Sync Completed' : 'Fresh Sync Failed';
  const statusClass = ok ? 'ok' : 'bad';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fresh Sync Report</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root{
      --bg:#0f172a; --card:#111827; --ok:#22c55e; --bad:#ef4444;
      --text:#e5e7eb; --muted:#9ca3af; --chip:#1f2937; --border:#1f2937;
      --line:#374151;
    }
    *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,Segoe UI,Roboto,Helvetica,Arial}
    .wrap{max-width:900px;margin:32px auto;padding:0 16px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
    .head{padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
    .badge{font-weight:600;padding:6px 10px;border-radius:999px;background:var(--chip);border:1px solid var(--border);color:var(--text)}
    .status.ok{color:var(--ok)} .status.bad{color:var(--bad)}
    .grid{display:grid;grid-template-columns:1fr;gap:16px;padding:16px}
    @media(min-width:720px){.grid{grid-template-columns:1fr 300px}}
    .pane{padding:12px 16px;border:1px solid var(--border);border-radius:12px;background:#0b1220}
    .kvs{display:flex;flex-direction:column;gap:8px}
    .kv{display:flex;justify-content:space-between;gap:12px}
    .kv .k{color:var(--muted)} .kv .v{font-weight:600}
    .logs{padding:0;margin:0;list-style:none;max-height:60vh;overflow:auto;border-top:1px dashed var(--line)}
    .logs .log{display:flex;gap:10px;align-items:flex-start;padding:10px 2px;border-bottom:1px dashed var(--line)}
    .logs .log:last-child{border-bottom:0}
    .icon{width:22px;display:inline-block;opacity:.95;transform:translateY(1px)}
    .log.error .txt{color:#fecaca}
    .log.action .txt{color:#bbf7d0}
    .log.seed .txt{color:#d1fae5}
    .log.sync .txt{color:#bae6fd}
    .btns{display:flex;gap:10px;flex-wrap:wrap}
    .btn{cursor:pointer; border:1px solid var(--border); background:var(--chip); color:var(--text);
         padding:8px 12px; border-radius:10px; text-decoration:none}
    .btn:hover{filter:brightness(1.1)}
    .muted{color:var(--muted)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="status ${statusClass}" style="font-size:22px">${statusIcon}</div>
        <div>
          <div style="font-weight:700;font-size:18px">${statusText}</div>
          <div class="muted" style="font-size:12px">Environment: ${hEsc(process.env.NODE_ENV || 'development')}</div>
        </div>
        <div style="margin-left:auto" class="btns">
          <button class="btn" onclick="toggleRaw()">Toggle raw</button>
          <a class="btn" href="#" onclick="window.history.back();return false;">Back</a>
        </div>
      </div>

      <div class="grid">
        <div class="pane">
          <ul class="logs" id="loglist">
            ${items || '<li class="log info"><span class="icon">ℹ️</span><span class="txt">No logs captured.</span></li>'}
          </ul>
        </div>
        <div class="pane">
          <div class="kvs">
            <div class="kv"><span class="k">Started</span><span class="v">${hEsc(started)}</span></div>
            <div class="kv"><span class="k">Ended</span><span class="v">${hEsc(ended)}</span></div>
            <div class="kv"><span class="k">Duration</span><span class="v">${durMs} ms</span></div>
            <div class="kv"><span class="k">Status</span><span class="v ${statusClass}">${ok ? 'Success' : 'Failed'}</span></div>
            <div class="kv"><span class="k">Logs count</span><span class="v">${(logs||[]).length}</span></div>
          </div>
        </div>
      </div>
    </div>
    <p class="muted" style="margin:12px 6px">Tip: you can call this endpoint programmatically with <code>Accept: application/json</code> to receive JSON instead of HTML.</p>
  </div>

  <script>
    function toggleRaw(){
      const list = document.getElementById('loglist');
      if (!list) return;
      list.classList.toggle('raw');
      // when raw: show plain bullets with no colors
      if (list.classList.contains('raw')) {
        for (const li of list.children) li.className = 'log';
      }
    }
  </script>
</body>
</html>`;
}

export const fresh_sync = async (req, res) => {
  if (running) {
    // If HTML was asked, show a pretty message; else JSON.
    if (req.accepts(['html','json']) === 'html') {
      const html = renderSyncReport({
        ok: false,
        logs: ['Another fresh_sync is already running. Try again in a moment.'],
        startedAt: Date.now(),
        endedAt: Date.now(),
        env: process.env.NODE_ENV || 'development',
      });
      return res.status(409).type('html').send(html);
    }
    return res.status(409).json({ success:false, message:'fresh_sync already running' });
  }

  const started = Date.now();
  running = true;
  try {
    const result = await freshSync(); // { ok, logs }
    // If client asked JSON explicitly, honor it
    if (req.accepts(['html','json']) === 'json') {
      return res.json({ success: !!result.ok, logs: result.logs, startedAt: started, endedAt: Date.now() });
    }
    // otherwise send pretty HTML
    const html = renderSyncReport({
      ok: !!result.ok,
      logs: result.logs || [],
      startedAt: started,
      endedAt: Date.now(),
      env: process.env.NODE_ENV || 'development',
    });
    return res.type('html').send(html);
  } catch (e) {
    if (req.accepts(['html','json']) === 'json') {
      return res.status(500).json({ success:false, error: e.message || String(e), startedAt: started, endedAt: Date.now() });
    }
    const html = renderSyncReport({
      ok: false,
      logs: ['Fresh sync crashed.', String(e && (e.stack || e.message || e))],
      startedAt: started,
      endedAt: Date.now(),
      env: process.env.NODE_ENV || 'development',
    });
    return res.status(500).type('html').send(html);
  } finally {
    running = false;
  }
};






