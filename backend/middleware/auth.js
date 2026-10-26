const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Supports both standard 'Authorization: Bearer <token>' and legacy 'x-auth-token' header
 */
const verifyToken = (req, res, next) => {
  let token = req.header('Authorization') || req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ success: false, msg: 'No token, authorization denied' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, msg: 'Token is not valid or expired' });
  }
};

/**
 * Role-Based Access Control Middleware Guard
 * @param  {...string} allowedRoles - e.g. 'admin', 'theater_owner'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, msg: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');
const requirePartner = requireRole('theater_owner', 'admin');

// Maintain backwards compatibility: module.exports is the default verifyToken function,
// with attached helper properties.
verifyToken.verifyToken = verifyToken;
verifyToken.requireRole = requireRole;
verifyToken.requireAdmin = requireAdmin;
verifyToken.requirePartner = requirePartner;

module.exports = verifyToken;
