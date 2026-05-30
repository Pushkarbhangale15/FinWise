const sampleModules = [
    {
      title: "Budgeting Basics for Students",
      description: "Learn how to create and stick to a budget as a student",
      category: "budgeting",
      difficulty: "beginner",
      estimatedTime: 15,
      xpReward: 50,
      order: 1,
      content: {
        sections: [
          {
            type: "text",
            title: "What is Budgeting?",
            content: "<p>Budgeting is simply tracking your money...</p>"
          },
          {
            type: "interactive",
            title: "Budget Calculator",
            content: "budget-calculator-component",
            interactiveData: { type: "budget_planner" }
          }
        ],
        quiz: [
          {
            question: "What percentage of income should students aim to save?",
            options: ["5%", "10-20%", "50%", "It doesn't matter"],
            correctAnswer: 1,
            explanation: "Students should aim to save 10-20% of their income for financial security."
          }
        ]
      }
    }
  ];
  
  const sampleBadges = [
    {
      name: "First Steps",
      description: "Complete your first learning module",
      icon: "🎯",
      category: "learning",
      criteria: { modulesCompleted: 1 },
      rarity: "common",
      xpBonus: 10
    },
    {
      name: "Budget Master",
      description: "Create your first budget",
      icon: "💰",
      category: "budgeting",
      criteria: { budgetsCreated: 1 },
      rarity: "common",
      xpBonus: 15
    },
    {
      name: "First Answer",
      description: "Posted your first answer to help someone",
      icon: "🎯",
      category: "community",
      criteria: { firstAnswer: true },
      rarity: "common",
      xpBonus: 25
    },
    {
      name: "Daily Helper",
      description: "Posted 3 answers in one day",
      icon: "📝",
      category: "community",
      criteria: { answersInOneDay: 3 },
      rarity: "common",
      xpBonus: 20
    },
    {
      name: "Helpful Helper",
      description: "Posted 5 helpful answers",
      icon: "🤝",
      category: "community",
      criteria: { helpfulAnswers: 5 },
      rarity: "common",
      xpBonus: 30
    },
    {
      name: "Answer Expert",
      description: "Posted 25 answers",
      icon: "🧠",
      category: "community",
      criteria: { totalAnswers: 25 },
      rarity: "rare",
      xpBonus: 50
    },
    {
      name: "Accepted Solution",
      description: "Had your answer accepted as the solution",
      icon: "✅",
      category: "community",
      criteria: { acceptedAnswers: 1 },
      rarity: "rare",
      xpBonus: 50
    },
    {
      name: "Helpful Community Member",
      description: "Posted 3 helpful answers (5+ upvotes each)",
      icon: "⭐",
      category: "community",
      criteria: { helpfulAnswers: 3 },
      rarity: "rare",
      xpBonus: 40
    },
    {
      name: "Answer Enthusiast",
      description: "Posted 5 answers in one day",
      icon: "⚡",
      category: "community",
      criteria: { answersInOneDay: 5 },
      rarity: "rare",
      xpBonus: 45
    },
    {
      name: "Answer Master",
      description: "Posted 100 answers",
      icon: "👑",
      category: "community",
      criteria: { totalAnswers: 100 },
      rarity: "epic",
      xpBonus: 150
    },
    {
      name: "Trusted Expert",
      description: "Had 5 answers accepted as solutions",
      icon: "🏆",
      category: "community",
      criteria: { acceptedAnswers: 5 },
      rarity: "epic",
      xpBonus: 100
    },
    {
      name: "Community Champion",
      description: "Had 25 answers accepted as solutions",
      icon: "🥇",
      category: "community",
      criteria: { acceptedAnswers: 25 },
      rarity: "legendary",
      xpBonus: 500
    }
  ];

  module.exports ={
    sampleModules, sampleBadges
  };