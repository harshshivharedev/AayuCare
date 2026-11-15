import { Request, Response, NextFunction } from 'express';
import { IAuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { ENV } from '../../config/env';

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      this.setCookieToken(res, result.token);

      res.status(201).json(
        ApiResponse.success('User registered successfully', {
          user: result.user,
          token: result.token,
          elderProfile: result.elderProfile
        })
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      this.setCookieToken(res, result.token);

      res.status(200).json(
        ApiResponse.success('Login successful', {
          user: result.user,
          token: result.token,
          elderProfile: result.elderProfile
        })
      );
    } catch (error) {
      next(error);
    }
  };

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.googleLogin(req.body);
      this.setCookieToken(res, result.token);

      res.status(200).json(
        ApiResponse.success('Google authentication successful', {
          user: result.user,
          token: result.token,
          elderProfile: result.elderProfile
        })
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      res.status(200).json(ApiResponse.success('Logged out successfully'));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.authService.getProfile(userId);
      res.status(200).json(ApiResponse.success('User profile retrieved', profile));
    } catch (error) {
      next(error);
    }
  };

  private setCookieToken(res: Response, token: string): void {
    res.cookie('token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }
}
