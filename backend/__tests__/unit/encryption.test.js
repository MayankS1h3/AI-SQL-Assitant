import { encrypt, decrypt, generateEncryptionKey } from '../../src/utils/encryption.js';

describe('Encryption Utils', () => {
  // Set up test encryption key
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = generateEncryptionKey();
  });

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plainText = 'my-secret-key';
      const encrypted = encrypt(plainText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plainText);
      expect(encrypted).toContain(':'); // Should have IV:data format
    });

    it('should throw error for empty string', () => {
      expect(() => encrypt('')).toThrow('Text to encrypt cannot be empty');
    });

    it('should produce different ciphertexts for same input', () => {
      const plainText = 'my-secret-key';
      const encrypted1 = encrypt(plainText);
      const encrypted2 = encrypt(plainText);
      
      // Should be different because of random IV
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plainText = 'my-secret-key';
      const encrypted = encrypt(plainText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plainText);
    });

    it('should throw error for empty string', () => {
      expect(() => decrypt('')).toThrow('Text to decrypt cannot be empty');
    });

    it('should throw error for invalid format', () => {
      expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted data format');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});
