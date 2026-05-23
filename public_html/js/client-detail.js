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

    /**
     * その会社に紐づく求人を描画
     */
    async function renderClientJobs(clientName) {
        const container = document.getElementById('clientJobsGrid');
        if (!container) return;

        const data = await fetchJSON('/data/jobs.json');
        if (!data || !Array.isArray(data.jobs)) {
            container.innerHTML = '<div class="client-jobs-empty">求人情報を読み込めませんでした</div>';
            return;
        }

        const target = normalizeCompanyName(clientName);
        const matched = data.jobs.filter(function (j) {
            return normalizeCompanyName(j.company) === target;
        });

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
            const area = [job.prefecture, job.city].filter(Boolean).join(' ');

            return '' +
                '<a class="client-job-card" href="' + escapeHTML(detailUrl) + '">' +
                    '<div class="client-job-card-meta">' +
                        (area ? '<span class="client-job-card-tag client-job-card-tag--area">' + escapeHTML(area) + '</span>' : '') +
                        tagHtml +
                    '</div>' +
                    '<h3 class="client-job-card-title">' + escapeHTML(job.title) + '</h3>' +
                    (job.salary ? '<div class="client-job-card-salary">' + escapeHTML(job.salary) + '</div>' : '') +
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
                        '<img src="' + escapeHTML(img) + '" alt="' + escapeHTML(c.name) + '" loading="lazy">' +
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
