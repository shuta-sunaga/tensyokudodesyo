import fs from 'fs';
import path from 'path';

const rewrites = {
    '087': '「小売・流通業界の年収は低い」を最新データで検証。主要職種の年収相場、EC化で伸びる職種、未経験から入れる5つの仕事、後悔しない企業選びのポイントを2026年版で解説します。',
    '092': '「実績がない」「定量化できない」を解決する書き方完全ガイド。Before/After変換テンプレート、職種別KPIの作り方、書類選考通過率を上げる数字表現を具体例付きで紹介します。',
    '114': '再エネ・電力・ガス業界の年収レンジ、未経験から狙える職種、必要資格、伸びる分野まで2026年版で網羅。「将来性のある転職先」を選びたい方が読むべき決定版ガイドです。',
    '046': '「件名・本文どう書く？」を即解決する例文集15パターン。場面別テンプレート、NG例とリライト例、送信前チェックリスト付き。コピペで失礼しない応募メールが完成します。',
    '050': '編年体・逆編年体・キャリア式の違いを採用担当目線で比較。職種・経験年数別の最適フォーマット、書類選考通過率を10〜15％上げる選び方を実例付きで解説します。',
    '049': '最終面接から内定まで平均1〜2週間。連絡が遅い理由、お礼メール例文、問い合わせる目安タイミング、内定待ち期間にやるべき5つの準備を採用担当目線で解説します。',
    '064': '入社3ヶ月で「いる前提」になる人の共通点5つ。初日の挨拶、質問のタイミング、観察ポイント、雑談で関係を作る言い回しまで実例付き。新しい職場で浮かない人の動き方が分かります。',
    '069': '封筒のサイズ・色・宛名の書き方から、送付状の位置、追跡可能な送り方、書き損じ時の対処まで網羅。「マナー違反で落ちる」を防ぐ郵送ルールを採用担当目線で解説します。',
    '109': '出典付きAI検索Perplexityで企業研究を15分に短縮する方法。業界レポート作成プロンプト、競合分析、面接直前ニュースリサーチ、二次検証のコツまで具体例付きで解説します。',
    '040': '最終面接の合格率は約50％。一次・二次との違い、役員面接で見られる5つの視点、頻出質問への回答例、前日にやるべきチェックリストまで採用担当目線で解説します。',
    '067': '「自分の市場価値はいくら？」を年代・職種別の年収データで把握。市場価値を決める5要素、無料の診断ツール、年収を100万単位で上げるアクションプランまで実例付きで解説します。',
    '107': 'プロンプトエンジニアの年収は800万〜2,000万円。未経験から参入する3ルート、求められるスキル、採用企業の傾向、ポートフォリオの作り方まで2026年最新で解説します。',
    '101': 'WordからのPDF変換手順、ファイル名ルール、パスワード保護の最新事情、件名と本文例文、送信前チェックリストまで網羅。「マナー違反で落ちる」を防ぐ実務ガイドです。',
    '084': '過去の感情の波を1枚のグラフに可視化する方法。強み・価値観・転職の軸が見つかる作成手順、エントリーシート・面接で使う言い換え例まで実例付きで解説します。',
    '071': '圧迫面接で「思考停止」しないための5つの即応テクニック。質問パターン別の回答例、ハラスメントとの境界線、辞退すべきケースの見分け方まで実例付きで解説します。',
    '030': '未経験・異業種でも書類選考を通過する職務経歴書の書き方。ポータブルスキルの抽出フレーム、職種別の言い換え例、採用担当を頷かせる構成テンプレートを実例付きで解説します。',
    '072': '市場規模60兆円超の建設・不動産業界、主要職種の年収相場、有用資格、未経験から入れる職種、2024年問題後の働き方改革まで2026年版で網羅。後悔しない業界選びの一冊です。',
    '058': 'ChatGPTで自己分析を30分で終わらせる方法。コピペで使えるプロンプト10種、強み・価値観・適職の言語化、面接で使える回答テンプレート化まで実例付きで2026年版で解説します。',
    '108': 'ChatGPTを面接官役にする模擬面接プロンプト集。想定問答集の作り方、PREP法・STAR法での回答ブラッシュアップ、録画併用メソッド、失敗パターンの対処まで実例付きで解説します。',
    '097': '市場規模7.7兆円の広告・マーケ業界、代理店・事業会社・支援会社の違い、主要職種の年収相場、未経験から入れるルート、デジタル化で伸びる職種を2026年版で解説します。',
};

const dir = 'public_html/knowhow/detail';

function escAttr(s) {
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

function escJson(s) {
    return s.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
}

let changed = 0;
Object.entries(rewrites).forEach(([id, newDesc]) => {
    const fp = path.join(dir, `knowhow-${id}.html`);
    if (!fs.existsSync(fp)) { console.log(`MISSING: ${fp}`); return; }
    let html = fs.readFileSync(fp, 'utf8');
    const orig = html;

    // 1. <meta name="description" content="...">
    html = html.replace(/(<meta name="description" content=")([^"]+)(")/,
        `$1${escAttr(newDesc)}$3`);

    // 2. <meta property="og:description" content="...">
    html = html.replace(/(<meta property="og:description" content=")([^"]+)(")/,
        `$1${escAttr(newDesc)}$3`);

    // 3. <meta name="twitter:description" content="...">
    html = html.replace(/(<meta name="twitter:description" content=")([^"]+)(")/,
        `$1${escAttr(newDesc)}$3`);

    // 4. JSON-LD BlogPosting description
    // matches "description": "....." inside the BlogPosting block. Use a non-greedy match limited to one line.
    html = html.replace(/("description":\s*")([^"]+)(")/g, `$1${escJson(newDesc)}$3`);

    if (html !== orig) {
        fs.writeFileSync(fp, html);
        const len = [...newDesc].length;
        console.log(`OK knowhow-${id}.html  (${len}chars)`);
        changed++;
    } else {
        console.log(`NO-CHANGE knowhow-${id}.html`);
    }
});

console.log(`\nTotal changed: ${changed}`);
