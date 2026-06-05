/**
 * Clients List Page
 * /clients/index.html のフィルタ・ページネーション制御
 */
(function () {
    'use strict';

    const PAGE_SIZE = 12;
    let allClients = [];
    let filters = { prefecture: '', industry: '' };
    let currentPage = 1;

    function escapeHTML(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function getIndustryName(id) {
        if (typeof CategoryManager !== 'undefined' && CategoryManager.normalizeToName) {
            return CategoryManager.normalizeToName('company', id) || id;
        }
        return id;
    }

    function applyFilters(list) {
        return list.filter(function (c) {
            if (filters.prefecture && c.prefecture !== filters.prefecture) return false;
            if (filters.industry) {
                const id = typeof CategoryManager !== 'undefined'
                    ? CategoryManager.normalizeToId('company', c.industry)
                    : c.industry;
                if (id !== filters.industry && c.industry !== filters.industry) return false;
            }
            return true;
        });
    }

    function renderGrid() {
        const container = document.getElementById('clientsGrid');
        const empty = document.getElementById('clientsEmpty');
        if (!container) return;

        const filtered = applyFilters(allClients);
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = totalPages;

        if (filtered.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            renderPagination(0, 0);
            return;
        }
        if (empty) empty.style.display = 'none';

        const start = (currentPage - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(start, start + PAGE_SIZE);

        container.innerHTML = pageItems.map(function (c) {
            const img = c.image || '/assets/ogp.png';
            const industryName = getIndustryName(c.industry);
            const detailUrl = c.detailUrl || ('/clients/detail/' + c.companyKey + '.html');

            return '' +
                '<a class="client-card" href="' + escapeHTML(detailUrl) + '">' +
                    '<div class="client-card-image">' +
                        '<img src="' + escapeHTML(img) + '" alt="' + escapeHTML(c.name) + '" loading="lazy" onerror="this.src=\'/assets/ogp.png\'">' +
                        '<div class="client-card-tags">' +
                            '<span class="client-card-tag client-card-tag--industry">' + escapeHTML(industryName) + '</span>' +
                            (c.prefecture ? '<span class="client-card-tag client-card-tag--area">' + escapeHTML(c.prefecture) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="client-card-body">' +
                        '<h3 class="client-card-name">' + escapeHTML(c.name) + '</h3>' +
                        (c.tagline ? '<p class="client-card-tagline">' + escapeHTML(c.tagline) + '</p>' : '') +
                        '<div class="client-card-meta">' +
                            (c.city ? '<span class="client-card-meta-item">' + escapeHTML(c.city) + '</span>' : '') +
                            (c.employees ? '<span class="client-card-meta-item">従業員 ' + escapeHTML(c.employees) + '</span>' : '') +
                        '</div>' +
                        '<span class="client-card-cta">詳細を見る →</span>' +
                    '</div>' +
                '</a>';
        }).join('');

        renderPagination(filtered.length, totalPages);
    }

    function renderPagination(total, totalPages) {
        const pager = document.getElementById('clientsPagination');
        if (!pager) return;
        if (totalPages <= 1) {
            pager.innerHTML = '';
            return;
        }

        let html = '';
        if (currentPage > 1) {
            html += '<button class="pagination-btn" data-page="' + (currentPage - 1) + '" aria-label="前のページ">←</button>';
        }
        for (let i = 1; i <= totalPages; i++) {
            const active = i === currentPage ? ' active' : '';
            html += '<button class="pagination-btn' + active + '" data-page="' + i + '">' + i + '</button>';
        }
        if (currentPage < totalPages) {
            html += '<button class="pagination-btn" data-page="' + (currentPage + 1) + '" aria-label="次のページ">→</button>';
        }
        pager.innerHTML = html;

        Array.prototype.forEach.call(pager.querySelectorAll('.pagination-btn'), function (btn) {
            btn.addEventListener('click', function () {
                currentPage = parseInt(this.getAttribute('data-page'), 10) || 1;
                renderGrid();
                window.scrollTo({ top: document.querySelector('.client-list-section')?.offsetTop - 80 || 0, behavior: 'smooth' });
            });
        });
    }

    // ネイティブ<select>を「常に下方向に開く」カスタムドロップダウンに拡張する。
    // 元のselectはデータ源として残し、選択時にvalueを書き戻して change を発火させるため、
    // 既存のフィルタ処理（prefecture/industry）はそのまま動作する。ARIA combobox 準拠。
    function enhanceSelect(selectEl) {
        if (!selectEl || selectEl.dataset.enhanced) return;
        selectEl.dataset.enhanced = '1';

        var listId = (selectEl.id || 'cdrop') + '-list';
        var options = [];
        var activeIndex = -1;

        var wrapper = document.createElement('div');
        wrapper.className = 'cdrop';

        var trigger = document.createElement('div');
        trigger.className = 'cdrop-trigger';
        trigger.setAttribute('role', 'combobox');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', listId);

        var label = selectEl.id ? document.querySelector('label[for="' + selectEl.id + '"]') : null;
        if (label) {
            if (!label.id) label.id = selectEl.id + '-label';
            trigger.setAttribute('aria-labelledby', label.id);
            label.addEventListener('click', function (e) { e.preventDefault(); trigger.focus(); });
        }

        var triggerText = document.createElement('span');
        triggerText.className = 'cdrop-trigger-text';
        trigger.appendChild(triggerText);

        var caret = document.createElement('span');
        caret.className = 'cdrop-caret';
        caret.setAttribute('aria-hidden', 'true');
        trigger.appendChild(caret);

        var list = document.createElement('ul');
        list.className = 'cdrop-list';
        list.id = listId;
        list.setAttribute('role', 'listbox');
        if (label) list.setAttribute('aria-labelledby', label.id);
        list.hidden = true;

        function syncTriggerText() {
            var sel = selectEl.options[selectEl.selectedIndex];
            triggerText.textContent = sel ? sel.textContent : '';
        }

        function buildOptions() {
            list.innerHTML = '';
            options = [];
            Array.prototype.forEach.call(selectEl.options, function (opt, i) {
                var li = document.createElement('li');
                li.className = 'cdrop-option';
                li.id = listId + '-opt-' + i;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', opt.value === selectEl.value ? 'true' : 'false');
                li.textContent = opt.textContent;
                li.addEventListener('click', function () { choose(i); });
                li.addEventListener('mousemove', function () { setActive(i); });
                list.appendChild(li);
                options.push({ value: opt.value, el: li });
            });
            syncTriggerText();
        }

        function setActive(i) {
            if (i < 0 || i >= options.length) return;
            options.forEach(function (o, idx) {
                o.el.classList.toggle('cdrop-option--active', idx === i);
            });
            activeIndex = i;
            trigger.setAttribute('aria-activedescendant', options[i].el.id);
            options[i].el.scrollIntoView({ block: 'nearest' });
        }

        function open() {
            if (!list.hidden) return;
            list.hidden = false;
            wrapper.classList.add('cdrop--open');
            trigger.setAttribute('aria-expanded', 'true');
            setActive(selectEl.selectedIndex >= 0 ? selectEl.selectedIndex : 0);
            document.addEventListener('click', onDocClick, true);
        }

        function close() {
            if (list.hidden) return;
            list.hidden = true;
            wrapper.classList.remove('cdrop--open');
            trigger.setAttribute('aria-expanded', 'false');
            trigger.removeAttribute('aria-activedescendant');
            document.removeEventListener('click', onDocClick, true);
        }

        function choose(i) {
            if (i < 0 || i >= options.length) return;
            selectEl.value = options[i].value;
            options.forEach(function (o, idx) {
                o.el.setAttribute('aria-selected', idx === i ? 'true' : 'false');
            });
            syncTriggerText();
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            close();
            trigger.focus();
        }

        function onDocClick(e) {
            if (!wrapper.contains(e.target)) close();
        }

        trigger.addEventListener('click', function () {
            if (list.hidden) open(); else close();
        });

        trigger.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowDown': case 'Down':
                    e.preventDefault();
                    if (list.hidden) open(); else setActive(Math.min(activeIndex + 1, options.length - 1));
                    break;
                case 'ArrowUp': case 'Up':
                    e.preventDefault();
                    if (list.hidden) open(); else setActive(Math.max(activeIndex - 1, 0));
                    break;
                case 'Enter': case ' ': case 'Spacebar':
                    e.preventDefault();
                    if (list.hidden) open(); else choose(activeIndex);
                    break;
                case 'Escape':
                    if (!list.hidden) { e.preventDefault(); close(); }
                    break;
                case 'Home':
                    if (!list.hidden) { e.preventDefault(); setActive(0); }
                    break;
                case 'End':
                    if (!list.hidden) { e.preventDefault(); setActive(options.length - 1); }
                    break;
                case 'Tab':
                    close();
                    break;
            }
        });

        selectEl.parentNode.insertBefore(wrapper, selectEl);
        wrapper.appendChild(trigger);
        wrapper.appendChild(list);
        wrapper.appendChild(selectEl);
        selectEl.classList.add('cdrop-native-hidden');
        selectEl.setAttribute('tabindex', '-1');
        selectEl.setAttribute('aria-hidden', 'true');

        buildOptions();
    }

    function setupFilters() {
        if (typeof CategoryManager !== 'undefined') {
            CategoryManager.renderPrefectureSelect('prefectureFilter', 'すべてのエリア');
            CategoryManager.renderFilterSelect('industryFilter', 'company', 'すべて');
        }

        const prefSelect = document.getElementById('prefectureFilter');
        if (prefSelect) {
            prefSelect.addEventListener('change', function () {
                filters.prefecture = this.value;
                currentPage = 1;
                renderGrid();
            });
        }

        if (typeof CategoryManager !== 'undefined') {
            CategoryManager.setupFilterSelectHandler('industryFilter', function (id) {
                filters.industry = id;
                currentPage = 1;
                renderGrid();
            });
        } else {
            const indSelect = document.getElementById('industryFilter');
            if (indSelect) {
                indSelect.addEventListener('change', function () {
                    filters.industry = this.value;
                    currentPage = 1;
                    renderGrid();
                });
            }
        }

        // ネイティブselectを下方向固定のカスタムドロップダウンに置き換え（changeで上記ハンドラに接続）
        enhanceSelect(document.getElementById('prefectureFilter'));
        enhanceSelect(document.getElementById('industryFilter'));
    }

    async function init() {
        try {
            const res = await fetch('/data/clients.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            allClients = (data.clients || []).slice().sort(function (a, b) {
                return (b.postDate || '').localeCompare(a.postDate || '');
            });
        } catch (err) {
            console.error('Failed to load clients.json:', err);
            const container = document.getElementById('clientsGrid');
            if (container) container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#666;">会社紹介を読み込めませんでした</p>';
            return;
        }

        setupFilters();
        renderGrid();
    }

    function bootstrap() {
        if (typeof CategoryManager === 'undefined') {
            init();
            return;
        }
        if (CategoryManager.checkLoaded && CategoryManager.checkLoaded()) {
            init();
        } else {
            document.addEventListener('categoriesLoaded', init, { once: true });
            setTimeout(function () {
                if (allClients.length === 0) init();
            }, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
