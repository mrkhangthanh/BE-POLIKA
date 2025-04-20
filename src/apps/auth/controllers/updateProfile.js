const { validationResult } = require('express-validator');

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user._id;
    const { name, address, avatar } = req.body;

    const result = await updateUserProfile(userId, { name, address, avatar });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = updateProfile;