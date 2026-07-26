/* ==========================================================================
   DrDer Electronic - Main Application Logic v4.0
   SPA Router | History API | Event Delegation | Memory Management
   Fully compatible with the new simulator system
   ========================================================================== */

(function () {
  'use strict';

  /* ========== Constants ========== */
  const PAGE_MAP = {
    home: { containerId: 'page-home', tabSelector: '[data-nav="home"]' },
    category: { containerId: 'page-category', tabSelector: null },
    lesson: { containerId: 'page-lesson', tabSelector: null },
    simulator: { containerId: 'page-simulator', tabSelector: '[data-nav="simulator"]' },
    calculators: { containerId: 'page-calculators', tabSelector: '[data-nav="calculators"]' },
    quiz: { containerId: 'page-quiz', tabSelector: '[data-nav="quiz"]' },
    projects: { containerId: 'page-projects', tabSelector: '[data-nav="projects"]' },
    library: { containerId: 'page-library', tabSelector: '[data-nav="library"]' },
    dictionary: { containerId: 'page-dictionary', tabSelector: '[data-nav="dictionary"]' },
  };

  const TOAST_DURATION = 3000;
  const MAX_HISTORY_STACK = 50;

  /* ========== State ========== */
  let currentPage = 'home';
  let currentCategoryId = null;
  let deferredPrompt = null;
  let installButtonVisible = false;
  let isNavigating = false;
  let historyStack = [{ page: 'home', data: null }];
  let simulatorInitialized = false;
  let keyboardListener = null;

  /* ========== DOM Cache ========== */
  const dom = {
    btnInstall: null,
    navTabs: null,
    mainContent: null,
    calcModalContainer: null,
    toastContainer: null,
  };

  /* ========== Initialize ========== */
  function init() {
    cacheDomElements();
    registerServiceWorker();
    setupGlobalEventDelegation();
    setupInstallListeners();
    handleInitialRoute();
    renderHomePage();
    updateActiveTab('home');

    window.addEventListener('popstate', handlePopState);
    keyboardListener = handleGlobalKeyboard;
    document.addEventListener('keydown', keyboardListener);
  }

  function cacheDomElements() {
    dom.btnInstall = document.getElementById('btnInstall');
    dom.navTabs = document.getElementById('navTabs');
    dom.mainContent = document.getElementById('mainContent');
    dom.calcModalContainer = document.getElementById('calcModalContainer');
    dom.toastContainer = document.getElementById('toastContainer');
  }

  /* ========== Service Worker ========== */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 تحديث جديد متاح! سيتم التحديث تلقائياً.', 'info');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err.message);
      });
  }

  /* ========== Global Event Delegation ========== */
  function setupGlobalEventDelegation() {
    document.body.addEventListener('click', (e) => {
      const navButton = e.target.closest('[data-nav]');
      if (navButton && !navButton.closest('#calcModalContainer')) {
        e.preventDefault();
        const page = navButton.dataset.nav;
        if (page) navigateTo(page, null);
        return;
      }

      const categoryCard = e.target.closest('.category-card');
      if (categoryCard && categoryCard.dataset.catId) {
        navigateTo('category', categoryCard.dataset.catId);
        return;
      }

      const calcCard = e.target.closest('.calc-card');
      if (calcCard && calcCard.dataset.calcId) {
        openCalculator(calcCard.dataset.calcId);
        return;
      }

      const libraryCard = e.target.closest('.library-card');
      if (libraryCard && libraryCard.dataset.catId) {
        navigateTo('category', libraryCard.dataset.catId);
        return;
      }

      const breadcrumbBtn = e.target.closest('.breadcrumb span[data-breadcrumb]');
      if (breadcrumbBtn) {
        const target = breadcrumbBtn.dataset.breadcrumb;
        if (target === 'home') navigateTo('home', null);
        else if (target === 'category') navigateTo('category', currentCategoryId);
        return;
      }

      const reviewLink = e.target.closest('.review-suggestion li[data-category]');
      if (reviewLink) {
        navigateTo('category', reviewLink.dataset.category);
        return;
      }
    });
  }

  /* ========== Install Handling ========== */
  function setupInstallListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      hideInstallButton();
      deferredPrompt = null;
      showToast('✅ تم تثبيت التطبيق بنجاح', 'success');
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      hideInstallButton();
    }

    if (dom.btnInstall) {
      dom.btnInstall.addEventListener('click', handleInstallClick);
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === 'accepted') {
      hideInstallButton();
      showToast('✅ جاري تثبيت التطبيق...', 'success');
    }

    deferredPrompt = null;
  }

  function showInstallButton() {
    if (!dom.btnInstall || installButtonVisible) return;
    dom.btnInstall.removeAttribute('hidden');
    dom.btnInstall.style.display = 'flex';
    installButtonVisible = true;
  }

  function hideInstallButton() {
    if (!dom.btnInstall) return;
    dom.btnInstall.setAttribute('hidden', '');
    dom.btnInstall.style.display = 'none';
    installButtonVisible = false;
  }

  /* ========== Initial Route ========== */
  function handleInitialRoute() {
    const hash = window.location.hash;
    if (hash) {
      const parts = hash.replace('#', '').split('/');
      const page = parts[0];
      const data = parts.length > 1 ? parts[1] : null;

      if (PAGE_MAP[page]) {
        navigateTo(page, data, true);
        return;
      }
    }

    history.replaceState({ page: 'home', data: null }, '', '#home');
  }

  /* ========== History API ========== */
  function pushHistory(page, data) {
    const state = { page, data, timestamp: Date.now() };
    historyStack.push(state);

    if (historyStack.length > MAX_HISTORY_STACK) {
      historyStack.shift();
    }

    const url = data ? `#${page}/${data}` : `#${page}`;
    history.pushState(state, '', url);
  }

  function handlePopState(event) {
    if (isNavigating) return;

    if (event.state && event.state.page) {
      isNavigating = true;
      navigateTo(event.state.page, event.state.data, true);
      isNavigating = false;
    } else {
      isNavigating = true;
      navigateTo('home', null, true);
      isNavigating = false;
    }
  }

  /* ========== Main Navigation ========== */
  function navigateTo(page, data, isPopState = false) {
    if (isNavigating && !isPopState) return;

    const pageConfig = PAGE_MAP[page];
    if (!pageConfig) {
      navigateTo('home', null);
      return;
    }

    isNavigating = true;
    currentPage = page;

    if (page === 'category') {
      currentCategoryId = data;
    }

    cleanupCurrentPage();
    switchPage(page);
    updateActiveTab(page);

    if (!isPopState) {
      pushHistory(page, data);
    }

    renderPage(page, data);

    window.scrollTo({ top: 0, behavior: 'instant' });

    requestAnimationFrame(() => {
      isNavigating = false;
    });
  }

  function switchPage(page) {
    const config = PAGE_MAP[page];
    const targetId = config.containerId;

    const allPages = document.querySelectorAll('.page');
    allPages.forEach((p) => {
      if (p.id === targetId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  function updateActiveTab(page) {
    const config = PAGE_MAP[page];
    const tabSelector = config.tabSelector;

    const allTabs = document.querySelectorAll('.nav-tab');
    allTabs.forEach((tab) => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    if (tabSelector) {
      const activeTab = document.querySelector(`.nav-tab${tabSelector}`);
      if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
      }
    }
  }

  function cleanupCurrentPage() {
    closeCalcModal();
  }

  /* ========== Page Renderers ========== */
  function renderPage(page, data) {
    switch (page) {
      case 'home': renderHomePage(); break;
      case 'category': renderCategoryPage(data); break;
      case 'lesson': renderLessonDetail(data); break;
      case 'simulator': renderSimulatorPage(); break;
      case 'calculators': renderCalculatorsPage(); break;
      case 'quiz': renderQuizPage(); break;
      case 'projects': renderProjectsPage(); break;
      case 'library': renderLibraryPage(); break;
      case 'dictionary': renderDictionaryPage(); break;
      default: renderHomePage();
    }
  }

  /* ========== Home Page ========== */
  function renderHomePage() {
    const container = document.getElementById('page-home');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const hero = createElement('div', { class: 'hero-section' });
    hero.innerHTML = `
      <h1 class="hero-title">⚡ DrDer Electronic</h1>
      <p class="hero-subtitle">مختبر هندسة كهربائية وإلكترونية متكامل للطلاب والمهندسين والفنيين</p>
    `;
    frag.appendChild(hero);

    const grid = createElement('div', { class: 'categories-grid' });

    APP_DATA.categories.forEach((cat) => {
      const card = createElement('div', {
        class: 'category-card',
        'data-cat-id': cat.id,
        role: 'button',
        tabindex: '0',
        'aria-label': `${cat.title} - ${cat.lessons.length} دروس`
      });
      card.innerHTML = `
        <span class="cat-icon" aria-hidden="true">${cat.icon}</span>
        <div class="cat-title">${cat.title}</div>
        <div class="cat-count">${cat.lessons.length} دروس</div>
      `;
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Category Page ========== */
  function renderCategoryPage(categoryId) {
    const cat = APP_DATA.categories.find((c) => c.id === categoryId);
    if (!cat) {
      navigateTo('home', null);
      return;
    }

    currentCategoryId = categoryId;
    const container = document.getElementById('page-category');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const breadcrumb = createElement('div', { class: 'breadcrumb' });
    breadcrumb.innerHTML = `
      <span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span>
      <span class="separator" aria-hidden="true">›</span>
      <span>${cat.icon} ${cat.title}</span>
    `;
    frag.appendChild(breadcrumb);

    const list = createElement('div', { class: 'lesson-list' });

    cat.lessons.forEach((lesson, index) => {
      const param = `${cat.id}|${lesson.id}`;
      const item = createElement('div', {
        class: 'lesson-item',
        role: 'button',
        tabindex: '0',
        'aria-label': `الدرس ${index + 1}: ${lesson.title}`
      });
      item.innerHTML = `
        <div class="lesson-num" aria-hidden="true">${index + 1}</div>
        <div class="lesson-info">
          <h4>${lesson.title}</h4>
          <p>${lesson.keyPoints.slice(0, 3).join(' • ')}</p>
        </div>
        <span class="lesson-arrow" aria-hidden="true">◀</span>
      `;

      item.addEventListener('click', () => navigateTo('lesson', param));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('lesson', param);
        }
      });

      list.appendChild(item);
    });

    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Lesson Detail ========== */
  function renderLessonDetail(param) {
    if (!param) {
      navigateTo('home', null);
      return;
    }

    const [catId, lessonId] = param.split('|');
    const cat = APP_DATA.categories.find((c) => c.id === catId);
    if (!cat) {
      navigateTo('home', null);
      return;
    }

    const lesson = cat.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      navigateTo('category', catId);
      return;
    }

    const container = document.getElementById('page-lesson');
    if (!container) return;

    const keyPointsHtml = lesson.keyPoints.map((kp) => `<span class="key-point">${kp}</span>`).join('');

    const frag = document.createDocumentFragment();

    const breadcrumb = createElement('div', { class: 'breadcrumb' });
    breadcrumb.innerHTML = `
      <span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span>
      <span class="separator" aria-hidden="true">›</span>
      <span data-breadcrumb="category" role="button" tabindex="0">${cat.icon} ${cat.title}</span>
      <span class="separator" aria-hidden="true">›</span>
      <span>${lesson.title}</span>
    `;
    frag.appendChild(breadcrumb);

    const detail = createElement('div', { class: 'lesson-detail' });
    detail.innerHTML = `
      <h3>${lesson.title}</h3>
      <div class="lesson-content">
        <p>${lesson.content}</p>
      </div>
      <div class="key-points">${keyPointsHtml}</div>
      <div class="formula-box">
        <div class="formula" dir="ltr">${lesson.formula}</div>
        <div class="formula-desc">${lesson.formulaDesc}</div>
      </div>
    `;
    frag.appendChild(detail);

    const backBtn = createElement('button', { class: 'btn btn-outline', style: 'margin-top:12px;' });
    backBtn.textContent = '↩ العودة للدروس';
    backBtn.addEventListener('click', () => navigateTo('category', cat.id));
    frag.appendChild(backBtn);

    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Simulator Page ========== */
  function renderSimulatorPage() {
    const container = document.getElementById('page-simulator');
    if (!container) return;

    if (typeof window.getSimulatorHTML === 'function') {
      container.innerHTML = window.getSimulatorHTML();

      setTimeout(() => {
        if (typeof window.initSimulator === 'function') {
          window.initSimulator();
          simulatorInitialized = true;
        }
      }, 200);
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
          <div style="font-size:3rem;margin-bottom:16px;">🔧</div>
          <p style="font-size:1.1rem;">⏳ جاري تحميل المحاكي...</p>
          <p style="font-size:0.85rem;margin-top:8px;">تأكد من وجود جميع ملفات المحاكي في مجلد simulator/</p>
        </div>
      `;
    }
  }

  /* ========== Calculators Page ========== */
  function renderCalculatorsPage() {
    const container = document.getElementById('page-calculators');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const title = createElement('h2', { style: 'margin-bottom:16px;' });
    title.textContent = '🧮 الحاسبات الهندسية';
    frag.appendChild(title);

    const grid = createElement('div', { class: 'calc-grid' });

    APP_DATA.calculators.forEach((calc) => {
      const card = createElement('div', {
        class: 'calc-card',
        'data-calc-id': calc.id,
        role: 'button',
        tabindex: '0',
        'aria-label': calc.name
      });
      card.innerHTML = `
        <span class="calc-icon" aria-hidden="true">${calc.icon}</span>
        <div class="calc-name">${calc.name}</div>
        <div class="calc-desc">${calc.desc || ''}</div>
      `;
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Calculator Modal ========== */
  function openCalculator(calcId) {
    const calc = APP_DATA.calculators.find((c) => c.id === calcId);
    if (!calc) return;

    const fieldsHtml = getCalculatorFields(calcId);
    if (!fieldsHtml) {
      showToast('⚠️ الحاسبة قيد التطوير', 'error');
      return;
    }

    const overlay = createElement('div', {
      class: 'calc-modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': calc.name
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCalcModal();
    });

    const modal = createElement('div', { class: 'calc-modal' });

    const modalTitle = createElement('h3');
    modalTitle.textContent = `${calc.icon} ${calc.name}`;
    modal.appendChild(modalTitle);

    const fieldsContainer = createElement('div');
    fieldsContainer.innerHTML = fieldsHtml;
    modal.appendChild(fieldsContainer);

    const resultDiv = createElement('div', { class: 'calc-result', id: 'calcResult' });
    modal.appendChild(resultDiv);

    const errorDiv = createElement('div', { class: 'calc-error', id: 'calcError' });
    modal.appendChild(errorDiv);

    const calcBtn = createElement('button', {
      class: 'btn btn-primary btn-block',
      id: 'btnCalcCalculate',
      style: 'margin-top:12px;'
    });
    calcBtn.textContent = '🧮 احسب';
    calcBtn.addEventListener('click', () => calculateResult(calcId));
    modal.appendChild(calcBtn);

    const closeBtn = createElement('button', {
      class: 'btn btn-outline btn-block',
      id: 'btnCalcClose',
      style: 'margin-top:8px;'
    });
    closeBtn.textContent = 'إغلاق';
    closeBtn.addEventListener('click', closeCalcModal);
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.appendChild(overlay);
    dom.calcModalContainer.removeAttribute('hidden');

    setTimeout(() => {
      const firstInput = overlay.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 150);
  }

  function getCalculatorFields(calcId) {
    const fields = {
      ohm: `
        <div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcR" placeholder="أدخل المقاومة" inputmode="decimal" min="0" step="any"></div>
        <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة</p>
      `,
      power: `
        <div class="calc-field"><label>القدرة P (واط)</label><input type="number" id="calcP" placeholder="أدخل القدرة" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div>
        <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">P = V × I</p>
      `,
      cable: `
        <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcCI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcCL" placeholder="أدخل الطول" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>الهبوط المسموح ΔV%</label><input type="number" id="calcCV" value="3" min="0.1" max="20" step="any"></div>
      `,
      breaker: `
        <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcBI" placeholder="أدخل تيار الحمل" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>نوع الحمل</label><select id="calcBType"><option value="1.25">حمل عادي</option><option value="1.5">محرك صغير</option><option value="1.75">محرك كبير</option><option value="2">حمل ثقيل</option></select></div>
      `,
      voltdrop: `
        <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcVDI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcVDL" placeholder="أدخل الطول" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>مساحة المقطع A (mm²)</label><input type="number" id="calcVDA" placeholder="أدخل مساحة المقطع" inputmode="decimal" min="0.1" step="any"></div>
      `,
      pf: `
        <div class="calc-field"><label>القدرة الفعالة P (واط)</label><input type="number" id="calcPFP" placeholder="أدخل P" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>القدرة الظاهرية S (VA)</label><input type="number" id="calcPFS" placeholder="أدخل S" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>القدرة غير الفعالة Q (VAR)</label><input type="number" id="calcPFQ" placeholder="أدخل Q" inputmode="decimal" min="0" step="any"></div>
        <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة ومعامل القدرة</p>
      `,
      transformer: `
        <div class="calc-field"><label>الجهد الابتدائي V1 (فولت)</label><input type="number" id="calcV1" placeholder="أدخل V1" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>الجهد الثانوي V2 (فولت)</label><input type="number" id="calcV2" placeholder="أدخل V2" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>التيار الابتدائي I1 (أمبير) - اختياري</label><input type="number" id="calcI1" placeholder="أدخل I1" inputmode="decimal" min="0" step="any"></div>
      `,
      solar: `
        <div class="calc-field"><label>الاستهلاك اليومي (واط.ساعة)</label><input type="number" id="calcWh" placeholder="أدخل الاستهلاك" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>جهد النظام V</label><select id="calcSV"><option value="12">12V</option><option value="24" selected>24V</option><option value="48">48V</option></select></div>
        <div class="calc-field"><label>ساعات الشمس الذروة</label><input type="number" id="calcSH" value="5" min="1" max="12" step="any"></div>
      `,
      motor: `
        <div class="calc-field"><label>القدرة P (كيلوواط)</label><input type="number" id="calcMP" placeholder="أدخل القدرة" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcMV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>معامل القدرة PF</label><input type="number" id="calcMPF" value="0.85" min="0.1" max="1" step="0.01"></div>
      `,
      led: `
        <div class="calc-field"><label>جهد المصدر Vs (فولت)</label><input type="number" id="calcLVs" placeholder="أدخل جهد المصدر" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>جهد LED الأمامي Vf (فولت)</label><input type="number" id="calcLVf" value="2" min="0" step="any"></div>
        <div class="calc-field"><label>تيار LED المطلوب If (مللي أمبير)</label><input type="number" id="calcLIf" value="20" min="1" step="any"></div>
      `,
      rc: `
        <div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcRCR" placeholder="أدخل المقاومة" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>السعة C (ميكروفاراد)</label><input type="number" id="calcRCC" placeholder="أدخل السعة" inputmode="decimal" min="0" step="any"></div>
      `,
      voltage_divider: `
        <div class="calc-field"><label>جهد الدخل Vin (فولت)</label><input type="number" id="calcVDVin" placeholder="أدخل جهد الدخل" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>المقاومة R1 (أوم)</label><input type="number" id="calcVDR1" placeholder="أدخل R1" inputmode="decimal" min="0" step="any"></div>
        <div class="calc-field"><label>المقاومة R2 (أوم)</label><input type="number" id="calcVDR2" placeholder="أدخل R2" inputmode="decimal" min="0" step="any"></div>
      `
    };
    return fields[calcId] || null;
  }

  function closeCalcModal() {
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.setAttribute('hidden', '');
  }

  function calculateResult(calcId) {
    const resultDiv = document.getElementById('calcResult');
    const errorDiv = document.getElementById('calcError');
    if (!resultDiv) return;

    resultDiv.classList.remove('show');
    if (errorDiv) errorDiv.classList.remove('show');

    const getVal = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const val = parseFloat(el.value);
      return isNaN(val) ? null : val;
    };

    let result = '';
    let error = '';

    try {
      switch (calcId) {
        case 'ohm': {
          const V = getVal('calcV'), I = getVal('calcI'), R = getVal('calcR');
          const provided = [V, I, R].filter(v => v !== null).length;
          if (provided < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (V && I && I === 0) { error = '⚠️ لا يمكن حساب المقاومة عندما يكون التيار = 0'; break; }
          if (V && I) result = `المقاومة R = ${(V / I).toFixed(3)} Ω`;
          else if (V && R) result = R === 0 ? '⚠️ المقاومة = 0 (قصر)' : `التيار I = ${(V / R).toFixed(3)} A`;
          else if (I && R) result = `الجهد V = ${(I * R).toFixed(2)} V`;
          break;
        }
        case 'power': {
          const P = getVal('calcP'), V = getVal('calcV'), I = getVal('calcI');
          const provided = [P, V, I].filter(v => v !== null).length;
          if (provided < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (V && I) result = `القدرة P = ${(V * I).toFixed(2)} W`;
          else if (P && V) result = V === 0 ? '⚠️ الجهد = 0' : `التيار I = ${(P / V).toFixed(3)} A`;
          else if (P && I) result = I === 0 ? '⚠️ التيار = 0' : `الجهد V = ${(P / I).toFixed(2)} V`;
          break;
        }
        case 'cable': {
          const I = getVal('calcCI'), L = getVal('calcCL'), dV = getVal('calcCV') || 3;
          if (!I || !L) { error = '⚠️ الرجاء إدخال التيار والطول'; break; }
          const area = (2 * L * I) / (56 * dV);
          result = `مساحة المقطع المطلوبة ≈ ${area.toFixed(2)} mm²`;
          break;
        }
        case 'breaker': {
          const I = getVal('calcBI');
          if (!I) { error = '⚠️ الرجاء إدخال تيار الحمل'; break; }
          const typeEl = document.getElementById('calcBType');
          const factor = typeEl ? parseFloat(typeEl.value) : 1.25;
          const breakerSize = I * factor;
          const sizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
          const recommended = sizes.find(s => s >= breakerSize) || Math.ceil(breakerSize / 5) * 5;
          result = `القاطع الموصى به: ${recommended} A`;
          break;
        }
        case 'voltdrop': {
          const I = getVal('calcVDI'), L = getVal('calcVDL'), A = getVal('calcVDA');
          if (!I || !L || !A) { error = '⚠️ الرجاء إدخال جميع القيم'; break; }
          const drop = (2 * L * I) / (56 * A);
          result = `هبوط الجهد: ${drop.toFixed(2)} V`;
          break;
        }
        case 'pf': {
          const P = getVal('calcPFP'), S = getVal('calcPFS'), Q = getVal('calcPFQ');
          const provided = [P, S, Q].filter(v => v !== null).length;
          if (provided < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (P !== null && S !== null) {
            if (P > S) { error = '⚠️ P لا يمكن أن تكون أكبر من S'; break; }
            const pf = P / S;
            result = `معامل القدرة PF = ${pf.toFixed(4)}`;
          } else if (P !== null && Q !== null) {
            const SCalc = Math.sqrt(P * P + Q * Q);
            result = `S = ${SCalc.toFixed(1)} VA | PF = ${(P / SCalc).toFixed(4)}`;
          } else if (S !== null && Q !== null) {
            if (S < Q) { error = '⚠️ S لا يمكن أن تكون أصغر من Q'; break; }
            const PCalc = Math.sqrt(Math.max(0, S * S - Q * Q));
            result = `P = ${PCalc.toFixed(1)} W | PF = ${(PCalc / S).toFixed(4)}`;
          }
          break;
        }
        case 'transformer': {
          const V1 = getVal('calcV1'), V2 = getVal('calcV2'), I1 = getVal('calcI1');
          if (!V1 || !V2) { error = '⚠️ الرجاء إدخال V1 و V2'; break; }
          const ratio = V1 / V2;
          result = `نسبة التحويل = ${ratio.toFixed(2)} : 1`;
          if (I1 !== null) result += ` | I2 = ${(I1 * ratio).toFixed(2)} A`;
          break;
        }
        case 'solar': {
          const Wh = getVal('calcWh'), V = parseFloat(document.getElementById('calcSV')?.value) || 24, H = getVal('calcSH') || 5;
          if (!Wh) { error = '⚠️ الرجاء إدخال الاستهلاك اليومي'; break; }
          const Ah = (Wh / V) * 1.3;
          const panelW = (Wh / H) * 1.2;
          result = `سعة البطارية: ${Math.ceil(Ah)} Ah | قدرة الألواح: ${Math.ceil(panelW)} W`;
          break;
        }
        case 'motor': {
          const P = getVal('calcMP'), V = getVal('calcMV'), PF = getVal('calcMPF') || 0.85;
          if (!P || !V) { error = '⚠️ الرجاء إدخال القدرة والجهد'; break; }
          const I = (P * 1000) / (Math.sqrt(3) * V * PF);
          result = `تيار المحرك ≈ ${I.toFixed(2)} A`;
          break;
        }
        case 'led': {
          const Vs = getVal('calcLVs'), Vf = getVal('calcLVf') || 2, If = getVal('calcLIf') || 20;
          if (!Vs) { error = '⚠️ الرجاء إدخال جهد المصدر'; break; }
          if (Vs <= Vf) { error = '⚠️ جهد المصدر يجب أن يكون أكبر من جهد LED'; break; }
          const R = (Vs - Vf) / (If / 1000);
          result = `المقاومة المطلوبة: ${R.toFixed(0)} Ω`;
          break;
        }
        case 'rc': {
          const R = getVal('calcRCR'), C = getVal('calcRCC');
          if (!R || !C) { error = '⚠️ الرجاء إدخال R و C'; break; }
          const tau = R * C / 1000000;
          result = `τ = ${tau.toFixed(4)} ثانية | 5τ = ${(tau * 5).toFixed(4)} ثانية`;
          break;
        }
        case 'voltage_divider': {
          const Vin = getVal('calcVDVin'), R1 = getVal('calcVDR1'), R2 = getVal('calcVDR2');
          if (!Vin || !R1 || !R2) { error = '⚠️ الرجاء إدخال جميع القيم'; break; }
          const Vout = Vin * R2 / (R1 + R2);
          result = `Vout = ${Vout.toFixed(2)} V`;
          break;
        }
        default: error = '⚠️ الحاسبة غير متوفرة';
      }
    } catch (e) {
      error = '⚠️ حدث خطأ في الحساب. تحقق من المدخلات.';
      console.error('Calculator error:', e);
    }

    if (error && errorDiv) {
      errorDiv.textContent = error;
      errorDiv.classList.add('show');
    } else if (result) {
      resultDiv.textContent = result;
      resultDiv.classList.add('show');
    }
  }

  /* ========== Projects Page ========== */
  function renderProjectsPage() {
    const container = document.getElementById('page-projects');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const title = createElement('h2', { style: 'margin-bottom:16px;' });
    title.textContent = '🛠️ المشاريع العملية';
    frag.appendChild(title);

    const list = createElement('div', { class: 'projects-list' });

    APP_DATA.projects.forEach((proj) => {
      const compsHtml = proj.components.map((c) => `<span class="project-comp">${c}</span>`).join('');
      const stepsHtml = proj.steps
        ? `<ol class="project-steps">${proj.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`
        : '';

      const levelClass = proj.levelClass || 'beginner';

      const card = createElement('div', {
        class: 'project-card',
        role: 'button',
        tabindex: '0',
        'aria-label': `${proj.title} - ${proj.level}`
      });
      card.innerHTML = `
        <h4>${proj.title}</h4>
        <span class="project-level ${levelClass}">📌 ${proj.level}</span>
        <div class="project-components">${compsHtml}</div>
        ${stepsHtml}
      `;

      card.addEventListener('click', () => navigateTo('simulator', null));
      list.appendChild(card);
    });

    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Library Page ========== */
  function renderLibraryPage() {
    const container = document.getElementById('page-library');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const title = createElement('h2', { style: 'margin-bottom:16px;' });
    title.textContent = '📚 المكتبة';
    frag.appendChild(title);

    const grid = createElement('div', { class: 'library-grid' });

    APP_DATA.categories.forEach((cat) => {
      const card = createElement('div', {
        class: 'library-card',
        'data-cat-id': cat.id,
        role: 'button',
        tabindex: '0',
        'aria-label': cat.title
      });
      card.innerHTML = `
        <span class="lib-icon" aria-hidden="true">${cat.icon}</span>
        <div class="lib-title">${cat.title}</div>
      `;
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Dictionary Page ========== */
  function renderDictionaryPage() {
    const container = document.getElementById('page-dictionary');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const title = createElement('h2', { style: 'margin-bottom:16px;' });
    title.textContent = '📖 قاموس المصطلحات';
    frag.appendChild(title);

    const searchDiv = createElement('div', { class: 'dict-search' });
    const searchInput = createElement('input', {
      type: 'search',
      id: 'dictSearch',
      placeholder: '🔍 ابحث عن مصطلح...',
      'aria-label': 'البحث في القاموس',
      autocomplete: 'off'
    });
    searchInput.addEventListener('input', debounce(filterDictionary, 150));
    searchDiv.appendChild(searchInput);
    frag.appendChild(searchDiv);

    const list = createElement('div', { class: 'dict-list', id: 'dictList' });

    APP_DATA.dictionary.forEach((item) => {
      const dictItem = createElement('div', {
        class: 'dict-item',
        'data-search': `${item.ar} ${item.en}`.toLowerCase()
      });
      dictItem.innerHTML = `
        <div class="dict-term">${item.ar}</div>
        <div class="dict-english">🇬🇧 ${item.en}</div>
        <div class="dict-desc">${item.desc}</div>
      `;
      list.appendChild(dictItem);
    });

    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function filterDictionary() {
    const query = document.getElementById('dictSearch')?.value?.toLowerCase() || '';
    const items = document.querySelectorAll('#dictList .dict-item');
    let visibleCount = 0;

    items.forEach((item) => {
      const text = item.getAttribute('data-search') || '';
      const visible = query === '' || text.includes(query);
      item.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    const existingEmpty = document.querySelector('.dict-empty');
    if (existingEmpty) existingEmpty.remove();

    if (visibleCount === 0 && query !== '') {
      const list = document.getElementById('dictList');
      if (list) {
        const emptyMsg = createElement('div', { class: 'dict-empty' });
        emptyMsg.textContent = `🔍 لا توجد نتائج لـ "${query}"`;
        list.appendChild(emptyMsg);
      }
    }
  }

  /* ========== Quiz Page ========== */
  function renderQuizPage() {
    const container = document.getElementById('page-quiz');
    if (!container) return;

    if (typeof window.getQuizHTML === 'function') {
      container.innerHTML = window.getQuizHTML();
      setTimeout(() => {
        if (typeof window.initQuiz === 'function') {
          window.initQuiz();
        }
      }, 200);
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
          <div style="font-size:3rem;margin-bottom:16px;">📝</div>
          <p style="font-size:1.1rem;">⏳ جاري تحميل الاختبارات...</p>
        </div>
      `;
    }
  }

  /* ========== Keyboard Handler ========== */
  function handleGlobalKeyboard(e) {
    if (e.key === 'Escape') {
      if (dom.calcModalContainer && !dom.calcModalContainer.hasAttribute('hidden')) {
        closeCalcModal();
      }
    }
  }

  /* ========== Toast System ========== */
  function showToast(message, type) {
    if (!dom.toastContainer) return;

    const toast = createElement('div', {
      class: `toast ${type ? 'toast-' + type : ''}`,
      role: 'status',
      'aria-live': 'polite'
    });
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    const removeToast = () => {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => {
        if (toast.parentNode) toast.remove();
      }, { once: true });
    };

    const timeoutId = setTimeout(removeToast, TOAST_DURATION);
    toast.addEventListener('click', () => {
      clearTimeout(timeoutId);
      removeToast();
    });
  }

  /* ========== Utility: Create Element ========== */
  function createElement(tag, attrs = {}) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'string') {
        el.style.cssText = value;
      } else if (key.startsWith('data-') || key === 'role' || key === 'tabindex' ||
                 key === 'aria-label' || key === 'aria-hidden' || key === 'aria-modal' ||
                 key === 'aria-live' || key === 'aria-selected' || key === 'aria-atomic' ||
                 key === 'autocomplete' || key === 'placeholder' || key === 'type' ||
                 key === 'id' || key === 'inputmode' || key === 'min' || key === 'max' ||
                 key === 'step' || key === 'dir') {
        el.setAttribute(key, String(value));
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, String(value));
      }
    });

    return el;
  }

  /* ========== Utility: Debounce ========== */
  function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* ========== Public API ========== */
  window.navigateTo = navigateTo;
  window.openCalculator = openCalculator;
  window.closeCalcModal = closeCalcModal;
  window.calculateResult = calculateResult;
  window.filterDictionary = filterDictionary;
  window.showToast = showToast;

  /* ========== Start ========== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
