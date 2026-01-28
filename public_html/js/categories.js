/**
 * Category Manager - 動的カテゴリ管理システム
 * カテゴリマスターJSONを読み込み、フィルタタブを動的生成
 */

// Guard against double execution
if (typeof CategoryManager !== 'undefined') {
    console.warn('categories.js already loaded, skipping');
} else {

var CategoryManager = (function() {
    'use strict';

    // Loading state flag
    let isLoaded = false;

    // Category data storage
    const categories = {
        interview: [],      // oc01-oc11
        company: [],        // in01-in09
        knowhow: [],        // kh01-kh03
        jobCondition: []    // pu01-pu11
    };

    // Prefectures data storage
    let prefectures = [];

    // Lookup maps for fast access
    const lookupById = {
        interview: {},
        company: {},
        knowhow: {},
        jobCondition: {}
    };

    const lookupByName = {
        interview: {},
        company: {},
        knowhow: {},
        jobCondition: {}
    };

    /**
     * Load a single category file
     */
    async function loadCategoryFile(filename, type) {
        // Use absolute path for consistent behavior across all pages
        const url = `/data/categories/${filename}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();

            categories[type] = data.categories || [];

            // Sort by ID (ascending)
            categories[type].sort((a, b) => a.id.localeCompare(b.id));

            // Build lookup maps
            categories[type].forEach(cat => {
                lookupById[type][cat.id] = cat.name;
                lookupByName[type][cat.name] = cat.id;
            });

            return true;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return false;
        }
    }

    /**
     * Load prefectures file
     */
    async function loadPrefectures() {
        // Use absolute path for consistent behavior across all pages
        const url = `/data/prefectures.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            prefectures = data.prefectures || [];
            return true;
        } catch (error) {
            console.error('Error loading prefectures:', error);
            return false;
        }
    }

    /**
     * Get active prefectures only
     */
    function getActivePrefectures() {
        return prefectures.filter(p => p.active);
    }

    /**
     * Get all prefectures
     */
    function getAllPrefectures() {
        return prefectures;
    }

    /**
     * Load all category files
     */
    async function loadAll() {
        const files = [
            { filename: 'interview-categories.json', type: 'interview' },
            { filename: 'company-industries.json', type: 'company' },
            { filename: 'knowhow-categories.json', type: 'knowhow' },
            { filename: 'job-conditions.json', type: 'jobCondition' }
        ];

        // Load categories and prefectures in parallel
        await Promise.all([
            ...files.map(f => loadCategoryFile(f.filename, f.type)),
            loadPrefectures()
        ]);

        // Set loaded flag
        isLoaded = true;

        // Dispatch event when categories are loaded
        document.dispatchEvent(new CustomEvent('categoriesLoaded'));
    }

    /**
     * Check if categories have been loaded
     */
    function checkLoaded() {
        return isLoaded;
    }

    /**
     * Get category name by ID
     */
    function getName(type, id) {
        return lookupById[type]?.[id] || id;
    }

    /**
     * Get category ID by name
     */
    function getId(type, name) {
        return lookupByName[type]?.[name] || name;
    }

    /**
     * Get all categories of a type
     */
    function getAll(type) {
        return categories[type] || [];
    }

    /**
     * Generate filter tabs HTML
     * @param {string} type - Category type (interview, company, knowhow, jobCondition)
     * @param {string} dataAttr - Data attribute name (e.g., 'category', 'industry')
     * @param {string} allLabel - Label for "all" button
     * @returns {string} HTML string
     */
    function generateFilterTabsHTML(type, dataAttr, allLabel = 'すべて') {
        const cats = categories[type] || [];

        let html = `<button class="filter-tab active" data-${dataAttr}="">${allLabel}</button>`;

        cats.forEach(cat => {
            html += `<button class="filter-tab" data-${dataAttr}="${cat.id}">${cat.name}</button>`;
        });

        return html;
    }

    /**
     * Render filter tabs into a container
     * @param {string} containerId - ID of the container element
     * @param {string} type - Category type
     * @param {string} dataAttr - Data attribute name
     * @param {string} allLabel - Label for "all" button
     */
    function renderFilterTabs(containerId, type, dataAttr, allLabel = 'すべて') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = generateFilterTabsHTML(type, dataAttr, allLabel);
    }

    /**
     * Setup filter tab click handlers
     * @param {string} containerId - ID of the container element
     * @param {Function} onFilter - Callback when filter changes (receives category ID)
     */
    function setupFilterHandlers(containerId, onFilter) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tabs = container.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // Get the data attribute value (could be data-category, data-industry, etc.)
                const dataAttrs = this.dataset;
                const value = dataAttrs.category ?? dataAttrs.industry ?? dataAttrs.knowhow ?? '';

                if (typeof onFilter === 'function') {
                    onFilter(value);
                }
            });
        });
    }

    /**
     * Generate filter select (dropdown) HTML
     * @param {string} type - Category type (interview, company, knowhow)
     * @param {string} selectId - ID for the select element
     * @param {string} allLabel - Label for "all" option
     * @returns {string} HTML string
     */
    function generateFilterSelectHTML(type, selectId, allLabel = 'すべて') {
        const cats = getAll(type);
        let html = `<option value="">${allLabel}</option>`;

        cats.forEach(cat => {
            html += `<option value="${cat.id}">${cat.name}</option>`;
        });

        return html;
    }

    /**
     * Render filter select (dropdown) into a container
     * @param {string} selectId - ID of the select element
     * @param {string} type - Category type
     * @param {string} allLabel - Label for "all" option
     */
    function renderFilterSelect(selectId, type, allLabel = 'すべて') {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = generateFilterSelectHTML(type, selectId, allLabel);
    }

    /**
     * Setup filter select change handler
     * @param {string} selectId - ID of the select element
     * @param {Function} onFilter - Callback when filter changes (receives category ID)
     */
    function setupFilterSelectHandler(selectId, onFilter) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.addEventListener('change', function() {
            if (typeof onFilter === 'function') {
                onFilter(this.value);
            }
        });
    }

    /**
     * Render prefecture filter select (active prefectures only)
     * @param {string} selectId - ID of the select element
     * @param {string} allLabel - Label for "all" option
     */
    function renderPrefectureSelect(selectId, allLabel = 'すべてのエリア') {
        const select = document.getElementById(selectId);
        if (!select) return;

        const activePrefectures = getActivePrefectures();
        let html = `<option value="">${allLabel}</option>`;

        activePrefectures.forEach(pref => {
            html += `<option value="${pref.name}">${pref.name}</option>`;
        });

        select.innerHTML = html;
    }

    /**
     * Map legacy category name to ID (for backward compatibility)
     * @param {string} type - Category type
     * @param {string} value - Category name or ID
     * @returns {string} Category ID
     */
    function normalizeToId(type, value) {
        // If it's already an ID format (e.g., oc01), return as-is
        if (/^(oc|in|kh|pu)\d{2}$/.test(value)) {
            return value;
        }
        // Otherwise, try to look up the ID by name
        return lookupByName[type]?.[value] || value;
    }

    /**
     * Map category ID to display name
     * @param {string} type - Category type
     * @param {string} value - Category ID or name
     * @returns {string} Display name
     */
    function normalizeToName(type, value) {
        // If it's an ID format, look up the name
        if (/^(oc|in|kh|pu)\d{2}$/.test(value)) {
            return lookupById[type]?.[value] || value;
        }
        // Otherwise, return as-is (it's already a name)
        return value;
    }

    // Public API
    return {
        loadAll,
        checkLoaded,
        getName,
        getId,
        getAll,
        generateFilterTabsHTML,
        renderFilterTabs,
        setupFilterHandlers,
        generateFilterSelectHTML,
        renderFilterSelect,
        setupFilterSelectHandler,
        normalizeToId,
        normalizeToName,
        getActivePrefectures,
        getAllPrefectures,
        renderPrefectureSelect
    };
})();

// Auto-load categories when script is included
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CategoryManager.loadAll());
} else {
    CategoryManager.loadAll();
}

} // End of double-execution guard
