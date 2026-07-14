const ai = require('../services/aiService');
const db = require('../services/dbService');

exports.explainError = async (req, res) => {
  const { code, language, error } = req.body;
  const userId = req.user.id;

  if (!language || !error) {
    return res.status(400).json({ message: 'Language and error details are required' });
  }

  try {
    const aiResult = await ai.getAIResponse('explain', error, code || '', { language });

    await db.aiHistory.create({
      user: userId,
      prompt: `Explain error: ${error.slice(0, 100)}`,
      response: aiResult.response,
      type: 'explain'
    });

    res.json({ explanation: aiResult.response });
  } catch (err) {
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

exports.reviewCode = async (req, res) => {
  const { code, language } = req.body;
  const userId = req.user.id;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }

  try {
    const aiResult = await ai.getAIResponse('review', 'Review this code structure.', code, { language });
    const scoreVal = aiResult.score !== null ? aiResult.score : 80;

    await db.aiHistory.create({
      user: userId,
      prompt: 'Review code parameters.',
      response: aiResult.response,
      type: 'review',
      score: scoreVal
    });

    res.json({
      review: aiResult.response,
      score: scoreVal
    });
  } catch (err) {
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

exports.optimizeCode = async (req, res) => {
  const { code, language } = req.body;
  const userId = req.user.id;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }

  try {
    const aiResult = await ai.getAIResponse('optimize', 'Optimize this code execution.', code, { language });

    await db.aiHistory.create({
      user: userId,
      prompt: 'Optimize implementation.',
      response: aiResult.response,
      type: 'optimize'
    });

    res.json({ optimization: aiResult.response });
  } catch (err) {
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

exports.chatAssistant = async (req, res) => {
  const { code, language, message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ message: 'Message prompt is required' });
  }

  try {
    const aiResult = await ai.getAIResponse('chat', message, code || '', { language });

    await db.aiHistory.create({
      user: userId,
      prompt: message,
      response: aiResult.response,
      type: 'chat'
    });

    res.json({ reply: aiResult.response });
  } catch (err) {
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

exports.generateChallenge = async (req, res) => {
  const { topic, difficulty } = req.body;
  const userId = req.user.id;

  if (!topic || !difficulty) {
    return res.status(400).json({ message: 'Topic and difficulty are required' });
  }

  try {
    const aiResult = await ai.getAIResponse(
      'challenge_gen',
      `Generate challenge for Topic: ${topic}, Difficulty: ${difficulty}`,
      '',
      { topic, difficulty }
    );

    await db.aiHistory.create({
      user: userId,
      prompt: `Generate Challenge: ${topic} (${difficulty})`,
      response: aiResult.response,
      type: 'challenge_gen'
    });

    res.json({ challengeMarkdown: aiResult.response });
  } catch (err) {
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

exports.getAIHistory = async (req, res) => {
  try {
    const history = await db.aiHistory.find({ user: req.user.id });
    
    // Sort latest first
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve AI records', error: error.message });
  }
};
