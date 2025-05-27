import { verifyToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = verifyToken(header.slice(7));   
    req.user = payload;                            
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
