import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import { ApiError } from '../../utils/apiError';
import { ENV } from '../../config/env';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  getProfile(userId: string): Promise<any>;
}

export class AuthService implements IAuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      throw ApiError.badRequest('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    const newUser = await this.authRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword
    });

    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private generateToken(id: string, email: string, role: string): string {
    return jwt.sign(
      { id, email, role },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );
  }
}
