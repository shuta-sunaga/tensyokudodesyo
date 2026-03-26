(function() {
  'use strict';

  // 1. ノウハウ記事詳細ページのみで表示
  if (!window.location.pathname.includes('/knowhow/detail/')) return;

  // 2. sessionStorageで閉じた状態を記憶
  if (sessionStorage.getItem('ad-dismissed')) return;

  // 3. CSSをstyleタグとして注入
  var style = document.createElement('style');
  style.textContent = '#blog-ad-banner{position:fixed;bottom:20px;right:20px;z-index:1001;opacity:0;transform:translateY(20px);transition:opacity .4s ease,transform .4s ease;pointer-events:none;width:340px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);overflow:hidden;font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif}#blog-ad-banner.visible{opacity:1;transform:translateY(0);pointer-events:auto}#blog-ad-banner.hiding{opacity:0;transform:translateY(20px)}#blog-ad-header{display:flex;align-items:center;justify-content:space-between;padding:0 4px 0 16px;height:32px;background:#f5f0e8;border-bottom:1px solid #e8dfd0}#blog-ad-header span{font-size:10px;color:#8a7a60;font-weight:500}#blog-ad-close{width:32px;height:32px;border-radius:0 14px 0 0;background:none;color:#bba880;border:none;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:color .2s,background .2s}#blog-ad-close:hover{color:#333;background:#e8dfd0}#blog-ad-body{display:block;text-decoration:none;background:linear-gradient(160deg,#fdf8f0 0%,#faf3e6 50%,#f7edd8 100%);padding:32px 28px 28px;text-align:center}#blog-ad-body:hover #blog-ad-arrow{color:#F5820D}#blog-ad-copy{font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.6;margin-bottom:20px}#blog-ad-logo{width:180px;height:auto;margin:0 auto 20px;display:block}#blog-ad-sub{font-size:13px;color:#8a7a60;line-height:1.6;margin-bottom:20px}#blog-ad-arrow{display:inline-block;font-size:13px;color:#b08940;font-weight:600;transition:color .2s;letter-spacing:.02em;padding:8px 24px;border:1.5px solid #d4b87a;border-radius:6px}@media(max-width:768px){#blog-ad-banner{width:auto;right:12px;left:12px;bottom:12px;border-radius:14px}#blog-ad-body{padding:24px 20px 22px}#blog-ad-copy{font-size:16px;margin-bottom:16px}#blog-ad-logo{width:150px;margin-bottom:16px}#blog-ad-sub{font-size:12px;margin-bottom:16px}#blog-ad-arrow{font-size:12px;padding:7px 20px}#blog-ad-close{width:34px;height:34px;font-size:20px}}';
  document.head.appendChild(style);

  // 4. バナーHTMLを生成してbodyに追加
  var ad = document.createElement('div');
  ad.id = 'blog-ad-banner';
  ad.innerHTML = ''
    + '<div id="blog-ad-header">'
    +   '<span>転職どうでしょうの運営会社</span>'
    +   '<button id="blog-ad-close" aria-label="閉じる">&times;</button>'
    + '</div>'
    + '<a href="https://www.sei-san-sei.com/?utm_source=tensyokudodesyo-blog&utm_medium=banner&utm_campaign=seisansei-ad" target="_blank" rel="noopener" id="blog-ad-body">'
    +   '<div id="blog-ad-copy">地方企業のDXを、<br>もっと身近に、もっと安価に。</div>'
    +   '<img src="/assets/seisansei-logo.webp" alt="株式会社Sei San Sei" id="blog-ad-logo" width="360" height="360" loading="lazy">'
    +   '<div id="blog-ad-sub">AI採用代行・業務自動化・Web制作</div>'
    +   '<span id="blog-ad-arrow">詳しく見る &rarr;</span>'
    + '</a>';
  document.body.appendChild(ad);

  // 5. 3秒後にフェードイン
  setTimeout(function() { ad.classList.add('visible'); }, 3000);

  // 6. 閉じるボタン
  document.getElementById('blog-ad-close').addEventListener('click', function(e) {
    e.preventDefault();
    ad.classList.remove('visible');
    ad.classList.add('hiding');
    setTimeout(function() { ad.remove(); }, 400);
    sessionStorage.setItem('ad-dismissed', '1');
  });
})();
