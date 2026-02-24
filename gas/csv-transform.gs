/**
 * CSV データ整形スクリプト
 *
 * 自社求人管理システムからエクスポートしたデータを
 * Movable Type インポート用 CSV（Shift_JIS）に変換する。
 *
 * 使い方:
 * 1. Google スプレッドシートの「整形前」シートに元データを貼り付ける
 * 2. メニューから「CSV整形」→「データを整形する」を実行
 * 3. 「整形後」シートに変換結果が出力される
 * 4. Shift_JIS CSV がマイドライブに保存され、ダウンロードリンクが表示される
 * 5. ダウンロードした CSV を MT 管理画面から手動インポートする
 */

// メニュー追加
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CSV整形')
    .addItem('データを整形する', 'transformData')
    .addToUi();
}

/**
 * メイン処理：整形前シートのデータを整形後シートに変換出力する
 */
function transformData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 整形前シートからデータ取得 ──
  const srcSheet = ss.getSheetByName('整形前');
  if (!srcSheet) {
    SpreadsheetApp.getUi().alert('「整形前」シートが見つかりません。');
    return;
  }

  const srcData = srcSheet.getDataRange().getValues();
  const srcDisplay = srcSheet.getDataRange().getDisplayValues();
  if (srcData.length < 2) {
    SpreadsheetApp.getUi().alert('整形前シートにデータがありません。');
    return;
  }

  // ── 整形後シートを準備（なければ作成） ──
  let dstSheet = ss.getSheetByName('整形後');
  if (!dstSheet) {
    dstSheet = ss.insertSheet('整形後');
  } else {
    dstSheet.clear();
  }

  // ── 整形後ヘッダー定義 ──
  const dstHeaders = [
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

  // ── 整形前ヘッダーからカラムインデックスを取得 ──
  const srcHeaders = srcData[0].map(h => String(h).trim());
  const col = (name) => srcHeaders.indexOf(name);

  const IDX = {
    求人票ID:       col('求人票ID'),
    求人名:         col('求人名'),
    採用企業名:     col('採用企業名'),
    雇用形態:       col('雇用形態'),
    職種大分類:     col('職種（大分類）'),
    応募条件:       col('応募条件'),
    歓迎条件:       col('歓迎条件'),
    仕事内容:       col('仕事内容'),
    勤務地詳細:     col('勤務地詳細'),
    勤務時間:       col('勤務時間'),
    休日詳細:       col('休日詳細'),
    選考フロー:     col('選考フロー'),
    年収下限:       col('年収下限'),
    年収上限:       col('年収上限'),
    給与詳細:       col('給与詳細'),
    福利厚生詳細:   col('福利厚生詳細'),
    諸手当:         col('諸手当'),
    賞与詳細:       col('賞与詳細'),
    郵便番号:       col('本社：郵便場号'),
    都道府県:       col('本社：都道府県'),
    住所詳細:       col('本社：住所詳細'),
    建物:           col('建物'),
    従業員数:       col('従業員数'),
    設立年月:       col('設立年月'),
    会社概要:       col('会社概要'),
    会社HP_URL:     col('会社HP_URL'),
  };

  // ── 実行時刻を取得（"YYYY-MM-DD HH:mm:ss" 形式） ──
  const now = new Date();
  const execTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  // ── ユーティリティ関数 ──

  /** 半角括弧を全角括弧に統一 */
  const normalizeParens = (text) => {
    return text.replace(/\(/g, '（').replace(/\)/g, '）');
  };

  /** 数値に千の位カンマを付与（文字列中の数字列すべてに適用） */
  const addCommas = (text) => {
    return String(text).replace(/\d+/g, (match) => {
      return Number(match).toLocaleString('en-US');
    });
  };

  /** 全角チルダ「～」を半角チルダ「~」に置換（Unicodeエスケープで確実に） */
  const normalizeTilde = (text) => {
    return String(text)
      .replace(/\uFF5E/g, '~')   // ～ (fullwidth tilde)
      .replace(/\u301C/g, '~');   // 〜 (wave dash)
  };

  /**
   * 環境依存文字を安全な代替文字に変換する
   * GASエディタのエンコーディングに依存しないよう、すべて \uXXXX 正規表現で処理する
   */
  const replaceUnsafeChars = (text) => {
    let s = String(text);

    // ── 丸囲み数字 ①〜⑳ (U+2460〜U+2473) ──
    s = s.replace(/[\u2460-\u2473]/g, (ch) => '(' + (ch.codePointAt(0) - 0x2460 + 1) + ')');

    // ── ハイフン・ダッシュ系 → 半角ハイフン ──
    s = s.replace(/[\uFF0D\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE63\u207B\uFF70]/g, '-');
    //             －      ‐     ‑      ‒     –     —     ―     −     ﹣    ⁻     ｰ

    // ── チルダ系 → 半角チルダ ──
    s = s.replace(/[\uFF5E\u301C]/g, '~');
    //             ～      〜

    // ── ローマ数字（大文字）Ⅰ〜Ⅹ (U+2160〜U+2169) ──
    const romanUpper = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    s = s.replace(/[\u2160-\u2169]/g, (ch) => romanUpper[ch.codePointAt(0) - 0x2160]);

    // ── ローマ数字（小文字）ⅰ〜ⅹ (U+2170〜U+2179) ──
    const romanLower = ['i','ii','iii','iv','v','vi','vii','viii','ix','x'];
    s = s.replace(/[\u2170-\u2179]/g, (ch) => romanLower[ch.codePointAt(0) - 0x2170]);

    // ── 括弧付き略語 ──
    s = s.replace(/\u3231/g, '(株)');  // ㈱
    s = s.replace(/\u3232/g, '(有)');  // ㈲
    s = s.replace(/\u3233/g, '(社)');  // ㈳
    s = s.replace(/\u3234/g, '(名)');  // ㈴
    s = s.replace(/\u3235/g, '(特)');  // ㈵
    s = s.replace(/\u3236/g, '(財)');  // ㈶
    s = s.replace(/\u323B/g, '(学)');  // ㈻
    s = s.replace(/\u323C/g, '(監)');  // ㈼
    s = s.replace(/\u323E/g, '(合)');  // ㈾
    s = s.replace(/\u323F/g, '(労)');  // ㈿

    // ── 単位記号 ──
    s = s.replace(/\u33A1/g, 'm2');     // ㎡
    s = s.replace(/\u33A5/g, 'm3');     // ㎥
    s = s.replace(/\u339D/g, 'cm');     // ㎝
    s = s.replace(/\u339E/g, 'km');     // ㎞
    s = s.replace(/\u338F/g, 'kg');     // ㎏
    s = s.replace(/\u338E/g, 'mg');     // ㎎
    s = s.replace(/\u33C4/g, 'cc');     // ㏄
    s = s.replace(/\u2103/g, 'C');      // ℃
    s = s.replace(/\u2109/g, 'F');      // ℉

    // ── 年号 ──
    s = s.replace(/\u337E/g, '明治');   // ㍾
    s = s.replace(/\u337D/g, '大正');   // ㍽
    s = s.replace(/\u337C/g, '昭和');   // ㍼
    s = s.replace(/\u337B/g, '平成');   // ㍻
    s = s.replace(/\u32FF/g, '令和');   // ㋿

    // ── 異体字（人名・地名で頻出） ──
    s = s.replace(/\u9AD9/g, '高');     // 髙
    s = s.replace(/\uFA11/g, '崎');     // 﨑
    s = s.replace(/\u6FF5/g, '浜');     // 濵
    s = s.replace(/\u5FB7/g, '徳');     // 德
    s = s.replace(/\u908A/g, '辺');     // 邊
    s = s.replace(/\u9089/g, '辺');     // 邉
    s = s.replace(/\u9F4B/g, '斎');     // 齋
    s = s.replace(/\u9F4A/g, '斉');     // 齊
    s = s.replace(/\u5EE3/g, '広');     // 廣
    s = s.replace(/\u6AFB/g, '桜');     // 櫻
    s = s.replace(/\u570B/g, '国');     // 國
    s = s.replace(/\u58FD/g, '寿');     // 壽
    s = s.replace(/\u9F8D/g, '竜');     // 龍
    s = s.replace(/\u6FA4/g, '沢');     // 澤
    s = s.replace(/\u6822/g, '柳');     // 栁
    s = s.replace(/\u9ED1/g, '黒');     // 黑

    // ── 引用符系 ──
    s = s.replace(/[\u201C\u201D\u301D\u301E\u2033]/g, '"');  // " " 〝 〞 ″
    s = s.replace(/[\u2018\u2019]/g, "'");                     // ' '

    // ── その他記号 ──
    s = s.replace(/\u2026/g, '...');    // …
    s = s.replace(/\u2025/g, '..');     // ‥
    s = s.replace(/[\u2713\u2714]/g, 'v');  // ✓ ✔
    s = s.replace(/[\u2715\u2716\u2717\u2718]/g, 'x');  // ✕ ✖ ✗ ✘

    return s;
  };

  /** Shift_JISに変換可能かテストする */
  const isShiftJISSafe = (char) => {
    try {
      const blob = Utilities.newBlob('').setDataFromString(char, 'Shift_JIS');
      const bytes = blob.getBytes();
      if (bytes.length === 1 && bytes[0] === 0x3F && char !== '?') {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const unmappedChars = new Set();

  /** replaceUnsafeChars → 残存文字の Shift_JIS 変換チェック の2段構え */
  const sanitizeForShiftJIS = (text) => {
    // 1段目: 既知の環境依存文字をUnicodeエスケープ正規表現で確実に置換
    let result = replaceUnsafeChars(String(text));

    // 2段目: 残りの文字を1文字ずつチェックし、変換不能なものを「?」に置換
    let output = '';
    for (const char of result) {
      if (isShiftJISSafe(char)) {
        output += char;
      } else {
        unmappedChars.add(char);
        output += '?';
      }
    }
    return output;
  };

  /**
   * locationの値から「都道府県+市区町村」を抽出して city を生成する
   * 例: "浜松三方町店（静岡県浜松市中央区東三方町222-3）" → "静岡県浜松市"
   * 抽出できない場合は "要相談" を返す
   */
  const extractCity = (location) => {
    if (!location) return '要相談';

    // 括弧内の住所を優先的に取得（全角・半角両対応）
    let address = '';
    const parenMatch = location.match(/[（(]([^）)]+)[）)]/);
    if (parenMatch) {
      // 括弧内に都道府県が含まれていれば住所とみなす
      if (/[都道府県]/.test(parenMatch[1])) {
        address = parenMatch[1];
      } else {
        // 括弧内が店舗名等の場合、括弧外のテキストから抽出
        // 例: "静岡県磐田市見付4353-1（磐田店）"
        address = location.replace(/[（(][^）)]*[）)]/g, '').trim();
      }
    } else {
      address = location;
    }

    // 都道府県 + 市 を抽出（例: 静岡県浜松市）
    const cityMatch = address.match(/(.+?[都道府県])(.+?市)/);
    if (cityMatch) {
      return cityMatch[1] + cityMatch[2];
    }

    // 東京都の特別区（例: 東京都渋谷区）
    const wardMatch = address.match(/(東京都)(.+?区)/);
    if (wardMatch) {
      return wardMatch[1] + wardMatch[2];
    }

    // 北海道の郡・町村（例: 北海道虻田郡ニセコ町）
    const gunMatch = address.match(/(.+?[都道府県])(.+?郡.+?[町村])/);
    if (gunMatch) {
      return gunMatch[1] + gunMatch[2];
    }

    // 都道府県のみ取得できた場合
    const prefOnly = address.match(/(.+?[都道府県])/);
    if (prefOnly) {
      return prefOnly[1];
    }

    return '要相談';
  };

  // ── データ行を変換 ──
  const outputRows = [dstHeaders];

  for (let i = 1; i < srcData.length; i++) {
    const r = srcData[i];
    const v = (key) => (IDX[key] >= 0 ? String(r[IDX[key]]).trim() : '');
    // 表示値をそのまま取得（日付等の形式維持用）
    const d = (key) => (IDX[key] >= 0 ? String(srcDisplay[i][IDX[key]]).trim() : '');

    // --- 応募条件 + 歓迎条件（「特になし」は空白に置換） ---
    const sanitize = (text) => {
      const t = text.trim();
      return (t === '特になし') ? '' : t;
    };
    const ouboRaw   = sanitize(v('応募条件'));
    const kangeiRaw = sanitize(v('歓迎条件'));
    const requirements = [ouboRaw, kangeiRaw].filter(Boolean).join('\n');

    // --- 年収（下限～上限） ---
    const salaryLower = v('年収下限');
    const salaryUpper = v('年収上限');
    const salary = (salaryLower || salaryUpper)
      ? salaryLower + '~' + salaryUpper
      : '';

    // --- 福利厚生詳細 + 諸手当 ---
    const fukuri   = v('福利厚生詳細');
    const teate    = v('諸手当');
    const benefits = [fukuri, teate].filter(Boolean).join('\n');

    // --- 本社住所（郵便番号 + 都道府県 + 住所詳細 + 建物） ---
    const companyAddress = [
      v('郵便番号'),
      v('都道府県'),
      v('住所詳細'),
      v('建物')
    ].filter(Boolean).join(' ');

    // ── 整形後の各カラムにマッピング ──
    const row = new Array(dstHeaders.length).fill('');

    const set = (name, value) => {
      const idx = dstHeaders.indexOf(name);
      if (idx >= 0) row[idx] = value;
    };

    set('class',              'entry');
    set('author',             'admin');
    set('authored_on',        execTime);
    set('modified_on',        execTime);
    set('basename',           v('求人票ID'));
    set('title',              v('求人名'));
    set('company',            v('採用企業名'));
    set('employment_type',    v('雇用形態'));
    set('category',           normalizeParens(v('職種大分類')));
    set('requirements',       requirements);
    set('description',        v('仕事内容'));
    set('localtion',          v('勤務地詳細'));
    set('city',               extractCity(v('勤務地詳細')));
    set('work_hours',         v('勤務時間'));
    set('holidays',           v('休日詳細'));
    set('selection_process',  v('選考フロー'));
    set('salary',             addCommas(salary));
    set('salary_detail',      addCommas(v('給与詳細')));
    set('benefits',           benefits);
    set('bonus',              addCommas(v('賞与詳細')));
    set('company_address',    companyAddress);
    set('employees',          addCommas(v('従業員数')));
    set('established',        d('設立年月'));
    set('business_content',   v('会社概要'));
    set('companyurl',         v('会社HP_URL'));

    // 全セルの全角チルダ「～」を半角「~」に置換
    // + 環境依存文字をShift_JIS安全な文字に変換
    for (let c = 0; c < row.length; c++) {
      row[c] = sanitizeForShiftJIS(normalizeTilde(row[c]));
    }

    outputRows.push(row);
  }

  // 変換できなかった未知の環境依存文字をログに出力
  if (unmappedChars.size > 0) {
    const charList = Array.from(unmappedChars).map(c => `「${c}」(U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(', ');
    Logger.log('⚠ Shift_JIS変換不能文字を「?」に置換しました: ' + charList);
  }

  // ── 整形後シートに書き出し ──
  // established カラムをテキスト形式に設定（日付への自動変換を防止）
  const estColIdx = dstHeaders.indexOf('established') + 1; // 1-based
  if (estColIdx > 0) {
    dstSheet.getRange(1, estColIdx, outputRows.length, 1).setNumberFormat('@');
  }
  dstSheet.getRange(1, 1, outputRows.length, dstHeaders.length).setValues(outputRows);

  // ── Shift_JIS の CSV ファイルを Google Drive に保存 ──
  let csvContent = outputRows.map(row =>
    row.map(cell => {
      const s = String(cell);
      // カンマ・改行・ダブルクォートを含むセルはクォートで囲む
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')
  ).join('\r\n');

  // CSV文字列全体に最終サニタイズ（万が一残っている環境依存文字を確実に置換）
  csvContent = replaceUnsafeChars(csvContent);

  const blob = Utilities.newBlob('', 'text/csv');
  blob.setDataFromString(csvContent, 'Shift_JIS');
  const fileName = 'export_' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss') + '.csv';
  blob.setName(fileName);

  const file = DriveApp.createFile(blob);
  const fileUrl = file.getDownloadUrl();

  // ── ダウンロードリンクをダイアログで表示 ──
  const warningHtml = unmappedChars.size > 0
    ? `<p style="margin-top: 12px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 12px; color: #856404;">
        ⚠ Shift_JISに変換できない文字が ${unmappedChars.size} 種類あり「?」に置換しました。<br>
        詳細は Apps Script のログを確認してください。
      </p>`
    : '';

  const htmlContent = `
    <div style="font-family: sans-serif; padding: 10px;">
      <p>整形完了：<strong>${outputRows.length - 1} 件</strong>のデータを変換しました。</p>
      <p>Shift_JIS の CSV ファイルを Google Drive に保存しました。</p>
      <p style="margin-top: 16px;">
        <a href="${fileUrl}" target="_blank"
           style="background: #4285f4; color: #fff; padding: 10px 20px;
                  text-decoration: none; border-radius: 4px; font-size: 14px;">
          CSV をダウンロード
        </a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #666;">
        ファイル名: ${fileName}<br>
        保存先: マイドライブ直下
      </p>
      ${warningHtml}
    </div>`;
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(260);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'CSV エクスポート完了');
}
