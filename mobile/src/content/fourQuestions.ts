/** The four "how GeneoRx works" cards, word for word as on the website (resources/data/intro_slides.php). */
export const FOUR_QUESTIONS: Array<{ tag: string; title: string; paragraphs: string[]; bullets: string[] }> = [
  {
    tag: 'Overview', title: 'What is GeneoRx?',
    paragraphs: ["GeneoRx is your personal medication intelligence platform connecting medications, symptoms, and nutrient levels to help you understand what's really going on in your body giving you a clearer picture of your health."],
    bullets: [],
  },
  {
    tag: 'How it works', title: 'How does it work?',
    paragraphs: ['GeneoRx analyzes:', 'As you check in regularly, it builds a personalized profile, spotting patterns and improving accuracy over time.'],
    bullets: ['Your medications', 'Your symptoms over time', 'Known drug–nutrient interactions'],
  },
  {
    tag: 'Benefits', title: 'How does it help you?', paragraphs: [],
    bullets: [
      'Explains symptoms – Understand possible links to medications or nutrient imbalances',
      'Finds root causes – Highlights what may be driving issues like fatigue or brain fog',
      'Tracks progress – Monitors changes over time',
      'Prepares you for doctor visits – Provides a quick health summary for your doctor',
    ],
  },
  {
    tag: 'In short', title: 'In short',
    paragraphs: ['GeneoRx helps you connect the dots between your medications, symptoms, and nutrition so you can make smarter health decisions.'],
    bullets: [],
  },
];
