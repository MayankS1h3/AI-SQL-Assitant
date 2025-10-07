import crypto from 'crypto';

// Encryption algorithm
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

// Helper function to get encryption key (lazy loading)
const getEncryptionKey = () => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
};

/**
 * Encrypt sensitive data (Supabase keys)
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:encryptedData
 */
export const encrypt = (text) => {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  const ENCRYPTION_KEY = getEncryptionKey();

  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by ':'
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data (Supabase keys)
 * @param {string} text - Encrypted text in format: iv:encryptedData
 * @returns {string} Decrypted plain text
 */
export const decrypt = (text) => {
  if (!text) {
    throw new Error('Text to decrypt cannot be empty');
  }

  const ENCRYPTION_KEY = getEncryptionKey();

  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate a random encryption key (for initial setup)
 * @returns {string} 32-byte hex string
 */
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};
