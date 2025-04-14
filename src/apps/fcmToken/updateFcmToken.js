const User = require('../auth/models/user'); // Đường dẫn đến model User

exports.updateFcmToken = async (req, res) => {
  const { id } = req.params;
  const { fcmToken } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.status(200).json({ message: 'FCM token updated successfully.' });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// module.exports =  {updateFcmToken} ;