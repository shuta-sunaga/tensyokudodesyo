/**
 * Prefecture Page Module (v2)
 * 都道府県ページ: 求人の絞り込み（キーワード・市区町村・職種グループ・雇用形態・こだわり条件）、
 * 並び替え、ページネーション、URL パラメータ同期。
 *
 * データは /data/jobs/{id}.json（MT 生成・detail 付き）をそのまま使い、
 * 職種グループとこだわり条件は job-taxonomy.js でクライアント側判定する。
 */
(function () {
    'use strict';

    const config = window.PREFECTURE_CONFIG;
    if (!config || !config.id || !config.name) {
        console.error('Prefecture configuration not found');
        return;
    }
    const PER_PAGE = 20;
    const NEW_DAYS = 14;

    let jobs = [];
    let filtered = [];
    let prefectureInterviews = [];
    let prefectureCompanies = [];

    const state = { q: '', city: '', cat: '', emp: '', tags: [], sort: 'new', page: 1 };

    const $ = id => document.getElementById(id);
    const fetchJSON = url => (typeof DataCache !== 'undefined'
        ? DataCache.fetchJSON(url)
        : fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url); return r.json(); }));

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }
    function debounce(fn, wait) {
        let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(null, a), wait); };
    }

    /* ---------- 正規化 ---------- */
    function normCity(city) {
        let c = String(city || '').trim();
        if (!c) return 'その他';
        if (c.startsWith(config.name)) c = c.slice(config.name.length);
        c = c.trim();
        if (!c) return 'その他';
        if (/要相談|応相談|相談/.test(c)) return '要相談';
        const m = c.match(/^(.+?[市区郡町村])/);
        if (m) return m[1];
        return 'その他';
    }
    function normEmp(emp) {
        const e = String(emp || '').trim();
        if (!e) return '正社員';
        if (/^正社員$/.test(e)) return '正社員';
        if (/^正社員/.test(e)) return '正社員';
        if (/契約/.test(e)) return '契約社員';
        if (/派遣/.test(e)) return '派遣・紹介予定派遣';
        if (/パート|アルバイト/.test(e)) return 'パート・アルバイト';
        if (/新卒/.test(e)) return '新卒';
        return e;
    }
    function isNew(postDate) {
        if (!postDate) return false;
        return (Date.now() - new Date(postDate).getTime()) / 86400000 <= NEW_DAYS;
    }
    function prepare(list) {
        const T = window.JobTaxonomy;
        list.forEach(j => {
            j._text = T ? T.fullText(j) : [j.title, j.company, j.keywords, j.conditions].join(' ');
            j._lc = j._text.toLowerCase();
            j._bucket = T ? T.classify(j.category).id : 'other';
            j._tags = T ? T.matchedTags(j, j._text).map(t => t.id) : [];
            j._sal = T ? T.salaryRange(j.salary) : null;
            j._city = normCity(j.city);
            j._emp = normEmp(j.employmentType);
            j._ts = Date.parse(j.postDate) || 0;
        });
    }

    /* ---------- URL <-> state ---------- */
    function readState() {
        const p = new URLSearchParams(window.location.search);
        state.q = (p.get('q') || p.get('keyword') || '').trim();
        state.city = p.get('city') || '';
        state.cat = p.get('cat') || '';
        state.emp = p.get('emp') || '';
        state.tags = p.getAll('tag').filter(Boolean);
        state.sort = p.get('sort') || 'new';
        state.page = Math.max(1, parseInt(p.get('page') || '1', 10) || 1);
    }
    function writeState() {
        const p = new URLSearchParams();
        if (state.q) p.set('q', state.q);
        if (state.city) p.set('city', state.city);
        if (state.cat) p.set('cat', state.cat);
        if (state.emp) p.set('emp', state.emp);
        state.tags.forEach(t => p.append('tag', t));
        if (state.sort !== 'new') p.set('sort', state.sort);
        if (state.page > 1) p.set('page', String(state.page));
        const qs = p.toString();
        const url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
        window.history.replaceState(null, '', url);
    }

    /* ---------- フォーム構築 ---------- */
    function countBy(list, key) {
        const m = new Map();
        list.forEach(j => { const k = j[key]; m.set(k, (m.get(k) || 0) + 1); });
        return m;
    }
    function fillSelect(sel, entries, current) {
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
        entries.forEach(([value, label]) => {
            const o = document.createElement('option');
            o.value = value; o.textContent = label;
            sel.appendChild(o);
        });
        sel.value = current || '';
        if (sel.value !== (current || '')) sel.value = '';
    }
    function buildControls() {
        const T = window.JobTaxonomy;
        // 市区町村（件数順、その他・要相談は末尾）
        const cities = Array.from(countBy(jobs, '_city').entries())
            .sort((a, b) => {
                const tail = x => (x[0] === 'その他' ? 2 : x[0] === '要相談' ? 1 : 0);
                return tail(a) - tail(b) || b[1] - a[1] || a[0].localeCompare(b[0], 'ja');
            })
            .map(([c, n]) => [c, `${c}（${n}）`]);
        fillSelect($('searchCity'), cities, state.city);

        // 職種グループ（表示順固定、0 件は出さない）
        const bc = countBy(jobs, '_bucket');
        const cats = (T ? T.orderedBuckets() : []).filter(b => bc.get(b.id)).map(b => [b.id, `${b.name}（${bc.get(b.id)}）`]);
        fillSelect($('searchJobType'), cats, state.cat);

        // 雇用形態
        const emps = Array.from(countBy(jobs, '_emp').entries()).sort((a, b) => b[1] - a[1]).map(([e, n]) => [e, `${e}（${n}）`]);
        fillSelect($('searchEmp'), emps, state.emp);

        // こだわり条件チップ（1 件以上あるものだけ）
        const wrap = $('searchTags');
        if (wrap && T) {
            wrap.querySelectorAll('.jsr-chip').forEach(el => el.remove());
            const tc = new Map();
            jobs.forEach(j => j._tags.forEach(t => tc.set(t, (tc.get(t) || 0) + 1)));
            T.TAGS.forEach(tag => {
                const n = tc.get(tag.id);
                if (!n) return;
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'jsr-chip' + (state.tags.includes(tag.id) ? ' is-on' : '');
                b.dataset.tag = tag.id;
                b.innerHTML = `${esc(tag.name)}<small style="color:inherit;opacity:.7;font-family:var(--font-family-en)">${n}</small>`;
                b.addEventListener('click', () => {
                    const i = state.tags.indexOf(tag.id);
                    if (i >= 0) state.tags.splice(i, 1); else state.tags.push(tag.id);
                    b.classList.toggle('is-on', i < 0);
                    state.page = 1;
                    apply();
                });
                wrap.appendChild(b);
            });
        }

        const kw = $('searchKeyword');
        if (kw) kw.value = state.q;
        const sort = $('searchSort');
        if (sort) sort.value = state.sort;
    }
    function bindControls() {
        const form = $('jobSearchForm');
        if (form) form.addEventListener('submit', e => { e.preventDefault(); syncFromForm(); state.page = 1; apply(); });
        const kw = $('searchKeyword');
        if (kw) kw.addEventListener('input', debounce(() => { syncFromForm(); state.page = 1; apply(); }, 300));
        ['searchCity', 'searchJobType', 'searchEmp'].forEach(id => {
            const el = $(id);
            if (el) el.addEventListener('change', () => { syncFromForm(); state.page = 1; apply(); });
        });
        const sort = $('searchSort');
        if (sort) sort.addEventListener('change', () => { state.sort = sort.value; state.page = 1; apply(); });
    }
    function syncFromForm() {
        state.q = ($('searchKeyword')?.value || '').trim();
        state.city = $('searchCity')?.value || '';
        state.cat = $('searchJobType')?.value || '';
        state.emp = $('searchEmp')?.value || '';
    }

    /* ---------- 絞り込み・並び替え ---------- */
    function apply() {
        const tokens = state.q.toLowerCase().split(/[\s　]+/).filter(Boolean);
        filtered = jobs.filter(j => {
            if (tokens.length && !tokens.every(t => j._lc.includes(t))) return false;
            if (state.city && j._city !== state.city) return false;
            if (state.cat && j._bucket !== state.cat) return false;
            if (state.emp && j._emp !== state.emp) return false;
            if (state.tags.length && !state.tags.every(t => j._tags.includes(t))) return false;
            return true;
        });
        const bySal = (a, b, dir) => {
            const av = a._sal ? (dir > 0 ? a._sal.max : a._sal.min) : null;
            const bv = b._sal ? (dir > 0 ? b._sal.max : b._sal.min) : null;
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return dir > 0 ? bv - av : av - bv;
        };
        if (state.sort === 'salaryHigh') filtered.sort((a, b) => bySal(a, b, 1) || b._ts - a._ts);
        else if (state.sort === 'salaryLow') filtered.sort((a, b) => bySal(a, b, -1) || b._ts - a._ts);
        else filtered.sort((a, b) => b._ts - a._ts || (b.id || 0) - (a.id || 0));

        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (state.page > totalPages) state.page = totalPages;

        renderJobs();
        renderPagination(totalPages);
        renderBar();
        writeState();
    }

    /* ---------- 描画 ---------- */
    function jobUrl(job) {
        const file = job.detailUrl ? job.detailUrl.split('/').pop() : ('job-' + String(job.id).padStart(6, '0') + '.html');
        return './jobs/' + file;
    }
    function renderJobs() {
        const container = $('jobListContainer');
        if (!container) return;
        if (!filtered.length) {
            container.innerHTML = `<div class="jsr-empty">
                <p>条件に合う求人が見つかりませんでした</p>
                <p>キーワードを減らす、こだわり条件を外すなどしてお試しください。</p>
                <button type="button" class="btn btn-outline" id="jsrReset">条件をすべてクリア</button>
            </div>`;
            const r = $('jsrReset');
            if (r) r.addEventListener('click', clearAll);
            return;
        }
        const T = window.JobTaxonomy;
        const start = (state.page - 1) * PER_PAGE;
        const page = filtered.slice(start, start + PER_PAGE);
        container.innerHTML = page.map(job => {
            const bucket = T ? T.bucketById(job._bucket) : null;
            const points = (T ? T.TAGS.filter(t => job._tags.includes(t.id)) : []).slice(0, 4);
            const sal = T ? T.salaryLabel(job.salary) : esc(job.salary || '');
            const date = String(job.postDate || '').replace(/-/g, '.');
            const url = jobUrl(job);
            return `<article class="job-row">
                <a class="job-row-cover" href="${esc(url)}" aria-label="${esc(job.title)}"></a>
                <div class="job-row-main">
                    <div class="job-row-tags">
                        ${isNew(job.postDate) ? '<span class="job-row-tag new">NEW</span>' : ''}
                        <span class="job-row-tag">${esc(job._emp)}</span>
                        ${bucket && bucket.id !== 'other' ? `<span class="job-row-tag cat">${esc(bucket.name)}</span>` : ''}
                    </div>
                    <h3 class="job-row-title">${esc(job.title)}</h3>
                    <p class="job-row-company">${esc(job.company)}</p>
                    <div class="job-row-meta">
                        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${esc(config.name)}${esc(job._city !== 'その他' && job._city !== '要相談' ? job._city : (job._city === '要相談' ? '（勤務地は要相談）' : ''))}</span>
                        <span class="sal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8 9h8M8 13h8M12 9v9"></path></svg>年収 ${esc(sal)}</span>
                    </div>
                    ${points.length ? `<div class="job-row-points">${points.map(p => `<span class="job-row-point">${esc(p.name)}</span>`).join('')}</div>` : ''}
                </div>
                <div class="job-row-side">
                    <span class="job-row-date">${esc(date)}</span>
                    <span class="job-row-link">詳細を見る</span>
                </div>
            </article>`;
        }).join('');
    }
    function renderPagination(totalPages) {
        const container = $('paginationContainer');
        if (!container) return;
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        const cur = state.page;
        let html = '<div class="pagination-inner">';
        if (cur > 1) html += `<button type="button" class="pagination-btn" data-page="${cur - 1}">前へ</button>`;
        for (let i = 1; i <= totalPages; i++) {
            if (i === cur) html += `<span class="pagination-current" aria-current="page">${i}</span>`;
            else if (i === 1 || i === totalPages || (i >= cur - 2 && i <= cur + 2)) html += `<button type="button" class="pagination-btn" data-page="${i}">${i}</button>`;
            else if (i === cur - 3 || i === cur + 3) html += '<span class="pagination-ellipsis">…</span>';
        }
        if (cur < totalPages) html += `<button type="button" class="pagination-btn" data-page="${cur + 1}">次へ</button>`;
        html += '</div>';
        container.innerHTML = html;
        container.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => goToPage(parseInt(b.dataset.page, 10))));
    }
    function goToPage(page) {
        state.page = page;
        apply();
        const top = $('jobs');
        if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.goToPage = goToPage;

    function renderBar() {
        const n = filtered.length;
        const c1 = $('resultsCount'); if (c1) c1.textContent = n.toLocaleString();
        const c2 = $('resultsCountTop'); if (c2) c2.textContent = jobs.length.toLocaleString();
        const wrap = $('activeFilters');
        if (!wrap) return;
        const T = window.JobTaxonomy;
        const chips = [];
        if (state.q) chips.push(['q', `「${state.q}」`]);
        if (state.city) chips.push(['city', state.city]);
        if (state.cat && T) { const b = T.bucketById(state.cat); if (b) chips.push(['cat', b.name]); }
        if (state.emp) chips.push(['emp', state.emp]);
        state.tags.forEach(t => { const tag = T ? T.TAGS.find(x => x.id === t) : null; if (tag) chips.push(['tag:' + t, tag.name]); });
        if (!chips.length) { wrap.innerHTML = ''; return; }
        wrap.innerHTML = chips.map(([k, label]) => `<button type="button" data-remove="${esc(k)}">${esc(label)}</button>`).join('') +
            '<button type="button" class="jsr-clear" data-remove="*">すべてクリア</button>';
        wrap.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removeFilter(b.dataset.remove)));
    }
    function removeFilter(key) {
        if (key === '*') return clearAll();
        if (key === 'q') { state.q = ''; if ($('searchKeyword')) $('searchKeyword').value = ''; }
        else if (key === 'city') { state.city = ''; if ($('searchCity')) $('searchCity').value = ''; }
        else if (key === 'cat') { state.cat = ''; if ($('searchJobType')) $('searchJobType').value = ''; }
        else if (key === 'emp') { state.emp = ''; if ($('searchEmp')) $('searchEmp').value = ''; }
        else if (key.startsWith('tag:')) {
            const t = key.slice(4);
            state.tags = state.tags.filter(x => x !== t);
            document.querySelectorAll(`.jsr-chip[data-tag="${t}"]`).forEach(c => c.classList.remove('is-on'));
        }
        state.page = 1;
        apply();
    }
    function clearAll() {
        state.q = ''; state.city = ''; state.cat = ''; state.emp = ''; state.tags = []; state.page = 1;
        ['searchKeyword'].forEach(id => { if ($(id)) $(id).value = ''; });
        ['searchCity', 'searchJobType', 'searchEmp'].forEach(id => { if ($(id)) $(id).value = ''; });
        document.querySelectorAll('.jsr-chip.is-on').forEach(c => c.classList.remove('is-on'));
        apply();
    }

    /* ---------- インタビュー・企業（既存仕様を踏襲） ---------- */
    function fixImagePath(imagePath) {
        if (!imagePath) return '';
        if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('/') || imagePath.startsWith('../')) return imagePath;
        return '../' + imagePath;
    }
    function renderInterviews() {
        const container = $('interviewsContainer');
        if (!container) return;
        if (!prefectureInterviews.length) { container.innerHTML = '<p class="no-content">この地域のインタビュー記事は準備中です</p>'; return; }
        container.innerHTML = prefectureInterviews.map(iv => {
            const cat = typeof CategoryManager !== 'undefined' ? CategoryManager.normalizeToName('interview', iv.category) : iv.category;
            return `<article class="article-card"><a href="${esc(iv.detailUrl)}">
                <div class="article-card-image"><img src="${esc(fixImagePath(iv.image))}" alt="${esc(iv.title)}" loading="lazy"></div>
                <div class="article-card-content"><span class="article-card-category">${esc(cat)}</span><h3 class="article-card-title">${esc(iv.title)}</h3><p class="article-card-company">${esc(iv.company)}</p></div>
            </a></article>`;
        }).join('');
    }
    function renderCompanies() {
        const container = $('companiesContainer');
        if (!container) return;
        if (!prefectureCompanies.length) { container.innerHTML = '<p class="no-content">この地域の企業インタビューは準備中です</p>'; return; }
        container.innerHTML = prefectureCompanies.map(co => {
            const ind = typeof CategoryManager !== 'undefined' ? CategoryManager.normalizeToName('company', co.industry) : co.industry;
            return `<article class="article-card"><a href="${esc(co.detailUrl)}">
                <div class="article-card-image"><img src="${esc(fixImagePath(co.image))}" alt="${esc(co.title)}" loading="lazy"></div>
                <div class="article-card-content"><span class="article-card-category">${esc(ind)}</span><h3 class="article-card-title">${esc(co.title)}</h3><p class="article-card-company">${esc(co.company)}</p></div>
            </a></article>`;
        }).join('');
    }

    /* ---------- init ---------- */
    async function init() {
        readState();
        bindControls();
        const [jobsRes, ivRes, coRes] = await Promise.allSettled([
            fetchJSON(`/data/jobs/${config.id}.json`),
            fetchJSON('/data/interviews.json'),
            fetchJSON('/data/companies.json')
        ]);
        jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value.jobs || []) : [];
        prefectureInterviews = ivRes.status === 'fulfilled' ? (ivRes.value.interviews || []).filter(x => x.prefecture === config.name) : [];
        prefectureCompanies = coRes.status === 'fulfilled' ? (coRes.value.companies || []).filter(x => x.prefecture === config.name) : [];
        if (jobsRes.status !== 'fulfilled') console.error('Failed to load jobs:', jobsRes.reason);

        prepare(jobs);
        buildControls();
        apply();
        renderInterviews();
        renderCompanies();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
