import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai/ai.service';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  aiAnalyzeSchema,
  scanPrescriptionSchema,
  dietaryCautionsSchema,
  verifyPillSchema
} from './ai.schema';
import { ApiResponse } from '../../utils/apiResponse';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();

// 1. Scan Prescription using Adaption AI (Primary) / Gemini (Secondary)
router.post(
  '/scan-prescription',
  authenticateJwt,
  authRateLimiter,
  validateRequest(scanPrescriptionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prescriptionText, dietaryPreference } = req.body;

      const systemInstruction = `You are AayuCare's Clinical Prescription Parser AI powered by Adaption AI. 
Extract all medications into a strictly structured JSON response with the following format:
{
  "doctorName": "string or Dr. Unknown",
  "clinic": "string or General Hospital",
  "diagnoses": ["string"],
  "medications": [
    {
      "name": "string (brand + molecule if available, e.g. Telmisartan 40mg)",
      "dosage": "string (e.g. 1 Tablet)",
      "frequency": "DAILY",
      "scheduleTimes": ["09:00"],
      "mealRelation": "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "ANYTIME",
      "criticality": "HIGH_RISK" | "ROUTINE",
      "dietaryGuidelines": ["guideline 1 tailored for Indian food", "guideline 2"],
      "instructionsHindi": "instruction in simple Hindi for elderly patient"
    }
  ],
  "generalDietaryAdvice": ["diet advice 1", "diet advice 2"]
}`;

      const prompt = `Prescription Input:
"""
${prescriptionText}
"""
Patient Dietary Preference: ${dietaryPreference}

Parse and extract all medication details, schedule times, meal relations, criticality, and dietary warnings. Output raw JSON only.`;

      const execution = await aiService.generateStructuredJson<any>(
        prompt,
        { systemInstruction },
        req.id
      );

      res.status(200).json(
        ApiResponse.success(
          `Prescription ingested successfully via [${execution.provider}]`,
          execution.result
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// 2. Generate Dietary Cautions & Indian Drug-Food Interactions
router.post(
  '/dietary-cautions',
  authenticateJwt,
  authRateLimiter,
  validateRequest(dietaryCautionsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { medicationNames, age, conditions } = req.body;

      const systemInstruction = `You are a Senior Geriatric Nutritionist AI. 
Provide practical dietary cautions for an elderly patient taking these medications in India. 
Return raw structured JSON:
{
  "foodsToFavor": ["food 1", "food 2"],
  "foodsToAvoidOrModerate": [
    {
      "food": "e.g. Potassium salt substitutes / Bananas in excess",
      "reason": "Telmisartan retains potassium; excess can cause hyperkalemia"
    }
  ],
  "hydrationAdvice": "string",
  "timingTips": ["tip 1", "tip 2"]
}`;

      const prompt = `Patient Age: ${age} years
Diagnosed Conditions: ${(conditions || []).join(', ')}
Medications: ${medicationNames.join(', ')}

Analyze drug-nutrient interactions for an Indian diet and return tailored cautions.`;

      const execution = await aiService.generateStructuredJson<any>(
        prompt,
        { systemInstruction },
        req.id
      );

      res.status(200).json(
        ApiResponse.success(
          `Dietary cautions generated via [${execution.provider}]`,
          execution.result
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// 3. Pill Strip Visual OCR Verification & Cross-Check
router.post(
  '/verify-pill',
  authenticateJwt,
  authRateLimiter,
  validateRequest(verifyPillSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { expectedMedicationName, pillImageTextOrUrl } = req.body;

      const systemInstruction = `You are AayuCare's Multimodal Pill Verification Safety Officer.
Compare the detected tablet strip or pill against the expected prescribed medication name.
Return raw structured JSON:
{
  "isMatch": boolean,
  "detectedPillName": "string",
  "prescribedPillName": "string",
  "safetyStatus": "SAFE_TO_TAKE" | "DANGEROUS_MISMATCH" | "UNCLEAR",
  "confidenceScore": number (0 to 1),
  "messageHindi": "Polite reassuring Hindi message for the grandfather/grandmother",
  "warnings": ["string"]
}`;

      const prompt = `Expected Medication Name: ${expectedMedicationName}
Pill/Strip Detection Context: ${pillImageTextOrUrl}

Verify if this pill matches the prescribed medication. Return raw JSON only.`;

      const execution = await aiService.generateStructuredJson<any>(
        prompt,
        { systemInstruction },
        req.id
      );

      res.status(200).json(
        ApiResponse.success(
          `Pill verification completed via [${execution.provider}]`,
          execution.result
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// 4. General AI Structured Analysis
router.post(
  '/analyze',
  authenticateJwt,
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

      res.status(200).json(ApiResponse.success('AI structured analysis completed', execution));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
