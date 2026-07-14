const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Program = require('../models/Program');
const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const ExecutionHistory = require('../models/ExecutionHistory');
const AIHistory = require('../models/AIHistory');
const Notification = require('../models/Notification');

const localStorageDir = path.join(__dirname, '../data');
if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
}

const readLocalFile = (filename) => {
  const filepath = path.join(localStorageDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (err) {
    return [];
  }
};

const writeLocalFile = (filename, data) => {
  const filepath = path.join(localStorageDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
};

const generateObjectId = () => {
  return Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14);
};

const useLocal = () => process.env.USE_LOCAL_DB === "true";

// Helper to filter documents based on query criteria
const filterDocs = (docs, query) => {
  if (!query || Object.keys(query).length === 0) return docs;
  return docs.filter(doc => {
    for (const key in query) {
      if (query[key] && typeof query[key] === 'object' && query[key].$ne !== undefined) {
        if (doc[key] === query[key].$ne) return false;
      }
      else if (query[key] && typeof query[key] === 'object' && query[key].$in !== undefined) {
        const arr = query[key].$in;
        if (!arr.includes(String(doc[key]))) return false;
      }
      else if (doc[key] != query[key]) {
        return false;
      }
    }
    return true;
  });
};

const makeCollectionWrapper = (mongooseModel, filename) => {
  return {
    find: async (query = {}) => {
      if (!useLocal()) {
        return mongooseModel.find(query).lean();
      }
      const data = readLocalFile(filename);
      return filterDocs(data, query);
    },
    findOne: async (query = {}) => {
      if (!useLocal()) {
        return mongooseModel.findOne(query).lean();
      }
      const data = readLocalFile(filename);
      const filtered = filterDocs(data, query);
      return filtered.length > 0 ? filtered[0] : null;
    },
    findById: async (id) => {
      if (!useLocal()) {
        return mongooseModel.findById(id).lean();
      }
      const data = readLocalFile(filename);
      return data.find(doc => doc._id === id || doc.id === id) || null;
    },
    create: async (docData) => {
      if (!useLocal()) {
        return (await mongooseModel.create(docData)).toObject();
      }
      const data = readLocalFile(filename);
      const newDoc = {
        _id: generateObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...docData
      };
      data.push(newDoc);
      writeLocalFile(filename, data);
      return newDoc;
    },
    findByIdAndUpdate: async (id, updateData, options = { new: true }) => {
      if (!useLocal()) {
        return mongooseModel.findByIdAndUpdate(id, updateData, { ...options, lean: true });
      }
      const data = readLocalFile(filename);
      const index = data.findIndex(doc => doc._id === id);
      if (index === -1) return null;

      // Extract set updates if present, else apply full object
      const actualUpdate = updateData.$set || updateData;
      data[index] = {
        ...data[index],
        ...actualUpdate,
        updatedAt: new Date()
      };
      writeLocalFile(filename, data);
      return data[index];
    },
    findByIdAndDelete: async (id) => {
      if (!useLocal()) {
        return mongooseModel.findByIdAndDelete(id).lean();
      }
      const data = readLocalFile(filename);
      const index = data.findIndex(doc => doc._id === id);
      if (index === -1) return null;
      const [deleted] = data.splice(index, 1);
      writeLocalFile(filename, data);
      return deleted;
    },
    countDocuments: async (query = {}) => {
      if (!useLocal()) {
        return mongooseModel.countDocuments(query);
      }
      const data = readLocalFile(filename);
      const filtered = filterDocs(data, query);
      return filtered.length;
    },
    deleteMany: async (query = {}) => {
      if (!useLocal()) {
        return mongooseModel.deleteMany(query);
      }
      const data = readLocalFile(filename);
      const toKeep = data.filter(doc => {
        for (const key in query) {
          if (doc[key] == query[key]) return false;
        }
        return true;
      });
      writeLocalFile(filename, toKeep);
      return { deletedCount: data.length - toKeep.length };
    }
  };
};

module.exports = {
  users: makeCollectionWrapper(User, 'users.json'),
  programs: makeCollectionWrapper(Program, 'programs.json'),
  challenges: makeCollectionWrapper(Challenge, 'challenges.json'),
  submissions: makeCollectionWrapper(Submission, 'submissions.json'),
  executionHistory: makeCollectionWrapper(ExecutionHistory, 'executionHistory.json'),
  aiHistory: makeCollectionWrapper(AIHistory, 'aiHistory.json'),
  notifications: makeCollectionWrapper(Notification, 'notifications.json'),
  useLocal
};
