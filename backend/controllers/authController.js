const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../services/dbService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'codeverse_jwt_secret_token_12345',
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const userExists = await db.users.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role === 'admin' ? 'admin' : 'student';

    const newUser = await db.users.create({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    // Create a first welcome notification
    await db.notifications.create({
      user: newUser._id,
      message: `Welcome to CodeVerse AI, ${name}! Start by exploring the editor or solving coding challenges.`,
      type: 'success'
    });

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // For production-readiness, we reset password to a temporary code: 'reset123'
    // in a real system, you would send an email. We output the instruction for direct convenience.
    const tempPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    await db.users.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({
      message: `Password reset instructions sent. For local dev mode, your password has been reset to: '${tempPassword}'`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process forgot password request', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, password } = req.body;
  const updates = {};
  
  if (name) updates.name = name;
  
  try {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await db.users.findByIdAndUpdate(req.user.id, updates);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Total Programs Executed (ExecutionHistory count)
    const totalExecuted = await db.executionHistory.countDocuments({ user: userId });

    // 2. Saved Programs (Program count)
    const savedProgramsCount = await db.programs.countDocuments({ user: userId });

    // 3. AI Suggestions Used (AIHistory count)
    const aiSuggestionsUsed = await db.aiHistory.countDocuments({ user: userId });

    // 4. Coding Challenge Progress
    // Total challenges available
    const totalChallengesCount = await db.challenges.countDocuments({});
    
    // Solved challenges (status Accepted)
    const submissions = await db.submissions.find({ user: userId });
    const solvedChallengeIds = new Set();
    const attemptedChallengeIds = new Set();

    submissions.forEach(sub => {
      attemptedChallengeIds.add(String(sub.challenge));
      if (sub.status === 'Accepted') {
        solvedChallengeIds.add(String(sub.challenge));
      }
    });

    const solvedCount = solvedChallengeIds.size;
    const attemptedCount = attemptedChallengeIds.size;

    // 5. Recent Activity
    // Fetch user recent activities and sort them (manually if local, otherwise sorted index)
    const recentSubmissions = await db.submissions.find({ user: userId });
    const trials = recentSubmissions.map(s => ({
      _id: s._id,
      type: 'submission',
      message: `Submitted response of challenge`,
      detail: `${s.language} - Status: ${s.status}`,
      date: s.createdAt
    }));

    const recentRuns = await db.executionHistory.find({ user: userId });
    const runs = recentRuns.map(r => ({
      _id: r._id,
      type: 'run',
      message: `Executed code in editor`,
      detail: `${r.language} code run`,
      date: r.createdAt
    }));

    const recentSaved = await db.programs.find({ user: userId });
    const saved = recentSaved.map(p => ({
      _id: p._id,
      type: 'saved',
      message: `Saved program "${p.title}"`,
      detail: p.language,
      date: p.updatedAt || p.createdAt
    }));

    const activities = [...trials, ...runs, ...saved]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      totalExecuted,
      savedProgramsCount,
      aiSuggestionsUsed,
      challenges: {
        total: totalChallengesCount,
        solved: solvedCount,
        attempted: attemptedCount
      },
      recentActivity: activities
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve stats', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // Admin request for dashboard analytics
    const totalUsers = await db.users.countDocuments({ role: 'student' });
    const totalStaff = await db.users.countDocuments({ role: 'admin' });
    const totalPrograms = await db.programs.countDocuments({});
    const totalRuns = await db.executionHistory.countDocuments({});
    const totalSubmissions = await db.submissions.countDocuments({});
    const totalAIUsage = await db.aiHistory.countDocuments({});

    // Challenges by difficulty
    const easyChallenges = await db.challenges.countDocuments({ difficulty: 'Easy' });
    const mediumChallenges = await db.challenges.countDocuments({ difficulty: 'Medium' });
    const hardChallenges = await db.challenges.countDocuments({ difficulty: 'Hard' });

    // Most used languages in executions
    const runs = await db.executionHistory.find({});
    const languageCounts = {};
    runs.forEach(r => {
      const lang = r.language.toLowerCase();
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    res.json({
      totals: {
        users: totalUsers,
        admins: totalStaff,
        programs: totalPrograms,
        runs: totalRuns,
        submissions: totalSubmissions,
        aiQueries: totalAIUsage
      },
      challengesByDifficulty: {
        easy: easyChallenges,
        medium: mediumChallenges,
        hard: hardChallenges
      },
      languageStats: languageCounts
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to compute admin analytics', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const userList = await db.users.find({});
    // Remove passwords
    const sanitized = userList.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.users.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
