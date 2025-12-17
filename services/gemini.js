import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set');
    return false;
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized');
  return true;
};

// Generate Writing Task
export const generateWritingTask = async (type) => {
  if (!genAI) throw new Error('Gemini not initialized');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const isTask1 = type === 'TASK_1_EMAIL';
  
  const prompt = isTask1 
    ? `Generate a CELPIP Writing Task 1 (Email). Create a realistic scenario where someone needs to write an email.
       Return ONLY valid JSON: {"scenario": "description", "bulletPoints": ["point1", "point2", "point3"]}`
    : `Generate a CELPIP Writing Task 2 (Survey Response). Create a survey question with two options.
       Return ONLY valid JSON: {"surveyContext": "question", "optionA": {"label": "Option A: Name", "description": "details"}, "optionB": {"label": "Option B: Name", "description": "details"}}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  return {
    id: Date.now().toString(),
    mode: 'WRITING',
    type: type,
    title: isTask1 ? 'Writing Task 1: Email' : 'Writing Task 2: Survey',
    instructions: 'Read the following information.',
    details: JSON.parse(cleaned)
  };
};

// Generate Speaking Task
export const generateSpeakingTask = async (type) => {
  if (!genAI) throw new Error('Gemini not initialized');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const taskNum = type.replace('SPEAKING_TASK_', '');
  
  const prompts = {
    '1': 'Generate CELPIP Speaking Task 1 (Giving Advice). Return JSON: {"prompt": "advice scenario"}',
    '2': 'Generate CELPIP Speaking Task 2 (Personal Experience). Return JSON: {"prompt": "Talk about a time..."}',
    '3': 'Generate CELPIP Speaking Task 3 (Describe Scene). Return JSON: {"prompt": "Describe...", "imageDescription": "scene description"}',
    '4': 'Generate CELPIP Speaking Task 4 (Predictions). Return JSON: {"prompt": "What will happen?", "imageDescription": "situation"}',
    '5': 'Generate CELPIP Task 5 (Compare). Return JSON with prompt, optionA and optionB (each with title and features array).',
    '6': 'Generate CELPIP Task 6 (Difficult Situation). Return JSON: {"prompt": "scenario", "difficultSituationOptions": {"option1": "choice 1", "option2": "choice 2"}}',
    '7': 'Generate CELPIP Speaking Task 7 (Opinion). Return JSON: {"prompt": "opinion question"}',
    '8': 'Generate CELPIP Speaking Task 8 (Unusual). Return JSON: {"prompt": "describe unusual", "imageDescription": "unusual scene"}'
  };

  const titles = {
    '1': 'Task 1: Giving Advice',
    '2': 'Task 2: Personal Experience',
    '3': 'Task 3: Describing a Scene',
    '4': 'Task 4: Making Predictions',
    '5': 'Task 5: Comparing and Persuading',
    '6': 'Task 6: Dealing with a Difficult Situation',
    '7': 'Task 7: Expressing Opinions',
    '8': 'Task 8: Describing an Unusual Situation'
  };

  const result = await model.generateContent(prompts[taskNum] + ' Return ONLY valid JSON.');
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const data = JSON.parse(cleaned);

  return {
    id: Date.now().toString(),
    mode: 'SPEAKING',
    type: type,
    title: titles[taskNum],
    instructions: 'Read the instructions.',
    details: {
      ...data,
      preparationTime: 60,
      speakingTime: ['1', '7'].includes(taskNum) ? 90 : 60
    }
  };
};

// Evaluate Writing
export const evaluateWriting = async (task, userText) => {
  if (!genAI) throw new Error('Gemini not initialized');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const taskContext = task.type === 'TASK_1_EMAIL' 
    ? `Scenario: ${task.details.scenario}`
    : `Survey: ${task.details.surveyContext}`;

  const prompt = `
    You are a CELPIP Writing Examiner. Evaluate this response.
    Context: ${taskContext}
    User Text: "${userText}"
    
    Return ONLY valid JSON:
    {
      "score": (integer 1-12),
      "feedback": "overall feedback",
      "breakdown": {
        "content": "content feedback",
        "vocabulary": "vocabulary feedback",
        "coherence": "coherence feedback",
        "readability": "grammar feedback"
      },
      "improvedVersion": "improved version of the text"
    }
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  return JSON.parse(cleaned);
};

// Evaluate Speaking
export const evaluateSpeaking = async (task, audioBase64) => {
  if (!genAI) throw new Error('Gemini not initialized');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  let taskContext = `Task: ${task.title}\nPrompt: ${task.details.prompt}`;
  
  if (task.details.options) {
    taskContext += `\nOption A: ${task.details.options.optionA.title}\nOption B: ${task.details.options.optionB.title}`;
  }
  if (task.details.difficultSituationOptions) {
    taskContext += `\nOption 1: ${task.details.difficultSituationOptions.option1}\nOption 2: ${task.details.difficultSituationOptions.option2}`;
  }

  const prompt = `
    You are a CELPIP Speaking Examiner. 
    1. Transcribe the audio response.
    2. Evaluate based on CELPIP criteria.
    3. Provide a Score (1-12).
    
    Task Context: ${taskContext}

    Return ONLY valid JSON:
    {
      "score": (integer 1-12),
      "transcript": "transcribed text",
      "feedback": "overall feedback",
      "breakdown": {
        "content": "content feedback",
        "vocabulary": "vocabulary feedback",
        "coherence": "coherence feedback",
        "readability": "pronunciation feedback"
      },
      "improvedVersion": "example response"
    }
  `;

  const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
    { text: prompt }
  ]);
  
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  return JSON.parse(cleaned);
};
