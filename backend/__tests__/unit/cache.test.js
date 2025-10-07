import cache from '../../src/utils/cache.js';

describe('InMemoryCache', () => {
  beforeEach(() => {
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('test-key', 'test-value', 60);
      const value = cache.get('test-key');
      
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      const value = cache.get('non-existent');
      
      expect(value).toBeNull();
    });

    it('should store complex objects', () => {
      const testObj = { name: 'John', age: 30, data: [1, 2, 3] };
      cache.set('obj-key', testObj, 60);
      const retrieved = cache.get('obj-key');
      
      expect(retrieved).toEqual(testObj);
    });
  });

  describe('expiration', () => {
    it('should expire after TTL', (done) => {
      cache.set('expire-key', 'expire-value', 1); // 1 second TTL
      
      // Should exist immediately
      expect(cache.get('expire-key')).toBe('expire-value');
      
      // Should be gone after 1.5 seconds
      setTimeout(() => {
        expect(cache.get('expire-key')).toBeNull();
        done();
      }, 1500);
    }, 2000);
  });

  describe('delete', () => {
    it('should delete a key', () => {
      cache.set('delete-key', 'delete-value', 60);
      expect(cache.get('delete-key')).toBe('delete-value');
      
      cache.delete('delete-key');
      expect(cache.get('delete-key')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('has-key', 'has-value', 60);
      
      expect(cache.has('has-key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);
      
      expect(cache.getStats().size).toBe(3);
      
      cache.clear();
      
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('generateSchemaKey', () => {
    it('should generate correct cache key format', () => {
      const key = cache.constructor.generateSchemaKey('user123', 'conn456');
      
      expect(key).toBe('schema:user123:conn456');
    });
  });
});
