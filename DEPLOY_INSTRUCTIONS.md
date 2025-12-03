# 🚀 Instruksi Deploy ke GitHub Pages

## ⚠️ PERINGATAN PENTING

**API Key Gemini akan ter-expose di browser jika di-deploy ke GitHub Pages!**

Ketika aplikasi di-build untuk production, API key akan di-inject ke JavaScript bundle. Siapa saja yang mengakses website bisa melihat API key melalui:
- View Page Source
- Browser DevTools (Network tab, Sources tab)
- JavaScript bundle files

**Ini berarti API key Anda bisa dicuri dan disalahgunakan!**

## 📋 Setup GitHub Pages

### Langkah 1: Enable GitHub Pages di Repository

1. Buka repository: https://github.com/Lfridyans/injourneyairports
2. Klik **Settings** (pengaturan)
3. Scroll ke bagian **Pages** (di sidebar kiri)
4. Di **Source**, pilih: **GitHub Actions**
5. Klik **Save**

### Langkah 2: Setup GitHub Secrets (untuk API Key)

**PENTING**: API key akan tetap ter-expose, tapi setidaknya tidak hardcoded di workflow file.

1. Di repository, klik **Settings**
2. Klik **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: Masukkan API key Gemini Anda
6. Klik **Add secret**

### Langkah 3: Push Code dan Deploy

Workflow sudah disetup. Setiap kali push ke branch `main`, GitHub Actions akan:
1. Build aplikasi
2. Deploy ke GitHub Pages

```bash
# Commit perubahan
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Langkah 4: Tunggu Deploy Selesai

1. Buka tab **Actions** di repository
2. Tunggu workflow "Deploy to GitHub Pages" selesai
3. Website akan tersedia di: `https://lfridyans.github.io/injourneyairports/`

## 🔒 Alternatif yang Lebih Aman

### Opsi 1: Backend Proxy (RECOMMENDED)

1. Buat backend API (Node.js, Python, dll)
2. Backend menyimpan API key (server-side only)
3. Frontend memanggil backend API, bukan langsung ke Gemini
4. API key tetap aman di server

### Opsi 2: Environment Variable per User

- User harus input API key mereka sendiri di website
- Disimpan di localStorage (client-side)
- Tidak ter-commit ke repository

### Opsi 3: Tidak Deploy (SAFEST)

- Tetap sebagai repository source code saja
- Developer clone dan run lokal
- API key tetap aman

## 📝 Catatan

- URL website: `https://lfridyans.github.io/injourneyairports/`
- Base path sudah dikonfigurasi di `vite.config.ts`
- Workflow otomatis deploy setiap push ke `main`

## ⚠️ PERINGATAN TERAKHIR

**Dengan deploy ke GitHub Pages, API key Gemini Anda akan ter-expose ke publik.**
**Pastikan Anda memahami risiko ini sebelum deploy!**

---

**Apakah Anda yakin ingin melanjutkan deployment dengan risiko ini?**

