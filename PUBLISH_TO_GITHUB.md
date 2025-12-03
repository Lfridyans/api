# 📦 Publish ke GitHub - Injourney Airports

## 🎯 Repository Info

- **Repository**: injourneyairports
- **Owner**: Lfridyans  
- **URL**: https://github.com/Lfridyans/injourneyairports.git
- **Visibility**: Public

## ⚡ Quick Setup (Copy-Paste Commands)

Berdasarkan instruksi dari GitHub, jalankan commands berikut:

### Untuk Repository yang Sudah Ada (Existing Repository)

```bash
# 1. Tambahkan remote repository
git remote add origin https://github.com/Lfridyans/injourneyairports.git

# 2. Rename branch ke main
git branch -M main

# 3. Push ke GitHub
git push -u origin main
```

**Ketika push, akan diminta credentials:**
- **Username**: `Lfridyans`
- **Password**: `YOUR_GITHUB_TOKEN` (masukkan token Anda sebagai password)

## 📋 Langkah Detail

### Step 1: Inisialisasi Git (jika belum)

```bash
git init
```

### Step 2: Pastikan File Sensitif Tidak Ter-commit

File `.gitignore` sudah dikonfigurasi untuk meng-ignore:
- ✅ `.env` (API key)
- ✅ `node_modules/`
- ✅ File build

**VERIFIKASI PENTING:**
```bash
git status
```

Pastikan file `.env` **TIDAK muncul** dalam daftar file yang akan di-commit!

### Step 3: Add Semua File

```bash
git add .
```

### Step 4: Commit

```bash
git commit -m "Initial commit: Nataru Traffic Predictor - InJourney Airports"
```

### Step 5: Setup Remote

```bash
git remote add origin https://github.com/Lfridyans/injourneyairports.git
```

### Step 6: Rename Branch ke main

```bash
git branch -M main
```

### Step 7: Push ke GitHub

```bash
git push -u origin main
```

**Authentication:**
- Username: `Lfridyans`
- Password: `YOUR_GITHUB_TOKEN` (masukkan token Anda)

## 🔒 Keamanan - CHECKLIST WAJIB

Sebelum push, pastikan:

- [ ] ✅ File `.env` sudah di `.gitignore`
- [ ] ✅ File `.env` TIDAK muncul di `git status`
- [ ] ✅ Token GitHub tidak akan ter-commit
- [ ] ✅ File sensitif lainnya sudah di-ignore

## ✅ Verifikasi Setelah Push

1. Buka: https://github.com/Lfridyans/injourneyairports
2. Pastikan semua file sudah ada
3. **VERIFIKASI PENTING**: Pastikan file `.env` **TIDAK ada** di repository
4. Pastikan README.md sudah ada dan informatif

## 🆘 Troubleshooting

### Error: "remote origin already exists"

```bash
# Hapus remote yang lama
git remote remove origin

# Tambahkan lagi
git remote add origin https://github.com/Lfridyans/injourneyairports.git
```

### Error: Authentication failed

1. Pastikan token masih valid
2. Gunakan token sebagai password (bukan password GitHub)
3. Pastikan username benar: `Lfridyans`

### File .env Ter-commit (TIDAK BOLEH!)

Jika file `.env` ter-commit secara tidak sengaja:

```bash
# Hapus dari git (tapi tetap di local)
git rm --cached .env

# Commit perubahan
git commit -m "Remove .env from repository"

# Push
git push
```

## 📝 Catatan Penting

- ✅ Token hanya untuk autentikasi, tidak disimpan di code
- ✅ File `.env` tetap aman dan tidak ter-commit
- ✅ Repository ready untuk di-share
- ✅ Semua file sensitif sudah di-ignore

## 🎉 Selesai!

Setelah push berhasil, repository Anda akan tersedia di:
**https://github.com/Lfridyans/injourneyairports**

