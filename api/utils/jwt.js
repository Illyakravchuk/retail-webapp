import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecret';

export function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '1h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
