/**
 * Prefecture Page Module
 * 転職どうでしょう - 都道府県ページ用スクリプト
 */

console.log('prefecture-page.js loaded');
console.log('PREFECTURE_CONFIG:', window.PREFECTURE_CONFIG);

// Prefecture page data
let prefectureJobs = [];
let prefectureInterviews = [];
let prefectureCompanies = [];
let prefFilteredJobs = [];
let prefCurrentPage = 1;
const jobsPerPage = 10;

/**
 * Initialize Prefecture Page
 */
async function initPrefecturePage() {
    console.log('initPrefecturePage called');
    const config = window.PREFECTURE_CONFIG;
    console.log('config:', config);

    if (!config || !config.id || !config.name) {
        console.error('Prefecture configuration not found');
        return;
    }

    try {
        // Load prefecture-specific data in parallel
        const jobsUrl = `/data/jobs/${config.id}.json`;
        const interviewsUrl = `/data/interviews/${config.id}.json`;
        const companiesUrl = `/data/companies/${config.id}.json`;

        console.log('Loading prefecture data:', { jobsUrl, interviewsUrl, companiesUrl });

        const [jobsResponse, interviewsResponse, companiesResponse] = await Promise.all([
            fetch(jobsUrl),
            fetch(interviewsUrl),
            fetch(companiesUrl)
        ]);

        // Check for fetch errors
        if (!jobsResponse.ok) {
            console.error('Failed to load jobs:', jobsResponse.status, jobsResponse.statusText);
        }
        if (!interviewsResponse.ok) {
            console.error('Failed to load interviews:', interviewsResponse.status, interviewsResponse.statusText);
        }
        if (!companiesResponse.ok) {
            console.error('Failed to load companies:', companiesResponse.status, companiesResponse.statusText);
        }

        const jobsData = jobsResponse.ok ? await jobsResponse.json() : { jobs: [] };
        const interviewsData = interviewsResponse.ok ? await interviewsResponse.json() : { interviews: [] };
        const companiesData = companiesResponse.ok ? await companiesResponse.json() : { companies: [] };

        // Data is already filtered by prefecture in the JSON files
        prefectureJobs = jobsData.jobs || [];
        prefectureInterviews = interviewsData.interviews || [];
        prefectureCompanies = companiesData.companies || [];

        // Initialize filtered jobs
        prefFilteredJobs = [...prefectureJobs];

        // Render content
        renderJobs();
        renderInterviews();
        renderCompanies();

        // Update results count
        updateResultsCount();

        // Setup search form
        setupSearchForm();

    } catch (error) {
        console.error('Error initializing prefecture page:', error);
    }
}

/**
 * Setup Search Form
 */
function setupSearchForm() {
    const form = document.getElementById('jobSearchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        filterAndRenderJobs();
    });

    // Real-time filtering on input change
    const keywordInput = document.getElementById('searchKeyword');
    const jobTypeSelect = document.getElementById('searchJobType');
    const conditionCheckboxes = document.querySelectorAll('input[name="conditions"]');

    if (keywordInput) {
        keywordInput.addEventListener('input', debounce(filterAndRenderJobs, 300));
    }

    if (jobTypeSelect) {
        jobTypeSelect.addEventListener('change', filterAndRenderJobs);
    }

    conditionCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterAndRenderJobs);
    });
}

/**
 * Filter and Render Jobs
 */
function filterAndRenderJobs() {
    const keyword = document.getElementById('searchKeyword')?.value.toLowerCase() || '';
    const jobType = document.getElementById('searchJobType')?.value || '';
    const conditions = Array.from(document.querySelectorAll('input[name="conditions"]:checked')).map(cb => cb.value);

    // Condition mapping
    const conditionMap = {
        'remote': 'リモートワーク可',
        'inexperienced': '未経験歓迎',
        'high_salary': '高年収',
        'holiday': '土日祝休み',
        'no_overtime': '残業少なめ',
        'training': '研修充実',
        'flextime': 'フレックス',
        'benefits': '福利厚生充実',
        'certification': '資格取得支援',
        'incentive': 'インセンティブあり'
    };

    prefFilteredJobs = prefectureJobs.filter(job => {
        // Keyword filter
        if (keyword) {
            const searchText = `${job.title} ${job.company} ${job.keywords || ''}`.toLowerCase();
            if (!searchText.includes(keyword)) {
                return false;
            }
        }

        // Job type filter
        if (jobType && job.category !== jobType) {
            return false;
        }

        // Conditions filter
        if (conditions.length > 0) {
            const jobConditions = job.conditions ? job.conditions.split(',').map(c => c.trim()) : [];
            const hasAllConditions = conditions.every(condition => {
                const japaneseCondition = conditionMap[condition];
                return jobConditions.includes(japaneseCondition);
            });
            if (!hasAllConditions) {
                return false;
            }
        }

        return true;
    });

    prefCurrentPage = 1;
    renderJobs();
    updateResultsCount();
}

/**
 * Render Jobs
 */
function renderJobs() {
    const container = document.getElementById('jobListContainer');
    if (!container) return;

    if (prefFilteredJobs.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">条件に合う求人が見つかりませんでした</p>
                <p style="font-size: 0.875rem;">検索条件を変更してお試しください</p>
            </div>
        `;
        renderPagination();
        return;
    }

    // Pagination
    const startIndex = (prefCurrentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const pageJobs = prefFilteredJobs.slice(startIndex, endIndex);

    container.innerHTML = pageJobs.map(job => {
        const isNew = isNewJob(job.postDate);
        const conditions = job.conditions ? job.conditions.split(',').map(c => c.trim()) : [];

        return `
            <article class="job-listing-card" data-category="${escapeHTML(job.category)}" data-conditions="${escapeHTML(job.conditions || '')}">
                <a href="./jobs/${job.detailUrl ? job.detailUrl.split('/').pop() : 'job-' + String(job.id).padStart(6, '0') + '.html'}">
                    <div class="job-listing-header">
                        ${isNew ? '<span class="job-listing-new">NEW</span>' : ''}
                        <span class="job-listing-type">正社員</span>
                    </div>
                    <h3 class="job-listing-title">${escapeHTML(job.title)}</h3>
                    <p class="job-listing-company">${escapeHTML(job.company)}</p>
                    <div class="job-listing-info">
                        <span class="job-listing-location">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            ${escapeHTML(job.prefecture)}${job.city ? escapeHTML(job.city) : ''}
                        </span>
                        <span class="job-listing-salary">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                            </svg>
                            ${escapeHTML(job.salary)}
                        </span>
                    </div>
                    <div class="job-listing-tags">
                        ${conditions.slice(0, 3).map(condition => `<span class="job-tag-sm">${escapeHTML(condition)}</span>`).join('')}
                    </div>
                </a>
            </article>
        `;
    }).join('');

    renderPagination();
}

/**
 * Render Pagination
 */
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(prefFilteredJobs.length / jobsPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-inner">';

    // Previous button
    if (prefCurrentPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(${prefCurrentPage - 1})">前へ</button>`;
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === prefCurrentPage) {
            html += `<span class="pagination-current">${i}</span>`;
        } else if (i === 1 || i === totalPages || (i >= prefCurrentPage - 2 && i <= prefCurrentPage + 2)) {
            html += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === prefCurrentPage - 3 || i === prefCurrentPage + 3) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // Next button
    if (prefCurrentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="goToPage(${prefCurrentPage + 1})">次へ</button>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Go to Page
 */
function goToPage(page) {
    prefCurrentPage = page;
    renderJobs();

    // Scroll to jobs section
    const jobsSection = document.getElementById('jobs');
    if (jobsSection) {
        jobsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Update Results Count
 */
function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        countEl.textContent = prefFilteredJobs.length;
    }
}

/**
 * Render Interviews
 */
function renderInterviews() {
    const container = document.getElementById('interviewsContainer');
    if (!container) return;

    if (prefectureInterviews.length === 0) {
        container.innerHTML = '<p class="no-content">この地域のインタビュー記事は準備中です</p>';
        return;
    }

    container.innerHTML = prefectureInterviews.map(interview => `
        <article class="article-card" data-category="${escapeHTML(interview.category)}">
            <a href="${interview.detailUrl}">
                <div class="article-card-image">
                    <img src="${interview.image}" alt="${escapeHTML(interview.name)}" loading="lazy">
                </div>
                <div class="article-card-content">
                    <span class="article-card-category">${escapeHTML(interview.category)}</span>
                    <h3 class="article-card-title">${escapeHTML(interview.title)}</h3>
                    <p class="article-card-excerpt">${escapeHTML(interview.excerpt)}</p>
                </div>
            </a>
        </article>
    `).join('');
}

/**
 * Render Companies
 */
function renderCompanies() {
    const container = document.getElementById('companiesContainer');
    if (!container) return;

    if (prefectureCompanies.length === 0) {
        container.innerHTML = '<p class="no-content">この地域の企業インタビューは準備中です</p>';
        return;
    }

    container.innerHTML = prefectureCompanies.map(company => `
        <article class="company-card" data-category="${escapeHTML(company.industry)}">
            <div class="company-card-image">
                <img src="${company.image}" alt="${escapeHTML(company.name)}" loading="lazy">
            </div>
            <div class="company-card-content">
                <span class="company-industry">${escapeHTML(company.industry)}</span>
                <h2>${escapeHTML(company.name)}</h2>
                <p class="company-description">${escapeHTML(company.description)}</p>
                <div class="company-highlights">
                    ${company.highlights.map(h => `<span class="highlight-tag">${escapeHTML(h)}</span>`).join('')}
                </div>
                <a href="${company.detailUrl}" class="btn btn-outline">詳しく見る</a>
            </div>
        </article>
    `).join('');
}

/**
 * Utility: Escape HTML
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Utility: Check if job is new (within 7 days)
 */
function isNewJob(postDate) {
    if (!postDate) return false;
    const posted = new Date(postDate);
    const now = new Date();
    const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

/**
 * Utility: Debounce
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

// Initialize on DOM ready (handle case where DOM is already loaded)
console.log('document.readyState:', document.readyState);
if (document.readyState === 'loading') {
    console.log('Adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', initPrefecturePage);
} else {
    console.log('Calling initPrefecturePage immediately');
    initPrefecturePage();
}

// Make goToPage globally accessible for pagination
window.goToPage = goToPage;
