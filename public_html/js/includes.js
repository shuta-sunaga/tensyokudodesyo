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
            // Toggle menu function
            function toggleMenu(e) {
                e.preventDefault();
                e.stopPropagation();

                mobileMenuBtn.classList.toggle('active');
                nav.classList.toggle('active');
                document.body.classList.toggle('menu-open');

                // Hamburger to X animation
                const spans = mobileMenuBtn.querySelectorAll('span');
                const isOpen = nav.classList.contains('active');

                if (isOpen) {
                    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';

                    // Apply nav styles with animation and semi-transparent background
                    nav.style.cssText = 'display: flex; position: fixed; top: 70px; left: 0; right: 0; height: calc(100dvh - 70px); background: rgba(255, 255, 255, 0.97); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); flex-direction: column; padding: 1.5rem; z-index: 9999; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: slideInMenu 0.3s ease-out;';

                    // Style nav-list
                    const navList = nav.querySelector('.nav-list');
                    if (navList) {
                        navList.style.cssText = 'display: flex; flex-direction: column; width: 100%; gap: 0;';
                    }

                    // Style nav items
                    nav.querySelectorAll('.nav-list li').forEach(li => {
                        li.style.cssText = 'display: block; width: 100%;';
                    });

                    // Style nav links
                    nav.querySelectorAll('.nav-list a').forEach(a => {
                        a.style.cssText = 'display: block; padding: 1rem 0; font-size: 1.125rem; color: #333; border-bottom: 1px solid #eee; text-decoration: none;';
                    });

                    // Style mobile-menu-actions (positioned right after nav-list)
                    const menuActions = nav.querySelector('.mobile-menu-actions');
                    if (menuActions) {
                        menuActions.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;';

                        // Style buttons
                        menuActions.querySelectorAll('.btn').forEach(btn => {
                            btn.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; font-size: 1rem; text-decoration: none; border-radius: 8px; width: 100%;';
                        });

                        const lineBtn = menuActions.querySelector('.btn-line');
                        if (lineBtn) {
                            lineBtn.style.cssText += 'background: #06C755; color: #fff; border: none;';
                        }

                        const outlineBtn = menuActions.querySelector('.btn-outline');
                        if (outlineBtn) {
                            outlineBtn.style.cssText += 'background: transparent; color: #2d8a39; border: 2px solid #2d8a39;';
                        }
                    }
                } else {
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '';
                    spans[2].style.transform = '';

                    // Reset all styles
                    nav.style.cssText = '';
                    const navList = nav.querySelector('.nav-list');
                    if (navList) navList.style.cssText = '';
                    nav.querySelectorAll('.nav-list li').forEach(li => li.style.cssText = '');
                    nav.querySelectorAll('.nav-list a').forEach(a => a.style.cssText = '');
                    const menuActions = nav.querySelector('.mobile-menu-actions');
                    if (menuActions) {
                        menuActions.style.cssText = '';
                        menuActions.querySelectorAll('.btn').forEach(btn => btn.style.cssText = '');
                    }
                }
            }

            // Prevent double-firing on touch devices
            let touchHandled = false;

            mobileMenuBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                touchHandled = true;
                toggleMenu(e);
                setTimeout(() => { touchHandled = false; }, 300);
            });

            mobileMenuBtn.addEventListener('click', function(e) {
                if (touchHandled) return;
                toggleMenu(e);
            });

            // Close menu when clicking on nav links
            const navLinks = nav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    nav.classList.remove('active');
                    mobileMenuBtn.classList.remove('active');
                    document.body.classList.remove('menu-open');

                    const spans = mobileMenuBtn.querySelectorAll('span');
                    spans[0].style.transform = '';
                    spans[1].style.opacity = '';
                    spans[2].style.transform = '';
                });
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
