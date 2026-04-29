import bcrypt from 'bcrypt';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';

export class RegisterUseCase {
  constructor(private userRepository: IUserRepository) { }

  async execute(data: any) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const hasPrivateAreaAccess = data.role === 'ADMIN' || data.role === 'LAWYER';

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      hasPrivateAreaAccess
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
