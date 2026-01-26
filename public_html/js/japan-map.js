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

            // Update tooltip
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
 * Show initial tooltip message
 */
function showInitialTooltip(tooltip) {
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initJapanMap);
