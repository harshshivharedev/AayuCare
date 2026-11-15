import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CloudinaryUploadService } from './upload.service';

describe('UploadService Unit Tests (Dual Cloudinary + Resilient Fallback)', () => {
  const service = new CloudinaryUploadService();

  it('should upload tablet image buffer and return valid accessible URL and metadata', async () => {
    const fakeImageBuffer = Buffer.from('fake-image-content-jpeg-bytes');
    const result = await service.uploadImage(fakeImageBuffer, 'telmisartan_strip.jpg', 'image/jpeg');

    assert.ok(result.url, 'Upload URL must be returned');
    assert.ok(result.publicId, 'Public ID must be returned');
    assert.equal(result.format, 'jpg');
    assert.equal(result.bytes, fakeImageBuffer.length);
  });

  it('should upload caretaker voice note audio buffer and return valid URL and format', async () => {
    const fakeAudioBuffer = Buffer.from('fake-audio-content-webm-bytes');
    const result = await service.uploadVoice(fakeAudioBuffer, 'caretaker_guidance.webm', 'audio/webm');

    assert.ok(result.url, 'Audio URL must be returned');
    assert.ok(result.publicId);
    assert.equal(result.format, 'webm');
    assert.equal(result.bytes, fakeAudioBuffer.length);
  });
});
