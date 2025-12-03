# ✅ Buat Workflow via GitHub UI

## 🎯 Anda Sedang di Halaman Create Workflow

Anda sedang membuat file workflow baru. Ada 2 pilihan:

## ✅ Opsi 1: Gunakan File yang Sudah Ada (REKOMENDASI)

File `deploy.yml` sudah ada! Lebih baik edit file yang sudah ada:

### Langkah:

1. **Batal** halaman ini (klik "Cancel changes")
2. Buka file yang sudah ada:
   - https://github.com/Lfridyans/injourneyairports/edit/main/.github/workflows/deploy.yml
3. Edit dan commit (akan trigger workflow)

## ✅ Opsi 2: Buat File Baru (Jika File Lama Tidak Terdeteksi)

Jika file lama tidak muncul, buat file baru dengan isi yang benar:

### Langkah:

1. **Ganti nama file** dari `main.yml` menjadi `deploy.yml`
   - Klik di bagian path/file name
   - Hapus `main.yml`
   - Ketik: `deploy.yml`

2. **Copy isi workflow** ke editor:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. **Commit changes:**
   - Scroll ke bawah
   - Title: `Add GitHub Pages deployment workflow`
   - Description: (opsional)
   - Klik **"Commit changes"**

## 🎯 Setelah Commit

1. Buka tab **Actions**: https://github.com/Lfridyans/injourneyairports/actions
2. Workflow "Deploy to GitHub Pages" akan muncul!
3. Workflow akan otomatis trigger

## ⚠️ Pastikan

1. ✅ GitHub Pages sudah di-enable (Settings → Pages → GitHub Actions)
2. ⏳ GitHub Secret `GEMINI_API_KEY` sudah di-setup

---

**Rekomendasi: Batal halaman ini, lalu edit file deploy.yml yang sudah ada!** ✏️

