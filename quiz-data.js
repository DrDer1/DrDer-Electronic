const QUIZ_DATA = [
  {
    id: 1,
    category: 'basics',
    question: 'ما هي وحدة قياس التيار الكهربائي؟',
    options: ['الفولت', 'الأمبير', 'الأوم', 'الواط'],
    correct: 1,
    explanation: 'الأمبير هو وحدة قياس شدة التيار الكهربائي.'
  },
  {
    id: 2,
    category: 'basics',
    question: 'ما هو قانون أوم؟',
    options: ['V = I / R', 'V = I × R', 'V = I + R', 'V = I - R'],
    correct: 1,
    explanation: 'قانون أوم: الجهد = التيار × المقاومة (V = I × R).'
  },
  {
    id: 3,
    category: 'basics',
    question: 'التيار المستمر DC يسري في:',
    options: ['اتجاهين متعاكسين', 'اتجاه واحد ثابت', 'بشكل عشوائي', 'بشكل دائري'],
    correct: 1,
    explanation: 'التيار المستمر DC يسري في اتجاه واحد ثابت.'
  },
  {
    id: 4,
    category: 'basics',
    question: 'وحدة قياس المقاومة الكهربائية هي:',
    options: ['الفاراد', 'الهنري', 'الأوم', 'الفولت'],
    correct: 2,
    explanation: 'الأوم (Ω) هو وحدة قياس المقاومة الكهربائية.'
  },
  {
    id: 5,
    category: 'basics',
    question: 'ما هو تردد التيار الكهربائي في معظم دول العالم؟',
    options: ['25 هرتز', '50 هرتز', '75 هرتز', '100 هرتز'],
    correct: 1,
    explanation: 'تردد التيار الكهربائي في معظم دول العالم هو 50 هرتز (أو 60 هرتز في بعض الدول).'
  },
  {
    id: 6,
    category: 'electronics',
    question: 'ما هي وظيفة المكثف في الدائرة الإلكترونية؟',
    options: ['تضخيم التيار', 'تخزين الشحنة الكهربائية', 'توليد تيار', 'قطع التيار'],
    correct: 1,
    explanation: 'المكثف يقوم بتخزين الشحنة الكهربائية على شكل مجال كهربائي.'
  },
  {
    id: 7,
    category: 'electronics',
    question: 'الدايود يسمح بمرور التيار في:',
    options: ['الاتجاهين', 'اتجاه واحد فقط', 'بشكل متقطع', 'لا يسمح بمرور التيار'],
    correct: 1,
    explanation: 'الدايود يسمح بمرور التيار في اتجاه واحد فقط (الانحياز الأمامي).'
  },
  {
    id: 8,
    category: 'electronics',
    question: 'كم يبلغ الجهد الأمامي التقريبي للدايود السيليكوني؟',
    options: ['0.2 فولت', '0.7 فولت', '1.5 فولت', '3 فولت'],
    correct: 1,
    explanation: 'الجهد الأمامي للدايود السيليكوني حوالي 0.7 فولت.'
  },
  {
    id: 9,
    category: 'components',
    question: 'ما الفرق بين الريليه والكونتاكتور؟',
    options: ['لا يوجد فرق', 'الكونتاكتور للقدرات العالية', 'الريليه أسرع', 'الكونتاكتور أصغر حجماً'],
    correct: 1,
    explanation: 'الكونتاكتور يستخدم للأحمال ذات القدرات العالية بينما الريليه للقدرات المنخفضة.'
  },
  {
    id: 10,
    category: 'components',
    question: 'ما هو الرمز NO في نقاط التلامس؟',
    options: ['مغلق دائماً', 'مفتوح دائماً', 'متغير', 'مؤقت'],
    correct: 1,
    explanation: 'NO تعني Normally Open أي مفتوح في الحالة الطبيعية.'
  },
  {
    id: 11,
    category: 'motors',
    question: 'ما هي طريقة تشغيل المحرك التي تسبب أقل تيار بدء؟',
    options: ['مباشر DOL', 'ستار-دلتا', 'مقاومة', 'سوفت ستارتر'],
    correct: 3,
    explanation: 'السوفت ستارتر يوفر بدءاً ناعماً للمحرك مع أقل تيار بدء.'
  },
  {
    id: 12,
    category: 'motors',
    question: 'كم مرة يزيد تيار البدء عن التيار المقنن في المحرك الحثي؟',
    options: ['مرتين', '4 مرات', '6 مرات', '10 مرات'],
    correct: 2,
    explanation: 'تيار البدء في المحرك الحثي يصل إلى 6 أضعاف التيار المقنن تقريباً.'
  },
  {
    id: 13,
    category: 'control',
    question: 'ما معنى اختصار PLC؟',
    options: ['Power Line Control', 'Programmable Logic Controller', 'Power Logic Circuit', 'Programmable Line Circuit'],
    correct: 1,
    explanation: 'PLC تعني Programmable Logic Controller أو المتحكم المنطقي المبرمج.'
  },
  {
    id: 14,
    category: 'solar',
    question: 'ما هي وظيفة منظم الشحن في النظام الشمسي؟',
    options: ['تحويل DC إلى AC', 'حماية البطارية من الشحن الزائد', 'توليد الكهرباء', 'تخزين الطاقة'],
    correct: 1,
    explanation: 'منظم الشحن يحمي البطارية من الشحن الزائد والتفريغ العميق.'
  },
  {
    id: 15,
    category: 'safety',
    question: 'ما معنى LOTO في السلامة الكهربائية؟',
    options: ['Light On Time Off', 'Lock Out Tag Out', 'Low Overload Time Out', 'Line Output Transformer'],
    correct: 1,
    explanation: 'LOTO تعني Lock Out Tag Out: إغلاق وتعليق لافتة تحذيرية أثناء الصيانة.'
  },
  {
    id: 16,
    category: 'basics',
    question: 'قانون كيرشوف للتيار ينص على أن:',
    options: ['مجموع التيارات الداخلة = مجموع التيارات الخارجة', 'الجهد ثابت في جميع النقاط', 'المقاومة الكلية = مجموع المقاومات', 'القدرة ثابتة في الدائرة'],
    correct: 0,
    explanation: 'مجموع التيارات الداخلة إلى أي عقدة يساوي مجموع التيارات الخارجة منها.'
  },
  {
    id: 17,
    category: 'electronics',
    question: 'ما هو نوع الترانزستور الأكثر استخداماً في الدوائر الرقمية؟',
    options: ['BJT', 'JFET', 'MOSFET', 'UJT'],
    correct: 2,
    explanation: 'MOSFET هو الأكثر استخداماً في الدوائر الرقمية والمتكاملة.'
  },
  {
    id: 18,
    category: 'components',
    question: 'NC في نقاط التلامس تعني:',
    options: ['مفتوح دائماً', 'مغلق دائماً', 'غير موصل', 'محايد'],
    correct: 1,
    explanation: 'NC تعني Normally Closed أي مغلق في الحالة الطبيعية.'
  },
  {
    id: 19,
    category: 'solar',
    question: 'ما هو جهد النظام الشمسي المنزلي الأكثر شيوعاً؟',
    options: ['6 فولت', '12 فولت', '24 فولت', '48 فولت'],
    correct: 2,
    explanation: 'نظام 24 فولت هو الأكثر شيوعاً في التطبيقات المنزلية المتوسطة.'
  },
  {
    id: 20,
    category: 'safety',
    question: 'المسافة الآمنة من خطوط الجهد العالي يجب أن تكون أكثر من:',
    options: ['متر واحد', '3 أمتار', '10 أمتار', '20 متراً'],
    correct: 1,
    explanation: 'المسافة الآمنة من خطوط الجهد العالي يجب أن تكون أكثر من 3 أمتار.'
  }
];
