/* ==========================================================================
   DrDer Electronic - Quiz System
   Multiple Choice | Immediate Feedback | Final Score
   ========================================================================== */

(function () {
  'use strict';

  let _questions = [];
  let _currentIndex = 0;
  let _score = 0;
  let _answered = false;
  let _totalQuestions = 10;
  let _quizActive = false;

  function getQuizHTML() {
    return `
      <div class="quiz-container" id="quizContainer">
        <div class="quiz-header">
          <span class="quiz-score" id="quizScoreDisplay">النقاط: 0</span>
          <span id="quizQuestionNum">السؤال 1 / ${_totalQuestions}</span>
        </div>
        <div class="quiz-progress">
          <div class="quiz-progress-fill" id="quizProgressFill" style="width: 0%;"></div>
        </div>
        <div class="quiz-question-card" id="quizQuestionCard">
          <h3 id="quizQuestionText">جاري تحميل الأسئلة...</h3>
        </div>
        <div class="quiz-options" id="quizOptions"></div>
        <div class="quiz-feedback" id="quizFeedback"></div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
          <button class="btn btn-primary" id="btnNextQuestion" style="display:none;">التالي ▶</button>
          <button class="btn btn-outline" id="btnRestartQuiz" style="display:none;">🔄 إعادة الاختبار</button>
        </div>
        <div class="quiz-result" id="quizResult" style="display:none;"></div>
      </div>
    `;
  }

  function initQuiz() {
    if (typeof QUIZ_DATA === 'undefined') {
      document.getElementById('quizQuestionText').textContent = '⚠️ لا توجد أسئلة متاحة.';
      return;
    }

    _questions = shuffleArray([...QUIZ_DATA]).slice(0, _totalQuestions);
    _currentIndex = 0;
    _score = 0;
    _answered = false;
    _quizActive = true;

    if (_questions.length === 0) {
      document.getElementById('quizQuestionText').textContent = '⚠️ لا توجد أسئلة متاحة حالياً.';
      return;
    }

    _totalQuestions = _questions.length;
    updateScoreDisplay();
    showQuestion();

    const btnNext = document.getElementById('btnNextQuestion');
    const btnRestart = document.getElementById('btnRestartQuiz');

    if (btnNext) {
      btnNext.addEventListener('click', nextQuestion);
    }
    if (btnRestart) {
      btnRestart.addEventListener('click', restartQuiz);
    }
  }

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showQuestion() {
    if (_currentIndex >= _questions.length) {
      showFinalResult();
      return;
    }

    _answered = false;
    const question = _questions[_currentIndex];

    document.getElementById('quizQuestionText').textContent = question.question;
    document.getElementById('quizQuestionNum').textContent = `السؤال ${_currentIndex + 1} / ${_totalQuestions}`;

    const progressFill = document.getElementById('quizProgressFill');
    progressFill.style.width = `${(_currentIndex / _totalQuestions) * 100}%`;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = option;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.addEventListener('click', () => selectAnswer(index));
      optionsContainer.appendChild(btn);
    });

    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('btnNextQuestion').style.display = 'none';
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizQuestionCard').style.display = '';
    document.getElementById('quizOptions').style.display = '';
  }

  function selectAnswer(selectedIndex) {
    if (_answered || !_quizActive) return;
    _answered = true;

    const question = _questions[_currentIndex];
    const isCorrect = selectedIndex === question.correct;
    const optionButtons = document.querySelectorAll('#quizOptions .quiz-option');

    optionButtons.forEach((btn, index) => {
      btn.style.pointerEvents = 'none';
      btn.setAttribute('aria-checked', index === selectedIndex ? 'true' : 'false');

      if (index === question.correct) {
        btn.classList.add('correct');
      } else if (index === selectedIndex && !isCorrect) {
        btn.classList.add('wrong');
      }

      if (index === selectedIndex) {
        btn.classList.add('selected');
      }
    });

    const feedback = document.getElementById('quizFeedback');

    if (isCorrect) {
      _score++;
      feedback.textContent = '✅ إجابة صحيحة! ' + (question.explanation || '');
      feedback.style.color = 'var(--success)';
    } else {
      feedback.textContent = '❌ إجابة خاطئة. ' + (question.explanation || '');
      feedback.style.color = 'var(--danger)';
    }

    updateScoreDisplay();

    const progressFill = document.getElementById('quizProgressFill');
    progressFill.style.width = `${((_currentIndex + 1) / _totalQuestions) * 100}%`;

    const btnNext = document.getElementById('btnNextQuestion');
    if (_currentIndex < _questions.length - 1) {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = 'التالي ▶';
    } else {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = '📊 عرض النتيجة';
    }
  }

  function nextQuestion() {
    if (!_answered && _quizActive) return;

    if (_currentIndex >= _questions.length - 1) {
      showFinalResult();
      return;
    }

    _currentIndex++;
    showQuestion();
  }

  function updateScoreDisplay() {
    document.getElementById('quizScoreDisplay').textContent = `النقاط: ${_score}`;
  }

  function showFinalResult() {
    _quizActive = false;

    document.getElementById('quizQuestionCard').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('quizFeedback').textContent = '';
    document.getElementById('btnNextQuestion').style.display = 'none';

    const resultDiv = document.getElementById('quizResult');
    resultDiv.style.display = 'block';

    const percentage = Math.round((_score / _totalQuestions) * 100);
    let grade, gradeColor;

    if (percentage >= 90) {
      grade = 'ممتاز 🌟';
      gradeColor = 'var(--success)';
    } else if (percentage >= 70) {
      grade = 'جيد جداً 👍';
      gradeColor = 'var(--info)';
    } else if (percentage >= 50) {
      grade = 'جيد 📚';
      gradeColor = 'var(--warning)';
    } else {
      grade = 'حاول مرة أخرى 💪';
      gradeColor = 'var(--danger)';
    }

    resultDiv.innerHTML = `
      <div class="score-circle" style="border-color:${gradeColor};color:${gradeColor};">${percentage}%</div>
      <h3 style="margin-bottom:8px;">النتيجة النهائية</h3>
      <p style="font-size:1.1rem;margin-bottom:4px;">${_score} / ${_totalQuestions} إجابات صحيحة</p>
      <p style="color:${gradeColor};font-weight:700;font-size:1.2rem;">${grade}</p>
    `;

    const btnRestart = document.getElementById('btnRestartQuiz');
    btnRestart.style.display = 'inline-flex';

    const progressFill = document.getElementById('quizProgressFill');
    progressFill.style.width = '100%';
  }

  function restartQuiz() {
    _questions = shuffleArray([...QUIZ_DATA]).slice(0, _totalQuestions);
    _currentIndex = 0;
    _score = 0;
    _answered = false;
    _quizActive = true;

    if (_questions.length === 0) {
      document.getElementById('quizQuestionText').textContent = '⚠️ لا توجد أسئلة متاحة حالياً.';
      return;
    }

    _totalQuestions = _questions.length;
    updateScoreDisplay();

    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('btnRestartQuiz').style.display = 'none';
    document.getElementById('quizQuestionCard').style.display = '';
    document.getElementById('quizOptions').style.display = '';

    const progressFill = document.getElementById('quizProgressFill');
    progressFill.style.width = '0%';

    showQuestion();
  }

  window.getQuizHTML = getQuizHTML;
  window.initQuiz = initQuiz;
})();
