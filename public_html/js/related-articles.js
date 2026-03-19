/**
 * Related Articles Module
 * Dynamically loads and displays related articles on detail pages.
 * Cross-links between content types (knowhow, interviews, companies, jobs).
 */

// Guard against double execution
if (window._relatedArticlesJsLoaded) {
    console.warn('related-articles.js already loaded, skipping');
} else {
    window._relatedArticlesJsLoaded = true;

(function() {
    'use strict';

    /**
     * Escape HTML to prevent XSS.
     * Uses the global escapeHTML from main.js if available, otherwise defines a local version.
     */
    function safeEscapeHTML(str) {
        if (typeof escapeHTML === 'function') {
            return escapeHTML(str);
        }
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Detect current page type from URL path.
     * @returns {{ type: string, currentUrl: string } | null}
     */
    function detectPageType() {
        var path = window.location.pathname;

        if (path.indexOf('/knowhow/detail/') !== -1) {
            return { type: 'knowhow', currentUrl: path };
        }
        if (path.indexOf('/interviews/detail/') !== -1) {
            return { type: 'interview', currentUrl: path };
        }
        if (path.indexOf('/companies/detail/') !== -1) {
            return { type: 'company', currentUrl: path };
        }
        // Job detail pages: /{prefecture}/jobs/...
        if (/\/[^/]+\/jobs\//.test(path)) {
            return { type: 'job', currentUrl: path };
        }

        return null;
    }

    /**
     * Fetch JSON from a URL. Returns null on failure.
     * @param {string} url
     * @returns {Promise<any|null>}
     */
    async function fetchJSON(url) {
        var response = await fetch(url);
        if (!response.ok) {
            return null;
        }
        return response.json();
    }

    /**
     * Load and merge knowhow articles from both pipeline and MT JSON files.
     * Uses Promise.allSettled so the site works even if one file is missing.
     * @returns {Promise<Array>}
     */
    async function loadAllKnowhowArticles() {
        var urls = ['/data/knowhow.json', '/data/knowhow-mt.json'];
        var results = await Promise.allSettled(
            urls.map(function(url) {
                return fetch(url).then(function(r) {
                    return r.ok ? r.json() : { articles: [] };
                });
            })
        );
        var allArticles = results
            .filter(function(r) { return r.status === 'fulfilled'; })
            .flatMap(function(r) { return r.value.articles || []; });
        allArticles.sort(function(a, b) {
            return new Date(b.postDate) - new Date(a.postDate);
        });
        return allArticles;
    }

    /**
     * Load interviews from JSON.
     * @returns {Promise<Array>}
     */
    async function loadInterviews() {
        var data = await fetchJSON('/data/interviews.json');
        if (!data || !data.interviews) return [];
        var interviews = data.interviews.slice();
        interviews.sort(function(a, b) {
            return new Date(b.postDate) - new Date(a.postDate);
        });
        return interviews;
    }

    /**
     * Load companies from JSON.
     * @returns {Promise<Array>}
     */
    async function loadCompanies() {
        var data = await fetchJSON('/data/companies.json');
        if (!data || !data.companies) return [];
        var companies = data.companies.slice();
        companies.sort(function(a, b) {
            return new Date(b.postDate) - new Date(a.postDate);
        });
        return companies;
    }

    /**
     * Check if an article's detailUrl matches the current page URL.
     * @param {string} detailUrl - The article's detailUrl field
     * @param {string} currentUrl - Current page pathname
     * @returns {boolean}
     */
    function isCurrentPage(detailUrl, currentUrl) {
        if (!detailUrl || detailUrl === '#') return false;
        // Normalize both to compare: strip trailing slashes, ensure leading slash
        var normalizeUrl = function(url) {
            if (url.charAt(0) !== '/') url = '/' + url;
            return url.replace(/\/$/, '');
        };
        return normalizeUrl(detailUrl) === normalizeUrl(currentUrl);
    }

    /**
     * Get category display name for an article.
     * @param {string} categoryType - 'knowhow', 'interview', or 'company'
     * @param {string} categoryValue - Category ID or name
     * @returns {string}
     */
    function getCategoryDisplayName(categoryType, categoryValue) {
        if (typeof CategoryManager !== 'undefined' && CategoryManager.normalizeToName) {
            return CategoryManager.normalizeToName(categoryType, categoryValue);
        }
        return categoryValue || '';
    }

    /**
     * Build a single article card HTML string.
     * @param {Object} article - Article data object
     * @param {string} categoryType - 'knowhow', 'interview', or 'company'
     * @returns {string}
     */
    function buildCardHTML(article, categoryType) {
        var categoryField = categoryType === 'company' ? article.industry : article.category;
        var categoryDisplay = getCategoryDisplayName(categoryType, categoryField || '');

        var url = article.detailUrl || '#';
        var image = article.image || '';
        var title = article.title || '';

        return '<article class="article-card">' +
            '<a href="' + url + '">' +
                '<div class="article-card-image">' +
                    '<img src="' + image + '" alt="' + safeEscapeHTML(title) + '" loading="lazy">' +
                '</div>' +
                '<div class="article-card-content">' +
                    '<span class="article-card-category">' + safeEscapeHTML(categoryDisplay) + '</span>' +
                    '<h3 class="article-card-title">' + safeEscapeHTML(title) + '</h3>' +
                '</div>' +
            '</a>' +
        '</article>';
    }

    /**
     * Render the related articles section and insert it before .article-back.
     * @param {Array<{article: Object, categoryType: string}>} items
     */
    function renderRelatedSection(items) {
        if (!items || items.length === 0) return;

        var backEl = document.querySelector('.article-back');
        if (!backEl) return;

        var cardsHTML = items.map(function(item) {
            return buildCardHTML(item.article, item.categoryType);
        }).join('');

        var sectionHTML = '<section class="related-articles">' +
            '<h2>\u95A2\u9023\u8A18\u4E8B</h2>' +
            '<div class="article-grid">' +
            cardsHTML +
            '</div>' +
            '</section>';

        backEl.insertAdjacentHTML('beforebegin', sectionHTML);
    }

    /**
     * Gather related articles based on the current page type.
     * @param {string} pageType - 'knowhow', 'interview', 'company', or 'job'
     * @param {string} currentUrl - Current page pathname
     * @returns {Promise<Array<{article: Object, categoryType: string}>>}
     */
    async function gatherRelatedArticles(pageType, currentUrl) {
        var items = [];

        if (pageType === 'knowhow') {
            // Load interviews (2 latest) + other knowhow articles (2, excluding current)
            var results = await Promise.allSettled([
                loadInterviews(),
                loadAllKnowhowArticles()
            ]);

            var interviews = results[0].status === 'fulfilled' ? results[0].value : [];
            var knowhowArticles = results[1].status === 'fulfilled' ? results[1].value : [];

            // 2 latest interviews
            interviews.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'interview' });
            });

            // 2 other knowhow articles (exclude current)
            var otherKnowhow = knowhowArticles.filter(function(a) {
                return !isCurrentPage(a.detailUrl, currentUrl);
            });
            otherKnowhow.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'knowhow' });
            });

        } else if (pageType === 'interview') {
            // Load knowhow (2 latest) + other interviews (2, excluding current)
            var results = await Promise.allSettled([
                loadAllKnowhowArticles(),
                loadInterviews()
            ]);

            var knowhowArticles = results[0].status === 'fulfilled' ? results[0].value : [];
            var interviews = results[1].status === 'fulfilled' ? results[1].value : [];

            // 2 latest knowhow
            knowhowArticles.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'knowhow' });
            });

            // 2 other interviews (exclude current)
            var otherInterviews = interviews.filter(function(a) {
                return !isCurrentPage(a.detailUrl, currentUrl);
            });
            otherInterviews.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'interview' });
            });

        } else if (pageType === 'company') {
            // Load knowhow (2 latest) + other companies (2, excluding current)
            var results = await Promise.allSettled([
                loadAllKnowhowArticles(),
                loadCompanies()
            ]);

            var knowhowArticles = results[0].status === 'fulfilled' ? results[0].value : [];
            var companies = results[1].status === 'fulfilled' ? results[1].value : [];

            // 2 latest knowhow
            knowhowArticles.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'knowhow' });
            });

            // 2 other companies (exclude current)
            var otherCompanies = companies.filter(function(a) {
                return !isCurrentPage(a.detailUrl, currentUrl);
            });
            otherCompanies.slice(0, 2).forEach(function(a) {
                items.push({ article: a, categoryType: 'company' });
            });

        } else if (pageType === 'job') {
            // Load knowhow (3 latest)
            var results = await Promise.allSettled([
                loadAllKnowhowArticles()
            ]);

            var knowhowArticles = results[0].status === 'fulfilled' ? results[0].value : [];

            // 3 latest knowhow
            knowhowArticles.slice(0, 3).forEach(function(a) {
                items.push({ article: a, categoryType: 'knowhow' });
            });
        }

        return items;
    }

    /**
     * Main initialization function.
     */
    async function init() {
        var pageInfo = detectPageType();
        if (!pageInfo) return;

        try {
            var items = await gatherRelatedArticles(pageInfo.type, pageInfo.currentUrl);
            renderRelatedSection(items);
        } catch (error) {
            // Silently skip on error - don't show related section
            console.error('Related articles error:', error);
        }
    }

    /**
     * Wait for CategoryManager to be loaded if available, then initialize.
     * If categoriesLoaded fires within 3 seconds, use it. Otherwise proceed without.
     */
    function waitForCategoriesAndInit() {
        if (typeof CategoryManager !== 'undefined' && CategoryManager.checkLoaded()) {
            init();
            return;
        }

        var initialized = false;

        function onCategoriesLoaded() {
            if (initialized) return;
            initialized = true;
            document.removeEventListener('categoriesLoaded', onCategoriesLoaded);
            init();
        }

        document.addEventListener('categoriesLoaded', onCategoriesLoaded);

        // Fallback: proceed without CategoryManager after 3 seconds
        setTimeout(function() {
            if (initialized) return;
            initialized = true;
            document.removeEventListener('categoriesLoaded', onCategoriesLoaded);
            init();
        }, 3000);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForCategoriesAndInit);
    } else {
        waitForCategoriesAndInit();
    }
})();

} // End of double-execution guard
