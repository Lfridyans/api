# ⚡ Quick Setup GitHub Pages (2 Langkah)

## 🔴 Status: Website Masih 404

Website belum aktif karena perlu setup manual di GitHub.

## ✅ Langkah 1: Enable GitHub Pages (1 menit)

**Link langsung:** https://github.com/Lfridyans/injourneyairports/settings/pages

1. Buka link di atas
2. Di bagian **"Source"**, pilih: **"GitHub Actions"**
3. Klik **"Save"**

## ✅ Langkah 2: Setup GitHub Secret (2 menit)

**Link langsung:** https://github.com/Lfridyans/injourneyairports/settings/secrets/actions

1. Buka link di atas
2. Klik **"New repository secret"**
3. **Name**: `GEMINI_API_KEY`
4. **Secret**: Copy dari file `.env` lokal (nilai setelah `GEMINI_API_KEY=`)
5. Klik **"Add secret"**

## ⏳ Setelah Itu

1. Buka tab **Actions**: https://github.com/Lfridyans/injourneyairports/actions
2. Workflow akan otomatis jalan
3. Tunggu 2-5 menit untuk build selesai
4. Website akan tersedia di: **https://lfridyans.github.io/injourneyairports/**

## 📝 Catatan

- Workflow akan otomatis jalan setelah Langkah 1 dan 2
- Tidak perlu manual trigger jika sudah di-enable
- Tunggu beberapa menit setelah workflow selesai

---

**Cukup 2 langkah, lalu tunggu deploy selesai!** ⏰

