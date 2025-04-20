const UserModel = require('../models/user');
const logger = require('../../../libs/logger');

const getStatusHistory = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await UserModel.findById(userId, 'status status_history');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    logger.info(`Status history viewed for user: ${userId} by admin (ID: ${req.user._id})`);

    res.status(200).json({
      success: true,
      currentStatus: user.status,
      statusHistory: user.status_history,
    });
  } catch (err) {
    logger.error(`Get status history error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = getStatusHistory;