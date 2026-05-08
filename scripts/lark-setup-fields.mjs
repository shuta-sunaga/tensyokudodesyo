/**
 * Lark Base のフィールドを API 経由で一括セットアップするスクリプト
 *
 * 実行:
 *   node scripts/lark-setup-fields.mjs            # dry-run (差分表示のみ)
 *   node scripts/lark-setup-fields.mjs --apply    # 実際に作成
 *
 * 認証情報は backend/local-dev/.env から読み込む。
 *
 * Lark Bitable API:
 *   List fields:   GET  /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields
 *   Create field:  POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields
 *
 * フィールドタイプ (UIType):
 *   1: テキスト, 2: 数値, 3: 単一選択, 5: 日時, 7: チェックボックス
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, 'backend', 'local-dev', '.env');

const APPLY = process.argv.includes('--apply');

// ----- .env 読み込み ------------------------------------------------------
async function loadEnv() {
    const raw = await fs.readFile(ENV_PATH, 'utf8');
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m && !line.startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return env;
}

const env = await loadEnv();
const APP_ID = env.LARK_APP_ID;
const APP_SECRET = env.LARK_APP_SECRET;
const APP_TOKEN = env.LARK_APP_TOKEN;
const TABLE_ID = env.LARK_TABLE_ID;

if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
    console.error('ERROR: .env に必要な値が不足しています');
    console.error('  LARK_APP_ID    =', APP_ID ? '(ok)' : 'MISSING');
    console.error('  LARK_APP_SECRET=', APP_SECRET ? '(ok)' : 'MISSING');
    console.error('  LARK_APP_TOKEN =', APP_TOKEN ? '(ok)' : 'MISSING');
    console.error('  LARK_TABLE_ID  =', TABLE_ID ? '(ok)' : 'MISSING');
    process.exit(1);
}

// ----- 認証 ---------------------------------------------------------------
async function getTenantAccessToken() {
    const res = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    });
    const data = await res.json();
    if (data.code !== 0) {
        throw new Error(`auth failed: code=${data.code} msg=${data.msg}`);
    }
    return data.tenant_access_token;
}

// ----- 望ましいフィールド定義 ---------------------------------------------
const PREFECTURES = [
    '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
    '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
    '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
    '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
    '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
    '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
    '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];
const STATUSES = ['在職中','離職中','転職活動中','情報収集中','その他'];
const TICKET_STATUS = ['未対応','対応中','完了','不要対応'];

// 各フィールド: { name, type, ui_type, property? }
// type 1=Text, 2=Number, 3=SingleSelect, 5=DateTime, 7=Checkbox
const DESIRED_FIELDS = [
    { name: 'submitted_at',           type: 5, property: { date_formatter: 'yyyy/MM/dd HH:mm', auto_fill: false } },
    { name: 'name',                   type: 1 },
    { name: 'name_kana',              type: 1 },
    { name: 'email',                  type: 1 },
    { name: 'phone',                  type: 1 },
    { name: 'prefecture',             type: 3, property: { options: PREFECTURES.map(name => ({ name })) } },
    { name: 'age',                    type: 2, property: { formatter: '0' } },
    { name: 'current_status',         type: 3, property: { options: STATUSES.map(name => ({ name })) } },
    { name: 'interested_job',         type: 1 },
    { name: 'message',                type: 1 },
    { name: 'terms_consent',          type: 7 },
    { name: 'terms_version',          type: 1 },
    { name: 'privacy_consent',        type: 7 },
    { name: 'privacy_policy_version', type: 1 },
    { name: 'consent_ip',             type: 1 },
    { name: 'user_agent',             type: 1 },
    { name: 'referrer_url',           type: 1 },
    { name: 'status',                 type: 3, property: { options: TICKET_STATUS.map(name => ({ name })) } },
    { name: 'notes',                  type: 1 },
];

// ----- 既存フィールド取得 -------------------------------------------------
async function listFields(token) {
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${encodeURIComponent(APP_TOKEN)}/tables/${encodeURIComponent(TABLE_ID)}/fields?page_size=100`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`list fields failed: code=${data.code} msg=${data.msg}`);
    return data.data.items || [];
}

// ----- フィールド作成 -----------------------------------------------------
async function createField(token, fieldDef) {
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${encodeURIComponent(APP_TOKEN)}/tables/${encodeURIComponent(TABLE_ID)}/fields`;
    const body = {
        field_name: fieldDef.name,
        type: fieldDef.type,
    };
    if (fieldDef.property) body.property = fieldDef.property;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.code !== 0) {
        throw new Error(`create field [${fieldDef.name}] failed: code=${data.code} msg=${data.msg}`);
    }
    return data.data.field;
}

// ----- メイン -------------------------------------------------------------
function typeName(t) {
    return ({1:'Text',2:'Number',3:'SingleSelect',5:'DateTime',7:'Checkbox',13:'Phone',15:'URL',17:'Attachment',18:'Link'}[t] || `type${t}`);
}

console.log(`\n=== Lark Base Field Setup ===`);
console.log(`Mode: ${APPLY ? 'APPLY (実際に作成します)' : 'DRY-RUN (差分表示のみ)'}`);
console.log(`App Token: ${APP_TOKEN}`);
console.log(`Table ID : ${TABLE_ID}\n`);

const token = await getTenantAccessToken();
console.log('✓ tenant_access_token 取得成功\n');

const existing = await listFields(token);
console.log(`既存フィールド: ${existing.length} 件`);
existing.forEach(f => console.log(`  - ${f.field_name.padEnd(28)} ${typeName(f.type)}`));

const existingNames = new Set(existing.map(f => f.field_name));
const missing = DESIRED_FIELDS.filter(d => !existingNames.has(d.name));
const present = DESIRED_FIELDS.filter(d => existingNames.has(d.name));

console.log(`\n望ましいフィールド: ${DESIRED_FIELDS.length} 件`);
console.log(`  既に存在: ${present.length}`);
console.log(`  作成必要: ${missing.length}`);

if (missing.length === 0) {
    console.log('\n✅ すべて揃っています');
    process.exit(0);
}

// 既存だが型不一致の警告
const typeMismatches = present
    .map(d => ({ d, e: existing.find(f => f.field_name === d.name) }))
    .filter(({ d, e }) => e.type !== d.type);
if (typeMismatches.length > 0) {
    console.log('\n⚠ 既存フィールドの型不一致:');
    typeMismatches.forEach(({ d, e }) => {
        console.log(`  - ${d.name}: 既存=${typeName(e.type)} / 期待=${typeName(d.type)}`);
    });
    console.log('  (このスクリプトは型変更しません。手動で確認してください)');
}

console.log('\n作成対象:');
missing.forEach(d => console.log(`  + ${d.name.padEnd(28)} ${typeName(d.type)}`));

if (!APPLY) {
    console.log(`\n⏸  DRY-RUN モード。実際に作成するには --apply を付けて再実行:`);
    console.log(`   node scripts/lark-setup-fields.mjs --apply`);
    process.exit(0);
}

console.log('\n=== 作成開始 ===');
let created = 0, failed = 0;
for (const def of missing) {
    try {
        const f = await createField(token, def);
        console.log(`  ✓ ${def.name.padEnd(28)} ${typeName(def.type)}  (id=${f.field_id})`);
        created++;
        // レート制限対策で少し待つ
        await new Promise(r => setTimeout(r, 200));
    } catch (e) {
        console.log(`  ✗ ${def.name.padEnd(28)} ${e.message}`);
        failed++;
    }
}

console.log(`\n結果: 作成成功 ${created} / 失敗 ${failed}`);
if (failed > 0) process.exit(1);
console.log('✅ 完了');
