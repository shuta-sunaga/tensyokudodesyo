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

// Region colors
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

// Current tooltip state
let currentTooltipRegion = null;
let isTooltipVisible = false;

/**
 * Initialize Japan Map
 * Loads prefectures.json and then fetches job counts from each active prefecture's JSON
 */
async function initJapanMap() {
    try {
        // First, load prefectures.json
        const prefResponse = await fetch('data/prefectures.json');
        if (!prefResponse.ok) {
            throw new Error('Failed to load prefectures: HTTP ' + prefResponse.status);
        }
        const prefData = await prefResponse.json();
        prefectureData = prefData.prefectures;

        // Get active prefectures
        const activePrefectures = prefectureData.filter(p => p.active);

        // Load job counts from each active prefecture's JSON in parallel
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

        // Build job count by prefecture
        jobCountByPrefecture = {};
        jobCounts.forEach(({ prefName, count }) => {
            jobCountByPrefecture[prefName] = count;
        });

        // Group prefectures by region
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

        // Populate prefecture grid first (doesn't depend on SVG)
        populatePrefectureGrid();

        // Wait for SVG object to load before setting up interaction
        const svgObject = document.getElementById('japanMapObject');
        if (svgObject) {
            svgObject.addEventListener('load', () => {
                setupMapInteraction();
            });
            // Also try immediately in case already loaded
            if (svgObject.contentDocument) {
                setupMapInteraction();
            }
        } else {
            // Fallback for inline SVG
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

    // Try to get SVG from object element (external SVG)
    const svgObject = document.getElementById('japanMapObject');
    let svg = document.getElementById('japanMap');

    if (svgObject && svgObject.contentDocument) {
        svg = svgObject.contentDocument.getElementById('japanMap');
    }

    if (!svg) {
        // Retry after a short delay if SVG not loaded yet
        setTimeout(setupMapInteraction, 100);
        return;
    }

    // Store all groups for highlighting
    const allGroups = new Map();

    // Get all prefecture groups (Geolonia SVG uses <g> elements with data-prefecture)
    const prefectureGroups = svg.querySelectorAll('g[data-prefecture]');

    prefectureGroups.forEach(group => {
        const prefId = group.getAttribute('data-prefecture');
        const prefInfo = prefectureData.find(p => p.id === prefId);

        if (!prefInfo) return;

        // Get region info
        const regionId = regionIdMap[prefInfo.region];
        const colors = regionColors[regionId];

        // Store region on group
        group.setAttribute('data-region', regionId);

        // Store group reference
        if (!allGroups.has(regionId)) {
            allGroups.set(regionId, []);
        }
        allGroups.get(regionId).push({ group, shapes: group.querySelectorAll('path, polygon'), colors });

        // Apply initial colors to all paths and polygons
        const shapes = group.querySelectorAll('path, polygon');
        shapes.forEach(shape => {
            shape.style.fill = colors.fill;
            shape.style.stroke = colors.stroke;
            shape.style.strokeWidth = '0.5';
            shape.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
            shape.style.cursor = 'pointer';
        });

        // Handle region selection (click/touch only)
        function selectRegion(e) {
            e.preventDefault();
            e.stopPropagation();

            // Reset all regions to normal color first
            allGroups.forEach((items, rId) => {
                items.forEach(({ shapes, colors }) => {
                    shapes.forEach(shape => {
                        shape.style.fill = colors.fill;
                        shape.style.strokeWidth = '0.5';
                    });
                });
            });

            // Highlight all prefectures in this region
            const regionItems = allGroups.get(regionId);
            if (regionItems) {
                regionItems.forEach(({ shapes, colors }) => {
                    shapes.forEach(shape => {
                        shape.style.fill = colors.hoverFill;
                        shape.style.strokeWidth = '1';
                    });
                });
            }

            // Mobile: Show bottom sheet instead of tooltip
            if (typeof handleMobileRegionSelect === 'function' && handleMobileRegionSelect(prefInfo.region)) {
                return; // Bottom sheet handled it
            }

            // Desktop: Update tooltip
            currentTooltipRegion = regionId;
            showRegionTooltip(prefInfo.region, tooltip);
        }

        // Click event for desktop
        group.addEventListener('click', selectRegion);

        // Touch events for mobile
        group.addEventListener('touchend', selectRegion);
    });

    // Show initial tooltip message
    showInitialTooltip(tooltip);
}

/**
 * Show initial tooltip message (desktop only)
 */
function showInitialTooltip(tooltip) {
    // Skip on mobile - bottom sheet will be used
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

    // Build tooltip HTML
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

    // Only show active prefectures in grid
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

/**
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth <= 768;
}

// Store scroll position for restoration
let scrollPositionBeforeSheet = 0;

/**
 * Create Bottom Sheet HTML elements
 */
function createBottomSheet() {
    // Only create on mobile
    if (!isMobile()) return;

    // Check if already exists
    if (document.getElementById('bottomSheetOverlay')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'bottomSheetOverlay';
    overlay.className = 'bottom-sheet-overlay';
    overlay.addEventListener('click', closeBottomSheet);

    // Prevent touch events from propagating through overlay
    overlay.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Create bottom sheet
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

    // Add to body
    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    // Setup close button
    const closeBtn = document.getElementById('bottomSheetClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBottomSheet);
    }

    // Prevent touch events from scrolling background
    sheet.addEventListener('touchmove', (e) => {
        // Allow scrolling within the content area
        const content = sheet.querySelector('.bottom-sheet-content');
        if (content && content.contains(e.target)) {
            // Allow if content is scrollable and not at boundaries
            const isScrollable = content.scrollHeight > content.clientHeight;
            if (isScrollable) {
                return; // Allow scroll within content
            }
        }
        e.preventDefault();
    }, { passive: false });

    // Handle swipe down to close
    setupBottomSheetGestures(sheet);
}

/**
 * Setup swipe gestures for bottom sheet
 */
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

/**
 * Show Bottom Sheet with region info
 */
function showBottomSheet(regionName) {
    const overlay = document.getElementById('bottomSheetOverlay');
    const sheet = document.getElementById('bottomSheet');
    const regionTitle = document.getElementById('bottomSheetRegion');
    const prefContainer = document.getElementById('bottomSheetPrefectures');

    if (!overlay || !sheet) return;

    const regionId = regionIdMap[regionName];
    const regionData = prefecturesByRegion[regionId];

    if (!regionData) return;

    // Update region name
    regionTitle.textContent = regionName;

    // Build prefecture links
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

    // Show overlay and sheet
    overlay.style.display = 'block';
    sheet.style.display = 'block';

    // Trigger animation after display is set
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        sheet.classList.add('visible');
    });

    // Prevent body scroll - save scroll position first
    scrollPositionBeforeSheet = window.pageYOffset;
    document.body.classList.add('bottom-sheet-open');
    document.body.style.top = `-${scrollPositionBeforeSheet}px`;
}

/**
 * Close Bottom Sheet
 */
function closeBottomSheet() {
    const overlay = document.getElementById('bottomSheetOverlay');
    const sheet = document.getElementById('bottomSheet');

    if (!overlay || !sheet) return;

    overlay.classList.remove('visible');
    sheet.classList.remove('visible');
    sheet.style.transform = '';

    // Re-enable body scroll and restore position
    document.body.classList.remove('bottom-sheet-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollPositionBeforeSheet);

    // Hide after animation
    setTimeout(() => {
        overlay.style.display = 'none';
        sheet.style.display = 'none';
    }, 300);
}

/**
 * Modified region selection for mobile
 */
function handleMobileRegionSelect(regionName) {
    if (isMobile()) {
        showBottomSheet(regionName);
        return true; // Handled by bottom sheet
    }
    return false; // Use default tooltip
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initJapanMap();
    createBottomSheet();
});

// Recreate bottom sheet on resize (if switching from desktop to mobile)
window.addEventListener('resize', () => {
    if (isMobile()) {
        createBottomSheet();
    }
});
