import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai/ai.service';
import { validateRequest } from '../../middlewares/validate.middleware';
import { aiAnalyzeSchema } from './ai.schema';
import { ApiResponse } from '../../utils/apiResponse';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

// Real live AI analysis endpoint
router.post(
  '/analyze',
  authRateLimiter,
  validateRequest(aiAnalyzeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, systemInstruction } = req.body;
      const execution = await aiService.generateStructuredJson(
        prompt,
        {
          systemInstruction:
            systemInstruction ||
            'You are an expert system architect and code reviewer. Analyze the request and return structured JSON.'
        },
        req.id
      );

      res.status(200).json(
        ApiResponse.success('AI structured analysis completed', execution)
      );
    } catch (error) {
      next(error);
    }
  }
);

// Real live AI text generation endpoint
router.post(
  '/generate',
  authRateLimiter,
  validateRequest(aiAnalyzeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prompt, systemInstruction } = req.body;
      const execution = await aiService.generateText(
        prompt,
        { systemInstruction },
        req.id
      );

      res.status(200).json(
        ApiResponse.success('AI text generation completed', execution)
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
