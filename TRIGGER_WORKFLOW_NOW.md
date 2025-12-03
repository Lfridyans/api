# 🚀 Cara Trigger Workflow Sekarang

## ✅ File Workflow Sudah Ada

File `deploy.yml` sudah ada di repository! Sekarang perlu munculkan di tab Actions.

## 📋 Langkah-langkah

### Langkah 1: Skip Setup (Jika Masih di Halaman "Get started")

Jika Anda masih melihat halaman "Get started with GitHub Actions":

1. **Klik link**: **"Skip this and set up a workflow yourself →"**
   - Link ini ada di halaman "Get started"
   - Atau scroll ke bawah untuk menemukan linknya

2. **Atau langsung ke:** https://github.com/Lfridyans/injourneyairports/actions/workflows

### Langkah 2: Cari Workflow "Deploy to GitHub Pages"

Setelah skip setup:

1. Di tab Actions, scroll ke bawah
2. Cari workflow dengan nama: **"Deploy to GitHub Pages"**
3. Klik workflow tersebut

### Langkah 3: Trigger Workflow

1. Di halaman workflow, klik tombol **"Run workflow"** (di kanan atas)
2. Pilih branch: **main**
3. Klik tombol hijau **"Run workflow"**

### Langkah 4: Monitor Progress

1. Setelah trigger, workflow akan mulai berjalan
2. Klik workflow run yang baru (ada di list)
3. Monitor progress build:
   - ✅ Checkout
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build (butuh API key!)
   - ✅ Setup Pages
   - ✅ Upload artifact
   - ✅ Deploy to GitHub Pages

## ⚠️ PENTING: Pastikan GitHub Secret Sudah Di-setup!

Sebelum trigger workflow, **PASTIKAN**:

1. Buka: https://github.com/Lfridyans/injourneyairports/settings/secrets/actions
2. Pastikan ada secret dengan nama: **`GEMINI_API_KEY`**
3. Jika belum ada, tambahkan sekarang!

**Tanpa GitHub Secret, build akan gagal!**

## 🔗 Quick Links

- **Actions Tab:** https://github.com/Lfridyans/injourneyairports/actions
- **Workflows List:** https://github.com/Lfridyans/injourneyairports/actions/workflows
- **Workflow File:** https://github.com/Lfridyans/injourneyairports/blob/main/.github/workflows/deploy.yml
- **GitHub Secrets:** https://github.com/Lfridyans/injourneyairports/settings/secrets/actions

## 🎯 Alternatif: Akses Langsung ke Workflow

Coba akses langsung:
- https://github.com/Lfridyans/injourneyairports/actions/workflows/deploy.yml

Ini akan langsung menampilkan workflow "Deploy to GitHub Pages"!

## ⏱️ Timeline

Setelah trigger:
- **Build**: 2-4 menit
- **Deploy**: 1-2 menit
- **Total**: Sekitar 3-6 menit

Setelah workflow selesai, tunggu **1-2 menit** lagi untuk website aktif di:
**https://lfridyans.github.io/injourneyairports/**

---

**Coba akses link workflow langsung atau klik "Skip this and set up a workflow yourself"!** 🚀

