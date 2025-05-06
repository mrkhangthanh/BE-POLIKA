const requireRole = (roles, options = { readOnly: false }) => {
  return (req, res, next) => {
    console.log('requireRole - req.user:', req.user);
    console.log('requireRole - Allowed roles:', roles);

    if (!req.user || typeof req.user !== 'object' || !req.user.role) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: Role ${req.user.role} is not allowed` });
    }

    // Bỏ kiểm tra quyền ghi cho route /support-conversation
    if (req.path === '/support-conversation') {
      return next();
    }

    if (!options.readOnly && req.method !== 'GET' && req.path !== '/SupportId') {
      if (!['admin', 'manager'].includes(req.user.role)) {
        if (req.user.role === 'agent') {
          return res.status(403).json({ message: 'Write access denied for agents.' });
        }
        return res.status(403).json({ message: 'Write access denied.' });
      }
    }

    next();
  };
};

module.exports = requireRole;