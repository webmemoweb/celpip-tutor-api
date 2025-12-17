import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

export const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY not set - AI features disabled');
    return false;
  }
  
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  console.log('✅ Gemini AI initialized');
  return true;
};

// Helper function to get scenario from task
const getTaskScenario = (task) => {
  if (task.scenario) return task.scenario;
  if (task.details?.scenario) return task.details.scenario;
  return 'Write a response based on the given task.';
};

// Helper function to get bullets from task
const getTaskBullets = (task) => {
  if (task.bullets && Array.isArray(task.bullets)) return task.bullets;
  if (task.details?.bulletPoints && Array.isArray(task.details.bulletPoints)) return task.details.bulletPoints;
  return [];
};

// Generate writing task
export const generateWritingTask = async (type) => {
  if (!model) throw new Error('Gemini not initialized');

  const prompt = type === 'TASK_1_EMAIL' 
    ? `Generate a CELPIP Writing Task 1 (Email). Provide a realistic scenario where someone needs to write an email. Include:
       - A clear situation/context
       - 3 bullet points of what the email should address
       Format as JSON: {"scenario": "...", "bullets": ["...", "...", "..."]}`
    : `Generate a CELPIP Writing Task 2 (Survey Response). Provide a survey question with two options. Include:
       - A survey topic
       - Option A and Option B
       - The person should choose one and explain why
       Format as JSON: {"scenario": "...", "optionA": "...", "optionB": "...", "bullets": ["Choose one option", "Explain your choice", "Give reasons"]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: `generated-${Date.now()}`,
        type,
        mode: 'WRITING',
        title: type === 'TASK_1_EMAIL' ? 'Writing Task 1: Email' : 'Writing Task 2: Survey',
        ...parsed
      };
    }
  } catch (e) {
    console.error('Failed to parse generated task:', e);
  }

  return null;
};

// Generate speaking task
export const generateSpeakingTask = async (type) => {
  if (!model) throw new Error('Gemini not initialized');

  const taskNum = type.replace('SPEAKING_TASK_', '');
  const prompt = `Generate a CELPIP Speaking Task ${taskNum}. Provide a clear prompt that a test-taker should respond to verbally.
    Format as JSON: {"prompt": "...", "preparationTime": 30, "responseTime": 60}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: `speaking-${Date.now()}`,
        type,
        mode: 'SPEAKING',
        title: `Speaking Task ${taskNum}`,
        ...parsed
      };
    }
  } catch (e) {
    console.error('Failed to parse generated task:', e);
  }

  return null;
};

// Evaluate writing response
export const evaluateWriting = async (task, userText) => {
  if (!model) throw new Error('Gemini not initialized');

  console.log('Evaluating writing, task:', JSON.stringify(task));
  console.log('User text length:', userText?.length);

  const scenario = getTaskScenario(task);
  const bullets = getTaskBullets(task);

  const prompt = `You are a CELPIP writing examiner. Evaluate this writing response.

TASK SCENARIO: ${scenario}

TASK REQUIREMENTS: ${bullets.join(', ')}

STUDENT'S RESPONSE:
${userText}

Evaluate based on CELPIP criteria and provide scores from 1-12 for each category.
Respond ONLY with valid JSON in this exact format:
{
  "overallScore": 8,
  "coherenceScore": 8,
  "vocabularyScore": 7,
  "grammarScore": 8,
  "taskScore": 8,
  "strengths": "Good organization and clear ideas",
  "improvements": "Could use more varied vocabulary",
  "feedback": "Your response addresses the task well. You have organized your ideas logically."
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Gemini response:', text);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('Evaluation error:', error);
    throw error;
  }
};

// Evaluate speaking response
export const evaluateSpeaking = async (task, audioBase64) => {
  if (!model) throw new Error('Gemini not initialized');

  // For now, return a mock response since audio processing is complex
  return {
    overallScore: 7,
    fluencyScore: 7,
    pronunciationScore: 7,
    vocabularyScore: 7,
    feedback: "Speaking evaluation requires audio processing. This is a placeholder response.",
    strengths: "Audio received successfully",
    improvements: "Full audio evaluation coming soon"
  };
};

export default { initializeGemini, generateWritingTask, generateSpeakingTask, evaluateWriting, evaluateSpeaking };
