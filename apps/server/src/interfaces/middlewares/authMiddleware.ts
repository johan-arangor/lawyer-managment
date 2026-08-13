import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { logDebug } from '../../infrastructure/debugLogger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  logDebug(`🔐 [Auth Middleware] Checking token for ${req.method} ${req.originalUrl}`);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logDebug(`⚠️ [Auth Middleware] No Authorization header provided.`);
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    logDebug(`⚠️ [Auth Middleware] Token format is invalid (not 2 parts).`);
    return res.status(401).json({ error: 'Token error' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    logDebug(`⚠️ [Auth Middleware] Token scheme is not Bearer.`);
    return res.status(401).json({ error: 'Token malformatted' });
  }

  logDebug(`🔑 [Auth Middleware] Verifying token...`);
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
    if (err) {
      logDebug(`❌ [Auth Middleware] Token verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Token invalid' });
    }

    logDebug(`✅ [Auth Middleware] Token verified successfully for user: ${decoded.email} (${decoded.role})`);
    req.user = decoded;
    logDebug(`➡️ [Auth Middleware] Calling next() to enter controller...`);
    return next();
  });
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};
