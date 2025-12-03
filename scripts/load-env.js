// Helper function untuk load environment variables dari .env file
// Dapat digunakan oleh semua script di folder scripts/
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variables from .env file
 * Mirip dengan cara yang digunakan di test-gemini.js yang berhasil
 */
export function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          // Handle quoted values and trim
          let value = valueParts.join('=').trim();
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value;
        }
      }
    });
    
    // Also set to process.env for compatibility
    Object.keys(env).forEach(key => {
      process.env[key] = env[key];
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️ Warning: Error reading .env file:', error.message);
    return {};
  }
}

/**
 * Get GEMINI_API_KEY from environment variables
 * Priority: env.GEMINI_API_KEY > env.API_KEY > process.env.GEMINI_API_KEY > process.env.API_KEY
 */
export function getGeminiApiKey() {
  // Load from .env file first
  const env = loadEnv();
  
  // Try multiple sources
  const apiKey = env.GEMINI_API_KEY || 
                 env.API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('❌ ERROR: GEMINI_API_KEY tidak ditemukan di environment variable!');
    console.error('📋 Pastikan file .env ada di root project dan berisi:');
    console.error('   GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }
  
  return apiKey;
}

