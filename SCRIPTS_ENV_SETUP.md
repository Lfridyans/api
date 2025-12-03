# Setup Environment Variable untuk Scripts

## ✅ Helper Function Tersedia

Semua script di folder `scripts/` sekarang menggunakan helper function `load-env.js` untuk membaca environment variable dari file `.env`.

## 📋 Cara Menggunakan

### Di Script Baru

Tambahkan import helper function di awal script:

```javascript
import { getGeminiApiKey, loadEnv } from './load-env.js';

// Load environment variables
loadEnv();

// Get API key (akan exit jika tidak ditemukan)
const GEMINI_API_KEY = getGeminiApiKey();
```

### Script yang Sudah Diperbarui

1. ✅ `scripts/update-kesimpulan.js` - Sudah menggunakan helper function
2. ✅ `scripts/generate-kesimpulan-direct.js` - Mengimpor dari geminiService.ts (sudah load env)

## 🔍 Fungsi Helper

### `loadEnv()`
Memuat semua environment variables dari file `.env` ke `process.env`.

### `getGeminiApiKey()`
Mengambil `GEMINI_API_KEY` dari environment variables. Akan:
- Load dari file `.env` terlebih dahulu
- Mencoba beberapa sumber: `GEMINI_API_KEY` atau `API_KEY`
- Exit dengan error message jika tidak ditemukan

## ✅ Verifikasi

Untuk test apakah API key terbaca dengan benar:

```bash
node scripts/update-kesimpulan.js predictions-file.json
```

Script akan:
1. Load environment variables dari `.env`
2. Validasi API key
3. Exit dengan error message yang jelas jika API key tidak ditemukan

## 📝 Catatan

- File `.env` harus berada di root project (sama level dengan `vite.config.ts`)
- Format file `.env`:
  ```env
  GEMINI_API_KEY=your_api_key_here
  ```
- Semua script menggunakan cara yang sama untuk membaca env, konsisten dengan test yang berhasil

