/* ==========================================================================
   DrDer Electronic - Quiz Data
   30 Questions with Categories, Explanations & Review Suggestions
   ========================================================================== */

const QUIZ_DATA = [
  /* ========== أساسيات الكهرباء ========== */
  {
    id: 1,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'ما هي وحدة قياس شدة التيار الكهربائي؟',
    options: ['الفولت V', 'الأمبير A', 'الأوم Ω', 'الواط W'],
    correct: 1,
    explanation: 'الأمبير (A) هو وحدة قياس شدة التيار الكهربائي في النظام الدولي. سميت نسبة للعالم أندريه ماري أمبير.',
    reviewCategory: 'basics'
  },
  {
    id: 2,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'ما هو قانون أوم الصحيح؟',
    options: ['V = I / R', 'V = I × R', 'V = I + R', 'R = V × I'],
    correct: 1,
    explanation: 'قانون أوم: الجهد (V) = التيار (I) × المقاومة (R). وهو القانون الأساسي الذي يربط بين الكميات الكهربائية الثلاث.',
    reviewCategory: 'basics'
  },
  {
    id: 3,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'التيار المستمر (DC) يتميز بأنه:',
    options: ['يسري في اتجاهين متعاكسين', 'يسري في اتجاه واحد ثابت', 'يتغير بشكل عشوائي', 'لا يسري في الأسلاك'],
    correct: 1,
    explanation: 'التيار المستمر DC يسري في اتجاه واحد ثابت القطبية. مثال عليه: البطاريات والخلايا الشمسية.',
    reviewCategory: 'basics'
  },
  {
    id: 4,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'وحدة قياس المقاومة الكهربائية هي:',
    options: ['الفاراد F', 'الهنري H', 'الأوم Ω', 'الفولت V'],
    correct: 2,
    explanation: 'الأوم (Ω) هو وحدة قياس المقاومة الكهربائية. سميت نسبة للعالم جورج سيمون أوم.',
    reviewCategory: 'basics'
  },
  {
    id: 5,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'تردد التيار الكهربائي في معظم دول العالم هو:',
    options: ['25 هرتز', '50 هرتز', '75 هرتز', '100 هرتز'],
    correct: 1,
    explanation: 'تردد التيار الكهربائي 50 هرتز في معظم دول العالم (أوروبا، آسيا، أفريقيا)، و60 هرتز في أمريكا الشمالية وبعض الدول.',
    reviewCategory: 'basics'
  },
  {
    id: 6,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'قانون كيرشوف للتيار ينص على أن:',
    options: [
      'مجموع التيارات الداخلة للعقدة = مجموع التيارات الخارجة منها',
      'الجهد ثابت في جميع نقاط الدائرة',
      'المقاومة الكلية = مجموع المقاومات',
      'القدرة ثابتة في جميع الأحمال'
    ],
    correct: 0,
    explanation: 'قانون كيرشوف الأول (KCL): المجموع الجبري للتيارات عند أي عقدة يساوي صفراً. أي أن ما يدخل = ما يخرج.',
    reviewCategory: 'basics'
  },

  /* ========== الإلكترونيات ========== */
  {
    id: 7,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'ما هي وظيفة المكثف الأساسية في الدائرة الإلكترونية؟',
    options: ['تضخيم التيار', 'تخزين الشحنة الكهربائية', 'توليد تيار مستمر', 'قطع التيار المتردد'],
    correct: 1,
    explanation: 'المكثف يقوم بتخزين الشحنة الكهربائية على شكل مجال كهربائي بين لوحيه. يستخدم في التنعيم والترشيح والتوقيت.',
    reviewCategory: 'electronics'
  },
  {
    id: 8,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'الدايود العادي يسمح بمرور التيار في:',
    options: ['الاتجاهين معاً', 'اتجاه واحد فقط (أمامي)', 'بشكل متقطع', 'لا يسمح بمرور التيار أبداً'],
    correct: 1,
    explanation: 'الدايود يسمح بمرور التيار في الاتجاه الأمامي فقط (من المصعد إلى المهبط) ويمنعه في الاتجاه العكسي.',
    reviewCategory: 'electronics'
  },
  {
    id: 9,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'الجهد الأمامي التقريبي للدايود السيليكوني هو:',
    options: ['0.2 فولت', '0.7 فولت', '1.5 فولت', '3.3 فولت'],
    correct: 1,
    explanation: 'الجهد الأمامي للدايود السيليكوني حوالي 0.7 فولت. للدايود الجرمانيومي حوالي 0.3 فولت. هذا الجهد ضروري لتشغيل الدايود.',
    reviewCategory: 'electronics'
  },
  {
    id: 10,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'ما هو نوع الترانزستور الأكثر استخداماً في الدوائر الرقمية؟',
    options: ['BJT ثنائي القطبية', 'JFET', 'MOSFET', 'UJT'],
    correct: 2,
    explanation: 'الـ MOSFET هو الأكثر استخداماً في الدوائر الرقمية والمعالجات بسبب استهلاكه المنخفض للطاقة وسرعته العالية.',
    reviewCategory: 'electronics'
  },
  {
    id: 11,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'وحدة قياس سعة المكثف هي:',
    options: ['الأوم Ω', 'الفاراد F', 'الهنري H', 'الواط W'],
    correct: 1,
    explanation: 'الفاراد (F) هو وحدة قياس السعة الكهربائية. سميت نسبة للعالم مايكل فاراداي. المكثفات العملية بالميكروفاراد (μF) أو البيكوفاراد (pF).',
    reviewCategory: 'electronics'
  },

  /* ========== العناصر الكهربائية ========== */
  {
    id: 12,
    category: 'components',
    categoryName: 'العناصر الكهربائية',
    question: 'ما هو الفرق الرئيسي بين الريليه والكونتاكتور؟',
    options: [
      'لا يوجد فرق بينهما',
      'الكونتاكتور يتحمل تيارات أعلى',
      'الريليه أسرع في الفصل',
      'الكونتاكتور أصغر حجماً'
    ],
    correct: 1,
    explanation: 'الكونتاكتور مصمم لتحمل تيارات أعلى من الريليه، ويستخدم للأحمال الكبيرة مثل المحركات. الريليه يستخدم للتحكم في تيارات صغيرة.',
    reviewCategory: 'components'
  },
  {
    id: 13,
    category: 'components',
    categoryName: 'العناصر الكهربائية',
    question: 'نقطة التلامس NO تعني:',
    options: ['مغلقة دائماً', 'مفتوحة دائماً', 'متغيرة الوضع', 'تالمس مؤقت'],
    correct: 1,
    explanation: 'NO = Normally Open: نقطة التلامس تكون مفتوحة في الوضع الطبيعي (عند عدم تغذية الملف)، وتغلق عند تغذية الملف.',
    reviewCategory: 'components'
  },
  {
    id: 14,
    category: 'components',
    categoryName: 'العناصر الكهربائية',
    question: 'نقطة التلامس NC تعني:',
    options: ['مفتوحة دائماً', 'مغلقة دائماً', 'غير موصلة', 'تالمس محايد'],
    correct: 1,
    explanation: 'NC = Normally Closed: نقطة التلامس تكون مغلقة في الوضع الطبيعي، وتفتح عند تغذية الملف.',
    reviewCategory: 'components'
  },
  {
    id: 15,
    category: 'components',
    categoryName: 'العناصر الكهربائية',
    question: 'أي منحنى لقاطع MCB يستخدم للأحمال المنزلية العادية؟',
    options: ['منحنى B', 'منحنى C', 'منحنى D', 'منحنى Z'],
    correct: 1,
    explanation: 'منحنى C هو الأكثر استخداماً في التطبيقات المنزلية والتجارية. يفصل عند 5-10 أضعاف التيار المقنن.',
    reviewCategory: 'components'
  },

  /* ========== المحركات ========== */
  {
    id: 16,
    category: 'motors',
    categoryName: 'المحركات والمولدات',
    question: 'كم مرة يزيد تيار البدء عن التيار المقنن في المحركات الحثية؟',
    options: ['مرتين', '4 مرات', '6 إلى 8 مرات', '10 مرات'],
    correct: 2,
    explanation: 'تيار البدء في المحرك الحثي يصل إلى 6-8 أضعاف التيار المقنن. لذلك نحتاج طرق تشغيل خاصة للمحركات الكبيرة.',
    reviewCategory: 'motors'
  },
  {
    id: 17,
    category: 'motors',
    categoryName: 'المحركات والمولدات',
    question: 'طريقة ستار-دلتا لتشغيل المحركات تقلل تيار البدء إلى:',
    options: ['نصف التيار', 'ثلث التيار', 'ربع التيار', 'عشر التيار'],
    correct: 1,
    explanation: 'توصيلة ستار تقلل الجهد على كل ملف إلى 1/√3 من جهد الخط، مما يقلل تيار البدء إلى ثلث تيار البدء المباشر تقريباً.',
    reviewCategory: 'motors'
  },
  {
    id: 18,
    category: 'motors',
    categoryName: 'المحركات والمولدات',
    question: 'ما هو أفضل حل للتحكم في سرعة المحرك وتوفير الطاقة؟',
    options: ['مقاومة متغيرة', 'محول ذاتي', 'مغير تردد VFD', 'توصيلة ستار دلتا'],
    correct: 2,
    explanation: 'مغير التردد VFD يوفر تحكماً كاملاً في سرعة المحرك مع توفير كبير في الطاقة، وحماية متكاملة للمحرك.',
    reviewCategory: 'motors'
  },

  /* ========== التحكم الكهربائي ========== */
  {
    id: 19,
    category: 'control',
    categoryName: 'التحكم الكهربائي',
    question: 'ما معنى اختصار PLC؟',
    options: [
      'Power Line Carrier',
      'Programmable Logic Controller',
      'Power Load Control',
      'Programmable Line Circuit'
    ],
    correct: 1,
    explanation: 'PLC = Programmable Logic Controller: حاسوب صناعي يستخدم لأتمتة العمليات مثل خطوط الإنتاج والمصاعد.',
    reviewCategory: 'control'
  },
  {
    id: 20,
    category: 'control',
    categoryName: 'التحكم الكهربائي',
    question: 'جهد التحكم الشائع في دوائر التحكم الصناعية هو:',
    options: ['5 فولت', '12 فولت', '24 فولت', '110 فولت'],
    correct: 2,
    explanation: '24V DC هو الجهد القياسي الأكثر شيوعاً في دوائر التحكم الصناعية لأنه آمن ولا يحتاج ترخيصاً خاصاً للعمل عليه.',
    reviewCategory: 'control'
  },

  /* ========== الطاقة الشمسية ========== */
  {
    id: 21,
    category: 'solar',
    categoryName: 'الطاقة الشمسية',
    question: 'ما هي وظيفة منظم الشحن في النظام الشمسي؟',
    options: [
      'تحويل DC إلى AC',
      'حماية البطارية من الشحن الزائد والتفريغ',
      'توليد الكهرباء من الشمس',
      'تخزين الطاقة الكهربائية'
    ],
    correct: 1,
    explanation: 'منظم الشحن (Charge Controller) يحمي البطارية من الشحن الزائد الذي قد يتلفها، ومن التفريغ العميق الذي يقصر عمرها.',
    reviewCategory: 'solar'
  },
  {
    id: 22,
    category: 'solar',
    categoryName: 'الطاقة الشمسية',
    question: 'جهد النظام الشمسي المنزلي الأكثر شيوعاً هو:',
    options: ['12 فولت', '24 فولت', '48 فولت', '220 فولت'],
    correct: 1,
    explanation: 'نظام 24V هو الأكثر شيوعاً للتطبيقات المنزلية المتوسطة. 12V للأنظمة الصغيرة جداً، و48V للأنظمة الكبيرة.',
    reviewCategory: 'solar'
  },
  {
    id: 23,
    category: 'solar',
    categoryName: 'الطاقة الشمسية',
    question: 'ما هو الجهاز الذي يحول التيار المستمر إلى تيار متردد؟',
    options: ['منظم الشحن', 'البطارية', 'الانفرتر (Inverter)', 'اللوح الشمسي'],
    correct: 2,
    explanation: 'الانفرتر (Inverter) هو الجهاز الذي يحول التيار المستمر DC القادم من البطاريات إلى تيار متردد AC صالح للاستخدام المنزلي.',
    reviewCategory: 'solar'
  },

  /* ========== السلامة المهنية ========== */
  {
    id: 24,
    category: 'safety',
    categoryName: 'السلامة المهنية',
    question: 'ما معنى LOTO في إجراءات السلامة الكهربائية؟',
    options: [
      'Light On Time Off',
      'Lock Out Tag Out',
      'Low Overload Time Out',
      'Line Output Transformer'
    ],
    correct: 1,
    explanation: 'LOTO = Lock Out Tag Out: إجراء عزل مصادر الطاقة ووضع أقفال وبطاقات تحذيرية لضمان عدم إعادة التشغيل أثناء الصيانة.',
    reviewCategory: 'safety'
  },
  {
    id: 25,
    category: 'safety',
    categoryName: 'السلامة المهنية',
    question: 'المسافة الآمنة الدنيا من خطوط الجهد العالي يجب أن تكون:',
    options: ['متر واحد', '3 أمتار', '5 أمتار', '10 أمتار'],
    correct: 1,
    explanation: 'المسافة الآمنة الدنيا من خطوط الجهد العالي هي 3 أمتار، وتزداد بازدياد مستوى الجهد حسب المعايير المحلية.',
    reviewCategory: 'safety'
  },
  {
    id: 26,
    category: 'safety',
    categoryName: 'السلامة المهنية',
    question: 'أهم خطوة قبل البدء بأي عمل كهربائي هي:',
    options: [
      'ارتداء القفازات فقط',
      'فصل مصدر التيار والتأكد من فصله',
      'العمل بسرعة',
      'إخبار زميل فقط'
    ],
    correct: 1,
    explanation: 'أهم خطوة هي فصل مصدر التيار تماماً والتأكد من فصله باستخدام جهاز اختبار الجهد قبل لمس أي موصل.',
    reviewCategory: 'safety'
  },

  /* ========== أسئلة إضافية متنوعة ========== */
  {
    id: 27,
    category: 'basics',
    categoryName: 'أساسيات الكهرباء',
    question: 'في دائرة توازي، كيف تحسب المقاومة الكلية؟',
    options: [
      'مجموع المقاومات',
      '1/R_total = 1/R1 + 1/R2 + ...',
      'حاصل ضرب المقاومات',
      'أكبر مقاومة فقط'
    ],
    correct: 1,
    explanation: 'في دوائر التوازي: مقلوب المقاومة الكلية = مجموع مقلوبات المقاومات الفردية. المقاومة الكلية تكون أقل من أصغر مقاومة.',
    reviewCategory: 'basics'
  },
  {
    id: 28,
    category: 'electronics',
    categoryName: 'الإلكترونيات',
    question: 'ما هي وظيفة المكثف في دائرة مصدر القدرة؟',
    options: ['تضخيم الجهد', 'تنعيم الجهد بعد التقويم', 'زيادة التردد', 'خفض التيار'],
    correct: 1,
    explanation: 'المكثف في مصادر القدرة يقوم بتنعيم (ترشيح) الجهد المتردد بعد تقويمه، لتقليل التموج والحصول على جهد مستمر نظيف.',
    reviewCategory: 'electronics'
  },
  {
    id: 29,
    category: 'control',
    categoryName: 'التحكم الكهربائي',
    question: 'لغة البرمجة الأكثر شيوعاً للـ PLC هي:',
    options: ['C++', 'Python', 'Ladder Diagram', 'Java'],
    correct: 2,
    explanation: 'Ladder Diagram (مخطط السلم) هي اللغة الأكثر شيوعاً لبرمجة PLC لأنها تشبه مخططات الريليه التقليدية ويسهل فهمها.',
    reviewCategory: 'control'
  },
  {
    id: 30,
    category: 'motors',
    categoryName: 'المحركات والمولدات',
    question: 'المحرك الحثي يعمل على مبدأ:',
    options: [
      'التوصيل المباشر',
      'الحث الكهرومغناطيسي',
      'التأثير الكهروضوئي',
      'التفريغ الكهربائي'
    ],
    correct: 1,
    explanation: 'المحرك الحثي يعمل على مبدأ الحث الكهرومغناطيسي، حيث يولد المجال المغناطيسي الدوار في العضو الثابت تيارات حثية في العضو الدوار.',
    reviewCategory: 'motors'
  }
];
