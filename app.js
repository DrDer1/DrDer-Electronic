/* ==========================================================================
   DrDer Electronic - Main Application Logic
   PWA | SPA Router | History API | No Dependencies
   ========================================================================== */

(function () {
  'use strict';

  /* ========== Private State ========== */
  let _currentPage = 'home';
  let _currentCategoryId = null;
  let _deferredPrompt = null;
  let _installButtonVisible = false;
  let _isNavigating = false;

  /* ========== DOM References (cached) ========== */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    get btnInstall() { return $('#btnInstall'); },
    get navTabs() { return $('#navTabs'); },
    get mainContent() { return $('#mainContent'); },
    get calcModalContainer() { return $('#calcModalContainer'); },
    get allPages() { return $$('.page'); },
    get allNavTabs() { return $$('.nav-tab'); },
    get appLogo() { return $('.app-logo'); },
    get headerActions() { return $('.header-actions'); },
  };

  /* ========== Page Map ========== */
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

  /* ========== History Stack ========== */
  let _historyStack = [{ page: 'home', data: null }];

  /* ========== Initialize ========== */
  function init() {
    registerServiceWorker();
    setupNavigationListeners();
    setupInstallListeners();
    renderHomePage();
    updateActiveTab('home');

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('keydown', handleKeyboard);
  }

  /* ========== Service Worker ========== */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('./sw.js')
      .then(() => {
        console.log('[SW] Registered successfully');
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err.message);
      });
  }

  /* ========== Navigation Listeners ========== */
  function setupNavigationListeners() {
    if (dom.navTabs) {
      dom.navTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-nav]');
        if (!tab) return;
        const page = tab.dataset.nav;
        if (page) navigateTo(page, null);
      });
    }

    if (dom.headerActions) {
      dom.headerActions.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-nav]');
        if (!btn || btn.id === 'btnInstall') return;
        const page = btn.dataset.nav;
        if (page) navigateTo(page, null);
      });
    }

    if (dom.appLogo) {
      dom.appLogo.addEventListener('click', () => navigateTo('home', null));
    }
  }

  /* ========== Install Listeners ========== */
  function setupInstallListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      hideInstallButton();
      _deferredPrompt = null;
      showToast('✅ تم تثبيت التطبيق بنجاح');
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      hideInstallButton();
    }

    const btn = dom.btnInstall;
    if (btn) {
      btn.addEventListener('click', handleInstallClick);
    }
  }

  async function handleInstallClick() {
    if (!_deferredPrompt) return;

    _deferredPrompt.prompt();
    const result = await _deferredPrompt.userChoice;

    if (result.outcome === 'accepted') {
      hideInstallButton();
      showToast('✅ جاري تثبيت التطبيق...');
    }

    _deferredPrompt = null;
  }

  function showInstallButton() {
    const btn = dom.btnInstall;
    if (btn && !_installButtonVisible) {
      btn.style.display = 'flex';
      _installButtonVisible = true;
    }
  }

  function hideInstallButton() {
    const btn = dom.btnInstall;
    if (btn) {
      btn.style.display = 'none';
      _installButtonVisible = false;
    }
  }

  /* ========== History API ========== */
  function pushHistory(page, data) {
    const state = { page, data, timestamp: Date.now() };
    _historyStack.push(state);

    if (_historyStack.length > 50) {
      _historyStack.shift();
    }

    const url = data ? `#${page}/${data}` : `#${page}`;
    history.pushState(state, '', url);
  }

  function handlePopState(event) {
    if (_isNavigating) return;

    if (event.state && event.state.page) {
      _isNavigating = true;
      navigateTo(event.state.page, event.state.data, true);
      _isNavigating = false;
    } else {
      _isNavigating = true;
      navigateTo('home', null, true);
      _isNavigating = false;
    }
  }

  /* ========== Main Navigation ========== */
  function navigateTo(page, data, isPopState = false) {
    if (_isNavigating && !isPopState) return;
    _isNavigating = true;

    const pageConfig = PAGE_MAP[page];
    if (!pageConfig) {
      _isNavigating = false;
      return;
    }

    _currentPage = page;

    if (page === 'category') {
      _currentCategoryId = data;
    }

    switchPage(page);
    updateActiveTab(page);

    if (!isPopState) {
      pushHistory(page, data);
    }

    renderPage(page, data);

    window.scrollTo({ top: 0, behavior: 'instant' });

    _isNavigating = false;
  }

  function switchPage(page) {
    const config = PAGE_MAP[page];
    const targetId = config.containerId;

    dom.allPages.forEach((p) => {
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

    dom.allNavTabs.forEach((tab) => {
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

  /* ========== Page Renderers ========== */
  function renderPage(page, data) {
    closeCalcModal();

    switch (page) {
      case 'home':
        renderHomePage();
        break;
      case 'category':
        renderCategoryPage(data);
        break;
      case 'lesson':
        renderLessonDetail(data);
        break;
      case 'simulator':
        renderSimulatorPage();
        break;
      case 'calculators':
        renderCalculatorsPage();
        break;
      case 'quiz':
        renderQuizPage();
        break;
      case 'projects':
        renderProjectsPage();
        break;
      case 'library':
        renderLibraryPage();
        break;
      case 'dictionary':
        renderDictionaryPage();
        break;
      default:
        renderHomePage();
    }
  }

  /* ========== Home Page ========== */
  function renderHomePage() {
    const container = document.getElementById('page-home');
    if (!container) return;

    const frag = document.createDocumentFragment();
    const hero = document.createElement('div');
    hero.className = 'hero-section';
    hero.innerHTML = `
      <h1 class="hero-title">⚡ DrDer Electronic</h1>
      <p class="hero-subtitle">مختبر هندسة كهربائية وإلكترونية متكامل للطلاب والمهندسين والفنيين</p>
    `;
    frag.appendChild(hero);

    const grid = document.createElement('div');
    grid.className = 'categories-grid';

    APP_DATA.categories.forEach((cat) => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${cat.title} - ${cat.lessons.length} دروس`);
      card.innerHTML = `
        <span class="cat-icon" aria-hidden="true">${cat.icon}</span>
        <div class="cat-title">${cat.title}</div>
        <div class="cat-count">${cat.lessons.length} دروس</div>
      `;
      card.addEventListener('click', () => navigateTo('category', cat.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('category', cat.id);
        }
      });
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

    _currentCategoryId = categoryId;
    const container = document.getElementById('page-category');
    if (!container) return;

    const frag = document.createDocumentFragment();

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = `
      <span role="button" tabindex="0" aria-label="العودة للرئيسية">🏠 الرئيسية</span>
      <span class="separator" aria-hidden="true">›</span>
      <span>${cat.icon} ${cat.title}</span>
    `;
    breadcrumb.querySelector('span[role="button"]').addEventListener('click', () => navigateTo('home', null));
    frag.appendChild(breadcrumb);

    const list = document.createElement('div');
    list.className = 'lesson-list';

    cat.lessons.forEach((lesson, index) => {
      const item = document.createElement('div');
      item.className = 'lesson-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `الدرس ${index + 1}: ${lesson.title}`);
      item.innerHTML = `
        <div class="lesson-num" aria-hidden="true">${index + 1}</div>
        <div class="lesson-info">
          <h4>${lesson.title}</h4>
          <p>${lesson.keyPoints.slice(0, 3).join(' • ')}</p>
        </div>
        <span class="lesson-arrow" aria-hidden="true">◀</span>
      `;
      const param = `${cat.id}|${lesson.id}`;
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

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = `
      <span role="button" tabindex="0" aria-label="العودة للرئيسية">🏠 الرئيسية</span>
      <span class="separator" aria-hidden="true">›</span>
      <span role="button" tabindex="0" aria-label="العودة إلى ${cat.title}">${cat.icon} ${cat.title}</span>
      <span class="separator" aria-hidden="true">›</span>
      <span>${lesson.title}</span>
    `;
    const breadcrumbSpans = breadcrumb.querySelectorAll('span[role="button"]');
    breadcrumbSpans[0].addEventListener('click', () => navigateTo('home', null));
    breadcrumbSpans[1].addEventListener('click', () => navigateTo('category', cat.id));
    frag.appendChild(breadcrumb);

    const detail = document.createElement('div');
    detail.className = 'lesson-detail';
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

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-outline';
    backBtn.style.marginTop = '12px';
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

    if (typeof getSimulatorHTML === 'function') {
      container.innerHTML = getSimulatorHTML();
      setTimeout(() => {
        if (typeof initSimulator === 'function') {
          initSimulator();
        }
      }, 150);
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);">
          <p>⏳ جاري تحميل المحاكاة...</p>
        </div>
      `;
    }
  }

  /* ========== Calculators Page ========== */
  function renderCalculatorsPage() {
    const container = document.getElementById('page-calculators');
    if (!container) return;

    const frag = document.createDocumentFragment();
    const title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '🧮 الحاسبات الهندسية';
    frag.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'calc-grid';

    APP_DATA.calculators.forEach((calc) => {
      const card = document.createElement('div');
      card.className = 'calc-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', calc.name);
      card.innerHTML = `
        <span class="calc-icon" aria-hidden="true">${calc.icon}</span>
        <div class="calc-name">${calc.name}</div>
        <div class="calc-desc">${calc.desc || ''}</div>
      `;
      card.addEventListener('click', () => openCalculator(calc.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCalculator(calc.id);
        }
      });
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
      showToast('⚠️ الحاسبة قيد التطوير');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'calc-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', calc.name);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCalcModal();
    });

    overlay.innerHTML = `
      <div class="calc-modal" onclick="event.stopPropagation()">
        <h3>${calc.icon} ${calc.name}</h3>
        ${fieldsHtml}
        <div class="calc-result" id="calcResult"></div>
        <button class="btn btn-primary btn-block" id="btnCalcCalculate" style="margin-top:12px;">🧮 احسب</button>
        <button class="btn btn-outline btn-block" id="btnCalcClose" style="margin-top:8px;">إغلاق</button>
      </div>
    `;

    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.appendChild(overlay);

    const btnCalculate = document.getElementById('btnCalcCalculate');
    const btnClose = document.getElementById('btnCalcClose');

    if (btnCalculate) {
      btnCalculate.addEventListener('click', () => calculateResult(calcId));
    }
    if (btnClose) {
      btnClose.addEventListener('click', closeCalcModal);
    }

    setTimeout(() => {
      const firstInput = overlay.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function getCalculatorFields(calcId) {
    switch (calcId) {
      case 'ohm':
        return `
          <div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal"></div>
          <div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal"></div>
          <div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcR" placeholder="أدخل المقاومة" inputmode="decimal"></div>
          <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة</p>
        `;
      case 'power':
        return `
          <div class="calc-field"><label>القدرة P (واط)</label><input type="number" id="calcP" placeholder="أدخل القدرة" inputmode="decimal"></div>
          <div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" inputmode="decimal"></div>
          <div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" inputmode="decimal"></div>
          <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">P = V × I - أدخل قيمتين لتحصل على الثالثة</p>
        `;
      case 'cable':
        return `
          <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcCI" placeholder="أدخل التيار" inputmode="decimal"></div>
          <div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcCL" placeholder="أدخل الطول" inputmode="decimal"></div>
          <div class="calc-field"><label>الهبوط المسموح ΔV%</label><input type="number" id="calcCV" value="3" inputmode="decimal"></div>
        `;
      case 'breaker':
        return `
          <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcBI" placeholder="أدخل تيار الحمل" inputmode="decimal"></div>
          <div class="calc-field"><label>نوع الحمل</label><select id="calcBType"><option value="1.25">حمل عادي (1.25)</option><option value="1.5">محرك (1.5)</option><option value="2">حمل ثقيل (2)</option></select></div>
        `;
      case 'voltdrop':
        return `
          <div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcVDI" placeholder="أدخل التيار" inputmode="decimal"></div>
          <div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcVDL" placeholder="أدخل الطول" inputmode="decimal"></div>
          <div class="calc-field"><label>مساحة المقطع A (mm²)</label><input type="number" id="calcVDA" placeholder="أدخل مساحة المقطع" inputmode="decimal"></div>
        `;
      case 'pf':
        return `
          <div class="calc-field"><label>القدرة الفعالة P (واط)</label><input type="number" id="calcPFP" placeholder="أدخل القدرة الفعالة" inputmode="decimal"></div>
          <div class="calc-field"><label>القدرة الظاهرية S (VA)</label><input type="number" id="calcPFS" placeholder="أدخل القدرة الظاهرية" inputmode="decimal"></div>
          <div class="calc-field"><label>القدرة غير الفعالة Q (VAR)</label><input type="number" id="calcPFQ" placeholder="أدخل القدرة غير الفعالة" inputmode="decimal"></div>
          <p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة ومعامل القدرة</p>
        `;
      case 'transformer':
        return `
          <div class="calc-field"><label>الجهد الابتدائي V1 (فولت)</label><input type="number" id="calcV1" placeholder="أدخل V1" inputmode="decimal"></div>
          <div class="calc-field"><label>الجهد الثانوي V2 (فولت)</label><input type="number" id="calcV2" placeholder="أدخل V2" inputmode="decimal"></div>
          <div class="calc-field"><label>التيار الابتدائي I1 (أمبير)</label><input type="number" id="calcI1" placeholder="أدخل I1 (اختياري)" inputmode="decimal"></div>
        `;
      case 'solar':
        return `
          <div class="calc-field"><label>الاستهلاك اليومي (واط.ساعة)</label><input type="number" id="calcWh" placeholder="أدخل الاستهلاك اليومي" inputmode="decimal"></div>
          <div class="calc-field"><label>جهد النظام V</label><input type="number" id="calcSV" value="24" inputmode="decimal"></div>
          <div class="calc-field"><label>ساعات الشمس الذروة</label><input type="number" id="calcSH" value="5" inputmode="decimal"></div>
        `;
      default:
        return null;
    }
  }

  function closeCalcModal() {
    dom.calcModalContainer.innerHTML = '';
  }

  function calculateResult(calcId) {
    const resultDiv = document.getElementById('calcResult');
    if (!resultDiv) return;

    let result = '';

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) || null : null;
    };

    switch (calcId) {
      case 'ohm': {
        const V = getVal('calcV');
        const I = getVal('calcI');
        const R = getVal('calcR');
        if (V && I) result = `المقاومة R = ${(V / I).toFixed(2)} Ω`;
        else if (V && R) result = `التيار I = ${(V / R).toFixed(2)} A`;
        else if (I && R) result = `الجهد V = ${(I * R).toFixed(2)} V`;
        else result = '⚠️ الرجاء إدخال قيمتين على الأقل';
        break;
      }
      case 'power': {
        const P = getVal('calcP');
        const V = getVal('calcV');
        const I = getVal('calcI');
        if (V && I) result = `القدرة P = ${(V * I).toFixed(2)} W`;
        else if (P && V) result = `التيار I = ${(P / V).toFixed(2)} A`;
        else if (P && I) result = `الجهد V = ${(P / I).toFixed(2)} V`;
        else result = '⚠️ الرجاء إدخال قيمتين على الأقل';
        break;
      }
      case 'cable': {
        const I = getVal('calcCI');
        const L = getVal('calcCL');
        const dV = getVal('calcCV') || 3;
        if (I && L) {
          const area = (2 * L * I) / (56 * dV);
          result = `مساحة المقطع التقريبية: ${area.toFixed(2)} mm²`;
        } else {
          result = '⚠️ الرجاء إدخال التيار والطول';
        }
        break;
      }
      case 'breaker': {
        const I = getVal('calcBI');
        const typeEl = document.getElementById('calcBType');
        const factor = typeEl ? parseFloat(typeEl.value) || 1.25 : 1.25;
        if (I) {
          const breakerSize = I * factor;
          const standardSizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250];
          const recommended = standardSizes.find((s) => s >= breakerSize) || breakerSize;
          result = `القاطع الموصى به: ${recommended} A (التيار المحسوب: ${breakerSize.toFixed(1)} A)`;
        } else {
          result = '⚠️ الرجاء إدخال تيار الحمل';
        }
        break;
      }
      case 'voltdrop': {
        const I = getVal('calcVDI');
        const L = getVal('calcVDL');
        const A = getVal('calcVDA');
        if (I && L && A) {
          const drop = (2 * L * I) / (56 * A);
          result = `هبوط الجهد: ${drop.toFixed(2)} V`;
        } else {
          result = '⚠️ الرجاء إدخال جميع القيم';
        }
        break;
      }
      case 'pf': {
        const P = getVal('calcPFP');
        const S = getVal('calcPFS');
        const Q = getVal('calcPFQ');
        if (P && S) {
          const pf = P / S;
          result = `معامل القدرة PF = ${pf.toFixed(3)}`;
        } else if (P && Q) {
          const SCalc = Math.sqrt(P * P + Q * Q);
          const pf = P / SCalc;
          result = `القدرة الظاهرية S = ${SCalc.toFixed(1)} VA | PF = ${pf.toFixed(3)}`;
        } else if (S && Q) {
          const PCalc = Math.sqrt(S * S - Q * Q);
          const pf = PCalc / S;
          result = `القدرة الفعالة P = ${PCalc.toFixed(1)} W | PF = ${pf.toFixed(3)}`;
        } else {
          result = '⚠️ الرجاء إدخال قيمتين على الأقل';
        }
        break;
      }
      case 'transformer': {
        const V1 = getVal('calcV1');
        const V2 = getVal('calcV2');
        const I1 = getVal('calcI1');
        if (V1 && V2) {
          const ratio = V1 / V2;
          result = `نسبة التحويل = ${ratio.toFixed(2)} : 1`;
          if (I1) result += ` | I2 = ${(I1 * ratio).toFixed(2)} A`;
        } else {
          result = '⚠️ الرجاء إدخال V1 و V2';
        }
        break;
      }
      case 'solar': {
        const Wh = getVal('calcWh');
        const V = getVal('calcSV') || 24;
        const H = getVal('calcSH') || 5;
        if (Wh) {
          const Ah = (Wh / V) * 1.3;
          const panelW = Wh / H;
          result = `سعة البطارية: ${Ah.toFixed(0)} Ah | قدرة الألواح: ${panelW.toFixed(0)} W`;
        } else {
          result = '⚠️ الرجاء إدخال الاستهلاك اليومي';
        }
        break;
      }
      default:
        result = '⚠️ الحاسبة غير متوفرة';
    }

    resultDiv.textContent = result;
    resultDiv.classList.add('show');
  }

  /* ========== Projects Page ========== */
  function renderProjectsPage() {
    const container = document.getElementById('page-projects');
    if (!container) return;

    const frag = document.createDocumentFragment();
    const title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '🛠️ المشاريع العملية';
    frag.appendChild(title);

    const list = document.createElement('div');
    list.className = 'projects-list';

    APP_DATA.projects.forEach((proj) => {
      const compsHtml = proj.components.map((c) => `<span class="project-comp">${c}</span>`).join('');
      const stepsHtml = proj.steps
        ? `<ol class="project-steps">${proj.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`
        : '';

      const card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${proj.title} - ${proj.level}`);
      card.innerHTML = `
        <h4>${proj.title}</h4>
        <span class="project-level">📌 ${proj.level}</span>
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
    const title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '📚 المكتبة';
    frag.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'library-grid';

    APP_DATA.categories.forEach((cat) => {
      const card = document.createElement('div');
      card.className = 'library-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', cat.title);
      card.innerHTML = `
        <span class="lib-icon" aria-hidden="true">${cat.icon}</span>
        <div class="lib-title">${cat.title}</div>
      `;
      card.addEventListener('click', () => navigateTo('category', cat.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo('category', cat.id);
        }
      });
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
    const title = document.createElement('h2');
    title.style.marginBottom = '16px';
    title.textContent = '📖 قاموس المصطلحات';
    frag.appendChild(title);

    const searchDiv = document.createElement('div');
    searchDiv.className = 'dict-search';
    searchDiv.innerHTML = `
      <input type="search" id="dictSearch" placeholder="🔍 ابحث عن مصطلح..." aria-label="البحث في القاموس" autocomplete="off">
    `;
    frag.appendChild(searchDiv);

    const list = document.createElement('div');
    list.className = 'dict-list';
    list.id = 'dictList';

    APP_DATA.dictionary.forEach((item) => {
      const dictItem = document.createElement('div');
      dictItem.className = 'dict-item';
      dictItem.setAttribute('data-search', `${item.ar} ${item.en}`.toLowerCase());
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

    const searchInput = document.getElementById('dictSearch');
    if (searchInput) {
      searchInput.addEventListener('input', filterDictionary);
    }
  }

  function filterDictionary() {
    const query = document.getElementById('dictSearch')?.value?.toLowerCase() || '';
    const items = document.querySelectorAll('#dictList .dict-item');

    items.forEach((item) => {
      const text = item.getAttribute('data-search') || '';
      item.style.display = text.includes(query) ? '' : 'none';
    });
  }

  /* ========== Quiz Page ========== */
  function renderQuizPage() {
    const container = document.getElementById('page-quiz');
    if (!container) return;

    if (typeof getQuizHTML === 'function') {
      container.innerHTML = getQuizHTML();
      setTimeout(() => {
        if (typeof initQuiz === 'function') {
          initQuiz();
        }
      }, 150);
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);">
          <p>⏳ جاري تحميل الاختبارات...</p>
        </div>
      `;
    }
  }

  /* ========== Keyboard Handler ========== */
  function handleKeyboard(e) {
    if (e.key === 'Escape') {
      if (dom.calcModalContainer.children.length > 0) {
        closeCalcModal();
      }
    }
  }

  /* ========== Toast ========== */
  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  /* ========== Public API ========== */
  window.navigateTo = navigateTo;
  window.openCalculator = openCalculator;
  window.closeCalcModal = closeCalcModal;
  window.calculateResult = calculateResult;
  window.filterDictionary = filterDictionary;
  window.showToast = showToast;

  /* ========== Start Application ========== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
