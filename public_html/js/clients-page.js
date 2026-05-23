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
