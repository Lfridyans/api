# Troubleshooting File .env

## Masalah: File .env tidak terbaca

File `.env` sudah ada dan berisi (contoh):
```env
GEMINI_API_KEY=your_api_key_here
```

**Catatan**: Pastikan API key Anda valid dan sesuai dengan format yang benar.

## Solusi yang Sudah Diterapkan

### 1. Konfigurasi vite.config.ts
- Menggunakan `loadEnv(mode, '.', '')` untuk memuat semua env vars dari file `.env`
- Meng-inject env vars ke `process.env` via `define` configuration
- Menambahkan logging untuk debugging

### 2. Konfigurasi geminiService.ts
- Membaca dari `process.env.GEMINI_API_KEY` atau `process.env.API_KEY`
- Memiliki fallback ke hardcoded key jika env tidak tersedia

## Cara Verifikasi

1. **Restart Development Server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Cek Console Log**
   - Saat server start, akan muncul log di terminal:
     ```
     📋 Vite Config - Environment Variables:
       Mode: development
       GEMINI_API_KEY: ✅ Found (AIzaSyAbF...)
       API_KEY: ❌ Not found
       Final API Key: ✅ Will be used
     ```

3. **Cek Browser Console**
   - Buka Developer Tools (F12)
   - Cek apakah ada error terkait API key

## Catatan Penting

- File `.env` harus berada di **root directory** project (sama dengan `vite.config.ts`)
- Jangan ada spasi di sekitar tanda `=` di file `.env`
- Restart server setelah mengubah file `.env`
- File `.env` di-ignore oleh git (normal, untuk keamanan)

## Jika Masih Bermasalah

1. Pastikan file `.env` ada di root directory
2. Pastikan format file benar (tidak ada spasi berlebih)
3. Restart development server
4. Cek console log saat server start

