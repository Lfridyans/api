# 🚀 Panduan Publish ke GitHub

## ⚠️ PENTING: Keamanan Token

**JANGAN commit GitHub Personal Access Token ke repository!**

Token Anda: `YOUR_GITHUB_TOKEN` (ganti dengan token Anda)

Token ini akan digunakan untuk autentikasi, tapi **TIDAK akan disimpan di code**.

## 📋 Langkah-langkah Setup

### Step 1: Cek Status Git

Pastikan folder ini sudah di-inisialisasi sebagai git repository atau belum.

### Step 2: Inisialisasi Git (jika belum)

Jika belum ada git repository:
```bash
git init
```

### Step 3: Pastikan File .env Tidak Ter-commit

File `.gitignore` sudah dikonfigurasi untuk meng-ignore:
- ✅ `.env` file
- ✅ `node_modules/`
- ✅ File build

Verifikasi dengan:
```bash
git status
```

Pastikan file `.env` **TIDAK** muncul dalam daftar file yang akan di-commit.

### Step 4: Add Remote Repository

Tambahkan remote repository GitHub:
```bash
git remote add origin https://github.com/Lfridyans/injourneyairports.git
```

### Step 5: Add File ke Git

```bash
# Add semua file (kecuali yang di-ignore)
git add .

# Verifikasi file yang akan di-commit
git status
```

**Pastikan `.env` TIDAK ada di daftar!**

### Step 6: Commit

```bash
git commit -m "Initial commit: Nataru Traffic Predictor - InJourney Airports"
```

### Step 7: Rename Branch ke main (jika perlu)

```bash
git branch -M main
```

### Step 8: Push ke GitHub dengan Token

Untuk push ke GitHub, Anda perlu menggunakan token sebagai password.

**Opsi 1: Menggunakan token langsung di URL (untuk push pertama kali)**

```bash
git push -u origin main
```

Ketika diminta username: masukkan `Lfridyans`
Ketika diminta password: masukkan token Anda (bukan password GitHub)

**Opsi 2: Simpan token di Git Credential Manager (lebih aman)**

```bash
# Windows - Simpan credential
git config --global credential.helper wincred

# Kemudian push (akan menyimpan token secara aman)
git push -u origin main
# Username: Lfridyans
# Password: YOUR_GITHUB_TOKEN (masukkan token Anda)
```

**Opsi 3: Gunakan token di URL (hanya untuk push pertama, lalu hapus)**

```bash
git remote set-url origin https://YOUR_GITHUB_TOKEN@github.com/Lfridyans/injourneyairports.git
git push -u origin main

# SETELAH BERHASIL, hapus token dari URL untuk keamanan
git remote set-url origin https://github.com/Lfridyans/injourneyairports.git
```

## ✅ Verifikasi

Setelah push berhasil:

1. Buka repository di browser: https://github.com/Lfridyans/injourneyairports
2. Pastikan semua file sudah ada
3. **VERIFIKASI**: Pastikan file `.env` **TIDAK ada** di repository

## 🔒 Keamanan

### Checklist Keamanan:

- [ ] File `.env` sudah di-ignore (cek di `.gitignore`)
- [ ] File `.env` tidak muncul di `git status`
- [ ] Token tidak ter-commit ke repository
- [ ] File `.gitignore` sudah include semua file sensitif

### Jika Token Ter-commit (TIDAK BOLEH!):

Jika secara tidak sengaja token ter-commit:

1. **SEGERA revoke token** di GitHub:
   - Settings → Developer settings → Personal access tokens
   - Revoke token yang ter-expose

2. Buat token baru

3. Hapus dari git history:
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch FILE_YANG_BERISI_TOKEN" --prune-empty --tag-name-filter cat -- --all
   ```

## 🎯 Quick Start Commands

Copy-paste commands berikut untuk setup cepat:

```bash
# 1. Inisialisasi git (jika belum)
git init

# 2. Tambahkan remote
git remote add origin https://github.com/Lfridyans/injourneyairports.git

# 3. Add semua file
git add .

# 4. Commit
git commit -m "Initial commit: Nataru Traffic Predictor - InJourney Airports"

# 5. Rename branch ke main
git branch -M main

# 6. Push (akan diminta username dan password)
git push -u origin main
# Username: Lfridyans
# Password: YOUR_GITHUB_TOKEN (masukkan token Anda)
```

## 📝 Catatan

- Token hanya digunakan untuk autentikasi, tidak disimpan di code
- File `.env` dengan API key Gemini tetap aman dan tidak ter-commit
- Repository sudah ready untuk di-publish

