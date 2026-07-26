/* ==========================================================================
   DrDer Electronic - Main Application Logic v4.1
   Fixed: Simulator page rendering and initialization
   ========================================================================== */

(function () {
  'use strict';

  /* ========== Constants ========== */
  var PAGE_MAP = {
    home: { containerId: 'page-home', tabSelector: '[data-nav="home"]' },
    category: { containerId: 'page-category', tabSelector: null },
    lesson: { containerId: 'page-lesson', tabSelector: null },
    simulator: { containerId: 'page-simulator', tabSelector: '[data-nav="simulator"]' },
    calculators: { containerId: 'page-calculators', tabSelector: '[data-nav="calculators"]' },
    quiz: { containerId: 'page-quiz', tabSelector: '[data-nav="quiz"]' },
    projects: { containerId: 'page-projects', tabSelector: '[data-nav="projects"]' },
    library: { containerId: 'page-library', tabSelector: '[data-nav="library"]' },
    dictionary: { containerId: 'page-dictionary', tabSelector: '[data-nav="dictionary"]' }
  };

  var TOAST_DURATION = 3000;
  var MAX_HISTORY_STACK = 50;

  /* ========== State ========== */
  var currentPage = 'home';
  var currentCategoryId = null;
  var deferredPrompt = null;
  var installButtonVisible = false;
  var isNavigating = false;
  var historyStack = [{ page: 'home', data: null }];
  var keyboardListener = null;

  /* ========== DOM Cache ========== */
  var dom = {
    btnInstall: null,
    mainContent: null,
    calcModalContainer: null,
    toastContainer: null
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
    dom.mainContent = document.getElementById('mainContent');
    dom.calcModalContainer = document.getElementById('calcModalContainer');
    dom.toastContainer = document.getElementById('toastContainer');
  }

  /* ========== Service Worker ========== */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then(function (registration) {
        console.log('[SW] Registered:', registration.scope);
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 تحديث جديد متاح! سيتم التحديث تلقائياً.', 'info');
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[SW] Registration failed:', err.message);
      });
  }

  /* ========== Global Event Delegation ========== */
  function setupGlobalEventDelegation() {
    document.body.addEventListener('click', function (e) {
      var navButton = e.target.closest('[data-nav]');
      if (navButton && !navButton.closest('#calcModalContainer')) {
        e.preventDefault();
        var page = navButton.dataset.nav;
        if (page) navigateTo(page, null);
        return;
      }

      var categoryCard = e.target.closest('.category-card');
      if (categoryCard && categoryCard.dataset.catId) {
        navigateTo('category', categoryCard.dataset.catId);
        return;
      }

      var calcCard = e.target.closest('.calc-card');
      if (calcCard && calcCard.dataset.calcId) {
        openCalculator(calcCard.dataset.calcId);
        return;
      }

      var libraryCard = e.target.closest('.library-card');
      if (libraryCard && libraryCard.dataset.catId) {
        navigateTo('category', libraryCard.dataset.catId);
        return;
      }

      var breadcrumbBtn = e.target.closest('.breadcrumb span[data-breadcrumb]');
      if (breadcrumbBtn) {
        var target = breadcrumbBtn.dataset.breadcrumb;
        if (target === 'home') navigateTo('home', null);
        else if (target === 'category') navigateTo('category', currentCategoryId);
        return;
      }

      var reviewLink = e.target.closest('.review-suggestion li[data-category]');
      if (reviewLink) {
        navigateTo('category', reviewLink.dataset.category);
        return;
      }
    });
  }

  /* ========== Install Handling ========== */
  function setupInstallListeners() {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });

    window.addEventListener('appinstalled', function () {
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

  function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (result) {
      if (result.outcome === 'accepted') {
        hideInstallButton();
        showToast('✅ جاري تثبيت التطبيق...', 'success');
      }
      deferredPrompt = null;
    });
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
    var hash = window.location.hash;
    if (hash) {
      var parts = hash.replace('#', '').split('/');
      var page = parts[0];
      var data = parts.length > 1 ? parts[1] : null;
      if (PAGE_MAP[page]) {
        navigateTo(page, data, true);
        return;
      }
    }
    history.replaceState({ page: 'home', data: null }, '', '#home');
  }

  /* ========== History API ========== */
  function pushHistory(page, data) {
    var state = { page: page, data: data, timestamp: Date.now() };
    historyStack.push(state);
    if (historyStack.length > MAX_HISTORY_STACK) historyStack.shift();
    var url = data ? '#' + page + '/' + data : '#' + page;
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
  function navigateTo(page, data, isPopState) {
    if (isNavigating && !isPopState) return;
    var pageConfig = PAGE_MAP[page];
    if (!pageConfig) { navigateTo('home', null); return; }

    isNavigating = true;
    currentPage = page;
    if (page === 'category') currentCategoryId = data;

    cleanupCurrentPage();
    switchPage(page);
    updateActiveTab(page);

    if (!isPopState) pushHistory(page, data);

    renderPage(page, data);
    window.scrollTo({ top: 0, behavior: 'instant' });

    requestAnimationFrame(function () {
      isNavigating = false;
    });
  }

  function switchPage(page) {
    var config = PAGE_MAP[page];
    var targetId = config.containerId;
    var allPages = document.querySelectorAll('.page');
    for (var i = 0; i < allPages.length; i++) {
      if (allPages[i].id === targetId) {
        allPages[i].classList.add('active');
      } else {
        allPages[i].classList.remove('active');
      }
    }
  }

  function updateActiveTab(page) {
    var config = PAGE_MAP[page];
    var tabSelector = config.tabSelector;
    var allTabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < allTabs.length; i++) {
      allTabs[i].classList.remove('active');
      allTabs[i].setAttribute('aria-selected', 'false');
    }
    if (tabSelector) {
      var activeTab = document.querySelector('.nav-tab' + tabSelector);
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
    var container = document.getElementById('page-home');
    if (!container) return;

    var frag = document.createDocumentFragment();
    var hero = document.createElement('div');
    hero.className = 'hero-section';
    hero.innerHTML = '<h1 class="hero-title">⚡ DrDer Electronic</h1><p class="hero-subtitle">مختبر هندسة كهربائية وإلكترونية متكامل للطلاب والمهندسين والفنيين</p>';
    frag.appendChild(hero);

    var grid = document.createElement('div');
    grid.className = 'categories-grid';

    APP_DATA.categories.forEach(function (cat) {
      var card = document.createElement('div');
      card.className = 'category-card';
      card.setAttribute('data-cat-id', cat.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', cat.title + ' - ' + cat.lessons.length + ' دروس');
      card.innerHTML = '<span class="cat-icon" aria-hidden="true">' + cat.icon + '</span><div class="cat-title">' + cat.title + '</div><div class="cat-count">' + cat.lessons.length + ' دروس</div>';
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Category Page ========== */
  function renderCategoryPage(categoryId) {
    var cat = APP_DATA.categories.find(function (c) { return c.id === categoryId; });
    if (!cat) { navigateTo('home', null); return; }

    currentCategoryId = categoryId;
    var container = document.getElementById('page-category');
    if (!container) return;

    var frag = document.createDocumentFragment();
    var breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = '<span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span><span class="separator" aria-hidden="true">›</span><span>' + cat.icon + ' ' + cat.title + '</span>';
    frag.appendChild(breadcrumb);

    var list = document.createElement('div');
    list.className = 'lesson-list';

    cat.lessons.forEach(function (lesson, index) {
      var param = cat.id + '|' + lesson.id;
      var item = document.createElement('div');
      item.className = 'lesson-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'الدرس ' + (index + 1) + ': ' + lesson.title);
      item.innerHTML = '<div class="lesson-num" aria-hidden="true">' + (index + 1) + '</div><div class="lesson-info"><h4>' + lesson.title + '</h4><p>' + lesson.keyPoints.slice(0, 3).join(' • ') + '</p></div><span class="lesson-arrow" aria-hidden="true">◀</span>';
      item.addEventListener('click', function () { navigateTo('lesson', param); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateTo('lesson', param); }
      });
      list.appendChild(item);
    });

    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Lesson Detail ========== */
  function renderLessonDetail(param) {
    if (!param) { navigateTo('home', null); return; }
    var parts = param.split('|');
    var catId = parts[0];
    var lessonId = parts[1];
    var cat = APP_DATA.categories.find(function (c) { return c.id === catId; });
    if (!cat) { navigateTo('home', null); return; }
    var lesson = cat.lessons.find(function (l) { return l.id === lessonId; });
    if (!lesson) { navigateTo('category', catId); return; }

    var container = document.getElementById('page-lesson');
    if (!container) return;

    var keyPointsHtml = lesson.keyPoints.map(function (kp) { return '<span class="key-point">' + kp + '</span>'; }).join('');
    var frag = document.createDocumentFragment();

    var breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = '<span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span><span class="separator" aria-hidden="true">›</span><span data-breadcrumb="category" role="button" tabindex="0">' + cat.icon + ' ' + cat.title + '</span><span class="separator" aria-hidden="true">›</span><span>' + lesson.title + '</span>';
    frag.appendChild(breadcrumb);

    var detail = document.createElement('div');
    detail.className = 'lesson-detail';
    detail.innerHTML = '<h3>' + lesson.title + '</h3><div class="lesson-content"><p>' + lesson.content + '</p></div><div class="key-points">' + keyPointsHtml + '</div><div class="formula-box"><div class="formula" dir="ltr">' + lesson.formula + '</div><div class="formula-desc">' + lesson.formulaDesc + '</div></div>';
    frag.appendChild(detail);

    var backBtn = document.createElement('button');
    backBtn.className = 'btn btn-outline';
    backBtn.style.marginTop = '12px';
    backBtn.textContent = '↩ العودة للدروس';
    backBtn.addEventListener('click', function () { navigateTo('category', cat.id); });
    frag.appendChild(backBtn);

    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Simulator Page ========== */
  function renderSimulatorPage() {
    var container = document.getElementById('page-simulator');
    if (!container) return;

    if (typeof window.getSimulatorHTML === 'function') {
      container.innerHTML = window.getSimulatorHTML();

      setTimeout(function () {
        if (typeof window.initSimulator === 'function') {
          window.initSimulator();
        }
      }, 300);
    } else {
      container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted);"><div style="font-size:3rem;margin-bottom:16px;">🔧</div><p style="font-size:1.1rem;">⏳ جاري تحميل المحاكي...</p><p style="font-size:0.85rem;margin-top:8px;">تأكد من وجود جميع ملفات المحاكي في مجلد simulator/</p></div>';
    }
  }

  /* ========== Calculators Page ========== */
  function renderCalculatorsPage() {
    var container = document.getElementById('page-calculators');
    if (!container) return;

    var frag = document.createDocumentFragment();
    var title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '🧮 الحاسبات الهندسية';
    frag.appendChild(title);

    var grid = document.createElement('div');
    grid.className = 'calc-grid';

    APP_DATA.calculators.forEach(function (calc) {
      var card = document.createElement('div');
      card.className = 'calc-card';
      card.setAttribute('data-calc-id', calc.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', calc.name);
      card.innerHTML = '<span class="calc-icon" aria-hidden="true">' + calc.icon + '</span><div class="calc-name">' + calc.name + '</div><div class="calc-desc">' + (calc.desc || '') + '</div>';
      grid.appendChild(card);
    });

    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Calculator Modal ========== */
  function openCalculator(calcId) {
    var calc = APP_DATA.calculators.find(function (c) { return c.id === calcId; });
    if (!calc) return;

    var fieldsHtml = getCalculatorFields(calcId);
    if (!fieldsHtml) { showToast('⚠️ الحاسبة قيد التطوير', 'error'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'calc-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', calc.name);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCalcModal(); });

    var modal = document.createElement('div');
    modal.className = 'calc-modal';
    modal.innerHTML = '<h3>' + calc.icon + ' ' + calc.name + '</h3>' + fieldsHtml + '<div class="calc-result" id="calcResult"></div><div class="calc-error" id="calcError"></div>';

    var calcBtn = document.createElement('button');
    calcBtn.className = 'btn btn-primary btn-block';
    calcBtn.style.marginTop = '12px';
    calcBtn.textContent = '🧮 احسب';
    calcBtn.addEventListener('click', function () { calculateResult(calcId); });
    modal.appendChild(calcBtn);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-outline btn-block';
    closeBtn.style.marginTop = '8px';
    closeBtn.textContent = 'إغلاق';
    closeBtn.addEventListener('click', closeCalcModal);
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.appendChild(overlay);
    dom.calcModalContainer.removeAttribute('hidden');

    setTimeout(function () {
      var firstInput = overlay.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 150);
  }

  function getCalculatorFields(calcId) {
    var fields = {
      ohm: '<div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcR" placeholder="أدخل المقاومة" inputmode="decimal" min="0" step="any"></div><p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة</p>',
      power: '<div class="calc-field"><label>القدرة P (واط)</label><input type="number" id="calcP" placeholder="أدخل القدرة" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div><p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">P = V × I</p>',
      cable: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcCI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcCL" placeholder="أدخل الطول" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>الهبوط المسموح ΔV%</label><input type="number" id="calcCV" value="3" min="0.1" max="20" step="any"></div>',
      breaker: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcBI" placeholder="أدخل تيار الحمل" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>نوع الحمل</label><select id="calcBType"><option value="1.25">حمل عادي</option><option value="1.5">محرك صغير</option><option value="1.75">محرك كبير</option><option value="2">حمل ثقيل</option></select></div>',
      voltdrop: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcVDI" placeholder="أدخل التيار" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcVDL" placeholder="أدخل الطول" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>مساحة المقطع A (mm²)</label><input type="number" id="calcVDA" placeholder="أدخل مساحة المقطع" inputmode="decimal" min="0.1" step="any"></div>',
      pf: '<div class="calc-field"><label>القدرة الفعالة P (واط)</label><input type="number" id="calcPFP" placeholder="أدخل P" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>القدرة الظاهرية S (VA)</label><input type="number" id="calcPFS" placeholder="أدخل S" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>القدرة غير الفعالة Q (VAR)</label><input type="number" id="calcPFQ" placeholder="أدخل Q" inputmode="decimal" min="0" step="any"></div><p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة ومعامل القدرة</p>',
      transformer: '<div class="calc-field"><label>الجهد الابتدائي V1 (فولت)</label><input type="number" id="calcV1" placeholder="أدخل V1" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>الجهد الثانوي V2 (فولت)</label><input type="number" id="calcV2" placeholder="أدخل V2" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>التيار الابتدائي I1 (أمبير) - اختياري</label><input type="number" id="calcI1" placeholder="أدخل I1" inputmode="decimal" min="0" step="any"></div>',
      solar: '<div class="calc-field"><label>الاستهلاك اليومي (واط.ساعة)</label><input type="number" id="calcWh" placeholder="أدخل الاستهلاك" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>جهد النظام V</label><select id="calcSV"><option value="12">12V</option><option value="24" selected>24V</option><option value="48">48V</option></select></div><div class="calc-field"><label>ساعات الشمس الذروة</label><input type="number" id="calcSH" value="5" min="1" max="12" step="any"></div>',
      motor: '<div class="calc-field"><label>القدرة P (كيلوواط)</label><input type="number" id="calcMP" placeholder="أدخل القدرة" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcMV" placeholder="أدخل الجهد" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>معامل القدرة PF</label><input type="number" id="calcMPF" value="0.85" min="0.1" max="1" step="0.01"></div>',
      led: '<div class="calc-field"><label>جهد المصدر Vs (فولت)</label><input type="number" id="calcLVs" placeholder="أدخل جهد المصدر" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>جهد LED الأمامي Vf (فولت)</label><input type="number" id="calcLVf" value="2" min="0" step="any"></div><div class="calc-field"><label>تيار LED المطلوب If (مللي أمبير)</label><input type="number" id="calcLIf" value="20" min="1" step="any"></div>',
      rc: '<div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcRCR" placeholder="أدخل المقاومة" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>السعة C (ميكروفاراد)</label><input type="number" id="calcRCC" placeholder="أدخل السعة" inputmode="decimal" min="0" step="any"></div>',
      voltage_divider: '<div class="calc-field"><label>جهد الدخل Vin (فولت)</label><input type="number" id="calcVDVin" placeholder="أدخل جهد الدخل" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>المقاومة R1 (أوم)</label><input type="number" id="calcVDR1" placeholder="أدخل R1" inputmode="decimal" min="0" step="any"></div><div class="calc-field"><label>المقاومة R2 (أوم)</label><input type="number" id="calcVDR2" placeholder="أدخل R2" inputmode="decimal" min="0" step="any"></div>'
    };
    return fields[calcId] || null;
  }

  function closeCalcModal() {
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.setAttribute('hidden', '');
  }

  function calculateResult(calcId) {
    var resultDiv = document.getElementById('calcResult');
    var errorDiv = document.getElementById('calcError');
    if (!resultDiv) return;
    resultDiv.classList.remove('show');
    if (errorDiv) errorDiv.classList.remove('show');

    var getVal = function (id) {
      var el = document.getElementById(id);
      if (!el) return null;
      var val = parseFloat(el.value);
      return isNaN(val) ? null : val;
    };

    var result = '';
    var error = '';

    try {
      switch (calcId) {
        case 'ohm':
          var V = getVal('calcV'), I = getVal('calcI'), R = getVal('calcR');
          var provided = [V, I, R].filter(function (v) { return v !== null; }).length;
          if (provided < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (V && I && I === 0) { error = '⚠️ لا يمكن حساب المقاومة عندما يكون التيار = 0'; break; }
          if (V && I) result = 'المقاومة R = ' + (V / I).toFixed(3) + ' Ω';
          else if (V && R) result = R === 0 ? '⚠️ المقاومة = 0 (قصر)' : 'التيار I = ' + (V / R).toFixed(3) + ' A';
          else if (I && R) result = 'الجهد V = ' + (I * R).toFixed(2) + ' V';
          break;
        case 'power':
          var P = getVal('calcP'), V2 = getVal('calcV'), I2 = getVal('calcI');
          var provided2 = [P, V2, I2].filter(function (v) { return v !== null; }).length;
          if (provided2 < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (V2 && I2) result = 'القدرة P = ' + (V2 * I2).toFixed(2) + ' W';
          else if (P && V2) result = V2 === 0 ? '⚠️ الجهد = 0' : 'التيار I = ' + (P / V2).toFixed(3) + ' A';
          else if (P && I2) result = I2 === 0 ? '⚠️ التيار = 0' : 'الجهد V = ' + (P / I2).toFixed(2) + ' V';
          break;
        case 'cable':
          var Ic = getVal('calcCI'), Lc = getVal('calcCL'), dVc = getVal('calcCV') || 3;
          if (!Ic || !Lc) { error = '⚠️ الرجاء إدخال التيار والطول'; break; }
          result = 'مساحة المقطع المطلوبة ≈ ' + ((2 * Lc * Ic) / (56 * dVc)).toFixed(2) + ' mm²';
          break;
        case 'breaker':
          var Ib = getVal('calcBI');
          if (!Ib) { error = '⚠️ الرجاء إدخال تيار الحمل'; break; }
          var typeEl = document.getElementById('calcBType');
          var factor = typeEl ? parseFloat(typeEl.value) : 1.25;
          var breakerSize = Ib * factor;
          var sizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
          var recommended = sizes.find(function (s) { return s >= breakerSize; }) || Math.ceil(breakerSize / 5) * 5;
          result = 'القاطع الموصى به: ' + recommended + ' A';
          break;
        case 'voltdrop':
          var Iv = getVal('calcVDI'), Lv = getVal('calcVDL'), Av = getVal('calcVDA');
          if (!Iv || !Lv || !Av) { error = '⚠️ الرجاء إدخال جميع القيم'; break; }
          result = 'هبوط الجهد: ' + ((2 * Lv * Iv) / (56 * Av)).toFixed(2) + ' V';
          break;
        case 'pf':
          var Pp = getVal('calcPFP'), Sp = getVal('calcPFS'), Qp = getVal('calcPFQ');
          var providedP = [Pp, Sp, Qp].filter(function (v) { return v !== null; }).length;
          if (providedP < 2) { error = '⚠️ الرجاء إدخال قيمتين على الأقل'; break; }
          if (Pp !== null && Sp !== null) {
            if (Pp > Sp) { error = '⚠️ P لا يمكن أن تكون أكبر من S'; break; }
            result = 'معامل القدرة PF = ' + (Pp / Sp).toFixed(4);
          } else if (Pp !== null && Qp !== null) {
            var Sc = Math.sqrt(Pp * Pp + Qp * Qp);
            result = 'S = ' + Sc.toFixed(1) + ' VA | PF = ' + (Pp / Sc).toFixed(4);
          } else if (Sp !== null && Qp !== null) {
            if (Sp < Qp) { error = '⚠️ S لا يمكن أن تكون أصغر من Q'; break; }
            var Pc = Math.sqrt(Math.max(0, Sp * Sp - Qp * Qp));
            result = 'P = ' + Pc.toFixed(1) + ' W | PF = ' + (Pc / Sp).toFixed(4);
          }
          break;
        case 'transformer':
          var Vt1 = getVal('calcV1'), Vt2 = getVal('calcV2'), It1 = getVal('calcI1');
          if (!Vt1 || !Vt2) { error = '⚠️ الرجاء إدخال V1 و V2'; break; }
          var ratio = Vt1 / Vt2;
          result = 'نسبة التحويل = ' + ratio.toFixed(2) + ' : 1';
          if (It1 !== null) result += ' | I2 = ' + (It1 * ratio).toFixed(2) + ' A';
          break;
        case 'solar':
          var Wh = getVal('calcWh'), Vs = parseFloat(document.getElementById('calcSV') ? document.getElementById('calcSV').value : 24), Hs = getVal('calcSH') || 5;
          if (!Wh) { error = '⚠️ الرجاء إدخال الاستهلاك اليومي'; break; }
          result = 'سعة البطارية: ' + Math.ceil((Wh / Vs) * 1.3) + ' Ah | قدرة الألواح: ' + Math.ceil((Wh / Hs) * 1.2) + ' W';
          break;
        case 'motor':
          var Pm = getVal('calcMP'), Vm = getVal('calcMV'), PFm = getVal('calcMPF') || 0.85;
          if (!Pm || !Vm) { error = '⚠️ الرجاء إدخال القدرة والجهد'; break; }
          result = 'تيار المحرك ≈ ' + ((Pm * 1000) / (Math.sqrt(3) * Vm * PFm)).toFixed(2) + ' A';
          break;
        case 'led':
          var Vls = getVal('calcLVs'), Vlf = getVal('calcLVf') || 2, Ilf = getVal('calcLIf') || 20;
          if (!Vls) { error = '⚠️ الرجاء إدخال جهد المصدر'; break; }
          if (Vls <= Vlf) { error = '⚠️ جهد المصدر يجب أن يكون أكبر من جهد LED'; break; }
          result = 'المقاومة المطلوبة: ' + ((Vls - Vlf) / (Ilf / 1000)).toFixed(0) + ' Ω';
          break;
        case 'rc':
          var Rrc = getVal('calcRCR'), Crc = getVal('calcRCC');
          if (!Rrc || !Crc) { error = '⚠️ الرجاء إدخال R و C'; break; }
          var tau = Rrc * Crc / 1000000;
          result = 'τ = ' + tau.toFixed(4) + ' ثانية | 5τ = ' + (tau * 5).toFixed(4) + ' ثانية';
          break;
        case 'voltage_divider':
          var Vdv = getVal('calcVDVin'), Rd1 = getVal('calcVDR1'), Rd2 = getVal('calcVDR2');
          if (!Vdv || !Rd1 || !Rd2) { error = '⚠️ الرجاء إدخال جميع القيم'; break; }
          result = 'Vout = ' + (Vdv * Rd2 / (Rd1 + Rd2)).toFixed(2) + ' V';
          break;
        default: error = '⚠️ الحاسبة غير متوفرة';
      }
    } catch (e) {
      error = '⚠️ حدث خطأ في الحساب. تحقق من المدخلات.';
    }

    if (error && errorDiv) { errorDiv.textContent = error; errorDiv.classList.add('show'); }
    else if (result) { resultDiv.textContent = result; resultDiv.classList.add('show'); }
  }

  /* ========== Projects Page ========== */
  function renderProjectsPage() {
    var container = document.getElementById('page-projects');
    if (!container) return;
    var frag = document.createDocumentFragment();
    var title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '🛠️ المشاريع العملية';
    frag.appendChild(title);
    var list = document.createElement('div');
    list.className = 'projects-list';
    APP_DATA.projects.forEach(function (proj) {
      var compsHtml = proj.components.map(function (c) { return '<span class="project-comp">' + c + '</span>'; }).join('');
      var stepsHtml = proj.steps ? '<ol class="project-steps">' + proj.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : '';
      var levelClass = proj.levelClass || 'beginner';
      var card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<h4>' + proj.title + '</h4><span class="project-level ' + levelClass + '">📌 ' + proj.level + '</span><div class="project-components">' + compsHtml + '</div>' + stepsHtml;
      card.addEventListener('click', function () { navigateTo('simulator', null); });
      list.appendChild(card);
    });
    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Library Page ========== */
  function renderLibraryPage() {
    var container = document.getElementById('page-library');
    if (!container) return;
    var frag = document.createDocumentFragment();
    var title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '📚 المكتبة';
    frag.appendChild(title);
    var grid = document.createElement('div');
    grid.className = 'library-grid';
    APP_DATA.categories.forEach(function (cat) {
      var card = document.createElement('div');
      card.className = 'library-card';
      card.setAttribute('data-cat-id', cat.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<span class="lib-icon" aria-hidden="true">' + cat.icon + '</span><div class="lib-title">' + cat.title + '</div>';
      grid.appendChild(card);
    });
    frag.appendChild(grid);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  /* ========== Dictionary Page ========== */
  function renderDictionaryPage() {
    var container = document.getElementById('page-dictionary');
    if (!container) return;
    var frag = document.createDocumentFragment();
    var title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '📖 قاموس المصطلحات';
    frag.appendChild(title);
    var searchDiv = document.createElement('div');
    searchDiv.className = 'dict-search';
    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'dictSearch';
    searchInput.placeholder = '🔍 ابحث عن مصطلح...';
    searchInput.setAttribute('aria-label', 'البحث في القاموس');
    searchInput.setAttribute('autocomplete', 'off');
    searchInput.addEventListener('input', debounce(filterDictionary, 150));
    searchDiv.appendChild(searchInput);
    frag.appendChild(searchDiv);
    var list = document.createElement('div');
    list.className = 'dict-list';
    list.id = 'dictList';
    APP_DATA.dictionary.forEach(function (item) {
      var dictItem = document.createElement('div');
      dictItem.className = 'dict-item';
      dictItem.setAttribute('data-search', (item.ar + ' ' + item.en).toLowerCase());
      dictItem.innerHTML = '<div class="dict-term">' + item.ar + '</div><div class="dict-english">🇬🇧 ' + item.en + '</div><div class="dict-desc">' + item.desc + '</div>';
      list.appendChild(dictItem);
    });
    frag.appendChild(list);
    container.innerHTML = '';
    container.appendChild(frag);
  }

  function filterDictionary() {
    var query = (document.getElementById('dictSearch') ? document.getElementById('dictSearch').value : '').toLowerCase();
    var items = document.querySelectorAll('#dictList .dict-item');
    var visibleCount = 0;
    items.forEach(function (item) {
      var text = item.getAttribute('data-search') || '';
      var visible = query === '' || text.indexOf(query) !== -1;
      item.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });
    var existingEmpty = document.querySelector('.dict-empty');
    if (existingEmpty) existingEmpty.remove();
    if (visibleCount === 0 && query !== '') {
      var list = document.getElementById('dictList');
      if (list) {
        var emptyMsg = document.createElement('div');
        emptyMsg.className = 'dict-empty';
        emptyMsg.textContent = '🔍 لا توجد نتائج لـ "' + query + '"';
        list.appendChild(emptyMsg);
      }
    }
  }

  /* ========== Quiz Page ========== */
  function renderQuizPage() {
    var container = document.getElementById('page-quiz');
    if (!container) return;
    if (typeof window.getQuizHTML === 'function') {
      container.innerHTML = window.getQuizHTML();
      setTimeout(function () {
        if (typeof window.initQuiz === 'function') window.initQuiz();
      }, 200);
    } else {
      container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted);"><div style="font-size:3rem;margin-bottom:16px;">📝</div><p style="font-size:1.1rem;">⏳ جاري تحميل الاختبارات...</p></div>';
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
    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    var removeToast = function () {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', function () { if (toast.parentNode) toast.remove(); }, { once: true });
    };
    var timeoutId = setTimeout(removeToast, TOAST_DURATION);
    toast.addEventListener('click', function () { clearTimeout(timeoutId); removeToast(); });
  }

  /* ========== Utility: Debounce ========== */
  function debounce(fn, delay) {
    var timeoutId;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function () { fn.apply(ctx, args); }, delay);
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
