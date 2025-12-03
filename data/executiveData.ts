
import { ExecutiveData } from '../types';

export const EXECUTIVE_DATA: ExecutiveData = {
  lastUpdated: 'Jan 6, 2025, 7:19:15 AM',
  highlightBefore: {
    period: 'Traffic Tertinggi Sebelum Natal',
    date: 'Sunday, 22 December 2024',
    hDate: 'H-3',
    flight: { value: '3,744', growth: '-4%', trend: 'down' },
    pax: { value: '561,277', growth: '+5%', trend: 'up' },
    cargo: { value: '3,986', growth: '-17%', trend: 'down' },
    cgk: { flight: '1,179', pax: '189,202', cargo: '1,555' },
    dps: { flight: '438', pax: '75,478', cargo: '188' }
  },
  highlightAfter: {
    period: 'Traffic Tertinggi Setelah Tahun Baru',
    date: 'Sunday, 5 January 2025',
    hDate: 'H+5',
    flight: { value: '3,535', growth: '+5%', trend: 'up' },
    pax: { value: '521,431', growth: '+26%', trend: 'up' },
    cargo: { value: '3,695', growth: '-16%', trend: 'down' },
    cgk: { flight: '1,122', pax: '178,548', cargo: '1,448' },
    dps: { flight: '459', pax: '77,812', cargo: '174' }
  },
  accumulation: {
    flight: { total: '66,680', growth: '4%', recovery: '85%' },
    pax: { total: '9,240,482', growth: '11%', recovery: '96%' },
    cargo: { total: '70,704', growth: '-2%', recovery: '127%' }
  },
  topAirports: [
    { name: 'CGK', value: '3,134,042' },
    { name: 'DPS', value: '1,352,837' },
    { name: 'SUB', value: '768,712' },
    { name: 'UPG', value: '532,538' },
    { name: 'KNO', value: '463,472' }
  ],
  topDestInt: [
    { name: 'SIN', value: '106,637' },
    { name: 'KUL', value: '78,841' },
    { name: 'JED', value: '51,901' },
    { name: 'HKG', value: '21,827' },
    { name: 'DOH', value: '20,492' }
  ],
  topDestDom: [
    { name: 'DPS', value: '146,354' },
    { name: 'KNO', value: '109,541' },
    { name: 'SUB', value: '71,035' },
    { name: 'UPG', value: '68,326' },
    { name: 'PLM', value: '47,098' }
  ],
  operational: {
    otp: { dom: '66%', int: '76%', all: '68%' },
    loadFactor: { dom: '80%', int: '91%', all: '82%' },
    slotUtilization: { dom: '80%', int: '93%', all: '82%' },
    routes: { dom: '827', int: '470', all: '1,297' }
  },
  extraFlight: {
    plan: '3,142',
    realization: '2,170',
    percentage: '69%'
  },
  opsCondition: {
    yesterdayRealization: { flight: '3,535', pax: '521,431' },
    todayPlan: { flight: 'null', pax: 'null' }
  },
  irregularities: {
    total: 360,
    topCause: 'Faktor Alam (Hujan Lebat)',
    details: [
      {
        daily: 'H+5 / 05-Jan',
        branch: 'CGK',
        flightNo: 'JT170',
        kronologis: 'LATE ARRIVAL',
        dampak: 'Ya',
        category: 'Faktor Airline',
        type: 'Delay'
      }
    ]
  }
};

// Based on the PDF content provided
export const PDF_STYLE_REFERENCE = `
MONITORING DATA POSKO
PT ANGKASA PURA INDONESIA
HARI Ke - 19, H-7 S.D H+5 PASCA NATARU,
Tgl. 18 Desember 2024 S.D 5 Januari 2025
EXECUTIVE REPORT
Data Korporasi :
1) Trafik tertinggi sebelum Natal terjadi pada H-3, Minggu 22 Desember 2024 (Data Fix) dengan jumlah pergerakan :
a) Pesawat 3.744 turun 4%, diatas rata-rata harian 3.707;
b) Penumpang 561.277 meningkat 5 %, diatas rata-rata 529.414;
c) Kargo 3.986 Ton turun 17%.
2) Trafik tertinggi setelah Tahun Baru terjadi pada H+5, Minggu 5 Januari 2025 (Data Fix) dengan jumlah pergerakan :
a) Pesawat 3.535 meningkat 5%;
b) Penumpang 521.431 meningkat 26 %;
c) Kargo 3.695 Ton turun 16%.
3) Total rekapitulasi selama 19 hari monitoring posko, AP Indonesia telah melayani :
a) 66.680 pesawat meningkat 4% dengan Recv. Rate 85%.
Top 5 Traffic pesawat Bandara Cabang berturut-turut : CGK, DPS, SUB, UPG dan KNO
b) 9.240.482 penumpang meningkat 11% dengan Recv. Rate 96%.
Top 5 Traffic penumpang Bandara Cabang berturut-turut : CGK, DPS, SUB, UPG dan KNO
c) 70.704 Ton Kargo turun 2% dengan Recv. Rate 127%.
Top 5 Traffic kargo Bandara Cabang berturut-turut : CGK, DJJ, UPG, SUB dan DPS
d) Top 5 Airline by Passenger berturut-turut : JT 21%, IU 14%, QG 14%, GA 11%, ID 11%
e) Top 5 Airline by Flight berturut-turut : JT 16%, QG 14%, IU 13%, ID 12%, GA 11%
f) Monitoring Capaian Indikator Operasional yang dapat disampaikan : On Time Performance 68%, Load Factor 82%, Slot Utilization 82%.
g) Penambahan penerbangan atau extra flight sebanyak 2.170 flight atau 69% dari total rencana sebanyak 3.142.
h) Data diatas terhimpun dari total 1.297 Rute yang terkoneksi atas 37 cabang bandara di lingkungan PT. Angkasa Pura Indonesia dengan proporsional : 827 Rute domestik dan 470 rute internasional.
i) Secara umum operasional dan pelayanan penerbangan dan bandara dapat berjalan dengan baik, namun demikian terdapat total 360 kondisi irregularities (0,5 % dari total penerbangan yang dilayani).
`;
