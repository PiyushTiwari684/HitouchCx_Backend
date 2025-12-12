import jwt from 'jsonwebtoken';
import crypto from 'crypto'

 function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret);
}


 function generateAccessToken( payload ) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.sign(payload, secret, { expiresIn: '50m' })
}

 function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString('hex')
}

 function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export {generateAccessToken,generateRefreshTokenValue,hashRefreshToken,verifyToken}