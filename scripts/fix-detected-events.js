import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca file JSON
const jsonPath = path.join(__dirname, '../data/predictions/predictions-20251204-024932-763-uq9x.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Periode promo: 22 Des 2025 - 10 Jan 2026
const PROMO_START = '2025-12-22';
const PROMO_END = '2026-01-10';

function isWithinPromoPeriod(dateString) {
  return dateString >= PROMO_START && dateString <= PROMO_END;
}

// Fungsi untuk membuat detectedEvent yang benar berdasarkan data
function generateCorrectEvent(prediction, isPassenger) {
  const date = prediction.date;
  const isPeakDeparture = prediction.context?.isPeakDeparture;
  const isPeakReturn = prediction.context?.isPeakReturn;
  const isHoliday = prediction.context?.isHoliday;
  const description = prediction.context?.description || '';
  const appliedScenario = prediction.appliedScenario || '';
  const currentEvent = prediction.detectedEvent || '';
  
  // Hapus referensi promo tiket jika tidak dalam periode promo
  const hasPromo = isWithinPromoPeriod(date);
  
  let event = '';
  
  // Prioritas 1: Peak dates
  if (isPeakDeparture) {
    const dayName = prediction.context?.dayName || '';
    // Untuk 20 Des, tambahkan info event JakJazz dan Lovestival
    if (date === '2025-12-20') {
      event = `Puncak Arus Keberangkatan (${dayName}). Event JakJazz dan Lovestival ID.`;
    } else {
      event = `Puncak Arus Keberangkatan (${dayName}).`;
    }
  } else if (isPeakReturn) {
    const dayName = prediction.context?.dayName || '';
    // Untuk 4 Jan, tambahkan info event Big Bang Festival
    if (date === '2026-01-04') {
      event = `Puncak Arus Balik (${dayName}). Event Big Bang Festival.`;
    } else {
      event = `Puncak Arus Balik (${dayName}).`;
    }
  }
  // Prioritas 2: Holiday dengan aktivitas rendah
  else if (isHoliday && description.includes('Natal')) {
    event = 'Hari Natal, aktivitas perjalanan cenderung rendah.';
  } else if (isHoliday && description.includes('Tahun baru')) {
    event = 'Hari Tahun Baru, aktivitas perjalanan sangat rendah.';
  }
  // Prioritas 3: Event berdasarkan scenario
  else if (appliedScenario === 'Ground Transport Competition') {
    if (date === '2025-12-22' || date === '2025-12-23') {
      event = 'Diskon tarif tol 10-20% di 26 ruas, Promo tiket KAI 30% mulai berlaku.';
    } else if (date === '2025-12-31') {
      event = 'Diskon tarif tol 10-20%, Promo tiket KAI 30%, Pergerakan rendah di malam tahun baru.';
    } else {
      event = 'Efek lanjutan Diskon tarif tol dan Promo tiket KAI.';
    }
  } else if (appliedScenario === 'Weather Disruption') {
    if (date === '2025-12-24') {
      event = 'Peringatan cuaca ekstrem BMKG (Hujan Lebat) di Jawa & Sumatra.';
    } else if (date === '2025-12-27' || date === '2025-12-28') {
      event = 'Peringatan BMKG potensi hujan sangat tinggi di Jawa, Bali, NTT, NTB.';
    } else {
      event = 'Peringatan BMKG potensi gangguan cuaca.';
    }
  } else if (appliedScenario === 'High Demand Event' || appliedScenario === 'High Demand Event + Promo') {
    if (description.includes('H+1') && date === '2025-12-26') {
      event = hasPromo 
        ? 'Cuti Bersama Natal, Libur Panjang.'
        : 'Cuti Bersama Natal, Libur Panjang.';
    } else if (description.includes('H+2') || description.includes('H+3')) {
      event = hasPromo 
        ? 'Libur akhir pekan dalam periode liburan.'
        : 'Libur akhir pekan dalam periode liburan.';
    } else if (date === '2025-12-29') {
      event = hasPromo
        ? 'Awal pergerakan arus balik dan mudik Tahun Baru.'
        : 'Awal pergerakan arus balik dan mudik Tahun Baru.';
    } else if (date === '2025-12-30') {
      event = 'Pergerakan jelang Tahun Baru.';
    } else if (date === '2026-01-02') {
      event = 'Awal Puncak Arus Balik.';
    } else {
      event = 'Peningkatan permintaan liburan.';
    }
  } else if (appliedScenario === 'Normal Operations') {
    if (date === '2025-12-18') {
      event = 'Awal periode libur Nataru, pertumbuhan volume natural.';
    } else if (date === '2025-12-19') {
      event = 'Peningkatan arus mudik H-6 Nataru.';
    } else if (date === '2025-12-25') {
      event = 'Hari Natal, aktivitas perjalanan cenderung rendah.';
    } else if (date === '2026-01-01') {
      event = 'Hari Tahun Baru, aktivitas perjalanan sangat rendah.';
    } else if (date === '2026-01-02') {
      event = 'Awal arus balik pasca Tahun Baru.';
    } else {
      event = 'Operasi normal periode liburan.';
    }
  }
  // Fallback: gunakan event yang sudah ada tapi bersihkan promo jika tidak relevan
  else {
    event = currentEvent;
    // Hapus promo tiket jika tidak dalam periode promo
    if (!hasPromo && event.includes('Promo Tiket Pesawat')) {
      event = event.replace(/,?\s*Promo Tiket Pesawat\s*\d+%\.?/g, '').trim();
      if (event.endsWith(',')) {
        event = event.slice(0, -1).trim();
      }
    }
  }
  
  return event;
}

// Proses semua predictions - pastikan PASSENGER dan FLIGHT sama untuk tanggal yang sama
console.log('🔍 Memperbaiki detectedEvent untuk semua predictions...\n');

// Group by date untuk memastikan konsistensi
const byDate = {};
data.predictions.forEach(pred => {
  if (!byDate[pred.date]) {
    byDate[pred.date] = { passenger: null, flight: null };
  }
  if (pred.requestType === 'PASSENGER') {
    byDate[pred.date].passenger = pred;
  } else {
    byDate[pred.date].flight = pred;
  }
});

// Generate event untuk setiap tanggal - GUNAKAN EVENT YANG SAMA untuk PASSENGER dan FLIGHT
let passengerCount = 0;
let flightCount = 0;

Object.keys(byDate).sort().forEach(date => {
  const { passenger, flight } = byDate[date];
  
  // Generate event berdasarkan PASSENGER (atau FLIGHT jika PASSENGER tidak ada)
  const basePrediction = passenger || flight;
  const baseEvent = generateCorrectEvent(basePrediction, !!passenger);
  
  // Apply event yang sama ke PASSENGER dan FLIGHT
  if (passenger) {
    const oldEvent = passenger.detectedEvent;
    if (oldEvent !== baseEvent) {
      console.log(`📝 [${date}] PASSENGER:`);
      console.log(`   Lama: ${oldEvent}`);
      console.log(`   Baru: ${baseEvent}\n`);
    }
    passenger.detectedEvent = baseEvent;
    passengerCount++;
  }
  
  if (flight) {
    const oldEvent = flight.detectedEvent;
    if (oldEvent !== baseEvent) {
      console.log(`📝 [${date}] FLIGHT:`);
      console.log(`   Lama: ${oldEvent}`);
      console.log(`   Baru: ${baseEvent}\n`);
    }
    flight.detectedEvent = baseEvent;
    flightCount++;
  }
});

// Simpan file yang sudah diperbaiki
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Selesai! ${passengerCount} PASSENGER dan ${flightCount} FLIGHT predictions diperbaiki.`);
console.log(`📁 File disimpan: ${jsonPath}`);

