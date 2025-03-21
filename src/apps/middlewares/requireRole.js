const requireRole = (roles = [], permissions = {}) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Only ${roles.join(', ')} are allowed.` });
    }

    if (req.user.status !== 'active') {
      return res.status(403).json({ error: 'Access denied. Your account is inactive.' });
    }

    if (permissions.readOnly && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Access denied. You only have read-only access.' });
    }

    next();
  };
};

module.exports = requireRole;