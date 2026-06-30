/**
 * Vercel Serverless Function: 求人データ整形 CSV エクスポート
 *
 *   POST /api/export   body: { prefecture, since, password }  → Shift_JIS CSV をダウンロード
 *   GET  /api/export?action=fields&password=...               → Base のフィールド名一覧 (スキーマ確認用)
 *
 * 環境変数 (Vercel / ローカル .env):
 *   LARK_APP_ID, LARK_APP_SECRET, LARK_APP_TOKEN, LARK_TABLE_ID  ... Lark Base 認証情報
 *   EXPORT_PASSWORD       ... フォーム共有パスワード (公開URL保護)
 *   PREFECTURE_FIELD      ... 県で絞るフィールド名 (default: 本社：都道府県)
 *   DATE_FIELD            ... 日付で絞るフィールド名 (default: 登録日)  ※実フィールド名に要調整
 */

import crypto from 'node:crypto';
import JSZip from 'jszip';
import {
  getTenantAccessToken, listFields, searchRecords, normalizeRecord, flattenFieldValue,
} from '../lark.mjs';
import { buildRows, csvHeaderLine, rowToCsvLine, prefectureCore, matchesPrefectureCore, SRC_FIELDS } from '../transform.mjs';
import { encodeShiftJIS } from '../csv-shiftjis.mjs';

// 1ファイルあたりの最大データ件数(ヘッダー込み499行)。バイト上限と併用し早い方で分割。
const CHUNK_SIZE = Number(process.env.EXPORT_CHUNK_SIZE) || 498;
// 1ファイルあたりの最大バイト数(Shift_JIS実体)。MT/nginx の既定1MB上限に収めるため余裕をもって設定。
const MAX_BYTES = Number(process.env.EXPORT_MAX_BYTES) || 900 * 1024;

// 県フィルタは「勤務地（県）」(実際の勤務地)。本社所在地ではない点に注意。
const PREFECTURE_FIELD = process.env.PREFECTURE_FIELD || '勤務地（県）';

// search API で取得するフィールド (整形に使う分 + 県フィルタ用)。'id' は実フィールドではないため除外。
const NEEDED_FIELDS = [...new Set([
  ...Object.entries(SRC_FIELDS).filter(([k]) => k !== 'id').map(([, v]) => v),
  PREFECTURE_FIELD,
])];

/** タイミング安全なパスワード比較 (コピペ事故対策で前後空白は除去) */
function passwordOk(input) {
  const expected = String(process.env.EXPORT_PASSWORD || '').trim();
  if (!expected) return false;
  const a = Buffer.from(String(input || '').trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function jstExecTime() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

function jstTimestamp() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}_` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export default async function handler(req, res) {
  try {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    const appToken = process.env.LARK_APP_TOKEN;
    const tableId = process.env.LARK_TABLE_ID;
    if (!appId || !appSecret || !appToken || !tableId) {
      return res.status(500).json({ error: 'Lark credentials not configured' });
    }

    // ── 認証 ──
    const password = req.method === 'POST' ? req.body?.password : req.query?.password;
    if (!passwordOk(password)) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const token = await getTenantAccessToken(appId, appSecret);

    // ── スキーマ確認モード ──
    if (req.method === 'GET' && req.query?.action === 'fields') {
      const fields = await listFields(token, appToken, tableId);
      return res.status(200).json({ count: fields.length, fields });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'method not allowed' });
    }

    const prefecture = String(req.body?.prefecture || '').trim();
    const since = String(req.body?.since || '').trim(); // YYYY-MM-DD
    if (!prefecture) return res.status(400).json({ error: 'prefecture required' });

    // since (JST 0時) を ms に。指定なしなら日付で絞らない。
    const sinceMs = since ? Date.parse(`${since}T00:00:00+09:00`) : null;

    // 都道府県サフィックスを除いたコア名で絞る (例: 大阪府→大阪)。
    // 「東京」「大阪府,京都府,兵庫県」等のサフィックス有無・複数県混在に対応するため。
    const core = prefectureCore(prefecture);

    // ── 県(コア名)でサーバー側 contains 取得 → トークン精緻化 + 作成日時で絞り込み ──
    const searched = await searchRecords(token, appToken, tableId, {
      fieldName: PREFECTURE_FIELD, value: core, operator: 'contains', fieldNames: NEEDED_FIELDS,
    });
    const filtered = searched.filter((r) => {
      // contains は「京都」で「東京都」も拾うため、トークン単位の完全一致で精緻化
      if (!matchesPrefectureCore(flattenFieldValue(r.fields[PREFECTURE_FIELD]), core)) return false;
      if (sinceMs != null && !(typeof r.created_time === 'number' && r.created_time >= sinceMs)) return false;
      return true;
    });

    if (filtered.length === 0) {
      return res.status(200).json({ error: 'no_records', message: '条件に一致する求人がありませんでした。' });
    }

    const records = filtered.map((r) => normalizeRecord(r.fields));

    // ── 整形 → 各行を Shift_JIS エンコード ──
    const rows = buildRows(records, jstExecTime());
    const ts = jstTimestamp();
    const CRLF = Buffer.from('\r\n', 'latin1'); // 0x0D 0x0A (2 bytes)

    const allUnmapped = new Set();
    const enc = (str) => {
      const { buffer, unmapped } = encodeShiftJIS(str);
      unmapped.forEach((u) => allUnmapped.add(u));
      return buffer;
    };
    const headerBuf = enc(csvHeaderLine());
    const lineBufs = rows.map((r) => enc(rowToCsvLine(r)));

    // ── ファイル容量(MAX_BYTES)と件数(CHUNK_SIZE)の両方を上限に分割 ──
    // MT/nginx のアップロード上限(既定1MB)に収めるためバイト基準で分割する。
    const chunks = []; // 各要素 = そのファイルに入れる行バッファ配列
    let cur = [];
    let curBytes = headerBuf.length;
    for (const lb of lineBufs) {
      const add = CRLF.length + lb.length;
      if (cur.length > 0 && (curBytes + add > MAX_BYTES || cur.length >= CHUNK_SIZE)) {
        chunks.push(cur);
        cur = [];
        curBytes = headerBuf.length;
      }
      cur.push(lb);
      curBytes += add;
    }
    if (cur.length) chunks.push(cur);

    // ヘッダー + 各行(CRLF区切り)でファイルバッファを組む。末尾改行は付けない。
    const buildFile = (lineBufArr) => {
      const parts = [headerBuf];
      for (const lb of lineBufArr) { parts.push(CRLF, lb); }
      return Buffer.concat(parts);
    };

    res.setHeader('X-Record-Count', String(filtered.length));
    res.setHeader('X-File-Count', String(chunks.length));
    if (allUnmapped.size) res.setHeader('X-Unmapped-Chars', encodeURIComponent([...allUnmapped].join('')));

    // 1ファイルに収まる場合は単一CSV、超える場合はZIPでまとめて返す
    if (chunks.length <= 1) {
      const buffer = buildFile(chunks[0] || []);
      const fileName = `jobs_${prefecture}_${ts}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=Shift_JIS');
      res.setHeader('Content-Disposition', `attachment; filename="export.csv"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      return res.status(200).send(buffer);
    }

    // ZIP内のファイル名は Windows での文字化け回避のため ASCII (GAS同様 export_日時_NofM.csv)
    const zip = new JSZip();
    chunks.forEach((lineBufArr, i) => {
      zip.file(`export_${ts}_${i + 1}of${chunks.length}.csv`, buildFile(lineBufArr));
    });
    const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const zipName = `jobs_${prefecture}_${ts}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="export.zip"; filename*=UTF-8''${encodeURIComponent(zipName)}`);
    return res.status(200).send(zipBuf);
  } catch (e) {
    console.error('export error:', e);
    return res.status(500).json({ error: 'internal_error', message: String(e?.message || e) });
  }
}
