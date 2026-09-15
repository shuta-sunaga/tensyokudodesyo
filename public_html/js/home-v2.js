/**
 * トップページ v2
 * - ヒーロー検索（勤務地 → 都道府県ページへ、q / cat / tag を引き継ぐ）
 * - エリアから探す（prefectures.json + jobs-summary.json）
 * - 新着求人（jobs-latest.json。無ければセクションを隠す）
 * - 読み物タイルの最新 3 件
 */
(function () {
    'use strict';

    const REGION_EN = {
        '北海道': 'Hokkaido', '東北': 'Tohoku', '関東': 'Kanto', '中部': 'Chubu', '近畿': 'Kinki',
        '中国': 'Chugoku', '四国': 'Shikoku', '九州': 'Kyushu', '沖縄': 'Okinawa'
    };
    const REGION_ORDER = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州', '沖縄'];

    const fetchJSON = url => (typeof DataCache !== 'undefined'
        ? DataCache.fetchJSON(url)
        : fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url); return r.json(); }));

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function prefIdFromUrl(url) {
        try {
            const u = new URL(url, window.location.origin);
            return u.pathname.split('/').filter(Boolean)[0] || '';
        } catch (e) { return ''; }
    }

    function isNew(postDate) {
        if (!postDate) return false;
        const diff = (Date.now() - new Date(postDate).getTime()) / 86400000;
        return diff <= 14;
    }

    /* ---------- 都道府県マスター + 件数 ---------- */
    let prefectures = [];
    let counts = {};

    async function loadPrefectures() {
        try {
            const data = await fetchJSON('/data/prefectures.json');
            prefectures = (data.prefectures || []).filter(p => p.active);
        } catch (e) {
            console.warn('prefectures.json load failed', e);
        }
        try {
            const s = await fetchJSON('/data/jobs-summary.json');
            (s.prefectures || []).forEach(p => {
                const id = p.id || prefIdFromUrl(p.url);
                if (id) counts[id] = Number(p.count) || 0;
            });
        } catch (e) {
            // 件数 JSON は任意
        }
    }

    function fillPrefSelect() {
        const sel = document.getElementById('tpPref');
        if (!sel || !prefectures.length) return;
        while (sel.options.length > 1) sel.remove(1);
        REGION_ORDER.forEach(region => {
            const list = prefectures.filter(p => p.region === region);
            if (!list.length) return;
            const og = document.createElement('optgroup');
            og.label = region;
            list.forEach(p => {
                const o = document.createElement('option');
                o.value = p.id;
                o.textContent = counts[p.id] != null ? `${p.name}（${counts[p.id].toLocaleString()}件）` : p.name;
                og.appendChild(o);
            });
            sel.appendChild(og);
        });
    }

    function renderAreaGrid() {
        const grid = document.getElementById('tpAreaGrid');
        if (!grid) return;
        if (!prefectures.length) { grid.innerHTML = ''; return; }
        grid.innerHTML = REGION_ORDER.map(region => {
            const list = prefectures.filter(p => p.region === region);
            if (!list.length) return '';
            const items = list.map(p => {
                const n = counts[p.id];
                const cnt = n != null ? `<b>${n.toLocaleString()}</b>` : '';
                return `<li><a href="/${esc(p.id)}/">${esc(p.name)}${cnt}</a></li>`;
            }).join('');
            return `<div class="tp-region"><p class="tp-region-name">${esc(region)}<small>${esc(REGION_EN[region] || '')}</small></p><ul>${items}</ul></div>`;
        }).join('');
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const totalEl = document.getElementById('tpTotalJobs');
        if (totalEl && total) totalEl.textContent = total.toLocaleString();
    }

    /* ---------- ヒーロー検索 ---------- */
    function initSearch() {
        const form = document.getElementById('tpSearch');
        if (!form) return;
        const pref = document.getElementById('tpPref');
        const cat = document.getElementById('tpCat');
        const kw = document.getElementById('tpKeyword');
        const activeTags = new Set();

        // 職種セレクト（JobTaxonomy）
        if (cat && window.JobTaxonomy) {
            JobTaxonomy.orderedBuckets().forEach(b => {
                if (b.id === 'other') return;
                const o = document.createElement('option');
                o.value = b.id; o.textContent = b.name;
                cat.appendChild(o);
            });
        }

        form.querySelectorAll('.tp-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const tag = chip.dataset.tag;
                const bucket = chip.dataset.cat;
                if (bucket && cat) {
                    cat.value = cat.value === bucket ? '' : bucket;
                    form.querySelectorAll('.tp-chip[data-cat]').forEach(c => c.classList.toggle('is-on', c.dataset.cat === cat.value));
                }
                if (tag) {
                    if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
                    chip.classList.toggle('is-on', activeTags.has(tag));
                }
            });
        });
        if (cat) cat.addEventListener('change', () => {
            form.querySelectorAll('.tp-chip[data-cat]').forEach(c => c.classList.toggle('is-on', c.dataset.cat === cat.value));
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            const id = pref ? pref.value : '';
            if (!id) {
                form.classList.add('is-error');
                if (pref) pref.focus();
                return;
            }
            form.classList.remove('is-error');
            const params = new URLSearchParams();
            if (kw && kw.value.trim()) params.set('q', kw.value.trim());
            if (cat && cat.value) params.set('cat', cat.value);
            activeTags.forEach(t => params.append('tag', t));
            const qs = params.toString();
            window.location.href = `/${id}/${qs ? '?' + qs : ''}`;
        });
        if (pref) pref.addEventListener('change', () => form.classList.remove('is-error'));
    }

    /* ---------- 新着求人 ---------- */
    async function renderLatestJobs() {
        const list = document.getElementById('tpLatestList');
        const section = document.getElementById('tpLatest');
        if (!list) return;
        let jobs = [];
        try {
            const data = await fetchJSON('/data/jobs-latest.json');
            jobs = data.jobs || [];
        } catch (e) {
            console.warn('jobs-latest.json not available', e);
        }
        if (!jobs.length) {
            if (section) section.hidden = true;
            return;
        }
        jobs = jobs.slice(0, 12);
        list.innerHTML = jobs.map(job => {
            let url = job.detailUrl || '#';
            if (!/^https?:/.test(url) && !url.startsWith('/')) url = '/' + url;
            const pref = job.prefecture || '';
            let city = String(job.city || '').replace(pref, '').trim();
            const cm = city.match(/^(.+?[市区郡町村])/);
            if (cm) city = cm[1]; else if (/要相談|応相談/.test(city)) city = '勤務地は要相談'; else if (city.length > 12) city = city.slice(0, 12) + '…';
            const sub = [job.company, city].filter(Boolean).join('　');
            const sal = window.JobTaxonomy ? JobTaxonomy.salaryLabel(job.salary) : esc(job.salary || '');
            const date = String(job.postDate || '').replace(/-/g, '.');
            return `<a class="tp-jrow${isNew(job.postDate) ? ' is-new' : ''}" href="${esc(url)}">
                <span class="tp-jpref">${esc(pref)}</span>
                <span class="tp-jmain"><span class="tp-jttl">${esc(job.title)}</span><span class="tp-jsub">${esc(sub)}</span></span>
                <span class="tp-jsal"><small>年収</small>${esc(sal)}</span>
                <span class="tp-jdate">${esc(date)}</span>
            </a>`;
        }).join('');
    }

    /* ---------- タイルの最新 3 件 ---------- */
    async function renderTileFeeds() {
        const feeds = document.querySelectorAll('[data-feed]');
        if (!feeds.length) return;
        const loaders = {
            clients: async () => (await fetchJSON('/data/clients.json')).clients || [],
            interviews: async () => (await fetchJSON('/data/interviews.json')).interviews || [],
            companies: async () => (await fetchJSON('/data/companies.json')).companies || [],
            knowhow: async () => {
                const urls = ['/data/knowhow.json', '/data/knowhow-mt.json'];
                const results = await Promise.allSettled(urls.map(u => fetchJSON(u)));
                return results.filter(r => r.status === 'fulfilled').flatMap(r => r.value.articles || []);
            }
        };
        await Promise.all(Array.from(feeds).map(async ul => {
            const kind = ul.dataset.feed;
            const load = loaders[kind];
            if (!load) return;
            try {
                let items = await load();
                items = items.slice().sort((a, b) => new Date(b.postDate) - new Date(a.postDate) || (b.id || 0) - (a.id || 0)).slice(0, 3);
                ul.innerHTML = items.map(it => {
                    const title = it.title || it.name || '';
                    const url = it.detailUrl || (it.companyKey ? `/clients/detail/${it.companyKey}.html` : '#');
                    const date = String(it.postDate || '').replace(/-/g, '.');
                    return `<li><a href="${esc(url)}"><small>${esc(date)}</small><b>${esc(title)}</b></a></li>`;
                }).join('');
            } catch (e) {
                ul.innerHTML = '';
            }
        }));
    }

    /* ---------- フェードイン ---------- */
    function initFade() {
        const els = document.querySelectorAll('.tp-fade');
        if (!els.length) return;
        if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
        }, { threshold: 0.08 });
        els.forEach(el => io.observe(el));
    }

    async function init() {
        initSearch();
        initFade();
        await loadPrefectures();
        fillPrefSelect();
        renderAreaGrid();
        renderLatestJobs();
        renderTileFeeds();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
