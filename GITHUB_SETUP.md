# 🚀 Setup GitHub Repository

## 📋 Checklist Sebelum Publish

### 1. ✅ Pastikan File Sensitif Tidak Ter-commit

File-file berikut **TIDAK BOLEH** ter-commit ke GitHub:
- `.env` - Berisi API key yang sensitif
- `node_modules/` - Dependencies (akan di-generate ulang)
- File hasil build/dist

File `.gitignore` sudah dikonfigurasi untuk meng-ignore:
- ✅ `.env` file
- ✅ `node_modules/`
- ✅ `dist/` (build output)
- ✅ File log dan temporary files

### 2. 📝 File yang Akan Di-commit

File yang aman dan perlu di-commit:
- ✅ Semua source code (`.ts`, `.tsx`, `.js`, `.json`)
- ✅ Konfigurasi (`vite.config.ts`, `tsconfig.json`, `package.json`)
- ✅ Dokumentasi (`.md` files)
- ✅ Assets publik (`public/` folder)
- ✅ `.gitignore` (penting!)

### 3. 🔒 Keamanan

**PENTING**: 
- ❌ **JANGAN** commit file `.env` yang berisi API key
- ❌ **JANGAN** hardcode API key di source code
- ✅ Gunakan environment variable saja
- ✅ Pastikan `.gitignore` sudah include `.env`

## 📦 Langkah-langkah Publish ke GitHub

### Step 1: Pastikan Repository Sudah Dibuat di GitHub

1. Buka https://github.com/new
2. Repository name: `injourneyairports` (atau nama yang diinginkan)
3. Visibility: **Public** atau **Private** (sesuai kebutuhan)
4. **JANGAN** centang "Add README", "Add .gitignore", atau "Add license" (kita sudah punya)
5. Klik "Create repository"

### Step 2: Inisialisasi Git (jika belum)

```bash
# Cek apakah sudah ada git repository
git status

# Jika belum ada, inisialisasi git
git init

# Set remote repository (ganti dengan URL repository Anda)
git remote add origin https://github.com/Lfridyans/injourneyairports.git
```

### Step 3: Cek Status Git

```bash
# Lihat file yang akan di-commit
git status

# Pastikan file .env TIDAK muncul di sini!
```

### Step 4: Add File ke Git

```bash
# Add semua file (kecuali yang di-ignore)
git add .

# Verifikasi file yang akan di-commit
git status

# Pastikan .env TIDAK ada di daftar!
```

### Step 5: Commit dan Push

```bash
# Commit dengan pesan yang jelas
git commit -m "Initial commit: Nataru Traffic Predictor - InJourney Airports"

# Push ke GitHub
git push -u origin main
```

Jika branch utama adalah `master` bukan `main`:
```bash
git push -u origin master
```

### Step 6: Verifikasi

1. Buka repository di GitHub: https://github.com/Lfridyans/injourneyairports
2. Pastikan file `.env` **TIDAK** ada di repository
3. Pastikan semua file penting sudah ada

## 🔧 Troubleshooting

### Jika file .env ter-commit (TIDAK BOLEH!)

Jika secara tidak sengaja file `.env` sudah ter-commit:

```bash
# Hapus dari git (tapi tetap ada di local)
git rm --cached .env

# Commit perubahan
git commit -m "Remove .env file from repository"

# Push ke GitHub
git push

# Pastikan .gitignore sudah include .env
```

### Jika branch berbeda

```bash
# Cek branch saat ini
git branch

# Jika menggunakan master, ubah ke main (opsional)
git branch -M main
```

## 📚 Setelah Publish

### Buat `.env.example` untuk Dokumentasi (Opsional)

File ini untuk membantu developer lain setup:

```env
# Google Gemini API Key
# Dapatkan API key dari: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_api_key_here
```

**Catatan**: File ini boleh di-commit, karena tidak berisi API key yang sebenarnya.

## ✅ Checklist Final

- [ ] File `.env` tidak ada di repository
- [ ] File `.gitignore` sudah include `.env`
- [ ] Semua file penting sudah di-commit
- [ ] README.md sudah informatif
- [ ] Repository sudah di-push ke GitHub
- [ ] Verifikasi di GitHub bahwa `.env` tidak ada

## 🔗 Links Penting

- Repository: https://github.com/Lfridyans/injourneyairports
- GitHub Docs: https://docs.github.com/en/get-started/quickstart/create-a-repo

