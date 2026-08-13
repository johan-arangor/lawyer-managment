import { authMiddleware, authorize, AuthRequest } from './authMiddleware';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
    next = jest.fn();
  });

  describe('authMiddleware verification', () => {
    it('should return 401 if no authorization header is provided', () => {
      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should return 401 if authorization header parts length is not 2', () => {
      req.headers!.authorization = 'Bearer';
      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token error' });
    });

    it('should return 401 if token is malformatted (not Bearer)', () => {
      req.headers!.authorization = 'Basic mocktoken';
      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token malformatted' });
    });

    it('should return 401 if jwt verification fails', () => {
      req.headers!.authorization = 'Bearer invalidtoken';
      (jwt.verify as jest.Mock).mockImplementation((token, secret, cb) => {
        cb(new Error('Invalid token'), null);
      });

      authMiddleware(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token invalid' });
    });

    it('should call next and set req.user if token is valid', () => {
      req.headers!.authorization = 'Bearer validtoken';
      const decodedUser = { id: 'user-1', role: 'ADMIN', email: 'admin@example.com' };
      (jwt.verify as jest.Mock).mockImplementation((token, secret, cb) => {
        cb(null, decodedUser);
      });

      authMiddleware(req as AuthRequest, res as Response, next);
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should return 403 if req.user is not set', () => {
      const authz = authorize(['ADMIN']);
      authz(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized role' });
    });

    it('should return 403 if req.user role is not authorized', () => {
      req.user = { id: '1', role: 'CLIENT', email: 'client@example.com' };
      const authz = authorize(['ADMIN', 'LAWYER']);
      authz(req as AuthRequest, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized role' });
    });

    it('should call next if req.user role is authorized', () => {
      req.user = { id: '1', role: 'ADMIN', email: 'admin@example.com' };
      const authz = authorize(['ADMIN', 'LAWYER']);
      authz(req as AuthRequest, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
