/* ==========================================================================
   DrDer Electronic - Advanced Quiz System v2.0
   Random Questions | Shuffled Options | Detailed Results | Review Suggestions
   ========================================================================== */

(function () {
  'use strict';

  /* ========== Constants ========== */
  const QUESTIONS_PER_QUIZ = 10;

  /* ========== State ========== */
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let answered = false;
  let totalQuestions = QUESTIONS_PER_QUIZ;
  let quizActive = false;
  let wrongAnswers = [];
  let answeredQuestions = [];

  /* ========== Category Name Mapping ========== */
  const categoryNames = {
    basics: 'أساسيات الكهرباء',
    electronics: 'الإلكترونيات',
    components: 'العناصر الكهربائية',
    motors: 'المحركات والمولدات',
    control: 'التحكم الكهربائي',
    solar: 'الطاقة الشمسية',
    safety: 'السلامة المهنية'
  };

  /* ========== Get HTML ========== */
  function getQuizHTML() {
    return `
      <div class="quiz-container" id="quizContainer">
        <div class="quiz-header">
          <span class="quiz-score" id="quizScoreDisplay">النقاط: 0</span>
          <span id="quizQuestionNum">السؤال 1 / ${totalQuestions}</span>
        </div>
        <div class="quiz-progress">
          <div class="quiz-progress-fill" id="quizProgressFill" style="width: 0%;"></div>
        </div>
        <div class="quiz-question-card" id="quizQuestionCard">
          <div class="quiz-category-tag" id="quizCategoryTag"></div>
          <h3 id="quizQuestionText">جاري تحميل الأسئلة...</h3>
        </div>
        <div class="quiz-options" id="quizOptions"></div>
        <div class="quiz-feedback" id="quizFeedback"></div>
        <div class="quiz-explanation" id="quizExplanation" style="display:none;"></div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnNextQuestion" style="display:none;">التالي ▶</button>
          <button class="btn btn-outline" id="btnRestartQuiz" style="display:none;">🔄 اختبار جديد</button>
        </div>
        <div class="quiz-result" id="quizResult" style="display:none;"></div>
      </div>
    `;
  }

  /* ========== Initialize ========== */
  function initQuiz() {
    if (typeof QUIZ_DATA === 'undefined' || !QUIZ_DATA || QUIZ_DATA.length === 0) {
      const questionText = document.getElementById('quizQuestionText');
      if (questionText) questionText.textContent = '⚠️ لا توجد أسئلة متاحة حالياً.';
      return;
    }

    resetQuizState();
    prepareQuestions();
    updateScoreDisplay();
    showQuestion();

    document.getElementById('btnNextQuestion')?.addEventListener('click', handleNextQuestion);
    document.getElementById('btnRestartQuiz')?.addEventListener('click', restartQuiz);
  }

  function resetQuizState() {
    currentIndex = 0;
    score = 0;
    answered = false;
    quizActive = true;
    wrongAnswers = [];
    answeredQuestions = [];
  }

  function prepareQuestions() {
    const shuffled = shuffleArray([...QUIZ_DATA]);
    questions = shuffled.slice(0, QUESTIONS_PER_QUIZ);
    totalQuestions = questions.length;

    questions = questions.map((q) => ({
      ...q,
      shuffledOptions: shuffleArray(
        q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }))
      )
    }));
  }

  /* ========== Show Question ========== */
  function showQuestion() {
    if (currentIndex >= totalQuestions) {
      showFinalResult();
      return;
    }

    answered = false;
    const question = questions[currentIndex];

    document.getElementById('quizQuestionText').textContent = question.question;
    document.getElementById('quizQuestionNum').textContent = `السؤال ${currentIndex + 1} / ${totalQuestions}`;
    document.getElementById('quizProgressFill').style.width = `${(currentIndex / totalQuestions) * 100}%`;

    const categoryTag = document.getElementById('quizCategoryTag');
    if (categoryTag && question.categoryName) {
      categoryTag.textContent = question.categoryName;
      categoryTag.style.display = '';
    } else if (categoryTag) {
      categoryTag.style.display = 'none';
    }

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    question.shuffledOptions.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = option.text;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.addEventListener('click', () => selectAnswer(option.originalIndex));
      optionsContainer.appendChild(btn);
    });

    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('quizExplanation').style.display = 'none';
    document.getElementById('btnNextQuestion').style.display = 'none';
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizQuestionCard').style.display = '';
    document.getElementById('quizOptions').style.display = '';
    document.getElementById('btnRestartQuiz').style.display = 'none';
  }

  /* ========== Select Answer ========== */
  function selectAnswer(selectedIndex) {
    if (answered || !quizActive) return;
    answered = true;

    const question = questions[currentIndex];
    const isCorrect = selectedIndex === question.correct;
    const optionButtons = document.querySelectorAll('#quizOptions .quiz-option');

    optionButtons.forEach((btn, index) => {
      btn.style.pointerEvents = 'none';
      const originalIndex = question.shuffledOptions[index].originalIndex;

      if (originalIndex === question.correct) {
        btn.classList.add('correct');
      } else if (originalIndex === selectedIndex && !isCorrect) {
        btn.classList.add('wrong');
      }

      if (originalIndex === selectedIndex) {
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
      }
    });

    const feedback = document.getElementById('quizFeedback');
    const explanation = document.getElementById('quizExplanation');

    answeredQuestions.push({
      question: question.question,
      userAnswer: selectedIndex,
      correctAnswer: question.correct,
      isCorrect,
      category: question.category
    });

    if (isCorrect) {
      score++;
      feedback.textContent = '✅ إجابة صحيحة! أحسنت.';
      feedback.style.color = 'var(--success)';
    } else {
      feedback.textContent = '❌ إجابة خاطئة.';
      feedback.style.color = 'var(--danger)';
      wrongAnswers.push({
        question: question.question,
        userAnswer: selectedIndex,
        correctAnswer: question.correct,
        options: question.options,
        explanation: question.explanation,
        category: question.category
      });
    }

    if (question.explanation) {
      explanation.textContent = `💡 ${question.explanation}`;
      explanation.style.display = 'block';
    }

    updateScoreDisplay();

    const progressFill = document.getElementById('quizProgressFill');
    progressFill.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;

    const btnNext = document.getElementById('btnNextQuestion');
    if (currentIndex < totalQuestions - 1) {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = 'التالي ▶';
    } else {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = '📊 عرض النتيجة';
    }
  }

  /* ========== Next Question ========== */
  function handleNextQuestion() {
    if (!answered && quizActive) return;

    if (currentIndex >= totalQuestions - 1) {
      showFinalResult();
      return;
    }

    currentIndex++;
    showQuestion();
  }

  function updateScoreDisplay() {
    const display = document.getElementById('quizScoreDisplay');
    if (display) display.textContent = `النقاط: ${score}`;
  }

  /* ========== Final Result ========== */
  function showFinalResult() {
    quizActive = false;

    document.getElementById('quizQuestionCard').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('quizExplanation').style.display = 'none';
    document.getElementById('btnNextQuestion').style.display = 'none';

    const resultDiv = document.getElementById('quizResult');
    resultDiv.style.display = 'block';

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    let grade, gradeColor, gradeBg;
    if (percentage >= 90) {
      grade = 'ممتاز 🌟';
      gradeColor = 'var(--success)';
      gradeBg = 'var(--success-dim)';
    } else if (percentage >= 75) {
      grade = 'جيد جداً 👏';
      gradeColor = 'var(--info)';
      gradeBg = 'var(--info-dim)';
    } else if (percentage >= 60) {
      grade = 'جيد 📚';
      gradeColor = 'var(--warning)';
      gradeBg = 'var(--warning-dim)';
    } else if (percentage >= 40) {
      grade = 'مقبول 💪';
      gradeColor = 'var(--danger)';
      gradeBg = 'var(--danger-dim)';
    } else {
      grade = 'يحتاج تحسين 📖';
      gradeColor = 'var(--danger)';
      gradeBg = 'var(--danger-dim)';
    }

    let resultHTML = `
      <div class="score-circle" style="border-color:${gradeColor};color:${gradeColor};">${percentage}%</div>
      <h3 style="margin-bottom:8px;">النتيجة النهائية</h3>
      <p style="font-size:1.1rem;margin-bottom:4px;">${score} / ${totalQuestions} إجابات صحيحة</p>
      <span class="grade-badge" style="background:${gradeBg};color:${gradeColor};">${grade}</span>
    `;

    if (wrongAnswers.length > 0) {
      resultHTML += '<div class="review-suggestion"><h4>📌 دروس مقترحة للمراجعة:</h4><ul>';

      const categoryCount = {};
      wrongAnswers.forEach((wa) => {
        const cat = wa.category || 'basics';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

      sortedCategories.forEach(([cat, count]) => {
        const catName = categoryNames[cat] || cat;
        resultHTML += `<li data-category="${cat}" role="button" tabindex="0" style="cursor:pointer;">
          📖 ${catName} (${count} ${count === 1 ? 'خطأ' : 'أخطاء'})
        </li>`;
      });

      resultHTML += '</ul></div>';
    }

    if (percentage === 100) {
      resultHTML += '<p style="margin-top:16px;color:var(--success);font-weight:600;">🎉 علامة كاملة! أنت متمكن من المادة.</p>';
    }

    resultDiv.innerHTML = resultHTML;

    document.getElementById('btnRestartQuiz').style.display = 'inline-flex';
    document.getElementById('quizProgressFill').style.width = '100%';
  }

  /* ========== Restart ========== */
  function restartQuiz() {
    resetQuizState();
    prepareQuestions();
    updateScoreDisplay();

    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('btnRestartQuiz').style.display = 'none';
    document.getElementById('quizQuestionCard').style.display = '';
    document.getElementById('quizOptions').style.display = '';
    document.getElementById('quizProgressFill').style.width = '0%';

    showQuestion();
  }

  /* ========== Utilities ========== */
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ========== Public API ========== */
  window.getQuizHTML = getQuizHTML;
  window.initQuiz = initQuiz;
})();
