import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './auth.service';
import { IAuthRepository, ElderProfileSummary } from './auth.repository';
import { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// LSP Mock Auth Repository
class InMemoryMockAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();
  private elderProfiles: Map<string, ElderProfileSummary> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) return user;
    }
    return null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const id = `user-${Date.now()}-${Math.random()}`;
    const user: User = {
      id,
      name: data.name,
      email: data.email,
      password: (data.password as string) || null,
      role: (data.role as any) || 'ELDERLY',
      googleId: (data.googleId as string) || null,
      avatarUrl: (data.avatarUrl as string) || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    const updated: User = {
      ...existing,
      ...(data.name ? { name: data.name as string } : {}),
      ...(data.password ? { password: data.password as string } : {}),
      ...(data.googleId !== undefined ? { googleId: data.googleId as string | null } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl as string | null } : {}),
      ...(data.role ? { role: data.role as any } : {}),
      updatedAt: new Date()
    };
    this.users.set(id, updated);
    return updated;
  }

  async createElderProfile(data: {
    userId: string;
    fullName: string;
    carePasscode: string;
    emergencyContact?: string;
  }): Promise<ElderProfileSummary> {
    const profile: ElderProfileSummary = {
      id: `profile-${Date.now()}`,
      userId: data.userId,
      fullName: data.fullName,
      carePasscode: data.carePasscode
    };
    this.elderProfiles.set(data.userId, profile);
    return profile;
  }

  async findElderProfileByUserId(userId: string): Promise<ElderProfileSummary | null> {
    return this.elderProfiles.get(userId) || null;
  }
}

describe('AuthService Unit Tests', () => {
  const repo = new InMemoryMockAuthRepository();
  const authService = new AuthService(repo);

  it('should register a new elder with hashed password, token, and automatic CarePasscode', async () => {
    const result = await authService.register({
      name: 'Test Engineer',
      email: 'engineer@example.com',
      password: 'supersecretpassword123',
      role: 'ELDERLY'
    });

    assert.equal(result.user.name, 'Test Engineer');
    assert.equal(result.user.email, 'engineer@example.com');
    assert.equal(result.user.role, 'ELDERLY');
    assert.ok(result.token, 'Token must be generated');
    assert.ok(result.elderProfile, 'ElderProfile must be created for ELDERLY role');
    assert.ok(result.elderProfile.carePasscode.startsWith('CARE-'), 'Passcode must start with CARE-');

    // Verify stored password in repository was hashed
    const stored = await repo.findByEmail('engineer@example.com');
    assert.ok(stored);
    assert.notEqual(stored.password, 'supersecretpassword123', 'Password must be hashed');
    const isMatch = await bcrypt.compare('supersecretpassword123', stored.password!);
    assert.equal(isMatch, true, 'Hashed password must match bcrypt comparison');
  });

  it('should prevent registration with duplicate email address', async () => {
    await assert.rejects(
      async () => {
        await authService.register({
          name: 'Duplicate Engineer',
          email: 'engineer@example.com',
          password: 'anotherpassword123'
        });
      },
      {
        message: 'User with this email already exists'
      }
    );
  });

  it('should authenticate user with valid credentials and retrieve elderProfile', async () => {
    const loginResult = await authService.login({
      email: 'engineer@example.com',
      password: 'supersecretpassword123'
    });

    assert.equal(loginResult.user.email, 'engineer@example.com');
    assert.ok(loginResult.token);
    assert.ok(loginResult.elderProfile);
    assert.ok(loginResult.elderProfile.carePasscode.startsWith('CARE-'));
  });

  it('should reject login with invalid password', async () => {
    await assert.rejects(
      async () => {
        await authService.login({
          email: 'engineer@example.com',
          password: 'wrongpassword'
        });
      },
      {
        message: 'Invalid email or password'
      }
    );
  });

  it('should authenticate and auto-provision user via Google OAuth 2.0', async () => {
    const googleResult = await authService.googleLogin({
      idToken: 'mock-google-token-xyz',
      role: 'CAREGIVER'
    });

    assert.equal(googleResult.user.email, 'google.user@example.com');
    assert.equal(googleResult.user.name, 'Google Authenticated User');
    assert.equal(googleResult.user.role, 'CAREGIVER');
    assert.ok(googleResult.token);

    // Verify user stored in repository with googleId
    const stored = await repo.findByGoogleId('google-sub-mock-12345');
    assert.ok(stored);
    assert.equal(stored.email, 'google.user@example.com');
    assert.equal(stored.password, null, 'Google-only user has null password');
  });

  it('should reject password login for Google OAuth users without password', async () => {
    await assert.rejects(
      async () => {
        await authService.login({
          email: 'google.user@example.com',
          password: 'randompassword'
        });
      },
      {
        message: 'This account was registered using Google Sign-In. Please sign in with Google.'
      }
    );
  });

  it('should sanitize password from user profile output', async () => {
    await authService.register({
      name: 'Ramesh Patel',
      email: 'ramesh.patel@example.com',
      password: 'password1234',
      role: 'ELDERLY'
    });

    const user = await repo.findByEmail('ramesh.patel@example.com');
    assert.ok(user);
    const profile = await authService.getProfile(user.id);
    assert.equal(profile.email, 'ramesh.patel@example.com');
    assert.equal((profile as any).password, undefined, 'Password must be sanitized from profile');
  });
});
