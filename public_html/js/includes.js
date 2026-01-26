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

        console.log('initMobileMenuAfterLoad called');
        console.log('mobileMenuBtn:', mobileMenuBtn);
        console.log('nav:', nav);

        if (mobileMenuBtn && nav) {
            console.log('Adding event listeners to mobile menu button');

            // Toggle menu function
            function toggleMenu(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile menu button triggered!', e.type);

                mobileMenuBtn.classList.toggle('active');
                nav.classList.toggle('active');
                document.body.classList.toggle('menu-open');

                // Hamburger to X animation
                const spans = mobileMenuBtn.querySelectorAll('span');
                if (nav.classList.contains('active')) {
                    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';

                    // Force nav visibility with inline styles
                    nav.style.cssText = 'display: flex !important; position: fixed !important; top: 70px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: #ffffff !important; flex-direction: column !important; padding: 1rem !important; z-index: 9999 !important; overflow-y: auto !important;';

                    // Force nav-list visibility
                    const navList = nav.querySelector('.nav-list');
                    if (navList) {
                        navList.style.cssText = 'display: flex !important; flex-direction: column !important; width: 100% !important;';
                        console.log('Nav-list styles applied:', navList.style.cssText);
                    }

                    // Force all li and a elements visible
                    const navItems = nav.querySelectorAll('.nav-list li');
                    navItems.forEach(li => {
                        li.style.cssText = 'display: block !important; width: 100% !important;';
                    });
                    const navLinks = nav.querySelectorAll('.nav-list a');
                    navLinks.forEach(a => {
                        a.style.cssText = 'display: block !important; padding: 1rem 0 !important; font-size: 1.125rem !important; color: #333 !important;';
                    });

                    // Force mobile-menu-actions visible
                    const menuActions = nav.querySelector('.mobile-menu-actions');
                    if (menuActions) {
                        menuActions.style.cssText = 'display: flex !important; flex-direction: column !important; gap: 1rem !important; margin-top: auto !important; padding-top: 2rem !important;';
                    }

                    console.log('Nav styles applied:', nav.style.cssText);
                    console.log('Nav computed display:', window.getComputedStyle(nav).display);
                    console.log('Nav bounding rect:', nav.getBoundingClientRect());
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
                    if (menuActions) menuActions.style.cssText = '';
                }
            }

            // Prevent double-firing on touch devices
            let touchHandled = false;

            mobileMenuBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                touchHandled = true;
                toggleMenu(e);
                // Reset flag after a short delay
                setTimeout(() => { touchHandled = false; }, 300);
            });

            mobileMenuBtn.addEventListener('click', function(e) {
                // Skip if already handled by touch
                if (touchHandled) {
                    console.log('Click skipped (handled by touch)');
                    return;
                }
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
