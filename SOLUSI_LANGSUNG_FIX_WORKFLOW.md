# 🔧 Solusi Langsung: Fix Workflow Error

## 🔴 Error yang Terjadi

Workflow gagal dengan error:
```
Dependencies lock file is not found in /home/runner/work/injourneyairports/injourneyairports. 
Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock
```

## ✅ Solusi: Edit Workflow di GitHub

### Langkah 1: Buka File Workflow untuk Edit

**Link langsung:** https://github.com/Lfridyans/injourneyairports/edit/main/.github/workflows/deploy.yml

1. Klik link di atas
2. File workflow akan terbuka di mode edit

### Langkah 2: Cari Baris yang Perlu Diubah

Scroll ke bagian "Install dependencies", cari baris:

```yaml
      - name: Install dependencies
        run: npm ci
```

### Langkah 3: Ubah `npm ci` Menjadi `npm install`

**Hapus baris:**
```yaml
        run: npm ci
```

**Ganti dengan:**
```yaml
        run: npm install
```

**Hasil akhir seharusnya seperti ini:**
```yaml
      - name: Install dependencies
        run: npm install
```

### Langkah 4: Commit Perubahan

1. Scroll ke bagian bawah halaman
2. Di bagian "Commit changes":
   - **Title**: `Fix workflow: use npm install instead of npm ci`
   - **Description**: (bisa dikosongkan)
3. Klik tombol hijau **"Commit changes"**

### Langkah 5: Workflow Akan Otomatis Trigger

Setelah commit:
- Workflow akan otomatis trigger (karena ada push ke main)
- Atau bisa manual trigger: Klik "Re-run jobs" → "Re-run failed jobs"

## 🎯 Hasil Setelah Fix

Workflow akan:
- ✅ Install dependencies dengan `npm install` (berhasil!)
- ✅ Build aplikasi
- ✅ Deploy ke GitHub Pages

## 📋 Perbedaan

- **`npm ci`**: Butuh package-lock.json (strict)
- **`npm install`**: Lebih fleksibel, bisa tanpa lock file

## 🔗 Quick Link

**Edit Workflow:** https://github.com/Lfridyans/injourneyairports/edit/main/.github/workflows/deploy.yml

---

**Edit workflow sekarang, ubah `npm ci` menjadi `npm install`, lalu commit!** ✏️✨

