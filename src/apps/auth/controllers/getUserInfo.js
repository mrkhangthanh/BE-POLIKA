const UserModel = require('../models/user');


const getUserInfo = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select('name email phone_number address role specialization services');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = getUserInfo;