# ⚠️ PENTING: Deployment ke GitHub Pages

## 🚨 Masalah Keamanan

Aplikasi ini menggunakan Gemini API key di **client-side** (browser). Jika di-deploy ke GitHub Pages:

- ⚠️ API key akan ter-expose di browser (bisa dilihat siapa saja)
- ⚠️ API key akan ada di JavaScript bundle yang di-build
- ⚠️ Siapa saja bisa melihat dan menggunakan API key Anda

## 💡 Solusi

### Opsi 1: Tidak Deploy ke GitHub Pages (Disarankan)

**Rekomendasi**: Jangan deploy aplikasi ini ke GitHub Pages karena API key akan ter-expose.

**Alasan:**
- Aplikasi ini dirancang untuk **internal use** atau **local development**
- Gemini API key seharusnya tidak ter-expose ke publik
- Lebih aman tetap sebagai repository source code saja

### Opsi 2: Deploy dengan Backend Proxy (Aman)

Jika tetap ingin deploy, perlu backend untuk menyembunyikan API key:

1. Buat backend API (misalnya dengan Vercel, Netlify Functions, atau Node.js server)
2. Backend menyimpan API key (server-side only)
3. Frontend memanggil backend API, bukan langsung ke Gemini
4. API key tetap aman di server

### Opsi 3: Deploy Demo Version (Tanpa Fitur AI)

Deploy versi demo tanpa fitur yang memerlukan API key:
- Hanya tampilkan UI dan data statis
- Fitur prediksi dinonaktifkan

## 📋 Jika Tetap Ingin Setup GitHub Pages

**PENTING**: Hanya lakukan ini jika Anda mengerti risiko keamanan!

### Setup GitHub Actions untuk Deploy

1. Buat workflow file: `.github/workflows/deploy.yml`
2. Configure untuk build dan deploy otomatis

Tapi ingat: **API key akan ter-expose di browser!**

## ✅ Rekomendasi

**JANGAN deploy ke GitHub Pages** karena:
1. ✅ Repository sudah aman di GitHub
2. ✅ Developer bisa clone dan run lokal
3. ✅ API key tetap aman
4. ✅ Tidak ada risiko expose API key

Aplikasi ini lebih cocok untuk:
- Development lokal
- Internal deployment (dengan server sendiri)
- Private hosting (bukan public GitHub Pages)

---

**Kesimpulan: Lebih baik tetap sebagai repository source code saja, tidak perlu di-deploy ke GitHub Pages untuk keamanan API key.**

