# ⚠️ GitHub Pages Belum Aktif - Checklist Setup

## 🔍 Status Saat Ini

Website masih menampilkan **404 "Site not found"**, yang berarti:

1. ❌ GitHub Pages belum di-enable, ATAU
2. ❌ GitHub Secret belum di-setup, ATAU
3. ❌ Workflow belum berhasil deploy

## ✅ Checklist Setup GitHub Pages

### Langkah 1: Enable GitHub Pages (WAJIB!)

1. **Buka Settings Repository:**
   - https://github.com/Lfridyans/injourneyairports/settings

2. **Klik "Pages" di sidebar kiri**

3. **Pilih Source:**
   - Di bagian "Source", pilih dropdown
   - Pilih: **"GitHub Actions"**
   - (BUKAN "Deploy from a branch")

4. **Klik "Save"**

5. **Tunggu beberapa detik** untuk GitHub memproses

### Langkah 2: Setup GitHub Secret (WAJIB untuk Build!)

Workflow perlu API key untuk build aplikasi.

1. **Buka Settings Repository:**
   - https://github.com/Lfridyans/injourneyairports/settings

2. **Klik "Secrets and variables" → "Actions"** (di sidebar kiri)

3. **Klik "New repository secret"**

4. **Isi Form:**
   - **Name**: `GEMINI_API_KEY` (huruf besar semua)
   - **Secret**: Masukkan API key Gemini Anda
     - Buka file `.env` di komputer lokal
     - Copy nilai setelah `GEMINI_API_KEY=`
     - Paste ke kolom Secret

5. **Klik "Add secret"**

### Langkah 3: Trigger Workflow

Setelah langkah 1 dan 2 selesai:

1. **Buka tab "Actions"** di repository:
   - https://github.com/Lfridyans/injourneyairports/actions

2. **Cek apakah workflow sudah jalan:**
   - Jika ada workflow "Deploy to GitHub Pages", tunggu selesai
   - Jika tidak ada, klik "Run workflow" → "Run workflow"

3. **Tunggu build selesai:**
   - Build biasanya memakan waktu 2-5 menit
   - Pastikan semua step berhasil (hijau)

### Langkah 4: Verifikasi Website

Setelah workflow selesai:

1. **Tunggu 1-2 menit** untuk GitHub Pages memproses deploy

2. **Akses website:**
   - https://lfridyans.github.io/injourneyairports/

3. **Jika masih 404:**
   - Cek tab Actions untuk error
   - Pastikan GitHub Pages sudah di-enable
   - Pastikan workflow berhasil

## 🔍 Troubleshooting

### Masalah: Website masih 404

**Solusi:**
1. Pastikan GitHub Pages sudah di-enable (Source: GitHub Actions)
2. Pastikan workflow sudah berhasil (tab Actions)
3. Tunggu 2-5 menit setelah workflow selesai
4. Cek kembali website

### Masalah: Workflow gagal build

**Kemungkinan penyebab:**
1. GitHub Secret belum di-setup
2. API key tidak valid
3. Build error (cek log di tab Actions)

**Solusi:**
1. Pastikan GitHub Secret `GEMINI_API_KEY` sudah ada
2. Pastikan API key valid (bisa test di lokal dulu)
3. Cek error message di tab Actions

### Masalah: Workflow tidak jalan

**Solusi:**
1. Pastikan GitHub Pages sudah di-enable
2. Manual trigger: Actions → Deploy to GitHub Pages → Run workflow

## 📋 Quick Checklist

- [ ] ✅ GitHub Pages di-enable (Settings → Pages → GitHub Actions)
- [ ] ✅ GitHub Secret `GEMINI_API_KEY` sudah di-setup
- [ ] ✅ Workflow berhasil di tab Actions
- [ ] ✅ Website bisa diakses (bukan 404)

## 🎯 Next Steps

1. **Lakukan Langkah 1 dan 2** (Enable GitHub Pages + Setup Secret)
2. **Tunggu workflow selesai**
3. **Akses website** untuk verifikasi

---

**Setelah langkah 1 dan 2 selesai, workflow akan otomatis jalan dan website akan tersedia!** 🚀

