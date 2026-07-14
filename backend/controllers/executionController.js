const sandbox = require('../services/sandboxRunner');
const db = require('../services/dbService');

exports.runCode = async (req, res) => {
  const { code, language, input } = req.body;
  const userId = req.user.id;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }

  try {
    const result = await sandbox.execute(language, code, input || '');

    // Write execution attempt to ExecutionHistory
    await db.executionHistory.create({
      user: userId,
      code,
      language,
      output: result.stdout || '',
      error: result.stderr || '',
      executionTime: result.time || 0,
      memoryUsage: result.memory || 0
    });

    res.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTime: result.time,
      memoryUsage: result.memory
    });
  } catch (error) {
    res.status(500).json({ message: 'Execution thread crashed', error: error.message });
  }
};

exports.getExecutionHistory = async (req, res) => {
  try {
    const history = await db.executionHistory.find({ user: req.user.id });
    
    // Sort latest first
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve execution history', error: error.message });
  }
};
