/**
 * 求人データ整形ロジック (gas/csv-transform.gs の移植)
 *
 * Lark Base から取得した求人レコード(フィールド名→値のオブジェクト)を
 * Movable Type インポート用の行配列に変換する。
 * Shift_JIS への安全変換ロジックは GAS 版を忠実に移植している。
 */

// ── 整形後ヘッダー定義 (GAS版と同一) ──
export const DST_HEADERS = [
  'class', 'id', 'status', 'author', 'authored_on', 'modified_on',
  'unpublished_on', 'convert_breaks', 'title', 'text', 'text_more',
  'excerpt', 'categories', 'tags', 'allow_comments',
  'allow_pings', 'assets', 'basename', 'company', 'city', 'salary',
  'conditions', 'category', 'keywords', 'description', 'requirements',
  'employment_type', 'benefits', 'company_address', 'established',
  'representative', 'employees', 'business_content', 'localtion',
  'work_hours', 'salary_detail', 'bonus', 'holidays', 'selection_process',
  'application_method', 'recommendpoint1', 'recommendpoint2',
  'recommendpoint3', 'companyurl'
];

// ── Lark Base のフィールド名 (= GAS の整形前カラム名) ──
// creds 入手後に実フィールド名と照合して微調整する。
export const SRC_FIELDS = {
  id:           'id',
  求人票ID:     '求人票ID',
  求人名:       '求人名',
  採用企業名:   '採用企業名',
  雇用形態:     '雇用形態',
  職種大分類:   '職種（大分類）',
  応募条件:     '応募条件',
  歓迎条件:     '歓迎条件',
  仕事内容:     '仕事内容',
  勤務地詳細:   '勤務地詳細',
  勤務時間:     '勤務時間',
  休日詳細:     '休日詳細',
  選考フロー:   '選考フロー',
  年収下限:     '年収下限',
  年収上限:     '年収上限',
  給与詳細:     '給与詳細',
  福利厚生詳細: '福利厚生詳細',
  諸手当:       '諸手当',
  賞与詳細:     '賞与詳細',
  郵便番号:     '本社：郵便場号',
  都道府県:     '本社：都道府県',
  住所詳細:     '本社：住所詳細',
  建物:         '建物',
  従業員数:     '従業員数',
  設立年月:     '設立年月',
  会社概要:     '会社概要',
  ポイント1:    'ポジションのポイント1',
  ポイント2:    'ポジションのポイント2',
  ポイント3:    'ポジションのポイント3',
  会社HP_URL:   '会社HP_URL',
};

// ─────────────────────────────────────────────────────────
// ユーティリティ (GAS版を忠実移植)
// ─────────────────────────────────────────────────────────

/** 半角括弧を全角括弧に統一 */
const normalizeParens = (text) => String(text).replace(/\(/g, '（').replace(/\)/g, '）');

/** 数値に千の位カンマを付与 */
const addCommas = (text) =>
  String(text).replace(/\d[\d,]*/g, (match) => {
    const num = match.replace(/,/g, '');
    return Number(num).toLocaleString('en-US');
  });

/** 全角チルダ「～」を半角チルダ「~」に置換 */
const normalizeTilde = (text) =>
  String(text).replace(/～/g, '~').replace(/〜/g, '~');

/** 環境依存文字を安全な代替文字に変換 (GAS版 replaceUnsafeChars を完全移植) */
function replaceUnsafeChars(text) {
  let s = String(text);

  // 丸囲み数字 ①〜⑳
  s = s.replace(/[①-⑳]/g, (ch) => '(' + (ch.codePointAt(0) - 0x2460 + 1) + ')');
  // ハイフン・ダッシュ系 → 半角ハイフン
  s = s.replace(/[－‐‑‒–—―−﹣⁻ｰ]/g, '-');
  // チルダ系 → 半角チルダ
  s = s.replace(/[～〜]/g, '~');
  // ローマ数字（大文字）Ⅰ〜Ⅹ
  const romanUpper = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  s = s.replace(/[Ⅰ-Ⅹ]/g, (ch) => romanUpper[ch.codePointAt(0) - 0x2160]);
  // ローマ数字（小文字）ⅰ〜ⅹ
  const romanLower = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  s = s.replace(/[ⅰ-ⅹ]/g, (ch) => romanLower[ch.codePointAt(0) - 0x2170]);
  // 括弧付き略語
  s = s.replace(/㈱/g, '(株)').replace(/㈲/g, '(有)').replace(/㈳/g, '(社)')
    .replace(/㈴/g, '(名)').replace(/㈵/g, '(特)').replace(/㈶/g, '(財)')
    .replace(/㈻/g, '(学)').replace(/㈼/g, '(監)').replace(/㈾/g, '(合)')
    .replace(/㈿/g, '(労)');
  // 単位記号
  s = s.replace(/㎡/g, 'm2').replace(/㎥/g, 'm3').replace(/㎝/g, 'cm')
    .replace(/㎞/g, 'km').replace(/㎏/g, 'kg').replace(/㎎/g, 'mg')
    .replace(/㏄/g, 'cc').replace(/℃/g, 'C').replace(/℉/g, 'F');
  // 年号
  s = s.replace(/㍾/g, '明治').replace(/㍽/g, '大正').replace(/㍼/g, '昭和')
    .replace(/㍻/g, '平成').replace(/㋿/g, '令和');
  // 異体字
  s = s.replace(/髙/g, '高').replace(/﨑/g, '崎').replace(/濵/g, '浜')
    .replace(/德/g, '徳').replace(/邊/g, '辺').replace(/邉/g, '辺')
    .replace(/齋/g, '斎').replace(/齊/g, '斉').replace(/廣/g, '広')
    .replace(/櫻/g, '桜').replace(/國/g, '国').replace(/壽/g, '寿')
    .replace(/龍/g, '竜').replace(/澤/g, '沢').replace(/栢/g, '柳')
    .replace(/黑/g, '黒');
  // 引用符系
  s = s.replace(/[“”〝〞″]/g, '"');
  s = s.replace(/[‘’]/g, "'");
  // 商標・知的財産記号
  s = s.replace(/™/g, '(TM)').replace(/℠/g, '(SM)');
  // トランプ・装飾記号
  s = s.replace(/♦/g, '◆').replace(/♧/g, '◇').replace(/♠/g, '■')
    .replace(/♣/g, '■').replace(/♥/g, '●').replace(/♤/g, '○')
    .replace(/♡/g, '○').replace(/♢/g, '◇');
  // 数学・幾何記号
  s = s.replace(/∟/g, 'L').replace(/√/g, 'v/').replace(/≈/g, '≒')
    .replace(/≡/g, '≡');
  // 特殊スラッシュ → 半角スラッシュ
  s = s.replace(/⁄/g, '/').replace(/∕/g, '/').replace(/⧸/g, '/');
  // 特殊スペース → 半角スペース
  s = s.replace(/[            ]/g, ' ');
  // ゼロ幅文字 → 除去
  s = s.replace(/[​‌‍﻿]/g, '');
  // 矢印・ポインタ
  s = s.replace(/➜/g, '→').replace(/➡/g, '→').replace(/➔/g, '→').replace(/→/g, '→');
  // 箇条書き・弾丸記号
  s = s.replace(/•/g, '・').replace(/‣/g, '>').replace(/◦/g, '○')
    .replace(/⁃/g, '-');
  // 星・評価記号
  s = s.replace(/✪/g, '★').replace(/[⭐⭑⭒]/g, '★').replace(/✨/g, '');
  // その他記号
  s = s.replace(/…/g, '...').replace(/‥/g, '..');
  s = s.replace(/[✓✔]/g, 'v').replace(/[✕✖✗✘]/g, 'x');
  s = s.replace(/·/g, '・').replace(/∙/g, '・');

  return s;
}

/**
 * locationの値から「都道府県+市区町村」を抽出して city を生成 (GAS版を移植)
 */
export function extractCity(location) {
  if (!location) return '要相談';
  let address = '';
  const parenMatch = location.match(/[（(]([^）)]+)[）)]/);
  if (parenMatch) {
    if (/[都道府県]/.test(parenMatch[1])) {
      address = parenMatch[1];
    } else {
      address = location.replace(/[（(][^）)]*[）)]/g, '').trim();
    }
  } else {
    address = location;
  }
  const cityMatch = address.match(/(.+?[都道府県])(.+?市)/);
  if (cityMatch) return cityMatch[1] + cityMatch[2];
  const wardMatch = address.match(/(東京都)(.+?区)/);
  if (wardMatch) return wardMatch[1] + wardMatch[2];
  const gunMatch = address.match(/(.+?[都道府県])(.+?郡.+?[町村])/);
  if (gunMatch) return gunMatch[1] + gunMatch[2];
  const prefOnly = address.match(/(.+?[都道府県])/);
  if (prefOnly) return prefOnly[1];
  return '要相談';
}

/** 都道府県名からサフィックス(都/道/府/県)を除いたコア名を返す。例: 大阪府→大阪, 東京都→東京, 北海道→北海 */
export function prefectureCore(name) {
  return String(name || '').trim().replace(/[都道府県]$/, '');
}

/**
 * 「勤務地（県）」フィールド値が指定コア名にマッチするか判定する。
 * 複数県を 「、」「,」「，」空白 区切りで含む値や、サフィックス有無の混在に対応。
 * 各トークンのサフィックスを外して完全一致で比較するため、「京都」が「東京都」を誤検出しない。
 */
export function matchesPrefectureCore(fieldValue, core) {
  if (!core) return false;
  const tokens = String(fieldValue || '').split(/[、,，\s]+/).filter(Boolean);
  return tokens.some((t) => prefectureCore(t) === core);
}

/**
 * Lark レコード配列 → MT インポート用の行オブジェクト配列に整形する。
 * @param {Array<Object>} records  フィールド名→値 のオブジェクト配列
 * @param {string} execTime "YYYY-MM-DD HH:mm:ss"
 * @returns {Array<Object>} DST_HEADERS をキーに持つ行オブジェクト配列
 */
export function buildRows(records, execTime) {
  const F = SRC_FIELDS;
  return records.map((rec) => {
    const v = (fieldKey) => {
      const name = F[fieldKey];
      const raw = rec[name];
      return raw == null ? '' : String(raw).trim();
    };

    const sanitize = (text) => {
      const t = String(text).trim();
      return t === '特になし' ? '' : t;
    };
    const requirements = [sanitize(v('応募条件')), sanitize(v('歓迎条件'))]
      .filter(Boolean).join('\n');

    const salaryLower = v('年収下限');
    const salaryUpper = v('年収上限');
    const salary = (salaryLower || salaryUpper) ? salaryLower + '~' + salaryUpper : '';

    const benefits = [v('福利厚生詳細'), v('諸手当')].filter(Boolean).join('\n');

    const companyAddress = [v('郵便番号'), v('都道府県'), v('住所詳細'), v('建物')]
      .filter(Boolean).join(' ');

    const row = {};
    DST_HEADERS.forEach((h) => { row[h] = ''; });

    row.class = 'entry';
    row.id = v('id');
    row.author = 'admin';
    row.authored_on = execTime;
    row.modified_on = execTime;
    row.basename = v('求人票ID');
    row.title = v('求人名');
    row.company = v('採用企業名');
    row.employment_type = v('雇用形態');
    row.category = normalizeParens(v('職種大分類'));
    row.requirements = requirements;
    row.description = v('仕事内容');
    row.localtion = v('勤務地詳細');
    row.city = extractCity(v('勤務地詳細'));
    row.work_hours = v('勤務時間');
    row.holidays = v('休日詳細');
    row.selection_process = v('選考フロー');
    row.salary = addCommas(salary);
    row.salary_detail = addCommas(v('給与詳細'));
    row.benefits = benefits;
    row.bonus = addCommas(v('賞与詳細'));
    row.company_address = companyAddress;
    row.employees = addCommas(v('従業員数'));
    row.established = v('設立年月');
    row.business_content = v('会社概要');
    row.recommendpoint1 = v('ポイント1');
    row.recommendpoint2 = v('ポイント2');
    row.recommendpoint3 = v('ポイント3');
    row.companyurl = v('会社HP_URL');

    // 全セルにチルダ正規化 + 環境依存文字置換を適用
    for (const h of DST_HEADERS) {
      row[h] = replaceUnsafeChars(normalizeTilde(row[h]));
    }
    return row;
  });
}

const escapeCell = (cell) => {
  const s = String(cell);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

/** CSV ヘッダー行 (44列) */
export function csvHeaderLine() {
  return DST_HEADERS.join(',');
}

/** 1行オブジェクトを CSV 1行に変換する */
export function rowToCsvLine(row) {
  return DST_HEADERS.map((h) => escapeCell(row[h])).join(',');
}

/**
 * 行オブジェクト配列を CSV 文字列 (UTF-8 内部表現) に変換する。
 * Shift_JIS への実エンコードは csv-shiftjis.mjs 側で行う。
 */
export function rowsToCsvString(rows) {
  return [csvHeaderLine(), ...rows.map(rowToCsvLine)].join('\r\n');
}

export { replaceUnsafeChars, normalizeParens, addCommas, normalizeTilde };
