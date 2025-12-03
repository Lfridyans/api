<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🛫 Nataru Traffic Predictor - InJourney Airports

Aplikasi prediksi lalu lintas udara (traffic) untuk periode Nataru menggunakan AI Gemini. Aplikasi ini membantu manajemen bandara dalam memprediksi jumlah penumpang dan pesawat untuk periode liburan Natal dan Tahun Baru.

## ✨ Fitur Utama

- 🤖 **AI-Powered Predictions**: Menggunakan Google Gemini 2.5 Pro untuk prediksi yang akurat
- 📊 **Batch Prediction**: Prediksi untuk periode 18 Des - 4 Jan sekaligus
- 📈 **Visualisasi Data**: Chart dan heatmap table untuk analisis
- 🗺️ **Historical Comparison**: Perbandingan dengan data historis (2019, 2021, 2022, 2023, 2024)
- 🎯 **Multiple Scenarios**: Auto Agent, High Demand Event, Weather Disruption, dll
- 📱 **Executive Report**: Laporan analisis untuk direksi
- 🎨 **Modern UI**: Interface yang clean dan user-friendly

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 atau lebih baru)
- npm atau yarn
- Google Gemini API Key

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/Lfridyans/injourneyairports.git
   cd injourneyairports
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variable (WAJIB!)**
   
   ⚠️ **PENTING**: File `.env` tidak ada di repository GitHub untuk keamanan. 
   Anda perlu membuatnya sendiri:
   
   **Opsi 1: Copy dari template**
   ```bash
   # Windows (Command Prompt)
   copy .env.example .env
   
   # Windows (PowerShell) atau Linux/Mac
   cp .env.example .env
   ```
   
   **Opsi 2: Buat manual**
   
   Buat file baru bernama `.env` di root folder (sama level dengan `package.json`), 
   kemudian isi dengan:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   **Cara mendapatkan API key:**
   - Kunjungi: https://aistudio.google.com/app/apikey
   - Login dengan akun Google Anda
   - Buat API key baru
   - Copy dan paste ke file `.env`
   
   **Tanpa file `.env`, aplikasi TIDAK akan bisa menggunakan Gemini API!**

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Aplikasi akan berjalan di: http://localhost:3000

## 📋 Teknologi yang Digunakan

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 6.2.0
- **AI Model**: Google Gemini 2.5 Pro
- **Charting**: Recharts
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 🏗️ Struktur Project

```
nataru-traffic-predictor/
├── components/          # React components
│   ├── DashboardHeader.tsx
│   ├── ChartSection.tsx
│   ├── HeatmapTable.tsx
│   └── ...
├── services/           # API services
│   ├── geminiService.ts
│   └── databaseService.ts
├── data/              # Data files
│   ├── nataruData.ts
│   ├── historicalData.ts
│   └── ...
├── scripts/           # Utility scripts
│   ├── load-env.js
│   └── ...
├── config/            # Configuration
│   └── theme.ts
├── public/            # Static assets
└── .env              # Environment variables (NOT in git)
```

## 🎯 Fitur Detail

### 1. Dashboard Header
Menampilkan statistik utama:
- Total Penumpang (Baseline 2024)
- Total Pesawat (Baseline 2024)
- Prediksi 2025
- Rate Pemulihan vs 2019
- Pertumbuhan
- Puncak Arus

### 2. Chart Section
- Visualisasi data dengan bar chart
- Perbandingan baseline vs prediksi
- Analisis komprehensif dari AI

### 3. Heatmap Table
- Tabel heatmap untuk periode 18 Des - 4 Jan
- Perbandingan data historis (2019-2024)
- Prediksi 2025
- Highlight untuk hari libur dan puncak

### 4. Executive Report
- Laporan analisis untuk direksi
- Audio narration (text-to-speech)

## 🔧 Configuration

### Environment Variables

File `.env` berisi:
```env
GEMINI_API_KEY=your_api_key_here
```

### Port

Default port: `3000`

Untuk mengubah port, edit `vite.config.ts`:
```typescript
server: {
  port: 3000,  // Ganti dengan port yang diinginkan
}
```

## 📝 Scripts Available

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security

- ✅ File `.env` sudah di-ignore oleh git (tidak akan ter-commit)
- ✅ Tidak ada hardcoded API key di source code
- ✅ Semua sensitive data menggunakan environment variables

**PENTING**: Jangan commit file `.env` yang berisi API key ke repository!

## 📚 Dokumentasi

- [API Key Setup](API_KEY_SETUP.md) - Instruksi setup API key
- [GitHub Setup](GITHUB_SETUP.md) - Panduan publish ke GitHub
- [Scripts Environment Setup](SCRIPTS_ENV_SETUP.md) - Setup env untuk scripts
- [Environment Troubleshooting](ENV_TROUBLESHOOTING.md) - Troubleshooting env vars

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **InJourney Airports Team**

## 🙏 Acknowledgments

- Google Gemini AI for the prediction model
- All contributors and testers

## 📞 Support

Untuk pertanyaan atau bantuan, silakan buat issue di GitHub repository.

---

**Made with ❤️ for InJourney Airports**
