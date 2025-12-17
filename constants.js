// Demo task - available for free users (only 1)
export const DEMO_WRITING_TASK = {
  id: 'demo-1',
  mode: 'WRITING',
  type: 'TASK_1_EMAIL',
  title: 'Writing Task 1: Email (Demo)',
  instructions: 'Read the following information.',
  isDemo: true,
  details: {
    scenario: 'You recently visited a local hospital to visit a friend. However, you were very unhappy with the level of cleanliness and the behavior of the staff.',
    bulletPoints: [
      'Describe the purpose of your visit.',
      'Explain the problems you encountered.',
      'Suggest improvements.'
    ]
  }
};

export const DEMO_SPEAKING_TASK = {
  id: 'demo-speaking-1',
  mode: 'SPEAKING',
  type: 'SPEAKING_TASK_1',
  title: 'Task 1: Giving Advice (Demo)',
  instructions: 'A friend is looking for a job.',
  isDemo: true,
  details: {
    prompt: "Your friend Tom is looking for a new job but doesn't know where to start. Give him advice.",
    preparationTime: 60,
    speakingTime: 90
  }
};

// All tasks - available for premium users
export const INITIAL_TASKS = [
  // Writing Tasks
  {
    id: 't1-1',
    mode: 'WRITING',
    type: 'TASK_1_EMAIL',
    title: 'Writing Task 1: Email (#1)',
    instructions: 'Read the following information.',
    details: {
      scenario: 'You recently visited a local hospital to visit a friend. However, you were very unhappy with the level of cleanliness and the behavior of the staff.',
      bulletPoints: ['Describe the purpose of your visit.', 'Explain the problems you encountered.', 'Suggest improvements.']
    }
  },
  {
    id: 't1-2',
    mode: 'WRITING',
    type: 'TASK_1_EMAIL',
    title: 'Writing Task 1: Email (#2)',
    instructions: 'Read the following information.',
    details: {
      scenario: 'You ordered a laptop online two weeks ago, but it arrived damaged. You have tried contacting customer service multiple times without success.',
      bulletPoints: ['Describe what you ordered and when.', 'Explain the damage and your attempts to resolve the issue.', 'State what action you expect them to take.']
    }
  },
  {
    id: 't1-3',
    mode: 'WRITING',
    type: 'TASK_1_EMAIL',
    title: 'Writing Task 1: Email (#3)',
    instructions: 'Read the following information.',
    details: {
      scenario: 'Your neighbor has been playing loud music late at night, and it is affecting your sleep and work performance.',
      bulletPoints: ['Describe the problem in detail.', 'Explain how it is affecting you.', 'Suggest a solution.']
    }
  },
  {
    id: 't2-1',
    mode: 'WRITING',
    type: 'TASK_2_SURVEY',
    title: 'Writing Task 2: Survey (#1)',
    instructions: 'Read the following information.',
    details: {
      surveyContext: 'City Development Survey: How to spend surplus budget?',
      optionA: { label: 'Option A: New Public Library', description: 'Modern library with digital archives.' },
      optionB: { label: 'Option B: Sports Center', description: 'New pool and gym equipment.' }
    }
  },
  {
    id: 't2-2',
    mode: 'WRITING',
    type: 'TASK_2_SURVEY',
    title: 'Writing Task 2: Survey (#2)',
    instructions: 'Read the following information.',
    details: {
      surveyContext: 'Company Policy Survey: Remote work options for employees?',
      optionA: { label: 'Option A: Full Remote Work', description: 'Employees can work from home 5 days a week.' },
      optionB: { label: 'Option B: Hybrid Model', description: '3 days in office, 2 days remote.' }
    }
  },

  // Speaking Tasks
  { id: 's1-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_1', title: 'Task 1: Giving Advice (#1)', instructions: 'A friend is looking for a job.', details: { prompt: "Your friend Tom is looking for a new job but doesn't know where to start. Give him advice.", preparationTime: 60, speakingTime: 90 } },
  { id: 's1-2', mode: 'SPEAKING', type: 'SPEAKING_TASK_1', title: 'Task 1: Giving Advice (#2)', instructions: 'Getting healthy.', details: { prompt: "Your cousin wants to start a healthy lifestyle but lacks motivation. Advise her on how to start.", preparationTime: 60, speakingTime: 90 } },
  { id: 's2-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_2', title: 'Task 2: Personal Experience (#1)', instructions: 'Talk about a personal experience.', details: { prompt: "Talk about a time when you helped someone in need. What happened and how did you feel?", preparationTime: 60, speakingTime: 60 } },
  { id: 's3-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_3', title: 'Task 3: Scene (#1)', instructions: 'Describe the picture.', details: { prompt: "Describe everything you see in this scene.", preparationTime: 60, speakingTime: 60, imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600", imageDescription: "A busy restaurant with people dining." } },
  { id: 's4-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_4', title: 'Task 4: Predictions (#1)', instructions: 'What will happen next?', details: { prompt: "Look at the scene and predict what will happen next.", preparationTime: 60, speakingTime: 60, imageUrl: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600", imageDescription: "A person at a job interview." } },
  { 
    id: 's5-1', 
    mode: 'SPEAKING', 
    type: 'SPEAKING_TASK_5', 
    title: 'Task 5: Comparing (#1)', 
    instructions: 'Compare and persuade.', 
    details: { 
      prompt: "Your family is looking for a new home. Compare these options and persuade a family member.", 
      preparationTime: 60, 
      speakingTime: 60, 
      options: { 
        optionA: { 
          title: "Downtown Townhouse", 
          imageUrl: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600",
          features: ["$250,000", "3 bedrooms", "Close to transit"]
        }, 
        optionB: { 
          title: "Suburban Home", 
          imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600",
          features: ["$300,000", "4 bedrooms", "Large yard"]
        } 
      } 
    } 
  },
  { 
    id: 's6-1', 
    mode: 'SPEAKING', 
    type: 'SPEAKING_TASK_6', 
    title: 'Task 6: Difficult Situation (#1)', 
    instructions: 'Handle a difficult situation.', 
    details: { 
      prompt: "Your cousin wants to stay at your place for a year, but your roommate disagrees.", 
      preparationTime: 60, 
      speakingTime: 60,
      difficultSituationOptions: {
        option1: "Talk to your cousin. Explain why she cannot stay.",
        option2: "Talk to your roommate. Explain why your cousin should stay."
      }
    } 
  },
  { id: 's7-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_7', title: 'Task 7: Opinion (#1)', instructions: 'Express your opinion.', details: { prompt: "Do you think social media has a negative impact on society? Explain your opinion.", preparationTime: 60, speakingTime: 90 } },
  { id: 's8-1', mode: 'SPEAKING', type: 'SPEAKING_TASK_8', title: 'Task 8: Unusual (#1)', instructions: 'Describe something unusual.', details: { prompt: "Describe what you see and explain why it is unusual.", preparationTime: 60, speakingTime: 60, imageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600", imageDescription: "A dog wearing sunglasses at a cafe." } },
];

// Plan limits
export const LIMITS = {
  DEMO: {
    maxTasks: 1,
    canGenerate: false,
    canEvaluate: true
  },
  PREMIUM: {
    maxTasks: -1, // unlimited
    canGenerate: true,
    canEvaluate: true
  }
};
