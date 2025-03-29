const requireRole = (roles, options = { readOnly: false }) => {
  return (req, res, next) => {
    console.log('User Role:', req.user.role); // Thêm log
    console.log('Required Roles:', roles); // Thêm log
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!options.readOnly && req.method !== 'GET') {
      if (!['admin', 'manager'].includes(req.user.role)) {
        // Đại lý chỉ được phép đọc, không được ghi
        if (req.user.role === 'agent') {
          return res.status(403).json({ error: 'Write access denied for agents.' });
        }
        return res.status(403).json({ error: 'Write access denied.' });
      }
    }

    next();
  };
};

module.exports = requireRole;