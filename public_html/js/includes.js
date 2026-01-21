/**
 * Header/Footer Include System
 * Loads header.html and footer.html and inserts them into placeholder elements
 */

(function() {
    'use strict';

    /**
     * Calculate base path based on current page depth
     * @returns {string} Base path (e.g., '', '../', '../../')
     */
    function getBasePath() {
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;

        // Handle root level
        if (depth <= 0 || path === '/' || path.endsWith('/index.html') && depth === 1) {
            return '';
        }

        // Handle subdirectories
        let basePath = '';
        for (let i = 0; i < depth; i++) {
            basePath += '../';
        }

        return basePath;
    }

    /**
     * Load and insert an include file
     * @param {string} includeFile - Filename (e.g., 'header.html')
     * @param {string} placeholderId - ID of placeholder element
     */
    async function loadInclude(includeFile, placeholderId) {
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) return;

        const basePath = getBasePath();
        const includesPath = basePath + 'includes/';

        try {
            const response = await fetch(includesPath + includeFile);
            if (!response.ok) {
                throw new Error(`Failed to load ${includeFile}`);
            }

            let html = await response.text();

            // Replace {{BASE_PATH}} placeholder with actual base path
            html = html.replace(/\{\{BASE_PATH\}\}/g, basePath);

            // Insert HTML
            placeholder.outerHTML = html;

            // Dispatch event for other scripts to know include is loaded
            document.dispatchEvent(new CustomEvent('includeLoaded', {
                detail: { file: includeFile }
            }));

        } catch (error) {
            console.error(`Error loading include ${includeFile}:`, error);
        }
    }

    /**
     * Initialize mobile menu after header is loaded
     */
    function initMobileMenuAfterLoad() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.nav');

        if (mobileMenuBtn && nav) {
            mobileMenuBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                nav.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }
    }

    /**
     * Set active nav link based on current page
     */
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-list a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.endsWith(href) ||
                (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('/')))) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Initialize includes system
     */
    async function init() {
        // Load header and footer in parallel
        await Promise.all([
            loadInclude('header.html', 'header-placeholder'),
            loadInclude('footer.html', 'footer-placeholder')
        ]);

        // Initialize features that depend on header/footer
        initMobileMenuAfterLoad();
        setActiveNavLink();

        // Dispatch event when all includes are loaded
        document.dispatchEvent(new CustomEvent('includesReady'));
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
