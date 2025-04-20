const login = require('./login');
const register = require('./register');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');
const refreshToken = require('./refreshToken');
const logout = require('./logout');
const getStatusHistory = require('./getStatusHistory');
const updateProfile = require('./updateProfile');
const getUserInfo = require('./getUserInfo');

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getStatusHistory,
  updateProfile,
  getUserInfo,
};