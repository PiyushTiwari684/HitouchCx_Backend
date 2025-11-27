import jwt from 'jsonwebtoken';
 function generateToken({ id, role, status }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ id, role, status }, secret, { expiresIn: '7d' });
}

 function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret);
}

export {generateToken,verifyToken}