# 📤 Push Deployment Files ke GitHub

## ✅ File Sudah Di-commit

Semua file deployment sudah di-commit lokal:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vite.config.ts` - Base path configuration
- `DEPLOY_INSTRUCTIONS.md` - Instruksi deployment
- `GITHUB_PAGES_DEPLOY_FINAL.md` - Panduan lengkap

## 🔑 Push ke GitHub (Perlu Token)

Untuk push ke GitHub, Anda perlu autentikasi. Gunakan salah satu cara berikut:

### Cara 1: Push dengan Token di URL (Quick)

```bash
# Ganti YOUR_TOKEN dengan GitHub Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/Lfridyans/injourneyairports.git
git push origin main

# Setelah push, hapus token dari URL untuk keamanan
git remote set-url origin https://github.com/Lfridyans/injourneyairports.git
```

### Cara 2: Gunakan GitHub CLI

```bash
gh auth login
git push origin main
```

### Cara 3: SSH Key (Lebih Aman)

1. Setup SSH key di GitHub
2. Ubah remote ke SSH:
   ```bash
   git remote set-url origin git@github.com:Lfridyans/injourneyairports.git
   git push origin main
   ```

## 📋 Setelah Push Berhasil

1. **Enable GitHub Pages:**
   - Buka: https://github.com/Lfridyans/injourneyairports/settings/pages
   - Source: Pilih **GitHub Actions**
   - Klik **Save**

2. **Setup GitHub Secret:**
   - Buka: https://github.com/Lfridyans/injourneyairports/settings/secrets/actions
   - Klik **New repository secret**
   - Name: `GEMINI_API_KEY`
   - Value: Masukkan API key dari file `.env` lokal
   - Klik **Add secret**

3. **Tunggu Deploy:**
   - Buka tab **Actions**
   - Workflow akan otomatis jalan setelah push
   - Website akan tersedia di: `https://lfridyans.github.io/injourneyairports/`

## ⚠️ Catatan

- Token yang digunakan sebelumnya mungkin sudah expired
- Atau remote URL perlu di-update dengan token baru
- GitHub Personal Access Token bisa dibuat di: https://github.com/settings/tokens

---

**File sudah di-commit lokal, tinggal push ke GitHub!** 🚀

