# ⚠️ PENTING: Deployment ke GitHub Pages

## 🚨 Masalah Keamanan dengan API Key

Aplikasi ini menggunakan Gemini API key yang di-inject ke **client-side** (browser). 

**Jika di-deploy ke GitHub Pages:**
- ⚠️ API key akan ter-expose di JavaScript bundle
- ⚠️ Siapa saja bisa melihat API key di browser (View Source / DevTools)
- ⚠️ API key bisa dicuri dan digunakan orang lain

## 💡 Solusi

### Opsi 1: TIDAK Deploy ke GitHub Pages (DISARANKAN) ⭐

**Rekomendasi**: Jangan deploy aplikasi ini ke GitHub Pages publik.

**Alasan:**
- Aplikasi ini untuk **internal use** (bandara)
- API key harus tetap aman
- Lebih baik tetap sebagai repository source code saja

### Opsi 2: Setup GitHub Actions untuk Deploy (dengan Peringatan)

Jika tetap ingin deploy (dengan risiko expose API key), saya bisa setup workflow untuk GitHub Pages.

**PERINGATAN**: API key akan ter-expose di browser!

## 📋 Struktur Repository

Repository sudah ada di GitHub, tapi GitHub Pages belum dikonfigurasi. Untuk setup GitHub Pages, kita perlu:

1. GitHub Actions workflow untuk build dan deploy
2. Base path configuration di vite.config.ts
3. GitHub Pages settings di repository

## ✅ Rekomendasi Final

**JANGAN deploy ke GitHub Pages** karena:
1. ✅ Repository source code sudah aman di GitHub
2. ✅ Developer bisa clone dan run lokal dengan `.env` mereka
3. ✅ API key tetap aman (tidak ter-expose)
4. ✅ Tidak ada risiko keamanan

**Aplikasi ini cocok untuk:**
- Development lokal
- Internal deployment (server sendiri)
- Private hosting

Apakah Anda tetap ingin saya setup GitHub Pages deployment dengan peringatan keamanan ini?

