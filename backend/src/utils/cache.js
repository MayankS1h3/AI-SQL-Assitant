/**
 * Simple in-memory cache with TTL (Time To Live)
 * Used for caching database schemas to avoid repeated fetches
 */
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 600) {
    // Clear existing timer if key already exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);

    console.log(`📦 Cache SET: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      console.log(`📦 Cache MISS: ${key}`);
      return null;
    }

    // Check if item has expired (double-check)
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      console.log(`📦 Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`📦 Cache HIT: ${key}`);
    return item.value;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    // Delete from cache
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`📦 Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear cache
    this.cache.clear();
    console.log('📦 Cache CLEARED');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate a cache key for schema
   * @param {string} userId - User ID
   * @param {string} connectionId - Connection ID
   * @returns {string} Cache key
   */
  static generateSchemaKey(userId, connectionId) {
    return `schema:${userId}:${connectionId}`;
  }
}

// Create singleton instance
const cache = new InMemoryCache();

export default cache;
