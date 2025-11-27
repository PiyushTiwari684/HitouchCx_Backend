import { verifyToken } from '../utils/token.js';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Authorization header missing' });

  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ message: 'Bearer token missing' });

  try {
    const decoded = verifyToken(token);
    console.log(decoded.status)
    if (decoded.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Account inactive' });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      status: decoded.status
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(500).json({ message: 'User context missing' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

export default authMiddleware;
