const db = require('../services/dbService');

exports.createProgram = async (req, res) => {
  const { title, code, language } = req.body;
  try {
    if (!language) {
      return res.status(400).json({ message: 'Language is required' });
    }

    const program = await db.programs.create({
      title: title || 'Untitled Program',
      code: code || '',
      language,
      user: req.user.id
    });

    res.status(201).json(program);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create program', error: error.message });
  }
};

exports.getAllPrograms = async (req, res) => {
  const { search } = req.query;
  try {
    let programs = await db.programs.find({ user: req.user.id });
    
    if (search) {
      const searchLower = search.toLowerCase();
      programs = programs.filter(p => 
        (p.title && p.title.toLowerCase().includes(searchLower)) ||
        (p.code && p.code.toLowerCase().includes(searchLower)) ||
        (p.language && p.language.toLowerCase().includes(searchLower))
      );
    }

    // Sort by updated latest first
    programs.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve programs', error: error.message });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const program = await db.programs.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    // Authorization: only owner or admin can read programs (unless shared, which has a separate endpoint)
    if (String(program.user) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this program' });
    }

    res.json(program);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve program', error: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  const { title, code, language, isFavorite } = req.body;
  try {
    const program = await db.programs.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (String(program.user) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to edit this program' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (code !== undefined) updates.code = code;
    if (language !== undefined) updates.language = language;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;

    const updated = await db.programs.findByIdAndUpdate(req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update program', error: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const program = await db.programs.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (String(program.user) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this program' });
    }

    await db.programs.findByIdAndDelete(req.params.id);
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete program', error: error.message });
  }
};

exports.duplicateProgram = async (req, res) => {
  try {
    const original = await db.programs.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Original program not found' });
    }

    if (String(original.user) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to duplicate this program' });
    }

    const copy = await db.programs.create({
      title: `${original.title} (Copy)`,
      code: original.code,
      language: original.language,
      user: req.user.id
    });

    res.status(201).json(copy);
  } catch (error) {
    res.status(500).json({ message: 'Failed to duplicate program', error: error.message });
  }
};

exports.shareProgram = async (req, res) => {
  try {
    const program = await db.programs.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (String(program.user) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to share this program' });
    }

    // Generate unique share token if it doesn't already have one
    let token = program.shareToken;
    if (!token) {
      token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      await db.programs.findByIdAndUpdate(req.params.id, { shareToken: token });
    }

    res.json({ shareToken: token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to share program', error: error.message });
  }
};

exports.getSharedProgram = async (req, res) => {
  try {
    const program = await db.programs.findOne({ shareToken: req.params.token });
    if (!program) {
      return res.status(404).json({ message: 'Shared program not found or link has expired' });
    }

    // Retrieve creator details
    const creator = await db.users.findById(program.user);

    res.json({
      title: program.title,
      code: program.code,
      language: program.language,
      creatorName: creator ? creator.name : 'Unknown Dev',
      createdAt: program.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve shared program', error: error.message });
  }
};
