/**
 * 転職どうでしょう - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize basic modules immediately
    initMobileMenu();
    initScrollAnimations();
    initFormValidation();
    initStatsCounter();
    initJobSearch();

    // Wait for includes to load before initializing header-dependent modules
    document.addEventListener('includesReady', function() {
        initSmoothScroll();
        initHeaderScroll();
    });

    // Fallback: if includes.js not present, initialize immediately
    setTimeout(function() {
        if (!document.querySelector('.header')) {
            initSmoothScroll();
            initHeaderScroll();
        }
    }, 1000);

    // Track if category-dependent modules have been initialized
    let categoryModulesInitialized = false;

    function initCategoryModules() {
        if (categoryModulesInitialized) return;
        categoryModulesInitialized = true;
        initInterviewPage();
        initCompanyPage();
        initKnowhowPage();
        initHomePage(); // Move here - needs categories for display names
    }

    // Initialize category-dependent modules after categories are loaded
    document.addEventListener('categoriesLoaded', function() {
        initCategoryModules();
    });

    // Fallback: if CategoryManager not available, initialize immediately
    if (typeof CategoryManager === 'undefined') {
        initCategoryModules();
        initFilterTabs();
    } else if (CategoryManager.checkLoaded()) {
        // Categories already loaded (event already fired)
        initCategoryModules();
    } else {
        // Timeout fallback: initialize even if categories fail to load
        setTimeout(function() {
            if (!categoryModulesInitialized) {
                console.warn('Categories loading timeout - initializing without categories');
                initCategoryModules();
            }
        }, 3000);
    }
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    const body = document.body;

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        menuBtn.classList.toggle('active');
        body.classList.toggle('menu-open');

        // Toggle hamburger animation
        const spans = menuBtn.querySelectorAll('span');
        if (nav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });

    // Close menu when clicking on nav links
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            nav.classList.remove('active');
            menuBtn.classList.remove('active');
            body.classList.remove('menu-open');

            const spans = menuBtn.querySelectorAll('span');
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        });
    });
}

/**
 * Smooth Scroll for anchor links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 80; // fallback to 80px

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            // Recalculate header height at click time (in case header loaded after init)
            const currentHeader = document.querySelector('.header');
            const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - currentHeaderHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Scroll Animations (Intersection Observer)
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .region-card, .job-card, .story-card, .blog-card, .contact-item'
    );

    if (!animatedElements.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for grid items
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

/**
 * Header scroll effect
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleHeaderScroll(header, lastScrollY);
                lastScrollY = window.scrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
}

function handleHeaderScroll(header, lastScrollY) {
    const currentScrollY = window.scrollY;

    // Add shadow when scrolled
    if (currentScrollY > 10) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '';
    }

    // Hide/show header on scroll (optional - disabled for better UX)
    // if (currentScrollY > lastScrollY && currentScrollY > 200) {
    //     header.style.transform = 'translateY(-100%)';
    // } else {
    //     header.style.transform = 'translateY(0)';
    // }
}

/**
 * Form Validation
 */
function initFormValidation() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Basic validation
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            const value = field.value.trim();
            const group = field.closest('.form-group');

            // Remove previous error states
            field.style.borderColor = '';
            const existingError = group.querySelector('.error-message');
            if (existingError) existingError.remove();

            if (!value) {
                isValid = false;
                field.style.borderColor = '#e53935';

                const errorMsg = document.createElement('span');
                errorMsg.className = 'error-message';
                errorMsg.style.color = '#e53935';
                errorMsg.style.fontSize = '0.8125rem';
                errorMsg.style.marginTop = '0.25rem';
                errorMsg.style.display = 'block';
                errorMsg.textContent = 'この項目は必須です';
                group.appendChild(errorMsg);
            }

            // Email validation
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    field.style.borderColor = '#e53935';

                    const errorMsg = document.createElement('span');
                    errorMsg.className = 'error-message';
                    errorMsg.style.color = '#e53935';
                    errorMsg.style.fontSize = '0.8125rem';
                    errorMsg.style.marginTop = '0.25rem';
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = '正しいメールアドレスを入力してください';
                    group.appendChild(errorMsg);
                }
            }
        });

        if (isValid) {
            // Show success message
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = '送信中...';
            submitBtn.disabled = true;

            // Simulate form submission
            setTimeout(() => {
                form.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <svg viewBox="0 0 24 24" width="64" height="64" stroke="#4caf50" stroke-width="2" fill="none" style="margin: 0 auto 1rem;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9 12l2 2 4-4"></path>
                        </svg>
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">送信完了</h3>
                        <p style="color: #666;">お問い合わせありがとうございます。<br>担当者より2営業日以内にご連絡いたします。</p>
                    </div>
                `;
            }, 1500);
        }
    });
}

/**
 * Stats Counter Animation
 */
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    if (!stats.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const text = element.textContent;
    const match = text.match(/^([\d,]+)/);

    if (!match) return;

    const targetNum = parseInt(match[1].replace(/,/g, ''));
    const suffix = text.replace(match[1], '');
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentNum = Math.floor(targetNum * easeOutQuart);

        element.innerHTML = currentNum.toLocaleString() + suffix;

        if (currentStep >= steps) {
            clearInterval(timer);
            element.innerHTML = targetNum.toLocaleString() + suffix;
        }
    }, stepDuration);
}

/**
 * Utility: Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Filter Tabs for Articles/Companies
 */
function initFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    if (filterTabs.length === 0) return;

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active state
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Get filter category
            const category = this.textContent.trim();

            // Filter articles
            const articleCards = document.querySelectorAll('.article-card[data-category]');
            const companyCards = document.querySelectorAll('.company-card[data-category]');
            const allCards = [...articleCards, ...companyCards];

            allCards.forEach(card => {
                if (category === 'すべて' || card.dataset.category === category) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Job Search Functionality - JSON based
 */

// Global variable to store loaded jobs
let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const JOBS_PER_PAGE = 10;

// Japanese prefecture order
const PREFECTURE_ORDER = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

/**
 * Initialize job system
 */
function initJobSearch() {
    // Skip on prefecture pages - prefecture-page.js handles data loading
    if (window.PREFECTURE_CONFIG) {
        return;
    }

    const jobListContainer = document.getElementById('jobListContainer');
    const newJobsContainer = document.getElementById('newJobsContainer');
    const jobDetailContent = document.getElementById('jobDetailContent');

    // Load jobs if containers exist
    if (jobListContainer || newJobsContainer || jobDetailContent) {
        loadJobs();
    }
}

/**
 * Load jobs from multiple child site JSON files
 * Fetches prefectures.json first, then loads each active prefecture's jobs in parallel
 */
async function loadJobs() {
    const jobListContainer = document.getElementById('jobListContainer');
    const newJobsContainer = document.getElementById('newJobsContainer');
    const jobDetailContent = document.getElementById('jobDetailContent');

    try {
        // Determine base path based on current location
        const isInSubdirectory = window.location.pathname.includes('/jobs/');
        const basePath = isInSubdirectory ? '../' : './';

        // First, load prefectures.json to get active prefectures
        const prefResponse = await fetch(basePath + 'data/prefectures.json');
        if (!prefResponse.ok) {
            throw new Error('Failed to load prefectures: HTTP ' + prefResponse.status);
        }
        const prefData = await prefResponse.json();
        const activePrefectures = prefData.prefectures.filter(p => p.active);

        // Load all active prefecture job JSONs in parallel
        const jobPromises = activePrefectures.map(async (pref) => {
            try {
                const response = await fetch(basePath + `data/jobs/${pref.id}.json`);
                if (!response.ok) {
                    console.warn(`Jobs not found for ${pref.name}: HTTP ${response.status}`);
                    return [];
                }
                const data = await response.json();
                // Add prefecture info to each job if not present
                return (data.jobs || []).map(job => ({
                    ...job,
                    prefecture: job.prefecture || data.prefecture || pref.name,
                    prefecture_id: job.prefecture_id || data.prefecture_id || pref.id
                }));
            } catch (err) {
                console.warn(`Error loading jobs for ${pref.name}:`, err);
                return [];
            }
        });

        // Wait for all fetches and merge results
        const jobArrays = await Promise.all(jobPromises);
        allJobs = jobArrays.flat();

        // Sort by post date (newest first)
        allJobs.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // Populate prefecture dropdowns
        populatePrefectureDropdowns();

        // Render jobs based on page
        if (jobListContainer) {
            initJobsPage();
        }

        if (newJobsContainer) {
            renderNewJobs();
        }

        // Render job detail page
        if (jobDetailContent) {
            renderJobDetail();
        }
    } catch (error) {
        console.error('Error loading jobs:', error);

        const errorHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #999;">
                <p>求人情報を読み込めませんでした</p>
            </div>
        `;

        if (jobListContainer) {
            jobListContainer.innerHTML = errorHTML;
        }
        if (newJobsContainer) {
            newJobsContainer.innerHTML = errorHTML;
        }
    }
}

/**
 * Populate prefecture dropdowns from jobs data
 */
function populatePrefectureDropdowns() {
    // Get unique prefectures from jobs
    const prefecturesSet = new Set(allJobs.map(job => job.prefecture));
    const prefectures = Array.from(prefecturesSet);

    // Sort by Japanese prefecture order
    prefectures.sort((a, b) => {
        const indexA = PREFECTURE_ORDER.indexOf(a);
        const indexB = PREFECTURE_ORDER.indexOf(b);
        // If not found in order list, put at the end
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
    });

    // Get all prefecture select elements
    const prefectureSelects = document.querySelectorAll('#searchPrefecture, #searchPrefectureIndex');

    prefectureSelects.forEach(select => {
        if (!select) return;

        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add prefecture options
        prefectures.forEach(pref => {
            const option = document.createElement('option');
            option.value = pref;
            option.textContent = pref;
            select.appendChild(option);
        });
    });
}

/**
 * Initialize jobs page with filtering
 */
function initJobsPage() {
    // Handle URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobTypeParam = urlParams.get('job_type');
    const keywordParam = urlParams.get('keyword');
    const prefectureParam = urlParams.get('prefecture');
    const conditionsParam = urlParams.getAll('conditions');

    // Set form values from URL parameters
    const searchKeyword = document.getElementById('searchKeyword');
    const searchJobType = document.getElementById('searchJobType');
    const searchPrefecture = document.getElementById('searchPrefecture');

    if (searchKeyword && keywordParam) {
        searchKeyword.value = keywordParam;
    }

    if (searchJobType && jobTypeParam) {
        searchJobType.value = jobTypeParam;
    }

    if (searchPrefecture && prefectureParam) {
        searchPrefecture.value = prefectureParam;
    }

    // Set checkbox values
    if (conditionsParam.length > 0) {
        conditionsParam.forEach(condition => {
            const checkbox = document.querySelector(`input[name="conditions"][value="${condition}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Render and filter jobs
    filterAndRenderJobs();

    // If came from search (has URL params), scroll to results
    const hasSearchParams = keywordParam || prefectureParam || jobTypeParam || conditionsParam.length > 0;
    if (hasSearchParams) {
        setTimeout(() => {
            scrollToResults();
        }, 100);
    }

    // Setup form handlers - only trigger on search button click
    const jobSearchForm = document.getElementById('jobSearchForm');
    if (jobSearchForm) {
        jobSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterAndRenderJobs();
            updateURL();

            // Scroll to results
            scrollToResults();
        });
    }
}

/**
 * Scroll to search results section
 */
function scrollToResults() {
    const resultsSection = document.querySelector('.search-results-info');
    if (resultsSection) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
        const targetPosition = resultsSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
}

/**
 * Check if job is new (posted within 7 days)
 */
function isNewJob(postDate) {
    const now = new Date();
    const posted = new Date(postDate);
    const diffTime = now - posted;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}

/**
 * Map condition values for filtering
 */
function mapConditionValue(condition) {
    const conditionMap = {
        'リモートワーク可': 'remote',
        '未経験歓迎': 'inexperienced',
        '高年収': 'high_salary',
        '土日祝休み': 'holiday',
        '残業少なめ': 'no_overtime',
        '研修充実': 'training',
        'フレックス': 'flextime',
        '福利厚生充実': 'benefits',
        '資格取得支援': 'certification',
        'インセンティブあり': 'incentive'
    };
    return conditionMap[condition] || condition.toLowerCase();
}

/**
 * Filter and render jobs on jobs page
 */
function filterAndRenderJobs(resetPage = true) {
    const keyword = document.getElementById('searchKeyword')?.value.toLowerCase() || '';
    const jobType = document.getElementById('searchJobType')?.value || '';
    const prefecture = document.getElementById('searchPrefecture')?.value || '';
    const checkedConditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked')).map(cb => cb.value);

    // Reset to page 1 when filters change
    if (resetPage) {
        currentPage = 1;
    }

    // Filter jobs
    filteredJobs = allJobs.filter(job => {
        // Filter by keyword (search in title, company, keywords)
        if (keyword) {
            const searchText = `${job.title} ${job.company} ${job.keywords}`.toLowerCase();
            if (!searchText.includes(keyword)) {
                return false;
            }
        }

        // Filter by prefecture
        if (prefecture && job.prefecture !== prefecture) {
            return false;
        }

        // Filter by job type/category
        if (jobType && job.category !== jobType) {
            return false;
        }

        // Filter by conditions
        if (checkedConditions.length > 0) {
            const jobConditions = job.conditions.split(',').map(c => mapConditionValue(c.trim()));
            const hasAllConditions = checkedConditions.every(cond => jobConditions.includes(cond));
            if (!hasAllConditions) {
                return false;
            }
        }

        return true;
    });

    // Sort by post date (newest first)
    filteredJobs.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // Render filtered jobs with pagination
    renderJobList();

    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredJobs.length;
    }

    // Show/hide no results message
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = filteredJobs.length === 0 ? 'block' : 'none';
    }
}

/**
 * Render job list on jobs page with pagination
 */
function renderJobList() {
    const container = document.getElementById('jobListContainer');
    if (!container) return;

    // Calculate pagination
    const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShow = filteredJobs.slice(startIndex, endIndex);

    // Render job cards
    container.innerHTML = jobsToShow.map(job => createJobCardHTML(job)).join('');

    // Render pagination
    renderPagination(totalPages);
}

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
    // Remove existing pagination
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Don't show pagination if only 1 page or less
    if (totalPages <= 1) return;

    const container = document.getElementById('jobListContainer');
    if (!container) return;

    // Create pagination HTML
    let paginationHTML = '<div class="pagination">';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn pagination-prev" data-page="${currentPage - 1}">&lt; 前へ</button>`;
    }

    // Page numbers
    paginationHTML += '<div class="pagination-numbers">';
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn pagination-num ${activeClass}" data-page="${i}">${i}</button>`;
    }
    paginationHTML += '</div>';

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn pagination-next" data-page="${currentPage + 1}">次へ &gt;</button>`;
    }

    paginationHTML += '</div>';

    // Insert pagination after container
    container.insertAdjacentHTML('afterend', paginationHTML);

    // Add click handlers
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                renderJobList();
                // Scroll to top of results
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Render new jobs on index page (latest 3)
 */
function renderNewJobs() {
    const container = document.getElementById('newJobsContainer');
    if (!container) return;

    // Sort by post date and get latest 3
    const latestJobs = [...allJobs]
        .sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
        .slice(0, 3);

    container.innerHTML = latestJobs.map(job => createJobCardHTML(job)).join('');
}

/**
 * Create job card HTML
 */
function createJobCardHTML(job) {
    const isNew = isNewJob(job.postDate);
    const conditions = job.conditions.split(',').map(c => c.trim());
    const conditionValues = conditions.map(c => mapConditionValue(c));

    // Build detailUrl from prefecture_id and job id
    // If detailUrl doesn't include prefecture_id, prepend it
    let detailUrl = job.detailUrl;
    if (job.prefecture_id && !detailUrl.startsWith(job.prefecture_id)) {
        detailUrl = `${job.prefecture_id}/${job.detailUrl}`;
    }

    return `
        <article class="job-listing-card" data-category="${job.category}" data-conditions="${conditionValues.join(',')}">
            <a href="${detailUrl}">
                <div class="job-listing-header">
                    ${isNew ? '<span class="job-listing-new">NEW</span>' : ''}
                    <span class="job-listing-type">${escapeHTML(job.employmentType || '正社員')}</span>
                </div>
                <h3 class="job-listing-title">${escapeHTML(job.title)}</h3>
                <p class="job-listing-company">${escapeHTML(job.company)}</p>
                <div class="job-listing-info">
                    <span class="job-listing-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${escapeHTML(job.prefecture)}${escapeHTML(job.city)}
                    </span>
                    <span class="job-listing-salary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        ${escapeHTML(job.salary)}
                    </span>
                </div>
                <div class="job-listing-tags">
                    ${conditions.slice(0, 3).map(tag => `<span class="job-tag-sm">${escapeHTML(tag)}</span>`).join('')}
                </div>
            </a>
        </article>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Update URL with search parameters
 */
function updateURL() {
    const keyword = document.getElementById('searchKeyword')?.value || '';
    const prefecture = document.getElementById('searchPrefecture')?.value || '';
    const jobType = document.getElementById('searchJobType')?.value || '';
    const checkedConditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked')).map(cb => cb.value);

    const params = new URLSearchParams();

    if (keyword) {
        params.set('keyword', keyword);
    }

    if (prefecture) {
        params.set('prefecture', prefecture);
    }

    if (jobType) {
        params.set('job_type', jobType);
    }

    checkedConditions.forEach(cond => {
        params.append('conditions', cond);
    });

    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

/**
 * Render job detail page
 */
function renderJobDetail() {
    const container = document.getElementById('jobDetailContent');
    if (!container) return;

    // Get job ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = parseInt(urlParams.get('id'));

    if (!jobId) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <p>求人が見つかりませんでした。</p>
                <p><a href="index.html">転職先を探す</a></p>
            </div>
        `;
        return;
    }

    // Find job by ID
    const job = allJobs.find(j => j.id === jobId);

    if (!job) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <p>求人が見つかりませんでした。</p>
                <p><a href="index.html">転職先を探す</a></p>
            </div>
        `;
        return;
    }

    // Get detail object (for backward compatibility)
    const detail = job.detail || {};

    // Update page title and breadcrumb
    document.title = `${job.title} | 転職どうでしょう`;
    const breadcrumbTitle = document.getElementById('breadcrumbTitle');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = job.title;
    }

    // Check if job is new
    const isNew = isNewJob(job.postDate);
    const conditions = job.conditions.split(',').map(c => c.trim());

    // Build detail HTML with sections matching existing site
    const detailHTML = `
        <div class="job-detail-header">
            <div class="job-detail-tags">
                ${isNew ? '<span class="job-detail-tag tag-new">NEW</span>' : ''}
                <span class="job-detail-tag tag-type">正社員</span>
            </div>
            <h1 class="job-detail-title">${escapeHTML(job.title)}</h1>
            <p class="job-detail-company">${escapeHTML(job.company)}</p>
            <div class="job-detail-meta">
                <div class="job-detail-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    ${escapeHTML(job.prefecture)}${escapeHTML(job.city)}
                </div>
                <div class="job-detail-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    ${escapeHTML(job.salary)}
                </div>
            </div>
            <div class="job-detail-conditions-header">
                ${conditions.map(c => `<span class="job-detail-condition">${escapeHTML(c)}</span>`).join('')}
            </div>
        </div>

        <!-- 募集要項 -->
        <div class="job-detail-section">
            <h2 class="job-detail-section-title">募集要項</h2>
            <table class="job-detail-table">
                <tbody>
                    <tr>
                        <th>仕事内容</th>
                        <td>${escapeHTML(detail.description || '')}</td>
                    </tr>
                    <tr>
                        <th>求める人材</th>
                        <td>${escapeHTML(detail.requirements || '')}</td>
                    </tr>
                    <tr>
                        <th>勤務地</th>
                        <td>${escapeHTML(detail.location || job.prefecture + job.city)}</td>
                    </tr>
                    <tr>
                        <th>勤務時間</th>
                        <td>${escapeHTML(detail.workHours || '')}</td>
                    </tr>
                    <tr>
                        <th>雇用形態</th>
                        <td>${escapeHTML(detail.employmentType || '正社員')}</td>
                    </tr>
                    <tr>
                        <th>給与</th>
                        <td>${escapeHTML(detail.salaryDetail || job.salary)}</td>
                    </tr>
                    <tr>
                        <th>賞与</th>
                        <td>${escapeHTML(detail.bonus || '')}</td>
                    </tr>
                    <tr>
                        <th>待遇・福利厚生</th>
                        <td>${escapeHTML(detail.benefits || '')}</td>
                    </tr>
                    <tr>
                        <th>休日・休暇</th>
                        <td>${escapeHTML(detail.holidays || '')}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 会社概要 -->
        <div class="job-detail-section">
            <h2 class="job-detail-section-title">会社概要</h2>
            <table class="job-detail-table">
                <tbody>
                    <tr>
                        <th>会社名</th>
                        <td>${escapeHTML(job.company)}</td>
                    </tr>
                    <tr>
                        <th>所在地</th>
                        <td>${escapeHTML(detail.companyAddress || '')}</td>
                    </tr>
                    <tr>
                        <th>設立</th>
                        <td>${escapeHTML(detail.established || '')}</td>
                    </tr>
                    <tr>
                        <th>代表</th>
                        <td>${escapeHTML(detail.representative || '')}</td>
                    </tr>
                    <tr>
                        <th>従業員数</th>
                        <td>${escapeHTML(detail.employees || '')}</td>
                    </tr>
                    <tr>
                        <th>事業内容</th>
                        <td>${escapeHTML(detail.businessContent || '')}</td>
                    </tr>
                    <tr>
                        <th>企業HP</th>
                        <td>${detail.companyUrl ? `<a href="${escapeHTML(detail.companyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(detail.companyUrl)}</a>` : ''}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 応募・選考について -->
        <div class="job-detail-section">
            <h2 class="job-detail-section-title">応募・選考について</h2>
            <table class="job-detail-table">
                <tbody>
                    <tr>
                        <th>選考フロー</th>
                        <td>${escapeHTML(detail.selectionProcess || '')}</td>
                    </tr>
                    <tr>
                        <th>応募受付方法</th>
                        <td>${escapeHTML(detail.applicationMethod || '')}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="job-detail-cta">
            <h3 class="job-detail-cta-title">この求人に興味がありますか？</h3>
            <p class="job-detail-cta-text">LINEで気軽にご相談ください。キャリアアドバイザーが詳しくご説明します。</p>
            <a href="#" class="btn btn-line btn-lg">
                <img src="assets/LINE_Brand_icon.png" alt="LINE" width="24" height="24">
                LINEで相談する
            </a>
        </div>

        <div class="job-detail-back">
            <a href="index.html">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5"></path>
                    <path d="M12 19l-7-7 7-7"></path>
                </svg>
                転職先を探す
            </a>
        </div>
    `;

    container.innerHTML = detailHTML;
}

/**
 * Interview Page Functionality
 */
let allInterviews = [];
let interviewFilters = { prefecture: '', category: '' };

async function initInterviewPage() {
    const interviewGrid = document.getElementById('interviewGrid');
    if (!interviewGrid) return;

    // Generate category filter tabs dynamically
    if (typeof CategoryManager !== 'undefined') {
        CategoryManager.renderFilterTabs('categoryTabs', 'interview', 'category', 'すべて');
    }

    try {
        const response = await fetch('./data/interviews.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        allInterviews = data.interviews || [];

        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const prefectureParam = urlParams.get('prefecture');

        // Set prefecture filter from URL
        const prefectureSelect = document.getElementById('prefectureFilter');
        if (prefectureSelect && prefectureParam) {
            // Convert prefecture ID to name if needed
            const prefectureMap = { 'shiga': '滋賀県', 'shizuoka': '静岡県' };
            const prefectureName = prefectureMap[prefectureParam] || prefectureParam;
            prefectureSelect.value = prefectureName;
            interviewFilters.prefecture = prefectureName;
        }

        // Setup filter handlers
        setupInterviewFilters();

        // Render interviews
        renderInterviews();
    } catch (error) {
        console.error('Error loading interviews:', error);
        interviewGrid.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">インタビュー記事を読み込めませんでした</p>';
    }
}

function setupInterviewFilters() {
    // Prefecture filter
    const prefectureSelect = document.getElementById('prefectureFilter');
    if (prefectureSelect) {
        prefectureSelect.addEventListener('change', function() {
            interviewFilters.prefecture = this.value;
            renderInterviews();
            updateInterviewURL();
        });
    }

    // Category filter tabs - use CategoryManager if available
    if (typeof CategoryManager !== 'undefined') {
        CategoryManager.setupFilterHandlers('categoryTabs', function(categoryId) {
            interviewFilters.category = categoryId;
            renderInterviews();
        });
    } else {
        // Fallback for legacy hardcoded tabs
        const categoryTabs = document.querySelectorAll('#categoryTabs .filter-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                categoryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                interviewFilters.category = this.dataset.category || '';
                renderInterviews();
            });
        });
    }
}

function renderInterviews() {
    const container = document.getElementById('interviewGrid');
    if (!container) return;

    let filtered = allInterviews;

    // Filter by prefecture
    if (interviewFilters.prefecture) {
        filtered = filtered.filter(i => i.prefecture === interviewFilters.prefecture);
    }

    // Filter by category (supports both ID and name for backward compatibility)
    if (interviewFilters.category) {
        filtered = filtered.filter(i => {
            const itemCategoryId = typeof CategoryManager !== 'undefined'
                ? CategoryManager.normalizeToId('interview', i.category)
                : i.category;
            return itemCategoryId === interviewFilters.category || i.category === interviewFilters.category;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#666;">条件に合うインタビュー記事がありません</p>';
        return;
    }

    container.innerHTML = filtered.map(interview => {
        // Get display name for category
        const categoryDisplay = typeof CategoryManager !== 'undefined'
            ? CategoryManager.normalizeToName('interview', interview.category)
            : interview.category;

        return `
        <article class="article-card" data-category="${escapeHTML(interview.category)}" data-prefecture="${escapeHTML(interview.prefecture)}">
            <a href="${interview.detailUrl}">
                <div class="article-card-image">
                    <img src="${interview.image}" alt="${escapeHTML(interview.title)}" loading="lazy">
                </div>
                <div class="article-card-content">
                    <span class="article-card-category">${escapeHTML(categoryDisplay)}</span>
                    <h3 class="article-card-title">${escapeHTML(interview.title)}</h3>
                    <p class="article-card-company">${escapeHTML(interview.company)}</p>
                </div>
            </a>
        </article>
    `;
    }).join('');
}

function updateInterviewURL() {
    const params = new URLSearchParams();
    if (interviewFilters.prefecture) {
        const prefectureIdMap = { '滋賀県': 'shiga', '静岡県': 'shizuoka' };
        params.set('prefecture', prefectureIdMap[interviewFilters.prefecture] || interviewFilters.prefecture);
    }
    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

/**
 * Company Page Functionality
 */
let allCompanies = [];
let companyFilters = { prefecture: '', industry: '' };

async function initCompanyPage() {
    const companyGrid = document.getElementById('companyGrid');
    if (!companyGrid) return;

    // Generate industry filter tabs dynamically
    if (typeof CategoryManager !== 'undefined') {
        CategoryManager.renderFilterTabs('industryTabs', 'company', 'industry', 'すべて');
    }

    try {
        const response = await fetch('./data/companies.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        allCompanies = data.companies || [];

        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const prefectureParam = urlParams.get('prefecture');

        // Set prefecture filter from URL
        const prefectureSelect = document.getElementById('prefectureFilter');
        if (prefectureSelect && prefectureParam) {
            const prefectureMap = { 'shiga': '滋賀県', 'shizuoka': '静岡県' };
            const prefectureName = prefectureMap[prefectureParam] || prefectureParam;
            prefectureSelect.value = prefectureName;
            companyFilters.prefecture = prefectureName;
        }

        // Setup filter handlers
        setupCompanyFilters();

        // Render companies
        renderCompanies();
    } catch (error) {
        console.error('Error loading companies:', error);
        companyGrid.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">企業情報を読み込めませんでした</p>';
    }
}

function setupCompanyFilters() {
    // Prefecture filter
    const prefectureSelect = document.getElementById('prefectureFilter');
    if (prefectureSelect) {
        prefectureSelect.addEventListener('change', function() {
            companyFilters.prefecture = this.value;
            renderCompanies();
            updateCompanyURL();
        });
    }

    // Industry filter tabs - use CategoryManager if available
    if (typeof CategoryManager !== 'undefined') {
        CategoryManager.setupFilterHandlers('industryTabs', function(industryId) {
            companyFilters.industry = industryId;
            renderCompanies();
        });
    } else {
        // Fallback for legacy hardcoded tabs
        const industryTabs = document.querySelectorAll('#industryTabs .filter-tab');
        industryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                industryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                companyFilters.industry = this.dataset.industry || '';
                renderCompanies();
            });
        });
    }
}

function renderCompanies() {
    const container = document.getElementById('companyGrid');
    if (!container) return;

    let filtered = allCompanies;

    // Filter by prefecture
    if (companyFilters.prefecture) {
        filtered = filtered.filter(c => c.prefecture === companyFilters.prefecture);
    }

    // Filter by industry (supports both ID and name for backward compatibility)
    if (companyFilters.industry) {
        filtered = filtered.filter(c => {
            const itemIndustryId = typeof CategoryManager !== 'undefined'
                ? CategoryManager.normalizeToId('company', c.industry)
                : c.industry;
            return itemIndustryId === companyFilters.industry || c.industry === companyFilters.industry;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">条件に合う企業がありません</p>';
        return;
    }

    container.innerHTML = filtered.map(company => {
        // Get display name for industry
        const industryDisplay = typeof CategoryManager !== 'undefined'
            ? CategoryManager.normalizeToName('company', company.industry)
            : company.industry;

        return `
        <article class="article-card" data-industry="${escapeHTML(company.industry)}" data-prefecture="${escapeHTML(company.prefecture)}">
            <a href="${company.detailUrl}">
                <div class="article-card-image">
                    <img src="${company.image}" alt="${escapeHTML(company.title)}" loading="lazy">
                </div>
                <div class="article-card-content">
                    <span class="article-card-category">${escapeHTML(industryDisplay)}</span>
                    <h3 class="article-card-title">${escapeHTML(company.title)}</h3>
                    <p class="article-card-company">${escapeHTML(company.company)}</p>
                </div>
            </a>
        </article>
    `;
    }).join('');
}

function updateCompanyURL() {
    const params = new URLSearchParams();
    if (companyFilters.prefecture) {
        const prefectureIdMap = { '滋賀県': 'shiga', '静岡県': 'shizuoka' };
        params.set('prefecture', prefectureIdMap[companyFilters.prefecture] || companyFilters.prefecture);
    }
    const newURL = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

/**
 * Home Page - Load latest interviews and companies
 */
async function initHomePage() {
    const homeInterviewsContainer = document.getElementById('homeInterviewsContainer');
    const homeCompaniesContainer = document.getElementById('homeCompaniesContainer');

    // Skip if not on home page
    if (!homeInterviewsContainer && !homeCompaniesContainer) return;

    // Load interviews for home page
    if (homeInterviewsContainer) {
        try {
            const response = await fetch('./data/interviews.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            const interviews = data.interviews || [];

            // Sort by date and get latest 3
            const latestInterviews = [...interviews]
                .sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
                .slice(0, 3);

            homeInterviewsContainer.innerHTML = latestInterviews.map(interview => {
                // Get display name for category
                const categoryDisplay = typeof CategoryManager !== 'undefined'
                    ? CategoryManager.normalizeToName('interview', interview.category)
                    : interview.category;
                return `
                <article class="article-card">
                    <a href="${interview.detailUrl}">
                        <div class="article-card-image">
                            <img src="${interview.image}" alt="${escapeHTML(interview.title)}" loading="lazy">
                        </div>
                        <div class="article-card-content">
                            <span class="article-card-category">${escapeHTML(categoryDisplay)}</span>
                            <h3 class="article-card-title">${escapeHTML(interview.title)}</h3>
                            <p class="article-card-company">${escapeHTML(interview.company)}</p>
                        </div>
                    </a>
                </article>
            `;
            }).join('');
        } catch (error) {
            console.error('Error loading home interviews:', error);
            homeInterviewsContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#666;">読み込みに失敗しました</p>';
        }
    }

    // Load companies for home page
    if (homeCompaniesContainer) {
        try {
            const response = await fetch('./data/companies.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            const companies = data.companies || [];

            // Sort by date and get latest 3
            const latestCompanies = [...companies]
                .sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
                .slice(0, 3);

            homeCompaniesContainer.innerHTML = latestCompanies.map(company => {
                // Get display name for industry
                const industryDisplay = typeof CategoryManager !== 'undefined'
                    ? CategoryManager.normalizeToName('company', company.industry)
                    : company.industry;
                return `
                <article class="article-card">
                    <a href="${company.detailUrl}">
                        <div class="article-card-image">
                            <img src="${company.image}" alt="${escapeHTML(company.title)}" loading="lazy">
                        </div>
                        <div class="article-card-content">
                            <span class="article-card-category">${escapeHTML(industryDisplay)}</span>
                            <h3 class="article-card-title">${escapeHTML(company.title)}</h3>
                            <p class="article-card-company">${escapeHTML(company.company)}</p>
                        </div>
                    </a>
                </article>
            `;
            }).join('');
        } catch (error) {
            console.error('Error loading home companies:', error);
            homeCompaniesContainer.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#666;">読み込みに失敗しました</p>';
        }
    }
}

/**
 * Knowhow Page Functionality
 */
let knowhowFilter = '';

function initKnowhowPage() {
    const articleGrid = document.getElementById('articleGrid');
    if (!articleGrid) return;

    // Generate knowhow category filter tabs dynamically
    const filterTabsContainer = document.querySelector('.column-filter .filter-tabs');
    if (filterTabsContainer && typeof CategoryManager !== 'undefined') {
        // Add an ID to the container for easier reference
        filterTabsContainer.id = 'knowhowTabs';
        CategoryManager.renderFilterTabs('knowhowTabs', 'knowhow', 'knowhow', 'すべて');

        // Setup filter handlers
        CategoryManager.setupFilterHandlers('knowhowTabs', function(categoryId) {
            knowhowFilter = categoryId;
            filterKnowhowArticles();
        });
    } else {
        // Fallback: use existing initFilterTabs for legacy hardcoded tabs
        initFilterTabs();
    }
}

function filterKnowhowArticles() {
    const articleCards = document.querySelectorAll('#articleGrid .article-card');

    articleCards.forEach(card => {
        if (!knowhowFilter) {
            card.style.display = '';
        } else {
            const cardCategory = card.dataset.category;
            // Support both ID and name matching
            const cardCategoryId = typeof CategoryManager !== 'undefined'
                ? CategoryManager.normalizeToId('knowhow', cardCategory)
                : cardCategory;

            if (cardCategoryId === knowhowFilter || cardCategory === knowhowFilter) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    });
}
