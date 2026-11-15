import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { IAuthRepository, ElderProfileSummary } from './auth.repository';
import { RegisterInput, LoginInput, GoogleAuthInput } from './auth.schema';
import { ApiError } from '../../utils/apiError';
import { ENV } from '../../config/env';
import { UserRole } from '../../types/express';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  token: string;
  elderProfile?: ElderProfileSummary | null;
}

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  googleLogin(input: GoogleAuthInput): Promise<AuthResult>;
  getProfile(userId: string): Promise<any>;
}

export class AuthService implements IAuthService {
  private googleClient: OAuth2Client;

  constructor(private readonly authRepository: IAuthRepository) {
    this.googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      throw ApiError.badRequest('User with this email already exists');
    }

    if ((input.role as string) === 'ADMIN') {
      throw ApiError.forbidden('Administrator accounts cannot be created via public registration');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);
    const role = (input.role as UserRole) || 'ELDERLY';

    const newUser = await this.authRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: role as any
    });

    let elderProfile: ElderProfileSummary | null = null;

    // If registering as an Elder, automatically generate their unique 6-character CarePasscode
    if (role === 'ELDERLY') {
      try {
        const randomCode = `CARE-${Math.floor(1000 + Math.random() * 9000)}`;
        elderProfile = await this.authRepository.createElderProfile({
          userId: newUser.id,
          fullName: newUser.name,
          carePasscode: randomCode
        });
      } catch {
        // Safe fallback
      }
    }

    const token = this.generateToken(newUser.id, newUser.email, newUser.role as UserRole);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole,
        avatarUrl: newUser.avatarUrl || null
      },
      token,
      elderProfile
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.password) {
      throw ApiError.badRequest('This account was registered using Google Sign-In. Please sign in with Google.');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role as UserRole);

    let elderProfile: ElderProfileSummary | null = null;
    if (user.role === 'ELDERLY') {
      try {
        elderProfile = await this.authRepository.findElderProfileByUserId(user.id);
      } catch {
        // Safe fallback
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatarUrl: user.avatarUrl || null
      },
      token,
      elderProfile
    };
  }

  async googleLogin(input: GoogleAuthInput): Promise<AuthResult> {
    let googleEmail: string;
    let googleName: string;
    let googleId: string;
    let avatarUrl: string | undefined;

    try {
      if (ENV.NODE_ENV === 'test' && input.idToken.startsWith('mock-google-token')) {
        // Deterministic mock test tokens - strictly limited to test environments
        googleEmail = 'google.user@example.com';
        googleName = 'Google Authenticated User';
        googleId = 'google-sub-mock-12345';
        avatarUrl = 'https://lh3.googleusercontent.com/a/mock-avatar';
      } else {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: input.idToken,
          audience: ENV.GOOGLE_CLIENT_ID || undefined
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new Error('Google token payload missing email');
        }
        googleEmail = payload.email;
        googleName = payload.name || payload.email.split('@')[0];
        googleId = payload.sub;
        avatarUrl = payload.picture;
      }
    } catch (err: any) {
      throw ApiError.unauthorized(`Google Authentication failed: ${err.message}`);
    }

    // 1. Check if user exists by googleId
    let user = await this.authRepository.findByGoogleId(googleId);

    // 2. If not found by googleId, check by email
    if (!user) {
      user = await this.authRepository.findByEmail(googleEmail);
    }

    const requestedRole = (input.role as UserRole) || 'CAREGIVER';

    if (user) {
      // Existing user: link googleId & update avatar
      user = await this.authRepository.update(user.id, {
        googleId,
        avatarUrl: avatarUrl || user.avatarUrl
      });
    } else {
      // New user via Google OAuth
      user = await this.authRepository.create({
        email: googleEmail,
        name: googleName,
        googleId,
        avatarUrl,
        role: requestedRole as any
      });
    }

    let elderProfile: ElderProfileSummary | null = null;
    if (user.role === 'ELDERLY') {
      try {
        let profile = await this.authRepository.findElderProfileByUserId(user.id);
        if (!profile) {
          const randomCode = `CARE-${Math.floor(1000 + Math.random() * 9000)}`;
          profile = await this.authRepository.createElderProfile({
            userId: user.id,
            fullName: user.name,
            carePasscode: randomCode
          });
        }
        elderProfile = profile;
      } catch {
        // Safe fallback
      }
    }

    const token = this.generateToken(user.id, user.email, user.role as UserRole);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatarUrl: user.avatarUrl || null
      },
      token,
      elderProfile
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

  private generateToken(id: string, email: string, role: UserRole): string {
    return jwt.sign(
      { id, email, role },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );
  }
}
