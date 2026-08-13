import { LoginUseCase } from './LoginUseCase';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    useCase = new LoginUseCase(userRepository);
  });

  it('should successfully login and return user with token', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'LAWYER',
      hasPrivateAreaAccess: true,
    };

    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(jwt.sign).toHaveBeenCalled();
    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        role: 'LAWYER',
        hasPrivateAreaAccess: true,
      },
      token: 'mock-jwt-token',
    });
  });

  it('should throw error when user is not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'notfound@example.com', password: 'pass' })).rejects.toThrow('Invalid credentials');
  });

  it('should throw error when password is invalid', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'LAWYER',
      hasPrivateAreaAccess: true,
    };

    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute({ email: 'test@example.com', password: 'wrongpass' })).rejects.toThrow('Invalid credentials');
  });

  it('should throw error when user lacks private area access', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      password: 'hashed-password',
      role: 'CLIENT',
      hasPrivateAreaAccess: false,
    };

    userRepository.findByEmail.mockResolvedValue(mockUser as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(useCase.execute({ email: 'test@example.com', password: 'password123' })).rejects.toThrow('Acceso denegado. Su cuenta requiere activación por parte de un administrador.');
  });
});
