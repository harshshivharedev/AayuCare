import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCacheService } from './cache.service';

describe('CacheService Unit Tests (Performance & High-Speed Pillbox Lookup)', () => {
  it('should store and retrieve cached objects with high fidelity', async () => {
    const cache = new InMemoryCacheService();
    const testData = {
      elderProfileId: 'elder-ramesh-1',
      medicationCount: 3,
      lastUpdated: '2026-11-15'
    };

    await cache.set('pillbox:elder-ramesh-1', testData, 60);
    const retrieved = await cache.get<typeof testData>('pillbox:elder-ramesh-1');

    assert.deepEqual(retrieved, testData);
  });

  it('should invalidate cache on explicit deletion or prefix purge', async () => {
    const cache = new InMemoryCacheService();
    await cache.set('pillbox:elder-1', { doses: 2 }, 60);
    await cache.set('pillbox:elder-2', { doses: 5 }, 60);

    // Individual delete
    await cache.del('pillbox:elder-1');
    assert.equal(await cache.get('pillbox:elder-1'), null);
    assert.ok(await cache.get('pillbox:elder-2'));

    // Prefix purge
    await cache.delPrefix('pillbox:');
    assert.equal(await cache.get('pillbox:elder-2'), null);
  });
});
