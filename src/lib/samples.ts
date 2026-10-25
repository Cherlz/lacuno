// Fictional sample cases for demonstration. Every document here is invented
// and is always labelled "Sample" in the app.

export type SampleCase = {
  key: string;
  label: string;
  description: string;
  patient: { name: string; age: string; mainComplaints: string; familyLanguage: string; doctorLanguage: string; country: string };
  documents: { fileName: string; text: string }[];
  episodes: string[];
};

const HEADER = "[SAMPLE — fictional document created for demonstration]\n";

export const SAMPLE_CASES: SampleCase[] = [
  {
    key: "sari",
    label: "Ibu Sari · Indonesian → English",
    description: "5 records across 4 specialists, in Indonesian. Family reads Indonesian; next doctor reads English.",
    patient: {
      name: "Ibu Sari (sample)",
      age: "58",
      mainComplaints: "Pusing, lemas, mudah lelah selama sekitar 3 tahun",
      familyLanguage: "id-ID",
      doctorLanguage: "en-US",
      country: "ID",
    },
    documents: [
      {
        fileName: "THT_Dr_Hendra_2023.txt",
        text: `${HEADER}KLINIK THT CONTOH — Dr. Hendra Wijaya, Sp.THT
Tgl: 14/03/2023
Pasien: Ny. Sari W., 56 th
S/ Pusing ± 6 bln, rasa melayang, kadang berputar saat bangun tidur. Telinga berdenging kiri (+) kadang.
O/ Membran timpani intak ka/ki. Dix-Hallpike: (-)? ragu-ragu. Nistagmus (-).
A/ Susp. BPPV / vertigo perifer
P/ Betahistin 3x6mg, Flunarizin 1x5mg (malam)
   Saran audiometri → kontrol 2 minggu`,
      },
      {
        fileName: "Lab_Darah_2023.txt",
        text: `${HEADER}LABORATORIUM KLINIK — Hasil Pemeriksaan
Tgl sampling: 02/09/2023   Nama: Sari Wulandari   Umur: 56 th
Hemoglobin        11.2 g/dL     (12.0 - 16.0)   L
MCV               102 fL        (80 - 100)      H
Leukosit          6.800 /uL     (4.000 - 10.000)
Trombosit         245.000 /uL   (150.000 - 400.000)
Glukosa puasa     98 mg/dL      (70 - 110)
TSH               3.1 uIU/mL    (0.4 - 4.0)
Natrium           134 mmol/L    (135 - 145)     L
Kalium            4.1 mmol/L    (3.5 - 5.0)
Kreatinin         0.8 mg/dL     (0.6 - 1.1)`,
      },
      {
        fileName: "Penyakit_Dalam_Dr_Rina_2024.txt",
        text: `${HEADER}RS CONTOH — Poli Penyakit Dalam
dr. Rina Kusuma, Sp.PD   20 Januari 2024
Keluhan: lemas, mudah lelah, pusing masih ada. Obat THT masih diminum.
TD (duduk) 148/90, N 76. Konjungtiva agak pucat.
Lab Sept 2023: Hb 11,2.
Ass: Anemia ringan; Hipertensi st. I; kelelahan
Th/: Sangobion 1x1, Amlodipin 1x5mg
Kontrol 1 bulan, cek ulang darah lengkap`,
      },
      {
        fileName: "Ortopedi_Dr_Budi_2024.txt",
        text: `${HEADER}KLINIK ORTOPEDI — dr. Budi Santoso, Sp.OT
11/06/2024
Keluhan: kaki terasa lemah, cepat capek jalan, nyeri leher/tengkuk.
Ro cervical AP/lat: spondylosis C5-C6, osteofit (+).
A/ Kelemahan tungkai ec spondylosis cervical? DD/ osteoporosis
P/ Meloxicam 1x7,5mg, Kalsium 1x500mg, fisioterapi 2x/mgg
   Saran BMD (densitometri tulang)`,
      },
      {
        fileName: "Saraf_Dr_Andi_2024_tulisan_tangan.txt",
        text: `${HEADER}(transkrip catatan tulisan tangan — beberapa bagian sulit dibaca)
dr. Andi P., Sp.N — 05/11/24
Pusing + lemas tungkai, makin berat sore hari. Kesemutan kedua kaki (+) ± 1 th.
St. neurologis: refleks patela ↓ bilateral?, sensibilitas kaki ↓ (pola kaus kaki?), Romberg (+)
DD/ neuropati perifer ; vertigo sentral ?
Rencana: MRI kepala, EMG, cek vit B12 (blm pernah)
Th/ ...[tidak terbaca]...pentin 1x100mg malam
Lanjut obat sebelumnya`,
      },
    ],
    episodes: [
      "Tadi pagi waktu bangun dari kursi, ibu pusing melayang kira-kira 2 menit, harus pegangan meja. Kaki terasa lemas sesudahnya. Tidak pingsan.",
    ],
  },
  {
    key: "rosa",
    label: "Rosa · Spanish → English",
    description: "3 records in Spanish. Family reads Spanish; next doctor reads English.",
    patient: {
      name: "Rosa (sample)",
      age: "64",
      mainComplaints: "Cansancio, dolor en las articulaciones, hormigueo en las manos desde hace 2 años",
      familyLanguage: "es-ES",
      doctorLanguage: "en-US",
      country: "US",
    },
    documents: [
      {
        fileName: "Medico_familia_2024.txt",
        text: `${HEADER}Centro de Salud de Ejemplo — Dra. Laura Gómez (Medicina Familiar)
Fecha: 08/04/2024
Paciente refiere cansancio desde hace 1 año, duerme mal, ánimo bajo. Dolor difuso en manos.
Exploración normal. PA 124/78.
Impresión: probable síndrome depresivo. ¿Fibromialgia?
Plan: sertralina 50 mg/día. Analítica general. Control 6 semanas.`,
      },
      {
        fileName: "Analitica_2024.txt",
        text: `${HEADER}LABORATORIO DE EJEMPLO — Informe de resultados   Fecha: 22/04/2024
TSH              6,8 mUI/L   (0,4 - 4,5)   ALTO
T4 libre         0,9 ng/dL   (0,8 - 1,8)
Vitamina D       14 ng/mL    (30 - 100)    BAJO
Hemoglobina      12,9 g/dL   (12 - 16)
VSG              32 mm/h     (0 - 20)      ALTO
ANA              positivo 1:160, patrón moteado`,
      },
      {
        fileName: "Reumatologia_2025.txt",
        text: `${HEADER}Hospital de Ejemplo — Servicio de Reumatología
Dr. Javier Ortiz   15/01/2025
Remitida por ANA+ y artralgias. Rigidez matutina ~30 min. Hormigueo en ambas manos, peor de noche.
EF: sin sinovitis franca. Tinel (+) muñeca derecha.
Juicio: ANA+ a títulos bajos; descartar LES vs. fibromialgia. ¿Túnel carpiano?
Plan: anti-DNA, complemento C3/C4, electromiograma. Suplemento vitamina D 2000 UI/día.`,
      },
    ],
    episodes: [],
  },
];
