/**
 * Client Detail Page
 * 会社紹介の詳細ページで、その会社に紐づく求人と関連会社を動的に描画する。
 *
 * 必要な要素:
 *   <meta name="client-name" content="株式会社XXX">
 *   <meta name="client-key" content="company-key">
 *   <meta name="client-industry" content="in04">
 *   <meta name="client-prefecture" content="滋賀県">
 *   <div id="clientJobsGrid"></div>
 *   <div id="clientRelatedGrid"></div>
 */
(function () {
    'use strict';

    function escapeHTML(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function getMeta(name) {
        const el = document.querySelector('meta[name="' + name + '"]');
        return el ? el.getAttribute('content') : '';
    }

    async function fetchJSON(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (err) {
            console.error('fetchJSON error:', url, err);
            return null;
        }
    }

    function normalizeCompanyName(name) {
        return String(name || '').replace(/\s+/g, '').trim();
    }

    // 都道府県別JSON(MT生成)が 404 等でも静かに無視する取得関数
    async function fetchJSONQuiet(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            return null;
        }
    }

    // MT軽量JSONの生salary("3,600,000~4,300,000" / "3,600,000~0")を「年収◯万〜◯万円」に整形
    function formatSalary(raw) {
        if (!raw) return '';
        const parts = String(raw).split('~');
        const low = parseInt((parts[0] || '').replace(/[^0-9]/g, ''), 10) || 0;
        const high = parts.length > 1 ? (parseInt((parts[1] || '').replace(/[^0-9]/g, ''), 10) || 0) : 0;
        const man = function (n) { return Math.round(n / 10000); };
        if (!low && !high) return '';
        if (!high) return '年収' + man(low) + '万円〜';
        if (!low) return '年収〜' + man(high) + '万円';
        return '年収' + man(low) + '万〜' + man(high) + '万円';
    }

    /**
     * その会社に紐づく求人を「全都道府県のMT生成JSON」から集約し、最新5件を描画する。
     * - data/jobs/{prefecture_id}.json は MT が求人登録時に自動生成するため、
     *   ここを参照すれば求人追加が自動でこのページにも反映される。
     */
    async function renderClientJobs(clientName) {
        const container = document.getElementById('clientJobsGrid');
        if (!container) return;

        // 全都道府県リストを取得し、各 data/jobs/{id}.json を並列フェッチ（存在しない県は静かに無視）
        const prefData = await fetchJSON('/data/prefectures.json');
        const prefectures = (prefData && Array.isArray(prefData.prefectures)) ? prefData.prefectures : [];
        if (prefectures.length === 0) {
            container.innerHTML = '<div class="client-jobs-empty">求人情報を読み込めませんでした</div>';
            return;
        }

        const jobArrays = await Promise.all(prefectures.map(function (pref) {
            return fetchJSONQuiet('/data/jobs/' + pref.id + '.json').then(function (data) {
                if (!data || !Array.isArray(data.jobs)) return [];
                return data.jobs.map(function (job) {
                    return Object.assign({}, job, {
                        prefecture: job.prefecture || data.prefecture || pref.name
                    });
                });
            });
        }));
        const allJobs = jobArrays.reduce(function (acc, arr) { return acc.concat(arr); }, []);

        const target = normalizeCompanyName(clientName);
        const matched = allJobs
            .filter(function (j) { return normalizeCompanyName(j.company) === target; })
            .sort(function (a, b) {
                const da = new Date(a.postDate || 0).getTime();
                const db = new Date(b.postDate || 0).getTime();
                if (db !== da) return db - da;          // postDate 新しい順
                return (b.id || 0) - (a.id || 0);        // 同日は id の大きい順
            })
            .slice(0, 5);                                // 最新5件

        if (matched.length === 0) {
            container.innerHTML = '<div class="client-jobs-empty">現在、この会社の公開求人はありません。<br>転職相談からご希望をお聞かせください。</div>';
            return;
        }

        container.innerHTML = matched.map(function (job) {
            const detailUrl = job.detailUrl ? ('/' + job.detailUrl.replace(/^\/+/, '')) : '#';
            const conditions = String(job.conditions || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 2);
            const tagHtml = conditions.map(function (c) {
                return '<span class="client-job-card-tag">' + escapeHTML(c) + '</span>';
            }).join('');
            const area = job.city || job.prefecture || '';
            const salaryText = formatSalary(job.salary);

            return '' +
                '<a class="client-job-card" href="' + escapeHTML(detailUrl) + '">' +
                    '<div class="client-job-card-meta">' +
                        (area ? '<span class="client-job-card-tag client-job-card-tag--area">' + escapeHTML(area) + '</span>' : '') +
                        tagHtml +
                    '</div>' +
                    '<h3 class="client-job-card-title">' + escapeHTML(job.title) + '</h3>' +
                    (salaryText ? '<div class="client-job-card-salary">' + escapeHTML(salaryText) + '</div>' : '') +
                    '<span class="client-job-card-link">求人を見る</span>' +
                '</a>';
        }).join('');
    }

    /**
     * 関連会社紹介（同業界 > 同エリア > その他 の優先順位で最大3件）
     */
    async function renderRelatedClients(currentKey, currentIndustry, currentPrefecture) {
        const container = document.getElementById('clientRelatedGrid');
        if (!container) return;

        const data = await fetchJSON('/data/clients.json');
        if (!data || !Array.isArray(data.clients)) {
            container.innerHTML = '';
            return;
        }

        const others = data.clients.filter(function (c) { return c.companyKey !== currentKey; });

        const sameIndustry = others.filter(function (c) { return c.industry === currentIndustry; });
        const samePrefecture = others.filter(function (c) {
            return c.industry !== currentIndustry && c.prefecture === currentPrefecture;
        });
        const rest = others.filter(function (c) {
            return c.industry !== currentIndustry && c.prefecture !== currentPrefecture;
        });

        const picked = sameIndustry.concat(samePrefecture).concat(rest).slice(0, 3);

        if (picked.length === 0) {
            const section = container.closest('.client-related');
            if (section) section.style.display = 'none';
            return;
        }

        // CategoryManagerが読み込まれていれば業界名に変換
        const getIndustryName = (typeof CategoryManager !== 'undefined' && CategoryManager.normalizeToName)
            ? function (id) { return CategoryManager.normalizeToName('company', id) || id; }
            : function (id) { return id; };

        container.innerHTML = picked.map(function (c) {
            const img = c.image || '/assets/ogp.png';
            const industryName = getIndustryName(c.industry);
            const detailUrl = c.detailUrl || ('/clients/detail/' + c.companyKey + '.html');

            return '' +
                '<a class="article-card" href="' + escapeHTML(detailUrl) + '">' +
                    '<div class="article-card-image">' +
                        '<img src="' + escapeHTML(img) + '" alt="' + escapeHTML(c.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'https://placehold.co/600x450/5a9e6f/ffffff?text=' + encodeURIComponent(c.name) + '\'">' +
                    '</div>' +
                    '<div class="article-card-content">' +
                        '<div class="article-card-category">' + escapeHTML(industryName) + '</div>' +
                        '<h3 class="article-card-title">' + escapeHTML(c.name) + '</h3>' +
                        '<p class="article-card-excerpt">' + escapeHTML(c.tagline || '') + '</p>' +
                        '<div class="article-card-company">' + escapeHTML(c.prefecture || '') + '</div>' +
                    '</div>' +
                '</a>';
        }).join('');
    }

    function init() {
        const clientName = getMeta('client-name');
        const clientKey = getMeta('client-key');
        const industry = getMeta('client-industry');
        const prefecture = getMeta('client-prefecture');

        if (clientName) {
            renderClientJobs(clientName);
        }
        if (clientKey) {
            renderRelatedClients(clientKey, industry, prefecture);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
