# 🚀 Quick Setup GitHub - Injourney Airports

## Repository Info

- **Repository URL**: https://github.com/Lfridyans/injourneyairports.git
- **Username**: Lfridyans
- **Token**: YOUR_GITHUB_TOKEN (ganti dengan token Anda)

## ⚠️ PENTING: Keamanan

**Token ini HANYA untuk autentikasi, TIDAK akan disimpan di code!**

## 🎯 Quick Commands

Jalankan commands berikut satu per satu:

```bash
# 1. Inisialisasi git repository
git init

# 2. Tambahkan remote repository
git remote add origin https://github.com/Lfridyans/injourneyairports.git

# 3. Pastikan .env sudah di-ignore (cek .gitignore sudah ada .env)
# File .gitignore sudah dikonfigurasi dengan benar

# 4. Add semua file (kecuali yang di-ignore)
git add .

# 5. Cek status - PASTIKAN .env TIDAK ada di list!
git status

# 6. Jika .env tidak ada di list, commit:
git commit -m "Initial commit: Nataru Traffic Predictor - InJourney Airports"

# 7. Rename branch ke main
git branch -M main

# 8. Push ke GitHub
git push -u origin main
```

**Ketika push, akan diminta:**
- **Username**: `Lfridyans`
- **Password**: `YOUR_GITHUB_TOKEN` (masukkan token Anda sebagai password)

## ✅ Verifikasi Setelah Push

1. Buka: https://github.com/Lfridyans/injourneyairports
2. Pastikan semua file sudah ada
3. **PASTIKAN file `.env` TIDAK ada di repository!**

## 🔒 Checklist Keamanan

- [ ] File `.env` ada di `.gitignore`
- [ ] File `.env` TIDAK muncul di `git status`
- [ ] Token tidak ter-commit ke repository
- [ ] Semua file penting sudah di-push

## 🆘 Troubleshooting

### Jika .env muncul di git status:

```bash
# Hapus dari git tracking (tapi tetap di local)
git rm --cached .env

# Pastikan .gitignore sudah ada .env
# Lalu commit
git commit -m "Remove .env from repository"
```

### Jika push gagal:

1. Cek koneksi internet
2. Pastikan token masih valid
3. Coba push lagi dengan token yang sama

## 📝 Catatan

- Token hanya digunakan sekali saat push
- Token tidak disimpan di repository
- File `.env` tetap aman dan tidak ter-commit

