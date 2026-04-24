/**
 * Japan SVG Map Interaction Module
 * 転職どうでしょう - 日本地図インタラクション
 */

// Prefecture data store
let prefectureData = [];
let prefecturesByRegion = {};
let jobCountByPrefecture = {};

// Region name mapping (Japanese to English ID)
const regionIdMap = {
    '北海道': 'hokkaido',
    '東北': 'tohoku',
    '関東': 'kanto',
    '中部': 'chubu',
    '近畿': 'kinki',
    '中国': 'chugoku',
    '四国': 'shikoku',
    '九州': 'kyushu',
    '沖縄': 'okinawa'
};

// Region colors (kept for possible external reference; actual styling lives in injected CSS)
const regionColors = {
    'hokkaido': { fill: '#a8d8ea', stroke: '#6bb3cf', hoverFill: '#7bc4de' },
    'tohoku':   { fill: '#d4b8e0', stroke: '#a67bb8', hoverFill: '#c49dd4' },
    'kanto':    { fill: '#ffd4a8', stroke: '#e8a85c', hoverFill: '#f5c088' },
    'chubu':    { fill: '#c8e6d0', stroke: '#7db88d', hoverFill: '#a8d8b4' },
    'kinki':    { fill: '#f5c4c4', stroke: '#d88888', hoverFill: '#e8a8a8' },
    'chugoku':  { fill: '#f5f0a8', stroke: '#d4c85c', hoverFill: '#e8e088' },
    'shikoku':  { fill: '#a8f0e8', stroke: '#5cc4b8', hoverFill: '#88e0d8' },
    'kyushu':   { fill: '#f5a8d4', stroke: '#d45c9c', hoverFill: '#e888c0' },
    'okinawa':  { fill: '#a8e8f5', stroke: '#5cb8d4', hoverFill: '#88d8e8' }
};

// Track which regions have at least one active prefecture
let activeRegions = new Set();

// Current tooltip state
let currentTooltipRegion = null;

/**
 * Build CSS to be injected into the SVG document.
 * All fill/stroke rules live here so JS only toggles data attributes.
 */
function buildSvgStyles() {
    // Default rule covers paths BEFORE JS assigns data-region-active,
    // so the map never flashes the browser-default black fill.
    let css = `
        svg#japanMap { background: transparent; }
        g[data-prefecture] { cursor: pointer; }
        g.svg-map, g[data-prefecture] { touch-action: manipulation; }
        g[data-prefecture] path,
        g[data-prefecture] polygon {
            fill: #d0d0d0;
            stroke: #a0a0a0;
            stroke-width: 0.5;
            transition: fill 0.2s ease, stroke-width 0.2s ease;
        }
        g[data-prefecture][data-region-active="false"][data-selected="true"] path,
        g[data-prefecture][data-region-active="false"][data-selected="true"] polygon {
            fill: #c0c0c0;
            stroke-width: 1;
        }
    `;

    Object.entries(regionColors).forEach(([rid, c]) => {
        css += `
        g[data-prefecture][data-region-active="true"][data-region="${rid}"] path,
        g[data-prefecture][data-region-active="true"][data-region="${rid}"] polygon {
            fill: ${c.fill};
            stroke: ${c.stroke};
        }
        g[data-prefecture][data-region-active="true"][data-region="${rid}"][data-selected="true"] path,
        g[data-prefecture][data-region-active="true"][data-region="${rid}"][data-selected="true"] polygon {
            fill: ${c.hoverFill};
            stroke-width: 1;
        }`;
    });

    return css;
}

/**
 * Inject the <style> block into the SVG document (idempotent)
 */
function injectSvgStyles(svgDoc) {
    if (!svgDoc) return;
    if (svgDoc.getElementById('japan-map-styles')) return;
    const styleEl = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.setAttribute('id', 'japan-map-styles');
    styleEl.textContent = buildSvgStyles();
    const root = svgDoc.documentElement;
    root.insertBefore(styleEl, root.firstChild);
}

/**
 * Inject styles as soon as the SVG document is reachable, so the map
 * never renders the browser-default black fill while JSON is loading.
 */
function injectStylesASAP() {
    const svgObject = document.getElementById('japanMapObject');
    if (!svgObject) return;
    const tryInject = () => {
        const svgDoc = svgObject.contentDocument;
        if (svgDoc && svgDoc.getElementById('japanMap')) {
            injectSvgStyles(svgDoc);
        }
    };
    svgObject.addEventListener('load', tryInject);
    tryInject();
}

/**
 * Initialize Japan Map
 * Loads prefectures.json and then fetches job counts from each active prefecture's JSON
 */
async function initJapanMap() {
    try {
        const prefResponse = await fetch('data/prefectures.json');
        if (!prefResponse.ok) {
            throw new Error('Failed to load prefectures: HTTP ' + prefResponse.status);
        }
        const prefData = await prefResponse.json();
        prefectureData = prefData.prefectures;

        const activePrefectures = prefectureData.filter(p => p.active);

        const jobCountPromises = activePrefectures.map(async (pref) => {
            try {
                const response = await fetch(`data/jobs/${pref.id}.json`);
                if (!response.ok) {
                    return { prefName: pref.name, count: 0 };
                }
                const data = await response.json();
                const jobCount = (data.jobs || []).length;
                return { prefName: pref.name, count: jobCount };
            } catch (err) {
                console.warn(`Error loading jobs for ${pref.name}:`, err);
                return { prefName: pref.name, count: 0 };
            }
        });

        const jobCounts = await Promise.all(jobCountPromises);

        jobCountByPrefecture = {};
        jobCounts.forEach(({ prefName, count }) => {
            jobCountByPrefecture[prefName] = count;
        });

        prefecturesByRegion = {};
        prefectureData.forEach(pref => {
            const regionId = regionIdMap[pref.region];
            if (!prefecturesByRegion[regionId]) {
                prefecturesByRegion[regionId] = {
                    name: pref.region,
                    prefectures: []
                };
            }
            prefecturesByRegion[regionId].prefectures.push(pref);
        });

        activeRegions = new Set();
        Object.entries(prefecturesByRegion).forEach(([regionId, regionData]) => {
            if (regionData.prefectures.some(p => p.active)) {
                activeRegions.add(regionId);
            }
        });

        populatePrefectureGrid();

        const svgObject = document.getElementById('japanMapObject');
        if (svgObject) {
            const tryInit = () => {
                if (svgObject.contentDocument && svgObject.contentDocument.getElementById('japanMap')) {
                    setupMapInteraction();
                }
            };
            svgObject.addEventListener('load', setupMapInteraction);
            tryInit();
        } else {
            setupMapInteraction();
        }

    } catch (error) {
        console.error('Error initializing Japan map:', error);
    }
}

/**
 * Setup SVG Map Interaction
 */
function setupMapInteraction() {
    const tooltip = document.getElementById('mapTooltip');
    if (!tooltip) return;

    const svgObject = document.getElementById('japanMapObject');
    const svgDoc = svgObject && svgObject.contentDocument;
    const svg = svgDoc
        ? svgDoc.getElementById('japanMap')
        : document.getElementById('japanMap');

    if (!svg) {
        setTimeout(setupMapInteraction, 100);
        return;
    }

    // Guard against re-run when <object> fires load() multiple times
    if (svg.dataset.mapBound === 'true') return;
    svg.dataset.mapBound = 'true';

    // Inject CSS once so all fill/stroke logic stays off the JS hot path
    injectSvgStyles(svgDoc || document);

    const prefectureGroups = svg.querySelectorAll('g[data-prefecture]');

    prefectureGroups.forEach(group => {
        const prefId = group.getAttribute('data-prefecture');
        const prefInfo = prefectureData.find(p => p.id === prefId);
        if (!prefInfo) return;

        const regionId = regionIdMap[prefInfo.region];
        const isRegionActive = activeRegions.has(regionId);

        group.setAttribute('data-region', regionId);
        group.setAttribute('data-region-active', isRegionActive ? 'true' : 'false');

        group.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Clear previous selection (at most one region is selected)
            const prevSelected = svg.querySelectorAll('g[data-prefecture][data-selected="true"]');
            prevSelected.forEach(g => g.removeAttribute('data-selected'));

            // Select all prefectures in the clicked region
            const regionGroups = svg.querySelectorAll(`g[data-prefecture][data-region="${regionId}"]`);
            regionGroups.forEach(g => g.setAttribute('data-selected', 'true'));

            // Mobile: bottom sheet
            if (typeof handleMobileRegionSelect === 'function' && handleMobileRegionSelect(prefInfo.region)) {
                return;
            }

            // Desktop: tooltip
            currentTooltipRegion = regionId;
            showRegionTooltip(prefInfo.region, tooltip);
        });
    });

    showInitialTooltip(tooltip);
}

/**
 * Show initial tooltip message (desktop only)
 */
function showInitialTooltip(tooltip) {
    if (typeof isMobile === 'function' && isMobile()) {
        return;
    }

    tooltip.innerHTML = `
        <div class="tooltip-region">地域を選択</div>
        <div class="tooltip-message">地図上の都道府県をクリック（タップ）すると、その地域の情報が表示されます</div>
    `;
    tooltip.classList.add('visible');
}

/**
 * Show Region Tooltip with Prefecture Links
 */
function showRegionTooltip(regionName, tooltip) {
    const regionId = regionIdMap[regionName];
    const regionData = prefecturesByRegion[regionId];

    if (!regionData) return;

    let html = `<div class="tooltip-region">${regionName}</div>`;
    html += '<div class="tooltip-prefectures">';

    regionData.prefectures.forEach(pref => {
        if (pref.active) {
            html += `<a href="${pref.id}/" class="tooltip-pref-link">${pref.name}</a>`;
        } else {
            html += `<span class="tooltip-pref-link inactive">${pref.name}</span>`;
        }
    });

    html += '</div>';

    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
}

/**
 * Populate Prefecture Grid (Desktop & Mobile)
 */
function populatePrefectureGrid() {
    const grid = document.getElementById('prefectureGrid');
    if (!grid) return;

    const activePrefectures = prefectureData.filter(p => p.active);

    if (activePrefectures.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #7a7a7a;">現在対応エリアを準備中です</p>';
        return;
    }

    grid.innerHTML = activePrefectures.map(pref => {
        const jobCount = jobCountByPrefecture[pref.name] || 0;
        return `
            <a href="${pref.id}/" class="prefecture-card active">
                <span class="prefecture-name">${pref.name}</span>
                <span class="job-count">${jobCount}件</span>
            </a>
        `;
    }).join('');
}

/* ==========================================================================
   Mobile Bottom Sheet Functions (スマホ用ボトムシート)
   ※元に戻す場合はこのセクション全体を削除
   ========================================================================== */

function isMobile() {
    return window.innerWidth <= 768;
}

let scrollPositionBeforeSheet = 0;

function createBottomSheet() {
    if (!isMobile()) return;
    if (document.getElementById('bottomSheetOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'bottomSheetOverlay';
    overlay.className = 'bottom-sheet-overlay';
    overlay.addEventListener('click', closeBottomSheet);
    overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    const sheet = document.createElement('div');
    sheet.id = 'bottomSheet';
    sheet.className = 'bottom-sheet';
    sheet.innerHTML = `
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-header">
            <div class="bottom-sheet-region" id="bottomSheetRegion">地域を選択</div>
            <button class="bottom-sheet-close" id="bottomSheetClose" aria-label="閉じる">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <div class="bottom-sheet-content">
            <div class="bottom-sheet-prefectures" id="bottomSheetPrefectures"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    const closeBtn = document.getElementById('bottomSheetClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBottomSheet);
    }

    sheet.addEventListener('touchmove', (e) => {
        const content = sheet.querySelector('.bottom-sheet-content');
        if (content && content.contains(e.target)) {
            const isScrollable = content.scrollHeight > content.clientHeight;
            if (isScrollable) return;
        }
        e.preventDefault();
    }, { passive: false });

    setupBottomSheetGestures(sheet);
}

function setupBottomSheetGestures(sheet) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handle = sheet.querySelector('.bottom-sheet-handle');

    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    });

    handle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0) {
            sheet.style.transform = `translateY(${diff}px)`;
        }
    });

    handle.addEventListener('touchend', () => {
        isDragging = false;
        sheet.style.transition = '';
        const diff = currentY - startY;
        if (diff > 100) {
            closeBottomSheet();
        } else {
            sheet.style.transform = '';
        }
        startY = 0;
        currentY = 0;
    });
}

function showBottomSheet(regionName) {
    const overlay = document.getElementById('bottomSheetOverlay');
    const sheet = document.getElementById('bottomSheet');
    const regionTitle = document.getElementById('bottomSheetRegion');
    const prefContainer = document.getElementById('bottomSheetPrefectures');

    if (!overlay || !sheet) return;

    const regionId = regionIdMap[regionName];
    const regionData = prefecturesByRegion[regionId];

    if (!regionData) return;

    regionTitle.textContent = regionName;

    let html = '';
    regionData.prefectures.forEach(pref => {
        const jobCount = jobCountByPrefecture[pref.name] || 0;
        if (pref.active) {
            html += `
                <a href="${pref.id}/" class="bottom-sheet-pref-link">
                    <span class="pref-name">${pref.name}</span>
                    <span class="job-count">${jobCount}件</span>
                </a>
            `;
        } else {
            html += `
                <span class="bottom-sheet-pref-link inactive">
                    <span class="pref-name">${pref.name}</span>
                    <span class="job-count">準備中</span>
                </span>
            `;
        }
    });

    prefContainer.innerHTML = html;

    overlay.style.display = 'block';
    sheet.style.display = 'block';

    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        sheet.classList.add('visible');
    });

    scrollPositionBeforeSheet = window.pageYOffset;
    document.body.classList.add('bottom-sheet-open');
    document.body.style.top = `-${scrollPositionBeforeSheet}px`;
}

function closeBottomSheet() {
    const overlay = document.getElementById('bottomSheetOverlay');
    const sheet = document.getElementById('bottomSheet');

    if (!overlay || !sheet) return;

    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    sheet.style.transform = '';

    document.body.classList.remove('bottom-sheet-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollPositionBeforeSheet);

    setTimeout(() => {
        overlay.style.display = 'none';
        sheet.style.display = 'none';
    }, 300);
}

function handleMobileRegionSelect(regionName) {
    if (isMobile()) {
        showBottomSheet(regionName);
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS into the SVG the moment it's parseable — do not wait for JSON fetches.
    injectStylesASAP();
    initJapanMap();
    createBottomSheet();
});

window.addEventListener('resize', () => {
    if (isMobile()) {
        createBottomSheet();
    }
});
