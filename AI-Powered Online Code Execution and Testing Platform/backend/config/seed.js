const bcrypt = require('bcryptjs');
const db = require('../services/dbService');

const seedData = async () => {
  try {
    // 1. Seed default accounts if empty
    const adminExists = await db.users.findOne({ email: 'admin@codeverse.com' });
    let adminUserId = adminExists ? adminExists._id : null;
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const admin = await db.users.create({
        name: 'Admin Instructor',
        email: 'admin@codeverse.com',
        password: hashedPassword,
        role: 'admin'
      });
      adminUserId = admin._id;
      console.log('Seeded Admin account (admin@codeverse.com / password123)');
    }

    const studentExists = await db.users.findOne({ email: 'student@codeverse.com' });
    let studentUserId = studentExists ? studentExists._id : null;
    
    if (!studentExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const student = await db.users.create({
        name: 'Jane Doe',
        email: 'student@codeverse.com',
        password: hashedPassword,
        role: 'student'
      });
      studentUserId = student._id;
      console.log('Seeded Student account (student@codeverse.com / password123)');
      
      // Welcome notice
      await db.notifications.create({
        user: student._id,
        message: 'Welcome to CodeVerse! Try solving the classic "Two Sum" challenge in the panel.',
        type: 'info'
      });
    }

    // 2. Seed Coding Challenges if empty
    const challengeCount = await db.challenges.countDocuments({});
    if (challengeCount === 0) {
      const challengeList = [
        {
          title: 'Two Sum',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to the target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
          inputFormat: 'First line: N (element count).\nSecond line: N space-separated integers.\nThird line: target integer.',
          outputFormat: 'Two space-separated indices (index starts from 0).',
          constraints: '2 <= nums.length <= 10^3\n-10^9 <= nums[i] <= 10^9',
          difficulty: 'Easy',
          topic: 'Arrays',
          createdBy: adminUserId,
          testCases: [
            { input: '4\n2 7 11 15\n9', output: '0 1', isSample: true },
            { input: '3\n3 2 4\n6', output: '1 2', isSample: false },
            { input: '2\n3 3\n6', output: '0 1', isSample: false }
          ]
        },
        {
          title: 'Reverse String',
          description: 'Write a program that takes a string inputs and outputs the string in completely reversed order.',
          inputFormat: 'A single string parameter word.',
          outputFormat: 'The reversed string output.',
          constraints: '1 <= word.length <= 500',
          difficulty: 'Easy',
          topic: 'Strings',
          createdBy: adminUserId,
          testCases: [
            { input: 'hello', output: 'olleh', isSample: true },
            { input: 'code', output: 'edoc', isSample: false },
            { input: 'CodeVerseAI', output: 'IArsreVedoC', isSample: false }
          ]
        },
        {
          title: 'Climbing Stairs',
          description: 'You are climbing a staircase. It takes N steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
          inputFormat: 'An integer N representing total steps.',
          outputFormat: 'Total distinct ways F(N) to reach the top.',
          constraints: '1 <= N <= 40',
          difficulty: 'Medium',
          topic: 'DP',
          createdBy: adminUserId,
          testCases: [
            { input: '2', output: '2', isSample: true },
            { input: '3', output: '3', isSample: false },
            { input: '5', output: '8', isSample: false }
          ]
        },
        {
          title: 'Find Leaf Nodes',
          description: 'Given a representation of a tree structure, list all the leaf nodes in order of level traversal.',
          inputFormat: 'Tree levels nodes description values.',
          outputFormat: 'Ordered leaf nodes integers.',
          constraints: 'NodesCount <= 1000',
          difficulty: 'Medium',
          topic: 'Trees',
          createdBy: adminUserId,
          testCases: [
            { input: '1 2 3 -1 -1 4 5', output: '2 4 5', isSample: true }
          ]
        },
        {
          title: 'SQL Select Users',
          description: 'Write an SQL query to retrieve all active users over the age of 18 sorted alphabetically by name.',
          inputFormat: 'Schema definitions of database.',
          outputFormat: 'Query selection matching criterion constraints.',
          constraints: 'Standard SQLLite or PostgreSQL queries standard syntax.',
          difficulty: 'Easy',
          topic: 'SQL',
          createdBy: adminUserId,
          testCases: [
            { input: 'SELECT * FROM users', output: 'SELECT * FROM users WHERE status = \'active\' AND age > 18 ORDER BY name ASC', isSample: true }
          ]
        }
      ];

      for (const ch of challengeList) {
        await db.challenges.create(ch);
      }
      console.log('Seeded 5 initial coding challenges (Arrays, Strings, Trees, DP, SQL)');
    }
  } catch (error) {
    console.error('Seeding process failed:', error.message);
  }
};

module.exports = seedData;
