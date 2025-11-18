export interface KnowledgeArticle {
  topic: string;
  keywords: string[];
  content: string[];
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    topic: 'Menstrual Hygiene',
    keywords: ['menstruation', 'period', 'hygiene', 'clean', 'pad', 'cloth', 'wash', 'sanitary'],
    content: [
      "To maintain hygiene during periods, change your pad or cloth every 4-6 hours, or sooner if it's full.",
      "If you use a cloth, make sure it's clean, dry, and washed properly with soap after each use. Dry it in sunlight if possible.",
      "Gently wash your private parts with clean water at least twice a day. Avoid using strong soaps as they can cause irritation.",
      "Always wear clean and comfortable cotton underwear and change it daily.",
      "Wrap used pads in paper before throwing them in a dustbin. Never throw pads or cloth into toilets as it can block them.",
      "Taking a bath every day helps keep your whole body fresh and reduces discomfort.",
      "Periods are a normal and natural part of growing up. There is nothing to be shy or ashamed about."
    ]
  },
  {
    topic: 'Menstrual Pain',
    keywords: ['stomach pain', 'cramps', 'period pain', 'ache', 'hurts'],
    content: [
        "Stomach pain or cramps during periods are very common and are usually caused by the muscles of the womb tightening.",
        "Putting a warm water bottle on your lower belly can help relax the muscles and reduce the pain.",
        "Gentle exercise like walking can also provide relief.",
        "Drinking warm drinks like tea or milk can be soothing.",
        "If the pain is very strong and stops you from doing your daily activities, it's a good idea to talk to a health worker or an ASHA didi."
    ]
  },
  {
    topic: 'Healthy Diet',
    keywords: ['food', 'eat', 'healthy', 'diet', 'nutrition', 'energy', 'strong'],
    content: [
        "Eating a balanced diet is very important to stay healthy and energetic.",
        "Include green leafy vegetables like spinach, and other vegetables like beans and carrots in your meals.",
        "Foods like eggs, lentils (dal), milk, and yogurt will give you protein and make you strong.",
        "Eating fruits every day provides essential vitamins.",
        "Try to avoid too many fried or sugary snacks. Drink plenty of clean water throughout the day."
    ]
  },
  {
    topic: 'Anemia Prevention',
    keywords: ['anemia', 'tired', 'weak', 'pale', 'low energy', 'iron'],
    content: [
      "Feeling very tired, weak, or looking pale could be signs of anemia, which is common in girls.",
      "Anemia is often caused by a lack of iron in the body.",
      "To prevent anemia, eat iron-rich foods like green leafy vegetables (spinach), lentils, beans, and jaggery (gur).",
      "The government provides free iron and folic acid (IFA) tablets at schools and Anganwadi centers. Taking one tablet per week can help prevent anemia.",
      "Eating foods rich in Vitamin C, like lemons and oranges, helps your body absorb iron better."
    ]
  },
  {
    topic: 'Mental and Emotional Health',
    keywords: ['sad', 'anxious', 'stress', 'depressed', 'worried', 'exams', 'confidence', 'scared', 'feelings'],
    content: [
      "It's completely normal to feel sad, anxious, or worried sometimes. Your feelings are valid.",
      "Talking about your feelings with someone you trust, like a friend, parent, or teacher, can make you feel much better.",
      "To manage stress during exams, make a study schedule, take short breaks, get enough sleep, and eat healthy food.",
      "Simple activities like listening to music, drawing, walking, or deep breathing can help calm your mind.",
      "If you feel very sad for a long time and don't enjoy things you used to, please talk to a health worker or a trusted adult. You are not alone."
    ]
  },
  {
    topic: 'Early Marriage',
    keywords: ['marriage', 'marry', 'family', 'study', 'education', 'parents', 'convince'],
    content: [
      "The legal age for marriage for girls in India is 18 years. Marrying early can be harmful to a girl's health and future.",
      "Continuing your education can open up many opportunities for a better future for you and your family.",
      "If your family is talking about early marriage, try to share your dreams of studying further with them calmly.",
      "You can talk to a trusted teacher or an Anganwadi worker. They can help explain the importance of education and the risks of early marriage to your parents.",
      "There are government schemes that support girls' education, which might help convince your parents."
    ]
  },
  {
    topic: 'Education and Career',
    keywords: ['schemes', 'scholarship', 'education', 'career', 'courses', 'mobile', 'internet', 'job'],
    content: [
      "The government has many schemes to help girls continue their education, like providing scholarships, free bicycles, and books.",
      "You can ask your school teacher or Anganwadi worker about schemes like 'Beti Bachao, Beti Padhao'.",
      "Learning to use a mobile phone or the internet can help you find a lot of information for your studies and learn new skills.",
      "There are many free online courses available on platforms like YouTube where you can learn about computers, English, and other subjects.",
      "Career options are not limited. With education, girls can become teachers, nurses, police officers, computer operators, or even run their own business."
    ]
  },
  {
    topic: 'Default Fallback',
    keywords: [],
    content: [
        "Adolescence is a time of many changes in the body and mind.",
        "It's okay to have questions about health, feelings, and your future.",
        "Always talk to a trusted adult like a parent, teacher, or health worker if you are worried about something.",
        "Taking care of your health is very important for a happy future."
    ]
  }
];

export const retrieveContext = (query: string): { topic: string; content: string[] } => {
  const lowerCaseQuery = query.toLowerCase();
  let bestMatch = { score: 0, topic: 'Default Fallback', content: [] as string[] };

  knowledgeBase.forEach(article => {
    let currentScore = 0;
    article.keywords.forEach(keyword => {
      if (lowerCaseQuery.includes(keyword)) {
        currentScore++;
      }
    });

    if (currentScore > bestMatch.score) {
      bestMatch = { score: currentScore, topic: article.topic, content: article.content };
    }
  });

  // If no good match is found (score is 0), return the default fallback content.
  if (bestMatch.score === 0) {
    const fallbackArticle = knowledgeBase.find(article => article.topic === 'Default Fallback');
    return {
      topic: 'Default Fallback',
      content: fallbackArticle ? fallbackArticle.content : [],
    };
  }

  return { topic: bestMatch.topic, content: bestMatch.content };
};
