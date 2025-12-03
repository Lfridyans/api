# 🚀 Deploy ke GitHub Pages - Panduan Lengkap

## ✅ Setup Selesai!

Saya sudah menyiapkan semua file yang diperlukan untuk deploy ke GitHub Pages:

### File yang Sudah Dibuat:

1. ✅ **`.github/workflows/deploy.yml`** - GitHub Actions workflow untuk build dan deploy
2. ✅ **`vite.config.ts`** - Sudah dikonfigurasi dengan base path `/injourneyairports/`
3. ✅ **`DEPLOY_INSTRUCTIONS.md`** - Instruksi lengkap deployment

## ⚠️ PERINGATAN PENTING

**API Key Gemini akan ter-expose di browser jika di-deploy!**

Ketika aplikasi di-build, API key akan di-inject ke JavaScript bundle. Siapa saja bisa melihatnya di browser DevTools.

## 📋 Langkah-langkah Deployment

### 1. Enable GitHub Pages di Repository

1. Buka: https://github.com/Lfridyans/injourneyairports
2. Klik **Settings**
3. Scroll ke **Pages** (sidebar kiri)
4. Di **Source**, pilih: **GitHub Actions**
5. Klik **Save**

### 2. Setup GitHub Secrets (API Key)

**PENTING**: Masukkan API key Gemini Anda ke GitHub Secrets:

1. Di repository, klik **Settings**
2. Klik **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Masukkan API key Gemini Anda (dari file `.env` lokal)
6. Klik **Add secret**

### 3. Commit dan Push

Setelah semua file sudah ada, commit dan push ke GitHub:

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 4. Tunggu Deploy Selesai

1. Buka tab **Actions** di repository
2. Klik workflow "Deploy to GitHub Pages"
3. Tunggu build dan deploy selesai (biasanya 2-5 menit)
4. Website akan tersedia di: **https://lfridyans.github.io/injourneyairports/**

## 🔄 Deploy Otomatis

Setiap kali Anda push ke branch `main`, GitHub Actions akan:
- ✅ Build aplikasi
- ✅ Deploy ke GitHub Pages
- ✅ Update website otomatis

## 📝 Catatan Penting

### Base Path
- Aplikasi akan di-serve dari: `/injourneyairports/`
- Semua asset (CSS, JS, images) akan menggunakan path ini
- Sudah dikonfigurasi di `vite.config.ts`

### API Key
- **DISARANKAN**: Gunakan GitHub Secrets untuk menyimpan API key
- API key akan tetap ter-expose di browser (limitation client-side)
- Pertimbangkan backend proxy untuk keamanan lebih baik

### Build Output
- Build files akan ada di folder `dist/`
- GitHub Actions akan upload folder `dist/` ke GitHub Pages

## 🔒 Opsi Keamanan (Opsional)

Jika khawatir tentang API key ter-expose, pertimbangkan:

1. **Backend Proxy** - Buat API backend untuk menyembunyikan API key
2. **User Input** - User input API key mereka sendiri di website
3. **Rate Limiting** - Batasi penggunaan API key di Google Cloud Console

## ✅ Checklist Deployment

- [ ] GitHub Pages sudah di-enable (Source: GitHub Actions)
- [ ] GitHub Secret `GEMINI_API_KEY` sudah ditambahkan
- [ ] File workflow sudah ada di `.github/workflows/deploy.yml`
- [ ] Base path sudah dikonfigurasi di `vite.config.ts`
- [ ] Code sudah di-commit dan push ke `main`
- [ ] Workflow berhasil di tab **Actions**
- [ ] Website bisa diakses di `https://lfridyans.github.io/injourneyairports/`

## 🎯 Hasil Akhir

Setelah deploy selesai:
- ✅ Website publik: `https://lfridyans.github.io/injourneyairports/`
- ✅ Auto-deploy setiap push ke `main`
- ✅ Build dan deploy otomatis via GitHub Actions

---

**Ready to deploy!** 🚀

Jika ada pertanyaan atau masalah, cek tab **Actions** di repository untuk melihat log error.

