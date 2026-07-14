const db = require('../services/dbService');

exports.getNotifications = async (req, res) => {
  try {
    const list = await db.notifications.find({ user: req.user.id });
    
    // Sort latest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve notifications', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (String(notification.user) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized execution' });
    }

    const updated = await db.notifications.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await db.notifications.find({ user: userId, isRead: false });
    
    for (const item of items) {
      await db.notifications.findByIdAndUpdate(item._id, { isRead: true });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
  }
};
