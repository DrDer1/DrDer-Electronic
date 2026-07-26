/* ==========================================================================
   DrDer Electronic - Quiz System v4.1
   Fixed: Event handling, null checks, compatibility
   ========================================================================== */

(function () {
  'use strict';

  var QUESTIONS_PER_QUIZ = 10;

  var categoryNames = {
    basics: 'أساسيات الكهرباء',
    electronics: 'الإلكترونيات',
    components: 'العناصر الكهربائية',
    motors: 'المحركات والمولدات',
    control: 'التحكم الكهربائي',
    solar: 'الطاقة الشمسية',
    safety: 'السلامة المهنية'
  };

  var questions = [];
  var currentIndex = 0;
  var score = 0;
  var answered = false;
  var totalQuestions = QUESTIONS_PER_QUIZ;
  var quizActive = false;
  var wrongAnswers = [];

  function getQuizHTML() {
    return '<div class="quiz-container" id="quizContainer">' +
      '<div class="quiz-header">' +
        '<span class="quiz-score" id="quizScoreDisplay">النقاط: 0</span>' +
        '<span id="quizQuestionNum">السؤال 1 / ' + totalQuestions + '</span>' +
      '</div>' +
      '<div class="quiz-progress">' +
        '<div class="quiz-progress-fill" id="quizProgressFill" style="width: 0%;"></div>' +
      '</div>' +
      '<div class="quiz-question-card" id="quizQuestionCard">' +
        '<div class="quiz-category-tag" id="quizCategoryTag" style="display:none;"></div>' +
        '<h3 id="quizQuestionText">جاري تحميل الأسئلة...</h3>' +
      '</div>' +
      '<div class="quiz-options" id="quizOptions"></div>' +
      '<div class="quiz-feedback" id="quizFeedback"></div>' +
      '<div class="quiz-explanation" id="quizExplanation" style="display:none;"></div>' +
      '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;">' +
        '<button class="btn btn-primary" id="btnNextQuestion" style="display:none;">التالي ▶</button>' +
        '<button class="btn btn-outline" id="btnRestartQuiz" style="display:none;">🔄 اختبار جديد</button>' +
      '</div>' +
      '<div class="quiz-result" id="quizResult" style="display:none;"></div>' +
    '</div>';
  }

  function initQuiz() {
    if (typeof QUIZ_DATA === 'undefined' || !QUIZ_DATA || !Array.isArray(QUIZ_DATA) || QUIZ_DATA.length === 0) {
      var questionText = document.getElementById('quizQuestionText');
      if (questionText) {
        questionText.textContent = '⚠️ لا توجد أسئلة متاحة حالياً. تأكد من تحميل ملف quiz-data.js.';
      }
      return;
    }

    resetQuizState();
    prepareQuestions();
    updateScoreDisplay();
    showQuestion();

    var btnNext = document.getElementById('btnNextQuestion');
    var btnRestart = document.getElementById('btnRestartQuiz');

    if (btnNext) {
      var newBtn = btnNext.cloneNode(true);
      btnNext.parentNode.replaceChild(newBtn, btnNext);
      newBtn.addEventListener('click', handleNextQuestion);
    }

    if (btnRestart) {
      var newRestartBtn = btnRestart.cloneNode(true);
      btnRestart.parentNode.replaceChild(newRestartBtn, btnRestart);
      newRestartBtn.addEventListener('click', restartQuiz);
    }
  }

  function resetQuizState() {
    currentIndex = 0;
    score = 0;
    answered = false;
    quizActive = true;
    wrongAnswers = [];
  }

  function prepareQuestions() {
    var shuffled = shuffleArray(QUIZ_DATA.slice());
    questions = shuffled.slice(0, QUESTIONS_PER_QUIZ);
    totalQuestions = questions.length;

    questions = questions.map(function (q) {
      var opts = q.options.map(function (opt, idx) {
        return { text: opt, originalIndex: idx };
      });
      return {
        question: q.question,
        correct: q.correct,
        explanation: q.explanation,
        category: q.category,
        categoryName: q.categoryName,
        difficulty: q.difficulty,
        reviewCategory: q.reviewCategory,
        shuffledOptions: shuffleArray(opts)
      };
    });
  }

  function showQuestion() {
    if (currentIndex >= totalQuestions) {
      showFinalResult();
      return;
    }

    answered = false;
    var question = questions[currentIndex];

    var questionText = document.getElementById('quizQuestionText');
    var questionNum = document.getElementById('quizQuestionNum');
    var progressFill = document.getElementById('quizProgressFill');
    var categoryTag = document.getElementById('quizCategoryTag');
    var optionsContainer = document.getElementById('quizOptions');
    var feedback = document.getElementById('quizFeedback');
    var explanation = document.getElementById('quizExplanation');
    var btnNext = document.getElementById('btnNextQuestion');
    var resultDiv = document.getElementById('quizResult');
    var questionCard = document.getElementById('quizQuestionCard');
    var btnRestart = document.getElementById('btnRestartQuiz');

    if (questionText) questionText.textContent = question.question;
    if (questionNum) questionNum.textContent = 'السؤال ' + (currentIndex + 1) + ' / ' + totalQuestions;
    if (progressFill) progressFill.style.width = ((currentIndex / totalQuestions) * 100) + '%';

    if (categoryTag && question.categoryName) {
      categoryTag.textContent = question.categoryName;
      categoryTag.style.display = '';
    } else if (categoryTag) {
      categoryTag.style.display = 'none';
    }

    if (optionsContainer) optionsContainer.innerHTML = '';

    question.shuffledOptions.forEach(function (option) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = option.text;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.addEventListener('click', function () {
        selectAnswer(option.originalIndex);
      });
      if (optionsContainer) optionsContainer.appendChild(btn);
    });

    if (feedback) feedback.textContent = '';
    if (explanation) explanation.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (resultDiv) resultDiv.style.display = 'none';
    if (questionCard) questionCard.style.display = '';
    if (optionsContainer) optionsContainer.style.display = '';
    if (btnRestart) btnRestart.style.display = 'none';
  }

  function selectAnswer(selectedIndex) {
    if (answered || !quizActive) return;
    answered = true;

    var question = questions[currentIndex];
    var isCorrect = selectedIndex === question.correct;
    var optionButtons = document.querySelectorAll('#quizOptions .quiz-option');

    optionButtons.forEach(function (btn, index) {
      btn.style.pointerEvents = 'none';
      var originalIndex = question.shuffledOptions[index].originalIndex;

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

    var feedback = document.getElementById('quizFeedback');
    var explanation = document.getElementById('quizExplanation');

    if (isCorrect) {
      score++;
      if (feedback) {
        feedback.textContent = '✅ إجابة صحيحة! أحسنت.';
        feedback.style.color = 'var(--success)';
      }
    } else {
      if (feedback) {
        feedback.textContent = '❌ إجابة خاطئة.';
        feedback.style.color = 'var(--danger)';
      }
      wrongAnswers.push({
        question: question.question,
        userAnswer: selectedIndex,
        correctAnswer: question.correct,
        options: question.shuffledOptions.map(function (o) { return o.text; }),
        explanation: question.explanation,
        category: question.category,
        categoryName: question.categoryName
      });
    }

    if (question.explanation && explanation) {
      explanation.textContent = '💡 ' + question.explanation;
      explanation.style.display = 'block';
    }

    updateScoreDisplay();

    var progressFill = document.getElementById('quizProgressFill');
    if (progressFill) progressFill.style.width = (((currentIndex + 1) / totalQuestions) * 100) + '%';

    var btnNext = document.getElementById('btnNextQuestion');
    if (btnNext) {
      btnNext.style.display = 'inline-flex';
      btnNext.textContent = currentIndex < totalQuestions - 1 ? 'التالي ▶' : '📊 عرض النتيجة';
    }
  }

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
    var display = document.getElementById('quizScoreDisplay');
    if (display) display.textContent = 'النقاط: ' + score;
  }

  function showFinalResult() {
    quizActive = false;

    var questionCard = document.getElementById('quizQuestionCard');
    var optionsEl = document.getElementById('quizOptions');
    var feedback = document.getElementById('quizFeedback');
    var explanation = document.getElementById('quizExplanation');
    var btnNext = document.getElementById('btnNextQuestion');
    var resultDiv = document.getElementById('quizResult');
    var btnRestart = document.getElementById('btnRestartQuiz');
    var progressFill = document.getElementById('quizProgressFill');

    if (questionCard) questionCard.style.display = 'none';
    if (optionsEl) optionsEl.style.display = 'none';
    if (feedback) feedback.textContent = '';
    if (explanation) explanation.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';
    if (resultDiv) resultDiv.style.display = 'block';
    if (progressFill) progressFill.style.width = '100%';

    var percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    var grade, gradeColor, gradeBg;
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

    var resultHTML = '<div class="score-circle" style="border-color:' + gradeColor + ';color:' + gradeColor + ';">' + percentage + '%</div>' +
      '<h3 style="margin-bottom:8px;">النتيجة النهائية</h3>' +
      '<p style="font-size:1.1rem;margin-bottom:4px;">' + score + ' / ' + totalQuestions + ' إجابات صحيحة</p>' +
      '<span class="grade-badge" style="background:' + gradeBg + ';color:' + gradeColor + ';">' + grade + '</span>';

    if (wrongAnswers.length > 0) {
      resultHTML += '<div class="review-suggestion"><h4>📌 دروس مقترحة للمراجعة:</h4><ul>';

      var categoryCount = {};
      wrongAnswers.forEach(function (wa) {
        var cat = wa.category || 'basics';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      var sortedCategories = Object.entries(categoryCount).sort(function (a, b) { return b[1] - a[1]; });

      sortedCategories.forEach(function (entry) {
        var cat = entry[0];
        var count = entry[1];
        var catName = categoryNames[cat] || cat;
        resultHTML += '<li data-category="' + cat + '" role="button" tabindex="0" style="cursor:pointer;">📖 ' + catName + ' (' + count + ' ' + (count === 1 ? 'خطأ' : 'أخطاء') + ')</li>';
      });

      resultHTML += '</ul></div>';
    }

    if (percentage === 100) {
      resultHTML += '<p style="margin-top:16px;color:var(--success);font-weight:600;">🎉 علامة كاملة! أنت متمكن من المادة.</p>';
    } else if (percentage >= 80) {
      resultHTML += '<p style="margin-top:16px;color:var(--info);font-weight:600;">👏 أداء رائع! واصل التقدم.</p>';
    }

    if (resultDiv) resultDiv.innerHTML = resultHTML;
    if (btnRestart) btnRestart.style.display = 'inline-flex';
  }

  function restartQuiz() {
    resetQuizState();
    prepareQuestions();
    updateScoreDisplay();

    var resultDiv = document.getElementById('quizResult');
    var btnRestart = document.getElementById('btnRestartQuiz');
    var questionCard = document.getElementById('quizQuestionCard');
    var optionsEl = document.getElementById('quizOptions');
    var progressFill = document.getElementById('quizProgressFill');

    if (resultDiv) resultDiv.style.display = 'none';
    if (btnRestart) btnRestart.style.display = 'none';
    if (questionCard) questionCard.style.display = '';
    if (optionsEl) optionsEl.style.display = '';
    if (progressFill) progressFill.style.width = '0%';

    showQuestion();
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  window.getQuizHTML = getQuizHTML;
  window.initQuiz = initQuiz;
})();
