import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticateJwt, requireRole } from './auth.middleware';
import { ENV } from '../config/env';

describe('Auth Middleware Security Tests', () => {
  it('should reject request when token is missing', () => {
    const req: any = { headers: {}, cookies: {} };
    const res: any = {};
    let errorPassed: any = undefined;

    authenticateJwt(req, res, (err) => {
      errorPassed = err;
    });

    assert.ok(errorPassed, 'Expected error when token is missing');
    assert.equal(errorPassed.statusCode, 401);
  });

  it('should authenticate and attach req.user for valid JWT with compliant Zod payload', () => {
    const validToken = jwt.sign(
      { id: 'usr-12345', email: 'valid@example.com', role: 'USER' },
      ENV.JWT_SECRET
    );

    const req: any = {
      headers: { authorization: `Bearer ${validToken}` },
      cookies: {}
    };
    const res: any = {};
    let errorPassed: any = undefined;

    authenticateJwt(req, res, (err) => {
      errorPassed = err;
    });

    assert.equal(errorPassed, undefined, 'No error should be passed on success');
    assert.deepEqual(req.user, {
      id: 'usr-12345',
      email: 'valid@example.com',
      role: 'USER'
    });
  });

  it('should reject token with malformed or tampered payload failing Zod validation', () => {
    // Missing required 'email' and has invalid role
    const invalidPayloadToken = jwt.sign(
      { id: 'usr-999', role: 'SUPER_HACKER_ROLE' },
      ENV.JWT_SECRET
    );

    const req: any = {
      headers: { authorization: `Bearer ${invalidPayloadToken}` },
      cookies: {}
    };
    const res: any = {};
    let errorPassed: any = undefined;

    authenticateJwt(req, res, (err) => {
      errorPassed = err;
    });

    assert.ok(errorPassed, 'Expected error for invalid payload structure');
    assert.equal(errorPassed.statusCode, 401);
    assert.match(errorPassed.message, /Invalid authentication token payload structure/i);
  });

  it('should enforce Role-Based Access Control (RBAC)', () => {
    const adminReq: any = { user: { id: '1', email: 'admin@ex.com', role: 'ADMIN' } };
    const userReq: any = { user: { id: '2', email: 'user@ex.com', role: 'USER' } };
    const res: any = {};

    let adminErr: any = undefined;
    requireRole('ADMIN')(adminReq, res, (err) => {
      adminErr = err;
    });
    assert.equal(adminErr, undefined, 'Admin should be permitted');

    let userErr: any = undefined;
    requireRole('ADMIN')(userReq, res, (err) => {
      userErr = err;
    });
    assert.ok(userErr, 'Regular user should be forbidden from admin endpoint');
    assert.equal(userErr.statusCode, 403);
  });
});
