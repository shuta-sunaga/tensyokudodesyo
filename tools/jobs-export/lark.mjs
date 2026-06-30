/**
 * Lark Base (Bitable) 読み取りクライアント
 *
 * backend/lambda/submit-form/src/lark.mjs のトークン取得ロジックを踏襲し、
 * 求人データの読み取り (フィールド一覧 / 全レコード取得) を追加したもの。
 */

const BASE = 'https://open.larksuite.com/open-apis';
const TENANT_TOKEN_URL = `${BASE}/auth/v3/tenant_access_token/internal`;

let _tokenCache = { token: null, expiresAt: 0 };

export async function getTenantAccessToken(appId, appSecret) {
  const now = Date.now();
  if (_tokenCache.token && _tokenCache.expiresAt > now + 60_000) {
    return _tokenCache.token;
  }
  const res = await fetch(TENANT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  if (!res.ok) throw new Error('Lark token HTTP ' + res.status);
  const data = await res.json();
  if (data.code !== 0) throw new Error('Lark token error: ' + data.msg);
  _tokenCache = { token: data.tenant_access_token, expiresAt: now + data.expire * 1000 };
  return _tokenCache.token;
}

/** テーブルのフィールド一覧を取得 (field_name と type) */
export async function listFields(token, appToken, tableId) {
  const url = `${BASE}/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/fields?page_size=200`;
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.code !== 0) {
    throw new Error(`Lark listFields HTTP ${res.status} code=${data.code} msg=${data.msg}`);
  }
  return (data.data?.items || []).map((f) => ({ name: f.field_name, type: f.type }));
}

/**
 * search API で 1フィールドの完全一致フィルタ + 作成日時付きでレコード取得する。
 * テーブルが大規模(数万件)のため、県フィルタはサーバー側で行う。
 * @param {{fieldName: string, value: string}} filter
 * @returns {Array<{record_id: string, fields: Object, created_time: number}>}
 */
export async function searchRecords(token, appToken, tableId, { fieldName, value, operator = 'is', fieldNames = null }) {
  const records = [];
  let pageToken = null;
  do {
    // 1レコード ~100フィールドあるため page_size を抑えてレスポンス肥大(502)を回避
    const params = new URLSearchParams({ page_size: '200' });
    if (pageToken) params.set('page_token', pageToken);
    const url = `${BASE}/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records/search?${params}`;
    const body = {
      automatic_fields: true, // created_time / last_modified_time を含める
      filter: {
        conjunction: 'and',
        conditions: [{ field_name: fieldName, operator, value: [value] }],
      },
    };
    // 必要なフィールドのみ取得してペイロードを削減
    if (fieldNames && fieldNames.length) body.field_names = fieldNames;
    // 5xx / ネットワークエラーは指数バックオフでリトライ (Lark は稀に 502 を返す)
    let res, data, lastErr;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        data = await res.json().catch(() => ({}));
        if (res.ok && data.code === 0) { lastErr = null; break; }
        lastErr = new Error(`Lark searchRecords HTTP ${res.status} code=${data.code} msg=${data.msg}`);
        // 4xx (リクエスト不正・権限) はリトライしても無駄
        if (res.status >= 400 && res.status < 500) break;
      } catch (e) {
        lastErr = e;
      }
      if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 600));
    }
    if (lastErr) throw lastErr;
    for (const item of data.data?.items || []) {
      records.push({ record_id: item.record_id, fields: item.fields || {}, created_time: item.created_time });
    }
    pageToken = data.data?.has_more ? data.data.page_token : null;
  } while (pageToken);
  return records;
}

/**
 * テーブルの全レコードをページネーションで取得する。(フォールバック用)
 * @returns {Array<{record_id: string, fields: Object}>}
 */
export async function fetchAllRecords(token, appToken, tableId) {
  const records = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({ page_size: '500' });
    if (pageToken) params.set('page_token', pageToken);
    const url = `${BASE}/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records?${params}`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.code !== 0) {
      throw new Error(`Lark fetchRecords HTTP ${res.status} code=${data.code} msg=${data.msg}`);
    }
    for (const item of data.data?.items || []) {
      records.push({ record_id: item.record_id, fields: item.fields || {} });
    }
    pageToken = data.data?.has_more ? data.data.page_token : null;
  } while (pageToken);
  return records;
}

/**
 * Lark のフィールド値を整形ロジックが扱える文字列に正規化する。
 * Bitable はテキストを配列やオブジェクトで返すことがあるため平坦化する。
 */
export function flattenFieldValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : '';
  if (Array.isArray(value)) {
    return value.map((v) => flattenFieldValue(v)).filter(Boolean).join('');
  }
  if (typeof value === 'object') {
    // リッチテキスト要素 {type, text} / リンク {text, link} / 担当者 {name} 等
    if ('text' in value) return String(value.text);
    if ('name' in value) return String(value.name);
    if ('link' in value) return String(value.link);
    return '';
  }
  return String(value);
}

/** record.fields を {フィールド名: 文字列値} に平坦化する */
export function normalizeRecord(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = flattenFieldValue(v);
  }
  return out;
}
