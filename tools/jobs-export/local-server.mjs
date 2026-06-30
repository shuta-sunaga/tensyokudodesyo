/**
 * ローカル検証サーバー (Vercel function を localhost で動かす簡易ラッパー)
 *   起動: node --env-file=.env local-server.mjs   → http://localhost:5174
 *
 * Vercel の (req, res) シグネチャを Node http で再現する。
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import handler from './api/export.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5174;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 静的: index.html
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    const html = await readFile(join(__dirname, 'index.html'));
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.end(html);
  }

  // /api/export
  if (url.pathname === '/api/export') {
    // Vercel 互換の req.query / req.body を生やす
    req.query = Object.fromEntries(url.searchParams);
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try { req.body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
      catch { req.body = {}; }
    }
    // res.status().json()/.send() ヘルパを付与
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
    res.send = (buf) => { res.end(buf); return res; };
    return handler(req, res);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`求人CSVエクスポート (local) → http://localhost:${PORT}`);
  const need = ['LARK_APP_ID', 'LARK_APP_SECRET', 'LARK_APP_TOKEN', 'LARK_TABLE_ID', 'EXPORT_PASSWORD'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) console.warn('⚠ 未設定の環境変数:', missing.join(', '), '(.env を用意してください)');
});
