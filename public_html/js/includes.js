/**
 * Header/Footer Include System (v2)
 * includes/header.html と footer.html を読み込んで差し込み、
 * ヘッダーの挙動（ハンバーガー・透明→白の切替・下層ページ帯の英字ラベル）を初期化する。
 */

// Guard against double execution
if (window._includesJsLoaded) {
    console.warn('includes.js already loaded, skipping');
} else {
    window._includesJsLoaded = true;

(function() {
    'use strict';

    /**
     * Load and insert an include file
     */
    async function loadInclude(includeFile, placeholderId) {
        const placeholder = document.getElementById(placeholderId);
        if (!placeholder) return;
        if (!placeholder.parentNode) return;

        const includesPath = '/includes/';
        try {
            const response = await fetch(includesPath + includeFile);
            if (!response.ok) throw new Error(`Failed to load ${includeFile}`);
            const html = await response.text();
            if (placeholder.parentNode) {
                placeholder.outerHTML = html;
            }
            document.dispatchEvent(new CustomEvent('includeLoaded', { detail: { file: includeFile } }));
        } catch (error) {
            console.error(`Error loading include ${includeFile}:`, error);
        }
    }

    /**
     * ハンバーガー → 全画面白メニュー（クラス切替のみ。インラインスタイルは使わない）
     */
    function initMobileNav() {
        const header = document.querySelector('.header');
        const btn = document.querySelector('.hamburger');
        const nav = document.querySelector('.nav-mobile');
        if (!header || !btn || !nav) return;

        function setOpen(open) {
            btn.classList.toggle('active', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            btn.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
            nav.classList.toggle('active', open);
            header.classList.toggle('menu-open', open);
            document.body.classList.toggle('menu-open', open);
        }

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            setOpen(!nav.classList.contains('active'));
        });
        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
        window.addEventListener('resize', () => { if (window.innerWidth > 1024) setOpen(false); }, { passive: true });
    }

    /**
     * 透明ヘッダー → ヒーローを抜けたら白（.solid）。それ以外のページは影だけ付ける。
     */
    function initHeaderScroll() {
        const header = document.querySelector('.header');
        if (!header) return;
        const body = document.body;
        const transparent = body.classList.contains('page-home') || body.classList.contains('page-sub');
        const hero = document.querySelector('.tp-hero, .bz-hero');

        function update() {
            const y = window.scrollY || document.documentElement.scrollTop;
            header.classList.toggle('scrolled', y > 10);
            if (transparent) {
                const limit = hero ? Math.max(hero.offsetHeight - 80, 80) : 80;
                header.classList.toggle('solid', y > limit);
            }
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
    }

    /**
     * 下層ページのネイビー帯: 英字ウォーターマーク（data-en）とパンくずのみの帯を判定
     */
    function initPageHeaderMeta() {
        const path = window.location.pathname;
        const map = [
            [/^\/interviews\//, 'INTERVIEW'],
            [/^\/companies\//, 'COMPANY'],
            [/^\/clients\//, 'CLIENTS'],
            [/^\/knowhow\//, 'KNOWHOW'],
            [/^\/contact\//, 'CONTACT'],
            [/^\/terms\.html$/, 'TERMS'],
            [/^\/privacy\.html$/, 'PRIVACY'],
            [/^\/[a-z]+\/jobs\//, 'JOB'],
            [/^\/[a-z]+\/?$/, ''],
        ];
        document.querySelectorAll('.page-header').forEach(ph => {
            if (!ph.hasAttribute('data-en')) {
                const hit = map.find(([re]) => re.test(path));
                if (hit && hit[1]) ph.setAttribute('data-en', hit[1]);
            }
            const hasTitle = ph.querySelector('h1, .page-title');
            if (!hasTitle) ph.classList.add('is-crumb-only');
        });
    }

    /**
     * Set active nav link based on current page
     */
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-list a, .nav-mobile-link').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            if (href === '/') {
                if (currentPath === '/' || currentPath === '/index.html') link.classList.add('active');
            } else if (href.startsWith('/') && currentPath.startsWith(href)) {
                link.classList.add('active');
            }
        });
    }

    async function init() {
        await Promise.all([
            loadInclude('header.html', 'header-placeholder'),
            loadInclude('footer.html', 'footer-placeholder')
        ]);

        initMobileNav();
        initHeaderScroll();
        initPageHeaderMeta();
        setActiveNavLink();

        // main.js 側の旧ヘッダー処理をスキップさせるフラグ
        window.__v2HeaderReady = true;
        document.dispatchEvent(new CustomEvent('includesReady'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

} // End of double-execution guard
