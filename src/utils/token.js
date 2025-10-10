import jwt from 'jsonwebtoken';
export function generateToken({ id, role, status }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  // Embed minimal claims needed for downstream authorization checks
  return jwt.sign({ id, role, status }, secret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret);
}
