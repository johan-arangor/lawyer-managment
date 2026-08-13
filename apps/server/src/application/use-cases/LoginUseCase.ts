import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) { }

  async execute(data: any) {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    console.log('user has private area access:', user.hasPrivateAreaAccess);
    if (!user.hasPrivateAreaAccess) {
      throw new Error('Acceso denegado. Su cuenta requiere activación por parte de un administrador.');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }
}
