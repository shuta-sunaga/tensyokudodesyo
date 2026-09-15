/**
 * 求人の職種・こだわり条件の正規化（トップ・都道府県ページ共通）
 *
 * MT の求人フィールドは変更しない前提で、表記ゆれの多い category（自由入力）を
 * クライアント側で 10 の職種グループに寄せ、conditions が空でも本文から
 * 「未経験歓迎」「土日祝休み」等のこだわり条件を判定する。
 */
(function (global) {
    'use strict';

    // 職種グループ: Lark Base「職種（大分類）」で多数を占めるラベル（マイナビ転職系の大分類）に名称と区切りを合わせる。
    // MT の category はテキストのままなので、表記ゆれをここで吸収する。評価順が重要（上から順に最初に一致したグループへ）。
    const BUCKETS = [
        { id: 'sales',         name: '営業職',                                 re: /営業/ },
        { id: 'it',            name: 'ITエンジニア',                           re: /IT|ＩＴ|システム|Web|ＷＥＢ|ソフト|プログラ|インフラ|ネットワーク|ゲーム/ },
        { id: 'service',       name: '販売・サービス職',                       re: /販売|サービス|飲食|フード|外食|小売|店舗|接客|レジャー|美容|ブライダル|ホテル|清掃|アミューズメント|流通|ヘルスケア/ },
        { id: 'skilled',       name: '技能工・設備・配送・農林水産',           re: /技能工|運輸|交通|物流|配送|倉庫|ドライバー|運転|施設|警備|整備/ },
        { id: 'manufacturing', name: '製造・生産・品質管理',                   re: /製造|生産|品質|技能|モノづくり|ものづくり|溶接|組立|期間工|SCM|購買/ },
        { id: 'construction',  name: '技術職（建築・土木・プラント・設備）',   re: /建築|建設|土木|プラント|不動産|施工|工場/ },
        { id: 'chem',          name: '技術職（医薬・化学・素材・食品）',       re: /医薬|化学|素材|食品|香料|飼料|化粧品|トイレタリー|バイオ/ },
        { id: 'tech',          name: '技術職（電気・電子・機械・半導体）',     re: /機械|電気|電子|半導体|メーカー|技術職|技術系|エンジニア|制御|機構|設計|研究|開発/ },
        { id: 'medical',       name: '医療・福祉・介護',                       re: /医療|福祉|介護|保育|看護|メディカル|薬剤/ },
        { id: 'office',        name: '事務・管理部門職',                       re: /事務|管理部門|コーポレート|経営|企画|マーケ|人事|総務|経理|受付|秘書|翻訳|管理職|管理・|管理$|アシスタント/ },
        { id: 'specialist',    name: '専門職・その他',                         re: /専門職|コンサル|士業|教育|教員|通訳|公務員|クリエイ|デザイナー|ディレクター|カスタマー|コールセンター|サポート|人材|金融|農林水産/ },
    ];
    const OTHER = { id: 'other', name: 'その他' };
    // 旧 ID（URL の ?cat=）との互換
    const BUCKET_ALIASES = { transport: 'skilled' };

    // UI での表示順（製造業を前面に）
    const DISPLAY_ORDER = ['manufacturing', 'tech', 'chem', 'construction', 'skilled', 'sales', 'office', 'it', 'service', 'medical', 'specialist', 'other'];

    // こだわり条件（本文全体に対する正規表現）
    const TAGS = [
        { id: 'mikeiken',  name: '未経験歓迎',       re: /未経験(歓迎|OK|ＯＫ|可|者歓迎|でも|から|・)/ },
        { id: 'donichi',   name: '土日祝休み',       re: /土日祝(休|日)|土・日・祝|完全週休2日制（土日/ },
        { id: 'nenkyu120', name: '年間休日120日以上', re: /年間?休日\s*1[2-9]\d\s*日|年休\s*1[2-9]\d/ },
        { id: 'zangyo',    name: '残業少なめ',       re: /残業(少なめ|なし|ほぼなし|ゼロ|は?月平均?\s*(10|15|20)時間(未満|以下|程度)|月\s*(10|15|20)時間(未満|以下|程度))/ },
        { id: 'tenkin',    name: '転勤なし',         re: /転勤(なし|無し|は?ありません)/ },
        { id: 'shikaku',   name: '資格取得支援',     re: /資格取得(支援|補助|制度)|資格支援/ },
        { id: 'kenshu',    name: '研修充実',         re: /研修(充実|制度|期間|あり)|教育制度|OJT/ },
        { id: 'shataku',   name: '社宅・寮あり',     re: /社宅|寮(完備|あり|制度)/ },
        { id: 'car',       name: '車通勤可',         re: /車通勤|マイカー通勤/ },
        { id: 'remote',    name: 'リモート可',       re: /リモート|在宅|テレワーク/ },
        { id: 'uiturn',    name: 'U・Iターン歓迎',   re: /U・?Iターン|UIターン|Ｕ・?Ｉターン|Iターン/ },
        { id: 'gakureki',  name: '学歴不問',         re: /学歴不問/ },
    ];

    function classify(category) {
        const c = String(category || '');
        if (!c) return OTHER;
        for (const b of BUCKETS) if (b.re.test(c)) return b;
        return OTHER;
    }

    function bucketById(id) {
        id = BUCKET_ALIASES[id] || id;
        return BUCKETS.find(b => b.id === id) || (id === 'other' ? OTHER : null);
    }

    function orderedBuckets() {
        return DISPLAY_ORDER.map(id => bucketById(id)).filter(Boolean);
    }

    /** 求人 1 件の検索対象テキスト（title + conditions + keywords + detail の主要項目） */
    function fullText(job) {
        const d = job.detail || {};
        return [
            job.title, job.company, job.city, job.category, job.employmentType, job.conditions, job.keywords,
            d.description, d.requirements, d.location, d.workHours, d.salaryDetail, d.bonus, d.benefits, d.holidays,
            d.recommendPoint1, d.recommendPoint2, d.recommendPoint3
        ].filter(Boolean).join('\n');
    }

    function matchedTags(job, text) {
        const t = text != null ? text : fullText(job);
        return TAGS.filter(tag => tag.re.test(t));
    }

    /** schema 2 では MT が "mikeiken,donichi," のようにカンマ区切りで出す。無ければ本文から判定 */
    function tagIdsOf(job) {
        if (typeof job.tags === 'string') return job.tags.split(',').map(s => s.trim()).filter(Boolean);
        if (Array.isArray(job.tags)) return job.tags.slice();
        return matchedTags(job).map(t => t.id);
    }

    /** 給与文字列から万円の数値範囲を取り出す（"2,700,000~4,010,000" → {min:270,max:401}） */
    function salaryRange(salary) {
        const s = String(salary || '').replace(/,/g, '');
        const nums = [];
        const re = /(\d+(?:\.\d+)?)\s*(万)?/g;
        let m;
        while ((m = re.exec(s))) {
            let n = parseFloat(m[1]);
            if (m[2]) n = n * 10000;
            if (n >= 10000) nums.push(n);
        }
        if (!nums.length) return null;
        const min = Math.min.apply(null, nums);
        const max = Math.max.apply(null, nums);
        return { min: Math.round(min / 10000), max: Math.round(max / 10000) };
    }

    /** 表示用: "270万〜401万円" / "330万円〜" */
    function salaryLabel(salary) {
        const r = salaryRange(salary);
        if (!r) {
            let s = String(salary || '').trim();
            s = s.replace(/^年収[:：]?\s*/, '');
            return s || '応相談';
        }
        const raw = String(salary || '');
        const openEnded = /[~〜～\-]\s*$/.test(raw.trim());
        if (r.min === r.max) return openEnded ? `${r.min}万円〜` : `${r.min}万円`;
        return `${r.min}万〜${r.max}万円`;
    }

    global.JobTaxonomy = {
        BUCKETS, OTHER, TAGS, DISPLAY_ORDER, BUCKET_ALIASES,
        classify, bucketById, orderedBuckets, fullText, matchedTags, tagIdsOf, salaryRange, salaryLabel
    };
})(window);
