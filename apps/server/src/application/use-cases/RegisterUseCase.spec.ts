import { RegisterUseCase } from './RegisterUseCase';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('RegisterUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    useCase = new RegisterUseCase(userRepository);
  });

  it('should successfully register a new user and assign private area access for LAWYER', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');

    const newUser = {
      id: 'user-123',
      email: 'lawyer@example.com',
      password: 'hashed-pass',
      name: 'John Doe',
      role: 'LAWYER',
      hasPrivateAreaAccess: true,
    };

    userRepository.create.mockResolvedValue(newUser as any);

    const result = await useCase.execute({
      email: 'lawyer@example.com',
      password: 'secretpassword',
      name: 'John Doe',
      role: 'LAWYER',
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('lawyer@example.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('secretpassword', 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'lawyer@example.com',
      password: 'hashed-pass',
      name: 'John Doe',
      role: 'LAWYER',
      hasPrivateAreaAccess: true,
    });
    expect(result).toEqual({
      id: 'user-123',
      email: 'lawyer@example.com',
      name: 'John Doe',
      role: 'LAWYER',
      hasPrivateAreaAccess: true,
    });
  });

  it('should successfully register a CLIENT without private area access', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pass');

    const newUser = {
      id: 'user-client',
      email: 'client@example.com',
      password: 'hashed-pass',
      name: 'Jane Doe',
      role: 'CLIENT',
      hasPrivateAreaAccess: false,
    };

    userRepository.create.mockResolvedValue(newUser as any);

    const result = await useCase.execute({
      email: 'client@example.com',
      password: 'clientpassword',
      name: 'Jane Doe',
      role: 'CLIENT',
    });

    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'client@example.com',
      password: 'hashed-pass',
      name: 'Jane Doe',
      role: 'CLIENT',
      hasPrivateAreaAccess: false,
    });
    expect(result).toHaveProperty('hasPrivateAreaAccess', false);
  });

  it('should throw an error if user already exists', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing-user', email: 'exist@example.com' } as any);

    await expect(useCase.execute({ email: 'exist@example.com', password: 'pass', name: 'Existing', role: 'CLIENT' }))
      .rejects.toThrow('User already exists');

    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
