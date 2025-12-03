# 🔑 Fix Token Permission - Workflow Scope

## 🔴 Masalah

Error saat push:
```
refusing to allow a Personal Access Token to create or update workflow `.github/workflows/deploy.yml` without `workflow` scope
```

## ✅ Solusi

Token GitHub Anda tidak memiliki scope `workflow` yang diperlukan untuk push workflow file.

### Langkah-langkah:

1. **Buka GitHub Settings:**
   - https://github.com/settings/tokens

2. **Revoke token lama** (jika masih menggunakan yang lama)

3. **Buat Personal Access Token baru:**
   - Klik "Generate new token" → "Generate new token (classic)"
   - Beri nama: `nataru-traffic-predictor`
   - **PENTING**: Centang scope berikut:
     - ✅ `repo` (full control of private repositories)
     - ✅ `workflow` (update GitHub Action workflows)
   - Klik "Generate token"
   - **SALIN TOKEN** (hanya muncul sekali!)

4. **Update remote dengan token baru:**
   ```bash
   git remote set-url origin https://YOUR_NEW_TOKEN@github.com/Lfridyans/api.git
   ```

5. **Push ulang:**
   ```bash
   git push -f origin main
   ```

## 🎯 Alternative: Push Tanpa Workflow (Temporary)

Jika tidak bisa update token sekarang, kita bisa push tanpa workflow file dulu:

```bash
# Hapus workflow dari staging
git rm --cached .github/workflows/deploy.yml

# Commit
git commit -m "Temporary: remove workflow file"

# Push
git push -f origin main

# Setelah token di-update, tambahkan workflow kembali
git add .github/workflows/deploy.yml
git commit -m "Add workflow file"
git push origin main
```

## 📝 Catatan

- Token baru harus memiliki scope `workflow` untuk push workflow files
- Scope `repo` sudah cukup untuk push file biasa
- Setelah push berhasil, hapus token dari URL remote untuk keamanan

---

**Update token dengan scope `workflow` untuk push workflow file!** 🔧

