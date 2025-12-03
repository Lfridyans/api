# 🚀 Setup GitHub Pages untuk Deploy

Panduan lengkap untuk deploy aplikasi ke GitHub Pages.

## 📋 Langkah-langkah Setup

### 1. ✅ Setup GitHub Secret untuk API Key

Workflow membutuhkan `GEMINI_API_KEY` dari GitHub Secrets.

**Cara setup:**

1. Buka repository di GitHub: https://github.com/Lfridyans/api
2. Klik **Settings** (di bagian atas repository)
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**
4. Klik tombol **New repository secret**
5. Isi:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Masukkan API key Gemini Anda
6. Klik **Add secret**

**Cara mendapatkan API key:**
- Kunjungi: https://aistudio.google.com/app/apikey
- Login dengan akun Google
- Buat API key baru
- Copy dan paste ke GitHub Secret

### 2. ✅ Enable GitHub Pages

1. Buka repository di GitHub: https://github.com/Lfridyans/api
2. Klik **Settings**
3. Di sidebar kiri, klik **Pages** (di bawah "Code and automation")
4. Di bagian **Build and deployment**:
   - **Source**: Pilih **GitHub Actions**
5. Simpan perubahan

### 3. ✅ Trigger Workflow

Workflow akan otomatis berjalan saat:
- Push ke branch `main`
- Atau bisa di-trigger manual dari tab **Actions**

**Cara trigger manual:**

1. Buka tab **Actions** di repository
2. Pilih workflow **Deploy to GitHub Pages**
3. Klik **Run workflow** (tombol di kanan atas)
4. Pilih branch `main`
5. Klik **Run workflow**

### 4. ✅ Cek Status Deployment

1. Buka tab **Actions**
2. Klik pada workflow run yang sedang berjalan
3. Lihat progress di bagian **Jobs**:
   - ✅ **build** - Build aplikasi
   - ✅ **deploy** - Deploy ke GitHub Pages

### 5. ✅ Akses Website

Setelah deployment selesai, website akan tersedia di:

**URL GitHub Pages:**
```
https://lfridyans.github.io/api/
```

**Cara cek URL:**
1. Buka **Settings** → **Pages**
2. Di bagian atas akan muncul URL website Anda

## 🔍 Troubleshooting

### Workflow Gagal dengan Error "GEMINI_API_KEY not found"

**Solusi:**
- Pastikan sudah setup GitHub Secret `GEMINI_API_KEY`
- Cek di **Settings** → **Secrets and variables** → **Actions**
- Pastikan nama secret tepat: `GEMINI_API_KEY` (case-sensitive)

### Build Gagal

**Cek:**
- Pastikan semua dependencies bisa diinstall
- Lihat error message di tab **Actions** → workflow run yang gagal
- Pastikan Node.js version sesuai (v18+)

### Website Tidak Muncul atau 404

**Solusi:**
- Tunggu beberapa menit setelah deployment (GitHub Pages butuh waktu untuk propagate)
- Refresh browser dengan hard refresh (Ctrl+F5)
- Cek URL apakah benar: `https://lfridyans.github.io/api/`
- Pastikan base path di `vite.config.ts` sudah benar: `/api/`

### Assets Tidak Load (CSS/JS/Images Error)

**Solusi:**
- Pastikan base path di `vite.config.ts` sudah sesuai dengan nama repository
- Repository name: `api` → base path: `/api/`
- Build ulang setelah update base path

## 📝 Notes

- ⚠️ **API Key Security**: API key akan ter-expose di JavaScript bundle karena ini client-side app
- 🔄 **Auto Deploy**: Setiap push ke `main` akan trigger deployment otomatis
- ⏱️ **Deploy Time**: Biasanya membutuhkan 1-3 menit untuk deploy
- 🌐 **HTTPS**: GitHub Pages otomatis menggunakan HTTPS

## 🎯 Next Steps

Setelah setup selesai:
1. ✅ Test website di URL GitHub Pages
2. ✅ Cek semua fitur bekerja dengan baik
3. ✅ Monitor deployment di tab **Actions**

---

**Selamat! Website Anda sudah live di GitHub Pages! 🎉**

