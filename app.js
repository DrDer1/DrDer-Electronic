/* ==========================================================================
   DrDer Electronic - Main Application Logic v4.2
   Fixed: Library page shows different content from home page
   ========================================================================== */

(function () {
  'use strict';

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

  var currentPage = 'home';
  var currentCategoryId = null;
  var deferredPrompt = null;
  var installButtonVisible = false;
  var isNavigating = false;
  var historyStack = [{ page: 'home', data: null }];
  var keyboardListener = null;

  var dom = {
    btnInstall: null,
    mainContent: null,
    calcModalContainer: null,
    toastContainer: null
  };

  function init() {
    dom.btnInstall = document.getElementById('btnInstall');
    dom.mainContent = document.getElementById('mainContent');
    dom.calcModalContainer = document.getElementById('calcModalContainer');
    dom.toastContainer = document.getElementById('toastContainer');

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

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(function (reg) {
        console.log('[SW] Registered');
        reg.addEventListener('updatefound', function () {
          var w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', function () {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 تحديث جديد متاح!', 'info');
            }
          });
        });
      })
      .catch(function (err) { console.warn('[SW] Failed:', err.message); });
  }

  function setupGlobalEventDelegation() {
    document.body.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-nav]');
      if (navBtn && !navBtn.closest('#calcModalContainer')) {
        e.preventDefault();
        navigateTo(navBtn.dataset.nav, null);
        return;
      }
      var catCard = e.target.closest('.category-card');
      if (catCard && catCard.dataset.catId) {
        navigateTo('category', catCard.dataset.catId);
        return;
      }
      var calcCard = e.target.closest('.calc-card');
      if (calcCard && calcCard.dataset.calcId) {
        openCalculator(calcCard.dataset.calcId);
        return;
      }
      var libCard = e.target.closest('.library-card');
      if (libCard && libCard.dataset.catId) {
        navigateTo('category', libCard.dataset.catId);
        return;
      }
      var breadBtn = e.target.closest('.breadcrumb span[data-breadcrumb]');
      if (breadBtn) {
        var t = breadBtn.dataset.breadcrumb;
        if (t === 'home') navigateTo('home', null);
        else if (t === 'category') navigateTo('category', currentCategoryId);
        return;
      }
      var revLink = e.target.closest('.review-suggestion li[data-category]');
      if (revLink) {
        navigateTo('category', revLink.dataset.category);
        return;
      }
    });
  }

  function setupInstallListeners() {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });
    window.addEventListener('appinstalled', function () {
      hideInstallButton();
      deferredPrompt = null;
      showToast('✅ تم تثبيت التطبيق', 'success');
    });
    if (window.matchMedia('(display-mode: standalone)').matches) hideInstallButton();
    if (dom.btnInstall) dom.btnInstall.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) {
        if (r.outcome === 'accepted') { hideInstallButton(); showToast('✅ جاري التثبيت...', 'success'); }
        deferredPrompt = null;
      });
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

  function handleInitialRoute() {
    var hash = window.location.hash;
    if (hash) {
      var parts = hash.replace('#', '').split('/');
      if (PAGE_MAP[parts[0]]) {
        navigateTo(parts[0], parts[1] || null, true);
        return;
      }
    }
    history.replaceState({ page: 'home', data: null }, '', '#home');
  }

  function pushHistory(page, data) {
    var s = { page: page, data: data, timestamp: Date.now() };
    historyStack.push(s);
    if (historyStack.length > MAX_HISTORY_STACK) historyStack.shift();
    history.pushState(s, '', data ? '#' + page + '/' + data : '#' + page);
  }

  function handlePopState(e) {
    if (isNavigating) return;
    if (e.state && e.state.page) {
      isNavigating = true;
      navigateTo(e.state.page, e.state.data, true);
      isNavigating = false;
    } else {
      isNavigating = true;
      navigateTo('home', null, true);
      isNavigating = false;
    }
  }

  function navigateTo(page, data, isPop) {
    if (isNavigating && !isPop) return;
    var cfg = PAGE_MAP[page];
    if (!cfg) { navigateTo('home', null); return; }
    isNavigating = true;
    currentPage = page;
    if (page === 'category') currentCategoryId = data;
    cleanupCurrentPage();
    switchPage(page);
    updateActiveTab(page);
    if (!isPop) pushHistory(page, data);
    renderPage(page, data);
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(function () { isNavigating = false; });
  }

  function switchPage(page) {
    var tid = PAGE_MAP[page].containerId;
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.toggle('active', pages[i].id === tid);
    }
  }

  function updateActiveTab(page) {
    var sel = PAGE_MAP[page].tabSelector;
    var tabs = document.querySelectorAll('.nav-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
      tabs[i].setAttribute('aria-selected', 'false');
    }
    if (sel) {
      var at = document.querySelector('.nav-tab' + sel);
      if (at) { at.classList.add('active'); at.setAttribute('aria-selected', 'true'); }
    }
  }

  function cleanupCurrentPage() { closeCalcModal(); }

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
    }
  }

  function renderHomePage() {
    var c = document.getElementById('page-home');
    if (!c) return;
    var f = document.createDocumentFragment();
    var h = document.createElement('div');
    h.className = 'hero-section';
    h.innerHTML = '<h1 class="hero-title">⚡ DrDer Electronic</h1><p class="hero-subtitle">مختبر هندسة كهربائية وإلكترونية متكامل للطلاب والمهندسين والفنيين</p>';
    f.appendChild(h);
    var g = document.createElement('div');
    g.className = 'categories-grid';
    APP_DATA.categories.forEach(function (cat) {
      var card = document.createElement('div');
      card.className = 'category-card';
      card.setAttribute('data-cat-id', cat.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<span class="cat-icon">' + cat.icon + '</span><div class="cat-title">' + cat.title + '</div><div class="cat-count">' + cat.lessons.length + ' دروس</div>';
      g.appendChild(card);
    });
    f.appendChild(g);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function renderCategoryPage(catId) {
    var cat = APP_DATA.categories.find(function (x) { return x.id === catId; });
    if (!cat) { navigateTo('home', null); return; }
    currentCategoryId = catId;
    var c = document.getElementById('page-category');
    if (!c) return;
    var f = document.createDocumentFragment();
    var b = document.createElement('div');
    b.className = 'breadcrumb';
    b.innerHTML = '<span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span><span class="separator">›</span><span>' + cat.icon + ' ' + cat.title + '</span>';
    f.appendChild(b);
    var l = document.createElement('div');
    l.className = 'lesson-list';
    cat.lessons.forEach(function (les, i) {
      var param = cat.id + '|' + les.id;
      var item = document.createElement('div');
      item.className = 'lesson-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.innerHTML = '<div class="lesson-num">' + (i + 1) + '</div><div class="lesson-info"><h4>' + les.title + '</h4><p>' + les.keyPoints.slice(0, 3).join(' • ') + '</p></div><span class="lesson-arrow">◀</span>';
      item.addEventListener('click', function () { navigateTo('lesson', param); });
      l.appendChild(item);
    });
    f.appendChild(l);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function renderLessonDetail(param) {
    if (!param) { navigateTo('home', null); return; }
    var parts = param.split('|');
    var cat = APP_DATA.categories.find(function (x) { return x.id === parts[0]; });
    if (!cat) { navigateTo('home', null); return; }
    var les = cat.lessons.find(function (x) { return x.id === parts[1]; });
    if (!les) { navigateTo('category', parts[0]); return; }
    var c = document.getElementById('page-lesson');
    if (!c) return;
    var f = document.createDocumentFragment();
    var b = document.createElement('div');
    b.className = 'breadcrumb';
    b.innerHTML = '<span data-breadcrumb="home" role="button" tabindex="0">🏠 الرئيسية</span><span class="separator">›</span><span data-breadcrumb="category" role="button" tabindex="0">' + cat.icon + ' ' + cat.title + '</span><span class="separator">›</span><span>' + les.title + '</span>';
    f.appendChild(b);
    var d = document.createElement('div');
    d.className = 'lesson-detail';
    d.innerHTML = '<h3>' + les.title + '</h3><div class="lesson-content"><p>' + les.content + '</p></div><div class="key-points">' + les.keyPoints.map(function (k) { return '<span class="key-point">' + k + '</span>'; }).join('') + '</div><div class="formula-box"><div class="formula" dir="ltr">' + les.formula + '</div><div class="formula-desc">' + les.formulaDesc + '</div></div>';
    f.appendChild(d);
    var btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.style.marginTop = '12px';
    btn.textContent = '↩ العودة للدروس';
    btn.addEventListener('click', function () { navigateTo('category', cat.id); });
    f.appendChild(btn);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function renderSimulatorPage() {
    var c = document.getElementById('page-simulator');
    if (!c) return;
    if (typeof window.getSimulatorHTML === 'function') {
      c.innerHTML = window.getSimulatorHTML();
      setTimeout(function () {
        if (typeof window.initSimulator === 'function') window.initSimulator();
      }, 300);
    } else {
      c.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><p>⏳ جاري تحميل المحاكي...</p></div>';
    }
  }

  function renderCalculatorsPage() {
    var c = document.getElementById('page-calculators');
    if (!c) return;
    var f = document.createDocumentFragment();
    var t = document.createElement('h2');
    t.style.marginBottom = '16px';
    t.textContent = '🧮 الحاسبات الهندسية';
    f.appendChild(t);
    var g = document.createElement('div');
    g.className = 'calc-grid';
    APP_DATA.calculators.forEach(function (calc) {
      var card = document.createElement('div');
      card.className = 'calc-card';
      card.setAttribute('data-calc-id', calc.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<span class="calc-icon">' + calc.icon + '</span><div class="calc-name">' + calc.name + '</div><div class="calc-desc">' + (calc.desc || '') + '</div>';
      g.appendChild(card);
    });
    f.appendChild(g);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function openCalculator(calcId) {
    var calc = APP_DATA.calculators.find(function (x) { return x.id === calcId; });
    if (!calc) return;
    var fh = getCalculatorFields(calcId);
    if (!fh) { showToast('⚠️ الحاسبة قيد التطوير', 'error'); return; }
    var overlay = document.createElement('div');
    overlay.className = 'calc-modal-overlay';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCalcModal(); });
    var modal = document.createElement('div');
    modal.className = 'calc-modal';
    modal.innerHTML = '<h3>' + calc.icon + ' ' + calc.name + '</h3>' + fh + '<div class="calc-result" id="calcResult"></div><div class="calc-error" id="calcError"></div>';
    var cb = document.createElement('button');
    cb.className = 'btn btn-primary btn-block';
    cb.style.marginTop = '12px';
    cb.textContent = '🧮 احسب';
    cb.addEventListener('click', function () { calculateResult(calcId); });
    modal.appendChild(cb);
    var cl = document.createElement('button');
    cl.className = 'btn btn-outline btn-block';
    cl.style.marginTop = '8px';
    cl.textContent = 'إغلاق';
    cl.addEventListener('click', closeCalcModal);
    modal.appendChild(cl);
    overlay.appendChild(modal);
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.appendChild(overlay);
    dom.calcModalContainer.removeAttribute('hidden');
    setTimeout(function () {
      var fi = overlay.querySelector('input');
      if (fi) fi.focus();
    }, 150);
  }

  function getCalculatorFields(id) {
    var F = {
      ohm: '<div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" min="0" step="any"></div><div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" min="0" step="any"></div><div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcR" placeholder="أدخل المقاومة" min="0" step="any"></div><p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">أدخل قيمتين لتحصل على الثالثة</p>',
      power: '<div class="calc-field"><label>القدرة P (واط)</label><input type="number" id="calcP" placeholder="أدخل القدرة" min="0" step="any"></div><div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcV" placeholder="أدخل الجهد" min="0" step="any"></div><div class="calc-field"><label>التيار I (أمبير)</label><input type="number" id="calcI" placeholder="أدخل التيار" min="0" step="any"></div><p style="color:var(--text-muted);font-size:0.8rem;text-align:center;">P = V × I</p>',
      cable: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcCI" placeholder="أدخل التيار" min="0" step="any"></div><div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcCL" placeholder="أدخل الطول" min="0" step="any"></div><div class="calc-field"><label>الهبوط المسموح ΔV%</label><input type="number" id="calcCV" value="3" min="0.1" max="20" step="any"></div>',
      breaker: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcBI" placeholder="أدخل تيار الحمل" min="0" step="any"></div><div class="calc-field"><label>نوع الحمل</label><select id="calcBType"><option value="1.25">حمل عادي</option><option value="1.5">محرك صغير</option><option value="2">حمل ثقيل</option></select></div>',
      voltdrop: '<div class="calc-field"><label>تيار الحمل I (أمبير)</label><input type="number" id="calcVDI" placeholder="أدخل التيار" min="0" step="any"></div><div class="calc-field"><label>طول الكابل L (متر)</label><input type="number" id="calcVDL" placeholder="أدخل الطول" min="0" step="any"></div><div class="calc-field"><label>مساحة المقطع A (mm²)</label><input type="number" id="calcVDA" placeholder="أدخل المساحة" min="0.1" step="any"></div>',
      pf: '<div class="calc-field"><label>القدرة الفعالة P (واط)</label><input type="number" id="calcPFP" placeholder="أدخل P" min="0" step="any"></div><div class="calc-field"><label>القدرة الظاهرية S (VA)</label><input type="number" id="calcPFS" placeholder="أدخل S" min="0" step="any"></div><div class="calc-field"><label>القدرة غير الفعالة Q (VAR)</label><input type="number" id="calcPFQ" placeholder="أدخل Q" min="0" step="any"></div>',
      transformer: '<div class="calc-field"><label>الجهد الابتدائي V1 (فولت)</label><input type="number" id="calcV1" placeholder="أدخل V1" min="0" step="any"></div><div class="calc-field"><label>الجهد الثانوي V2 (فولت)</label><input type="number" id="calcV2" placeholder="أدخل V2" min="0" step="any"></div><div class="calc-field"><label>التيار الابتدائي I1 (أمبير)</label><input type="number" id="calcI1" placeholder="اختياري" min="0" step="any"></div>',
      solar: '<div class="calc-field"><label>الاستهلاك اليومي (واط.ساعة)</label><input type="number" id="calcWh" placeholder="أدخل الاستهلاك" min="0" step="any"></div><div class="calc-field"><label>جهد النظام</label><select id="calcSV"><option value="12">12V</option><option value="24" selected>24V</option><option value="48">48V</option></select></div><div class="calc-field"><label>ساعات الشمس</label><input type="number" id="calcSH" value="5" min="1" max="12" step="any"></div>',
      motor: '<div class="calc-field"><label>القدرة P (كيلوواط)</label><input type="number" id="calcMP" placeholder="أدخل القدرة" min="0" step="any"></div><div class="calc-field"><label>الجهد V (فولت)</label><input type="number" id="calcMV" placeholder="أدخل الجهد" min="0" step="any"></div><div class="calc-field"><label>معامل القدرة PF</label><input type="number" id="calcMPF" value="0.85" min="0.1" max="1" step="0.01"></div>',
      led: '<div class="calc-field"><label>جهد المصدر Vs (فولت)</label><input type="number" id="calcLVs" placeholder="أدخل Vs" min="0" step="any"></div><div class="calc-field"><label>جهد LED Vf (فولت)</label><input type="number" id="calcLVf" value="2" min="0" step="any"></div><div class="calc-field"><label>تيار LED If (mA)</label><input type="number" id="calcLIf" value="20" min="1" step="any"></div>',
      rc: '<div class="calc-field"><label>المقاومة R (أوم)</label><input type="number" id="calcRCR" placeholder="أدخل R" min="0" step="any"></div><div class="calc-field"><label>السعة C (µF)</label><input type="number" id="calcRCC" placeholder="أدخل C" min="0" step="any"></div>',
      voltage_divider: '<div class="calc-field"><label>جهد الدخل Vin (فولت)</label><input type="number" id="calcVDVin" placeholder="أدخل Vin" min="0" step="any"></div><div class="calc-field"><label>المقاومة R1 (أوم)</label><input type="number" id="calcVDR1" placeholder="أدخل R1" min="0" step="any"></div><div class="calc-field"><label>المقاومة R2 (أوم)</label><input type="number" id="calcVDR2" placeholder="أدخل R2" min="0" step="any"></div>'
    };
    return F[id] || null;
  }

  function closeCalcModal() {
    dom.calcModalContainer.innerHTML = '';
    dom.calcModalContainer.setAttribute('hidden', '');
  }

  function calculateResult(calcId) {
    var rd = document.getElementById('calcResult');
    var ed = document.getElementById('calcError');
    if (!rd) return;
    rd.classList.remove('show');
    if (ed) ed.classList.remove('show');
    var gv = function (id) { var el = document.getElementById(id); if (!el) return null; var v = parseFloat(el.value); return isNaN(v) ? null : v; };
    var result = '', error = '';
    try {
      if (calcId === 'ohm') {
        var V = gv('calcV'), I = gv('calcI'), R = gv('calcR');
        if ((V ? 1 : 0) + (I ? 1 : 0) + (R ? 1 : 0) < 2) { error = '⚠️ أدخل قيمتين'; }
        else if (V && I && I === 0) { error = '⚠️ تيار = 0'; }
        else if (V && I) result = 'R = ' + (V / I).toFixed(3) + ' Ω';
        else if (V && R) result = R === 0 ? '⚠️ R = 0' : 'I = ' + (V / R).toFixed(3) + ' A';
        else if (I && R) result = 'V = ' + (I * R).toFixed(2) + ' V';
      } else if (calcId === 'power') {
        var P = gv('calcP'), V2 = gv('calcV'), I2 = gv('calcI');
        if ((P ? 1 : 0) + (V2 ? 1 : 0) + (I2 ? 1 : 0) < 2) { error = '⚠️ أدخل قيمتين'; }
        else if (V2 && I2) result = 'P = ' + (V2 * I2).toFixed(2) + ' W';
        else if (P && V2) result = V2 === 0 ? '⚠️ V = 0' : 'I = ' + (P / V2).toFixed(3) + ' A';
        else if (P && I2) result = I2 === 0 ? '⚠️ I = 0' : 'V = ' + (P / I2).toFixed(2) + ' V';
      } else if (calcId === 'cable') {
        var Ic = gv('calcCI'), Lc = gv('calcCL'), dVc = gv('calcCV') || 3;
        if (!Ic || !Lc) { error = '⚠️ أدخل التيار والطول'; }
        else result = 'المقطع ≈ ' + ((2 * Lc * Ic) / (56 * dVc)).toFixed(2) + ' mm²';
      } else if (calcId === 'breaker') {
        var Ib = gv('calcBI'); if (!Ib) { error = '⚠️ أدخل تيار الحمل'; }
        else { var sel = document.getElementById('calcBType'); var f = sel ? parseFloat(sel.value) : 1.25; var sz = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250]; var bs = Ib * f; var rec = sz.find(function (s) { return s >= bs; }) || Math.ceil(bs / 5) * 5; result = 'القاطع: ' + rec + ' A'; }
      } else if (calcId === 'voltdrop') {
        var Iv = gv('calcVDI'), Lv = gv('calcVDL'), Av = gv('calcVDA');
        if (!Iv || !Lv || !Av) { error = '⚠️ أدخل جميع القيم'; }
        else result = 'هبوط الجهد: ' + ((2 * Lv * Iv) / (56 * Av)).toFixed(2) + ' V';
      } else if (calcId === 'pf') {
        var Pp = gv('calcPFP'), Sp = gv('calcPFS'), Qp = gv('calcPFQ');
        if ((Pp ? 1 : 0) + (Sp ? 1 : 0) + (Qp ? 1 : 0) < 2) { error = '⚠️ أدخل قيمتين'; }
        else if (Pp !== null && Sp !== null) { if (Pp > Sp) { error = '⚠️ P > S'; } else result = 'PF = ' + (Pp / Sp).toFixed(4); }
        else if (Pp !== null && Qp !== null) { var Sc = Math.sqrt(Pp * Pp + Qp * Qp); result = 'S = ' + Sc.toFixed(1) + ' VA, PF = ' + (Pp / Sc).toFixed(4); }
        else if (Sp !== null && Qp !== null) { if (Sp < Qp) { error = '⚠️ S < Q'; } else { var Pc = Math.sqrt(Math.max(0, Sp * Sp - Qp * Qp)); result = 'P = ' + Pc.toFixed(1) + ' W, PF = ' + (Pc / Sp).toFixed(4); } }
      } else if (calcId === 'transformer') {
        var Vt1 = gv('calcV1'), Vt2 = gv('calcV2'), It1 = gv('calcI1');
        if (!Vt1 || !Vt2) { error = '⚠️ أدخل V1 و V2'; }
        else { var ratio = Vt1 / Vt2; result = 'نسبة = ' + ratio.toFixed(2) + ' : 1'; if (It1 !== null) result += ' | I2 = ' + (It1 * ratio).toFixed(2) + ' A'; }
      } else if (calcId === 'solar') {
        var Wh = gv('calcWh'), Vs = parseFloat((document.getElementById('calcSV') || {}).value) || 24, Hs = gv('calcSH') || 5;
        if (!Wh) { error = '⚠️ أدخل الاستهلاك'; }
        else result = 'بطارية: ' + Math.ceil((Wh / Vs) * 1.3) + ' Ah | ألواح: ' + Math.ceil((Wh / Hs) * 1.2) + ' W';
      } else if (calcId === 'motor') {
        var Pm = gv('calcMP'), Vm = gv('calcMV'), PFm = gv('calcMPF') || 0.85;
        if (!Pm || !Vm) { error = '⚠️ أدخل P و V'; }
        else result = 'تيار ≈ ' + ((Pm * 1000) / (1.732 * Vm * PFm)).toFixed(2) + ' A';
      } else if (calcId === 'led') {
        var Vls = gv('calcLVs'), Vlf = gv('calcLVf') || 2, Ilf = gv('calcLIf') || 20;
        if (!Vls) { error = '⚠️ أدخل Vs'; }
        else if (Vls <= Vlf) { error = '⚠️ Vs يجب > Vf'; }
        else result = 'R = ' + Math.round((Vls - Vlf) / (Ilf / 1000)) + ' Ω';
      } else if (calcId === 'rc') {
        var Rrc = gv('calcRCR'), Crc = gv('calcRCC');
        if (!Rrc || !Crc) { error = '⚠️ أدخل R و C'; }
        else { var tau = Rrc * Crc / 1e6; result = 'τ = ' + tau.toFixed(4) + 's | 5τ = ' + (tau * 5).toFixed(4) + 's'; }
      } else if (calcId === 'voltage_divider') {
        var Vdv = gv('calcVDVin'), Rd1 = gv('calcVDR1'), Rd2 = gv('calcVDR2');
        if (!Vdv || !Rd1 || !Rd2) { error = '⚠️ أدخل جميع القيم'; }
        else result = 'Vout = ' + (Vdv * Rd2 / (Rd1 + Rd2)).toFixed(2) + ' V';
      }
    } catch (ex) { error = '⚠️ خطأ في الحساب'; }
    if (error && ed) { ed.textContent = error; ed.classList.add('show'); }
    else if (result) { rd.textContent = result; rd.classList.add('show'); }
  }

  function renderProjectsPage() {
    var c = document.getElementById('page-projects');
    if (!c) return;
    var f = document.createDocumentFragment();
    var t = document.createElement('h2');
    t.style.marginBottom = '16px';
    t.textContent = '🛠️ المشاريع العملية';
    f.appendChild(t);
    var l = document.createElement('div');
    l.className = 'projects-list';
    APP_DATA.projects.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = '<h4>' + p.title + '</h4><span class="project-level ' + (p.levelClass || 'beginner') + '">📌 ' + p.level + '</span><div class="project-components">' + p.components.map(function (c) { return '<span class="project-comp">' + c + '</span>'; }).join('') + '</div>' + (p.steps ? '<ol class="project-steps">' + p.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : '');
      card.addEventListener('click', function () { navigateTo('simulator', null); });
      l.appendChild(card);
    });
    f.appendChild(l);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function renderLibraryPage() {
    var c = document.getElementById('page-library');
    if (!c) return;
    var f = document.createDocumentFragment();
    var t = document.createElement('h2');
    t.style.marginBottom = '16px';
    t.textContent = '📚 المكتبة المرجعية';
    f.appendChild(t);

    var desc = document.createElement('p');
    desc.style.cssText = 'color:var(--text-secondary);margin-bottom:20px;font-size:0.9rem;';
    desc.textContent = 'تصفح جميع أقسام الهندسة الكهربائية والإلكترونية مع دروس تفصيلية ومراجع شاملة.';
    f.appendChild(desc);

    var g = document.createElement('div');
    g.className = 'library-grid';

    var libItems = [
      { id: 'basics', title: 'أساسيات الكهرباء', icon: '⚡', desc: 'قانون أوم، كيرشوف، القدرة، التيار والمتردد' },
      { id: 'electronics', title: 'الإلكترونيات', icon: '🔌', desc: 'مقاومات، مكثفات، ترانزستورات، دوائر متكاملة' },
      { id: 'components', title: 'العناصر الكهربائية', icon: '💡', desc: 'ريليهات، كونتاكتورات، قواطع، مفاتيح' },
      { id: 'motors', title: 'المحركات والمولدات', icon: '⚙️', desc: 'محركات DC/AC، طرق التشغيل، المولدات' },
      { id: 'control', title: 'التحكم الكهربائي', icon: '🎛️', desc: 'PLC، SCADA، دوائر كلاسيكية، VFD' },
      { id: 'solar', title: 'الطاقة الشمسية', icon: '☀️', desc: 'ألواح، بطاريات، انفرتر، حسابات النظام' },
      { id: 'safety', title: 'السلامة المهنية', icon: '🛡️', desc: 'LOTO، مهمات وقاية، إسعافات، مخاطر' }
    ];

    libItems.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'library-card';
      card.setAttribute('data-cat-id', item.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.style.cssText = 'padding:20px 14px;';
      card.innerHTML = '<span class="lib-icon" style="font-size:2.5rem;display:block;margin-bottom:10px;">' + item.icon + '</span><div class="lib-title" style="font-size:0.9rem;font-weight:700;margin-bottom:6px;">' + item.title + '</div><div style="font-size:0.72rem;color:var(--text-muted);line-height:1.5;">' + item.desc + '</div>';
      g.appendChild(card);
    });

    f.appendChild(g);

    var info = document.createElement('p');
    info.style.cssText = 'text-align:center;margin-top:24px;color:var(--text-muted);font-size:0.8rem;';
    info.textContent = '📌 انقر على أي قسم للاطلاع على الدروس والمراجع الكاملة';
    f.appendChild(info);

    c.innerHTML = '';
    c.appendChild(f);
  }

  function renderDictionaryPage() {
    var c = document.getElementById('page-dictionary');
    if (!c) return;
    var f = document.createDocumentFragment();
    var t = document.createElement('h2');
    t.style.marginBottom = '16px';
    t.textContent = '📖 قاموس المصطلحات';
    f.appendChild(t);
    var sd = document.createElement('div');
    sd.className = 'dict-search';
    var si = document.createElement('input');
    si.type = 'search';
    si.id = 'dictSearch';
    si.placeholder = '🔍 ابحث عن مصطلح...';
    si.setAttribute('aria-label', 'البحث في القاموس');
    si.setAttribute('autocomplete', 'off');
    si.addEventListener('input', debounce(filterDictionary, 150));
    sd.appendChild(si);
    f.appendChild(sd);
    var l = document.createElement('div');
    l.className = 'dict-list';
    l.id = 'dictList';
    APP_DATA.dictionary.forEach(function (item) {
      var di = document.createElement('div');
      di.className = 'dict-item';
      di.setAttribute('data-search', (item.ar + ' ' + item.en).toLowerCase());
      di.innerHTML = '<div class="dict-term">' + item.ar + '</div><div class="dict-english">🇬🇧 ' + item.en + '</div><div class="dict-desc">' + item.desc + '</div>';
      l.appendChild(di);
    });
    f.appendChild(l);
    c.innerHTML = '';
    c.appendChild(f);
  }

  function filterDictionary() {
    var q = (document.getElementById('dictSearch') ? document.getElementById('dictSearch').value : '').toLowerCase();
    var items = document.querySelectorAll('#dictList .dict-item');
    var vc = 0;
    items.forEach(function (item) {
      var t = item.getAttribute('data-search') || '';
      var v = q === '' || t.indexOf(q) !== -1;
      item.style.display = v ? '' : 'none';
      if (v) vc++;
    });
    var ee = document.querySelector('.dict-empty');
    if (ee) ee.remove();
    if (vc === 0 && q !== '') {
      var l = document.getElementById('dictList');
      if (l) { var em = document.createElement('div'); em.className = 'dict-empty'; em.textContent = '🔍 لا توجد نتائج لـ "' + q + '"'; l.appendChild(em); }
    }
  }

  function renderQuizPage() {
    var c = document.getElementById('page-quiz');
    if (!c) return;
    if (typeof window.getQuizHTML === 'function') {
      c.innerHTML = window.getQuizHTML();
      setTimeout(function () { if (typeof window.initQuiz === 'function') window.initQuiz(); }, 200);
    } else {
      c.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><p>⏳ جاري تحميل الاختبارات...</p></div>';
    }
  }

  function handleGlobalKeyboard(e) {
    if (e.key === 'Escape' && dom.calcModalContainer && !dom.calcModalContainer.hasAttribute('hidden')) {
      closeCalcModal();
    }
  }

  function showToast(message, type) {
    if (!dom.toastContainer) return;
    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' toast-' + type : '');
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    var rm = function () { toast.classList.add('toast-exit'); toast.addEventListener('animationend', function () { if (toast.parentNode) toast.remove(); }, { once: true }); };
    var tid = setTimeout(rm, TOAST_DURATION);
    toast.addEventListener('click', function () { clearTimeout(tid); rm(); });
  }

  function debounce(fn, delay) {
    var tid;
    return function () { var ctx = this, args = arguments; clearTimeout(tid); tid = setTimeout(function () { fn.apply(ctx, args); }, delay); };
  }

  window.navigateTo = navigateTo;
  window.openCalculator = openCalculator;
  window.closeCalcModal = closeCalcModal;
  window.calculateResult = calculateResult;
  window.filterDictionary = filterDictionary;
  window.showToast = showToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
