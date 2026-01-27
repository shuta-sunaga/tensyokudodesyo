/**
 * Article Detail Page - Table of Contents Generator
 * 記事詳細ページ - 目次生成 & スムーススクロール
 */

document.addEventListener('DOMContentLoaded', function() {
    initArticleToc();
});

/**
 * Initialize Table of Contents
 */
function initArticleToc() {
    const articleBody = document.getElementById('articleBody');
    const tocList = document.getElementById('tocList');
    const tocContainer = document.querySelector('.article-toc');

    if (!articleBody || !tocList) return;

    // Get all H3 tags from article body
    const h3Tags = articleBody.querySelectorAll('h3');

    // Hide TOC if no H3 headings
    if (h3Tags.length === 0) {
        if (tocContainer) {
            tocContainer.style.display = 'none';
        }
        return;
    }

    // Generate TOC and add IDs to H3 tags
    h3Tags.forEach((h3, index) => {
        const sectionId = 'section-' + (index + 1);

        // Add ID to H3 tag
        h3.id = sectionId;

        // Create TOC item
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + sectionId;
        a.textContent = h3.textContent;
        a.classList.add('toc-link');

        li.appendChild(a);
        tocList.appendChild(li);
    });

    // Setup smooth scroll for TOC links
    setupSmoothScroll();
}

/**
 * Setup Smooth Scroll for TOC Links
 */
function setupSmoothScroll() {
    const tocLinks = document.querySelectorAll('.toc-link');

    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                scrollToElement(target);
            }
        });
    });
}

/**
 * Scroll to Element with Header Offset
 * @param {HTMLElement} element - Target element to scroll to
 */
function scrollToElement(element) {
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 80;
    const offset = 20; // Additional offset for better visibility

    const targetPosition = element.getBoundingClientRect().top
        + window.pageYOffset
        - headerHeight
        - offset;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * Optional: Highlight current section in TOC while scrolling
 * Uncomment to enable scroll spy feature
 */
/*
function initScrollSpy() {
    const sections = document.querySelectorAll('.article-body h3');
    const tocLinks = document.querySelectorAll('.toc-link');

    if (sections.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.id;

                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + currentId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}
*/
