const db = require('../services/dbService');
const sandbox = require('../services/sandboxRunner');

exports.createChallenge = async (req, res) => {
  const { title, description, inputFormat, outputFormat, constraints, difficulty, topic, testCases } = req.body;
  try {
    if (!title || !description || !topic || !testCases || testCases.length === 0) {
      return res.status(400).json({ message: 'Title, description, topic and testCases are required' });
    }

    const challenge = await db.challenges.create({
      title,
      description,
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      constraints: constraints || '',
      difficulty: difficulty || 'Easy',
      topic,
      testCases,
      createdBy: req.user.id
    });

    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create challenge', error: error.message });
  }
};

exports.getAllChallenges = async (req, res) => {
  try {
    const list = await db.challenges.find({});
    // Remove secret testcases for safety, outputting only public sample test cases
    const sanitized = list.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      topic: c.topic,
      inputFormat: c.inputFormat,
      outputFormat: c.outputFormat,
      constraints: c.constraints,
      sampleTestCases: (c.testCases || []).filter(tc => tc.isSample),
      testCasesCount: (c.testCases || []).length
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch challenges', error: error.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await db.challenges.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Check if user has already solved this challenge
    const submissions = await db.submissions.find({ challenge: req.params.id, user: req.user.id, status: 'Accepted' });
    const isCompleted = submissions.length > 0;

    res.json({
      _id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      topic: challenge.topic,
      inputFormat: challenge.inputFormat,
      outputFormat: challenge.outputFormat,
      constraints: challenge.constraints,
      sampleTestCases: (challenge.testCases || []).filter(tc => tc.isSample),
      isCompleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to find challenge', error: error.message });
  }
};

exports.submitChallenge = async (req, res) => {
  const { code, language } = req.body;
  const challengeId = req.params.id;
  const userId = req.user.id;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }

  try {
    const challenge = await db.challenges.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const testCases = challenge.testCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({ message: 'This challenge has no test cases configured.' });
    }

    let passedCount = 0;
    let totalTime = 0;
    let totalMemory = 0;
    let submissionStatus = 'Accepted';
    let runtimeLogs = '';
    let detailedFeedback = [];

    // Run code through all test cases
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const runResult = await sandbox.execute(language, code, tc.input);

      totalTime += runResult.time || 0;
      totalMemory = Math.max(totalMemory, runResult.memory || 0);

      if (!runResult.success) {
        submissionStatus = runResult.stderr ? 'Compile Error' : 'Runtime Error';
        runtimeLogs = runResult.stderr || 'Execution failed';
        detailedFeedback.push({
          case: i + 1,
          passed: false,
          error: runtimeLogs
        });
        break; // Stop running further tests on compile/runtime error
      }

      // Check output (case insensitive, trim whitespace)
      const sanitizedActual = (runResult.stdout || '').trim().toLowerCase().replace(/\r\n/g, '\n');
      const sanitizedExpected = (tc.output || '').trim().toLowerCase().replace(/\r\n/g, '\n');

      if (sanitizedActual === sanitizedExpected) {
        passedCount++;
        detailedFeedback.push({ case: i + 1, passed: true });
      } else {
        submissionStatus = 'Wrong Answer';
        runtimeLogs = `Expected: "${tc.output.trim()}"\nActual: "${(runResult.stdout || '').trim()}"`;
        detailedFeedback.push({
          case: i + 1,
          passed: false,
          expected: tc.output,
          actual: runResult.stdout
        });
        break; // Stop running further tests on mismatch
      }
    }

    // Calculate score
    const finalScore = Math.round((passedCount / testCases.length) * 100);
    const avgTime = Math.round(totalTime / testCases.length);

    // Save submission
    const submission = await db.submissions.create({
      challenge: challengeId,
      user: userId,
      code,
      language,
      status: submissionStatus,
      score: finalScore,
      executionTime: avgTime,
      memoryUsage: totalMemory,
      testCasesPassed: passedCount,
      testCasesTotal: testCases.length
    });

    // Notify user
    let notificationMsg = '';
    let notificationType = 'info';

    if (submissionStatus === 'Accepted') {
      notificationMsg = `Congratulations! You solved "${challenge.title}" with 100/100 points!`;
      notificationType = 'success';
    } else {
      notificationMsg = `Challenge attempted: "${challenge.title}". Code status: ${submissionStatus} (${passedCount}/${testCases.length} passed).`;
      notificationType = 'warning';
    }

    await db.notifications.create({
      user: userId,
      message: notificationMsg,
      type: notificationType
    });

    res.json({
      submissionId: submission._id,
      status: submissionStatus,
      score: finalScore,
      executionTime: avgTime,
      memoryUsage: totalMemory,
      testCasesPassed: passedCount,
      testCasesTotal: testCases.length,
      errorFeedback: runtimeLogs,
      casesFeedback: detailedFeedback
    });

  } catch (error) {
    res.status(500).json({ message: 'Submission execution crashed', error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const submissions = await db.submissions.find({});
    const users = await db.users.find({});
    
    // Group challenges by user, keeping the highest score per challenge
    const userScores = {};
    submissions.forEach(sub => {
      const uStr = String(sub.user);
      const cStr = String(sub.challenge);
      
      if (!userScores[uStr]) {
        userScores[uStr] = {};
      }
      
      if (!userScores[uStr][cStr] || userScores[uStr][cStr] < sub.score) {
        userScores[uStr][cStr] = sub.score;
      }
    });

    // Calculate total score per user
    const leaderboard = Object.keys(userScores).map(userId => {
      const userObj = users.find(u => String(u._id) === userId);
      const scores = userScores[userId];
      const totalPoints = Object.values(scores).reduce((acc, score) => acc + score, 0);
      const solvedCount = Object.values(scores).filter(s => s === 100).length;

      return {
        userId,
        name: userObj ? userObj.name : 'Unknown Dev',
        email: userObj ? userObj.email : '',
        score: totalPoints,
        challengesSolved: solvedCount
      };
    });

    // Sort leaderboard by score descending, then count solved
    leaderboard.sort((a, b) => b.score - a.score || b.challengesSolved - a.challengesSolved);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Failed to construct leaderboard', error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    let subs = await db.submissions.find({ user: userId });
    
    // Fetch and append challenge details
    const challenges = await db.challenges.find({});
    
    const detailedSubs = subs.map(s => {
      const ch = challenges.find(c => String(c._id) === String(s.challenge));
      return {
        _id: s._id,
        challengeId: s.challenge,
        challengeTitle: ch ? ch.title : 'Deleted Challenge',
        difficulty: ch ? ch.difficulty : 'Unknown',
        code: s.code,
        language: s.language,
        status: s.status,
        score: s.score,
        executionTime: s.executionTime,
        memoryUsage: s.memoryUsage,
        testCasesPassed: s.testCasesPassed,
        testCasesTotal: s.testCasesTotal,
        createdAt: s.createdAt
      };
    });

    detailedSubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(detailedSubs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user submissions', error: error.message });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = await db.challenges.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    await db.challenges.findByIdAndDelete(req.params.id);
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete challenge', error: error.message });
  }
};
