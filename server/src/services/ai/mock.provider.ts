import { IAiProvider, AiGenerateOptions } from './ai.interface';

export class MockAiProvider implements IAiProvider {
  public readonly name = 'Offline Fallback Mock Provider';

  isAvailable(): boolean {
    return true;
  }

  async generateText(prompt: string, options?: AiGenerateOptions): Promise<string> {
    return `[Mock AI Analysis]: Processed prompt "${prompt.slice(0, 60)}..." successfully with simulated parameters.`;
  }

  async generateStructuredJson<T = any>(prompt: string, options?: AiGenerateOptions): Promise<T> {
    const promptLower = prompt.toLowerCase();

    // 1. Prescription Parsing Mock
    if (promptLower.includes('prescription') || promptLower.includes('rx:')) {
      return {
        doctorName: 'Dr. Arvind Sharma',
        clinic: 'Max Super Specialty Hospital, Saket',
        diagnoses: ['Essential Hypertension', 'Type-2 Diabetes Mellitus'],
        medications: [
          {
            name: 'Telmisartan 40mg',
            dosage: '1 Tablet',
            frequency: 'DAILY',
            scheduleTimes: ['09:00'],
            mealRelation: 'AFTER_MEAL',
            criticality: 'HIGH_RISK',
            dietaryGuidelines: [
              'Kam namak lijiye (Low sodium)',
              'Kela aur naariyal paani se bachein (High potassium caution)'
            ],
            instructionsHindi: 'Dada ji, subah nashte ke baad 1 goli paani ke sath lein aur 15 min aaram karein.'
          },
          {
            name: 'Metformin 500mg',
            dosage: '1 Tablet',
            frequency: 'TWICE_DAILY',
            scheduleTimes: ['13:30', '20:30'],
            mealRelation: 'AFTER_MEAL',
            criticality: 'ROUTINE',
            dietaryGuidelines: [
              'Khane ke turant baad lein',
              'Meetha aur high glycemic Indian sweets se parhez karein'
            ],
            instructionsHindi: 'Dada ji, dopahar aur raat ko khana khane ke baad 1 goli lein.'
          }
        ],
        generalDietaryAdvice: [
          'Roz 2 se 2.5 litre paani zaroor piyein',
          'Khane me sendha namak use karein aur thoda kam namak rakhein'
        ]
      } as unknown as T;
    }

    // 2. Dietary Cautions Mock
    if (promptLower.includes('diet') || promptLower.includes('interaction') || promptLower.includes('food')) {
      return {
        foodsToFavor: [
          'Moong dal khichdi with ghee in moderation',
          'Lauki (bottle gourd) sabzi',
          'Papaya and apples for dietary fiber'
        ],
        foodsToAvoidOrModerate: [
          {
            food: 'Chai / Coffee immediately with medication',
            reason: 'Tannins in Indian tea interfere with gastric absorption of cardiovascular and thyroid drugs'
          },
          {
            food: 'Excessive Coconut Water / Bananas',
            reason: 'Telmisartan retains potassium; excess dietary potassium can cause hyperkalemia in elderly'
          },
          {
            food: 'Heavy Sweets (Gulab Jamun, Jalebi)',
            reason: 'Rapid glucose spikes counteract Metformin glycemic control'
          }
        ],
        hydrationAdvice: 'Drink 8 to 10 glasses of lukewarm water daily. Avoid drinking water immediately after heavy meals.',
        timingTips: [
          'Keep a 45-minute gap between morning tea and heart/thyroid medication.',
          'Take Calcium supplements at least 2 hours apart from Iron supplements.'
        ]
      } as unknown as T;
    }

    // 3. Pill Verification Mock
    if (promptLower.includes('pill') || promptLower.includes('tablet') || promptLower.includes('strip')) {
      return {
        isMatch: true,
        detectedPillName: 'Telmisartan 40mg',
        prescribedPillName: 'Telmisartan 40mg',
        safetyStatus: 'SAFE_TO_TAKE',
        confidenceScore: 0.98,
        messageHindi: 'Haan Dada ji, ye bilkul sahi goli hai (Telmisartan 40mg). Khana khane ke baad paani se lijiye.',
        warnings: []
      } as unknown as T;
    }

    // Generic Mock
    return {
      status: 'success',
      mock: true,
      provider: this.name,
      promptReceived: prompt.slice(0, 80),
      recommendation: 'System is operating reliably in fallback mode.',
      timestamp: new Date().toISOString()
    } as unknown as T;
  }
}
