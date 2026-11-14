import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './auth.service';
import { IAuthRepository } from './auth.repository';
import { User, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// LSP Mock Auth Repository
class InMemoryMockAuthRepository implements IAuthRepository {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const id = `user-${Date.now()}-${Math.random()}`;
    const user: User = {
      id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: (data.role as any) || 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
}

describe('AuthService Unit Tests', () => {
  const repo = new InMemoryMockAuthRepository();
  const authService = new AuthService(repo);

  it('should register a new user with hashed password and return valid token', async () => {
    const result = await authService.register({
      name: 'Test Engineer',
      email: 'engineer@example.com',
      password: 'supersecretpassword123'
    });

    assert.equal(result.user.name, 'Test Engineer');
    assert.equal(result.user.email, 'engineer@example.com');
    assert.equal(result.user.role, 'USER');
    assert.ok(result.token, 'Token must be generated');

    // Verify stored password in repository was hashed
    const stored = await repo.findByEmail('engineer@example.com');
    assert.ok(stored);
    assert.notEqual(stored.password, 'supersecretpassword123', 'Password must be hashed');
    const isMatch = await bcrypt.compare('supersecretpassword123', stored.password);
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

  it('should authenticate user with valid credentials', async () => {
    const loginResult = await authService.login({
      email: 'engineer@example.com',
      password: 'supersecretpassword123'
    });

    assert.equal(loginResult.user.email, 'engineer@example.com');
    assert.ok(loginResult.token);
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
});
