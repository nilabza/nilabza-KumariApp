
export interface ProbingQuestionCategory {
  category: string;
  questions: string[];
}

export const probingQuestionBank: ProbingQuestionCategory[] = [
  {
    category: 'General Health & Hygiene',
    questions: [
      'How can I maintain personal hygiene during menstruation?',
      'Why do I get stomach pain during my periods?',
      'What foods should I eat to stay healthy?',
      'How often should I wash my hair to prevent dandruff?',
      'How can I avoid skin infections in hot weather?',
    ],
  },
  {
    category: 'Menstrual & Reproductive Health',
    questions: [
      'Is irregular menstruation normal?',
      'How do I track my period cycle?',
      'What should I do if I miss my period for two months?',
      'Can I use cloth instead of sanitary pads?',
      'Are there natural remedies for menstrual cramps?',
    ],
  },
  {
    category: 'Nutrition & Diet',
    questions: [
      'What are the best foods for increasing my energy levels?',
      'How can I improve my diet to prevent anemia?',
      'Is it okay to drink milk during my periods?',
      'What are the symptoms of malnutrition?',
    ],
  },
  {
    category: 'Mental Health & Emotional Well-being',
    questions: [
      'Why do I feel sad or anxious sometimes?',
      'How can I manage stress during exams?',
      'Who should I talk to if I feel depressed?',
      'How can I improve my confidence and self-esteem?',
    ],
  },
  {
    category: 'Early Marriage & Family Expectations',
    questions: [
      'What should I do if my family wants me to marry early?',
      'Can I continue my education after marriage?',
      'How can I convince my parents to let me study further?',
    ],
  },
  {
    category: 'Education & Career Guidance',
    questions: [
      'What government schemes help girls continue their education?',
      'How can I learn to use a mobile phone or the internet?',
      'What are the best career options for girls in my village?',
      'Are there free online courses I can take?',
    ],
  },
  {
    category: 'Digital & Mobile Safety',
    questions: [
      'How can I protect my privacy on social media?',
      'What should I do if someone harasses me online?',
      'Is it safe to share my phone number with strangers?',
    ],
  },
  {
    category: 'Sexual & Reproductive Health (Age-Appropriate Guidance)',
    questions: [
      'What is contraception, and is it safe?',
      'How can I avoid unwanted pregnancy?',
      'What should I do if someone touches me inappropriately?',
      'Who can I report sexual harassment to in my village?',
    ],
  },
  {
    category: 'Government Schemes & Support Systems',
    questions: [
      'How can I apply for a government scholarship for girls?',
      'What health services are free for adolescent girls?',
      'Where can I get sanitary pads for free?',
      'How can I contact an ASHA worker for health advice?',
    ],
  },
];

/**
 * A map to associate topics from the knowledgeBase with the more descriptive
 * categories used in the probing question bank.
 */
const topicToCategoryMap: { [key: string]: string } = {
  'Menstrual Hygiene': 'Menstrual & Reproductive Health',
  'Menstrual Pain': 'Menstrual & Reproductive Health',
  'Healthy Diet': 'Nutrition & Diet',
  'Anemia Prevention': 'Nutrition & Diet',
  'Mental and Emotional Health': 'Mental Health & Emotional Well-being',
  'Early Marriage': 'Early Marriage & Family Expectations',
  'Education and Career': 'Education & Career Guidance',
};


/**
 * Gets a random probing question. If a topic is provided, it attempts to
 * find a question from a relevant category. Otherwise, it picks from all available questions.
 * @param topic - The topic from the knowledgeBase (e.g., 'Menstrual Pain').
 * @returns A random probing question as a string.
 */
export const getRandomProbingQuestion = (topic?: string): string => {
  let questionPool: string[] = [];

  // Try to find a relevant category based on the topic
  if (topic) {
    const categoryName = topicToCategoryMap[topic];
    if (categoryName) {
        const categoryQuestions = probingQuestionBank.find(c => c.category === categoryName)?.questions;
        if (categoryQuestions) {
            questionPool = categoryQuestions;
        }
    }
  }

  // If no specific pool was found, use all questions as a fallback
  if (questionPool.length === 0) {
    questionPool = probingQuestionBank.flatMap(c => c.questions);
  }

  if (questionPool.length === 0) {
    return 'How can I help you with your health today?'; // Absolute fallback
  }

  const randomIndex = Math.floor(Math.random() * questionPool.length);
  return questionPool[randomIndex];
};
