/**
 * Article Detail Page - Table of Contents Generator
 * 記事詳細ページ - 目次生成 & スムーススクロール
 * H2/H3階層構造対応
 */

document.addEventListener('DOMContentLoaded', function() {
    initArticleToc();
});

/**
 * Check if text starts with a number pattern (e.g., "1.", "1.1", "2. ")
 * @param {string} text - Text to check
 * @returns {boolean} True if text has leading number
 */
function hasLeadingNumber(text) {
    return /^\d+[\.\s]/.test(text.trim());
}

/**
 * Initialize Table of Contents
 * H2をメイン項目、H3をサブ項目として階層構造で表示
 * H2がない場合はH3のみのフラットリストとして表示
 * 見出しに既に番号がある場合は目次の番号を省略
 */
function initArticleToc() {
    const articleBody = document.getElementById('articleBody');
    const tocList = document.getElementById('tocList');
    const tocContainer = document.querySelector('.article-toc');

    if (!articleBody || !tocList) return;

    // Get all H2 and H3 tags from article body
    const headings = articleBody.querySelectorAll('h2, h3');

    // Hide TOC if no headings
    if (headings.length === 0) {
        if (tocContainer) {
            tocContainer.style.display = 'none';
        }
        return;
    }

    // Check if headings already have numbers
    const headingsHaveNumbers = Array.from(headings).some(h => hasLeadingNumber(h.textContent));

    // Check if there are any H2 headings
    const hasH2 = Array.from(headings).some(h => h.tagName.toLowerCase() === 'h2');

    let h2Counter = 0;
    let h3Counter = 0;
    let currentH2Item = null;
    let currentSubList = null;

    headings.forEach((heading) => {
        const tagName = heading.tagName.toLowerCase();

        if (tagName === 'h2') {
            h2Counter++;
            h3Counter = 0; // Reset H3 counter for each H2

            const sectionId = 'section-' + h2Counter;
            heading.id = sectionId;

            // Create main TOC item
            const li = document.createElement('li');
            li.classList.add('toc-item-h2');

            const a = document.createElement('a');
            a.href = '#' + sectionId;
            a.textContent = heading.textContent;
            a.classList.add('toc-link');

            // Only add number if headings don't already have numbers
            if (!headingsHaveNumbers) {
                a.dataset.number = h2Counter + '.';
            }

            li.appendChild(a);
            tocList.appendChild(li);

            currentH2Item = li;
            currentSubList = null; // Reset sublist for new H2
        } else if (tagName === 'h3') {
            h3Counter++;

            // If no H2 exists, add H3 as flat list items
            if (!hasH2) {
                const sectionId = 'section-' + h3Counter;
                heading.id = sectionId;

                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#' + sectionId;
                a.textContent = heading.textContent;
                a.classList.add('toc-link');

                if (!headingsHaveNumbers) {
                    a.dataset.number = h3Counter + '.';
                }

                li.appendChild(a);
                tocList.appendChild(li);
            } else if (currentH2Item) {
                // H2 exists, add H3 as sub-items
                const sectionId = 'section-' + h2Counter + '-' + h3Counter;
                heading.id = sectionId;

                // Create sublist if not exists
                if (!currentSubList) {
                    currentSubList = document.createElement('ol');
                    currentSubList.classList.add('toc-sublist');
                    currentH2Item.appendChild(currentSubList);
                }

                // Create sub TOC item
                const li = document.createElement('li');
                li.classList.add('toc-item-h3');

                const a = document.createElement('a');
                a.href = '#' + sectionId;
                a.textContent = heading.textContent;
                a.classList.add('toc-link', 'toc-link-sub');

                // Only add number if headings don't already have numbers
                if (!headingsHaveNumbers) {
                    a.dataset.number = h2Counter + '.' + h3Counter;
                }

                li.appendChild(a);
                currentSubList.appendChild(li);
            }
        }
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
