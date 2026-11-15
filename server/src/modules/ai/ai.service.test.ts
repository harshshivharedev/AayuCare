import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AiService } from '../../services/ai/ai.service';
import { MockAiProvider } from '../../services/ai/mock.provider';

describe('AiService & Multimodal Clinical Intelligence Unit Tests', () => {
  // Test with Mock provider to ensure 100% deterministic, offline-safe verification
  const mockProvider = new MockAiProvider();
  const service = new AiService(mockProvider, mockProvider, mockProvider);

  it('should parse doctor prescription into structured clinical regimen with Hindi instructions', async () => {
    const prompt = `Prescription Input:
"Rx: Dr. Arvind Sharma, Max Hospital
1. Tab Telmisartan 40mg OD after breakfast (BP)
2. Tab Metformin 500mg BD after meals (Diabetes)
Diet: Low salt, avoid sugar"
`;

    const execution = await service.generateStructuredJson<any>(prompt);

    assert.ok(execution.result);
    assert.equal(execution.result.doctorName, 'Dr. Arvind Sharma');
    assert.ok(execution.result.medications.length >= 2);
    assert.equal(execution.result.medications[0].name, 'Telmisartan 40mg');
    assert.equal(execution.result.medications[0].mealRelation, 'AFTER_MEAL');
    assert.equal(execution.result.medications[0].criticality, 'HIGH_RISK');
    assert.ok(execution.result.medications[0].instructionsHindi);
  });

  it('should generate tailored Indian dietary cautions and drug-food interaction warnings', async () => {
    const prompt = `Patient Age: 74 years
Diagnosed Conditions: Hypertension, Diabetes
Medications: Telmisartan 40mg, Metformin 500mg
Analyze drug-nutrient interactions for Indian diet.`;

    const execution = await service.generateStructuredJson<any>(prompt);

    assert.ok(execution.result);
    assert.ok(execution.result.foodsToFavor.length > 0);
    assert.ok(execution.result.foodsToAvoidOrModerate.length > 0);
    assert.ok(
      execution.result.foodsToAvoidOrModerate.some((f: any) =>
        f.food.toLowerCase().includes('chai') || f.food.toLowerCase().includes('coconut')
      )
    );
    assert.ok(execution.result.timingTips.length > 0);
  });

  it('should verify pill strip visual OCR against prescribed medication and return safety status', async () => {
    const prompt = `Expected Medication Name: Telmisartan 40mg
Pill/Strip Detection Context: Blister strip reading 'Telmisartan Tablets IP 40mg'
Verify if this pill matches the prescribed medication.`;

    const execution = await service.generateStructuredJson<any>(prompt);

    assert.ok(execution.result);
    assert.equal(execution.result.isMatch, true);
    assert.equal(execution.result.safetyStatus, 'SAFE_TO_TAKE');
    assert.ok(execution.result.confidenceScore >= 0.9);
    assert.ok(execution.result.messageHindi.includes('Telmisartan 40mg'));
  });

  it('should generate free-form clinical text using provider fallback', async () => {
    const execution = await service.generateText('Explain why Telmisartan should not be taken with potassium supplements.');
    assert.ok(execution.result);
    assert.ok(execution.latencyMs >= 0);
  });
});
