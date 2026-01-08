
import { Room, StudentData } from './types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-1',
    name: "Rombel A - Teori Peluang",
    code: "PROB01",
    matkul: "Probabilitas",
    challenges: [
      {
        id: 'ch-1',
        title: "Kasus Dadu Standar",
        problem: "Dua dadu dilempar bersamaan. Tentukan peluang jumlah mata dadu sama dengan 8.",
        workspaceFields: [
          { id: 'f1', label: 'Eksplorasi Ruang Sampel' },
          { id: 'f2', label: 'Analisis Titik Sampel (Jumlah 8)' },
          { id: 'f3', label: 'Konstruksi Argumen Rasio' }
        ]
      },
      {
        id: 'ch-2',
        title: "Kasus Koin & Dadu",
        problem: "Satu koin dan satu dadu dilempar. Berapa peluang muncul Gambar dan angka genap?",
        workspaceFields: [
          { id: 'f1', label: 'Identifikasi Kejadian Terpisah' },
          { id: 'f2', label: 'Perhitungan Aturan Perkalian' }
        ]
      }
    ],
    questions: [
      { id: 'q1', type: 'pg', text: 'Manakah pernyataan yang paling tepat menggambarkan makna "Peluang"?', options: ['Kepastian hasil', 'Ukuran kemungkinan kejadian', 'Jumlah total sampel', 'Hasil bagi angka dadu'], correct: 'Ukuran kemungkinan kejadian' },
      { id: 'q2', type: 'boolean', text: 'Apakah mungkin probabilitas suatu kejadian bernilai 1.5?', correct: 'Salah' },
      { id: 'q3', type: 'isian', text: 'Jika peluang hujan 0.7, berapa peluang TIDAK hujan?', correct: '0.3' }
    ]
  }
];

export const MOCK_STUDENTS: StudentData[] = [
  { 
    id: 'Andi', 
    name: 'Andi', 
    group: 'Kelompok 1', 
    score: 100, 
    status: 'active', 
    challengeAnswers: {
      'ch-1': {f1: '36 total', f2: 'ada 5 pasang', f3: '5/36'}
    }, 
    factAnswers: ['Ukuran kemungkinan kejadian', 'Salah', '0.3'], 
    reflections: ['Saya sangat yakin dengan konsep peluang.'], 
    currentRoomId: 'room-1' 
  }
];
