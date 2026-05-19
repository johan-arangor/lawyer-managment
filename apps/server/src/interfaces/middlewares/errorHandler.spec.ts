import { errorHandler } from './errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('errorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Partial<Response>;
    next = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should use custom status and message from error object', () => {
    const customError = {
      status: 400,
      message: 'Custom Bad Request',
      stack: 'Error stack trace',
    };

    errorHandler(customError, req as Request, res as Response, next);

    expect(consoleSpy).toHaveBeenCalledWith('Error stack trace');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Custom Bad Request',
        status: 400,
      },
    });
  });

  it('should default to 500 and Internal Server Error if not provided', () => {
    const genericError = {
      stack: 'Generic stack trace',
    };

    errorHandler(genericError, req as Request, res as Response, next);

    expect(consoleSpy).toHaveBeenCalledWith('Generic stack trace');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Internal Server Error',
        status: 500,
      },
    });
  });
});
