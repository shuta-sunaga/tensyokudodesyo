/**
 * 転職どうでしょう - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initHeaderScroll();
    initFormValidation();
    initStatsCounter();
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
    const headerHeight = document.querySelector('.header').offsetHeight;

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

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
