# Setup API Key

## 📋 Model yang Digunakan
- **Model**: `gemini-2.5-pro` (Advanced reasoning model)
- Semua fungsi prediksi menggunakan model ini

## 📝 Cara Setup

### 1. Buat File `.env` di Root Project

Buat file baru bernama `.env` di root folder project (sama level dengan `vite.config.ts`).

### 2. Isi File `.env` dengan:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_api_key_here
```

**Catatan**: Ganti `your_api_key_here` dengan API key Google Gemini Anda yang valid.

### 3. Restart Development Server

Setelah membuat file `.env`, restart server:

```bash
# Stop server (Ctrl+C jika sedang running)
# Kemudian jalankan lagi:
npm run dev
```

## ✅ Verifikasi

Setelah setup, API key akan otomatis digunakan oleh:
- `services/geminiService.ts` - Semua fungsi prediksi
- Sistem akan membaca dari `process.env.API_KEY` yang sudah dikonfigurasi di `vite.config.ts`

## 🔒 Keamanan

- File `.env` sudah ada di `.gitignore`, jadi tidak akan ter-commit ke repository
- **JANGAN** commit file `.env` yang berisi API key ke repository public

