import { getSafeEnv } from "@/env";
import { prisma, withDbTimeout } from "@/lib/prisma";

export type SubStationCode =
  | "1A"
  | "1B"
  | "1C"
  | "2A"
  | "2B"
  | "2C"
  | "3A"
  | "3B"
  | "3C";

export type PsychologySubCategoryLiteral =
  | "EDUKASI_MENTAL"
  | "STRESS_BURNOUT"
  | "MOTIVASI_PRODUKTIF";

export type VoiceSubmissionTypeLiteral = "COMPLAINT" | "CRITIQUE_SUGGESTION";

export type ReviewStatusLiteral =
  | "PENDING"
  | "UNDER_REVIEW"
  | "ACKNOWLEDGED"
  | "RESOLVED";

export interface SerializedPsychologyArticle {
  id: string;
  title: string;
  slug: string;
  subCategory: PsychologySubCategoryLiteral;
  summary: string;
  content: string;
  actionTips: string[];
  readMinutes: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedEmployeeVoiceEntry {
  id: string;
  receiptCode: string;
  type: VoiceSubmissionTypeLiteral;
  categoryTag: string;
  message: string;
  isPublicOnWall: boolean;
  status: ReviewStatusLiteral;
  adminResponse: string | null;
  upvotes: number;
  createdAt: string;
  reviewedAt: string | null;
}

export interface SerializedWorkComfortPulse {
  id: string;
  overallComfort: number;
  workloadBalance: number;
  psychologicalSafety: number;
  teamSupport: number;
  departmentTag: string;
  environmentNote: string | null;
  createdAt: string;
}

export type PsychologyArticleItem = SerializedPsychologyArticle;
export type EmployeeVoiceEntryItem = SerializedEmployeeVoiceEntry;
export type WorkComfortPulseItem = SerializedWorkComfortPulse;

export const INITIAL_PSYCHOLOGY_ARTICLES: SerializedPsychologyArticle[] = [
  // 1A: EDUKASI_MENTAL
  {
    id: "psy-1a-1",
    title: "Memahami Keamanan Psikologis & Kesehatan Mental di Lingkungan Kerja",
    slug: "keamanan-psikologis-kesehatan-mental-kerja",
    subCategory: "EDUKASI_MENTAL",
    summary:
      "Panduan dasar mengenali tanda-tanda kelelahan emosional serta membangun budaya kerja yang aman secara psikologis tanpa rasa takut dihakimi.",
    content: [
      "Kesehatan mental di tempat kerja bukan sekadar ketiadaan stres, melainkan kemampuan tim untuk berkolaborasi dengan rasa aman, dihargai, dan memiliki ruang pemulihan kognitif yang sehat.",
      "Keamanan psikologis (psychological safety) memungkinkan setiap karyawan menyampaikan ide, mengakui kesalahan teknis, atau meminta bantuan kapasitas kerja tanpa takut dipermalukan.",
      "Langkah kecil seperti menghormati jam istirahat, melakukan check-in emosi secara jujur, dan memisahkan identitas diri dari tekanan pekerjaan membantu menjaga ketahanan mental jangka panjang.",
    ].join("\n\n"),
    actionTips: [
      "Lakukan jeda mikro 3 menit setiap menyelesaikan satu rapat intensif.",
      "Gunakan bahasa empatik saat menanyakan kapasitas rekan satu tim.",
      "Tetapkan batas waktu notifikasi kerja setelah jam operasional selesai.",
    ],
    readMinutes: 4,
    published: true,
    createdAt: "2026-11-10T08:00:00.000Z",
    updatedAt: "2026-11-10T08:00:00.000Z",
  },
  {
    id: "psy-1a-2",
    title: "Mengenali Sinyal Dini Kelelahan Kognitif Sebelum Menjadi Krisis",
    slug: "sinyal-dini-kelelahan-kognitif-kerja",
    subCategory: "EDUKASI_MENTAL",
    summary:
      "Pelajari perbedaan antara kelelahan kerja biasa yang pulih dengan tidur dan kelelahan emosional kronis yang membutuhkan penyesuaian beban.",
    content: [
      "Tubuh dan pikiran selalu mengirimkan sinyal peringatan berminggu-minggu sebelum kelelahan berat terjadi: mulai dari sulit berkonsentrasi pada tugas sederhana, sinisme terhadap pekerjaan, hingga gangguan kualitas tidur.",
      "Dalam psikologi organisasi, mengabaikan sinyal awal ini membuat sistem saraf simpatik terus berada dalam mode siaga tinggi (fight-or-flight) sepanjang hari kerja.",
      "Kenali ambang kapasitas harian Anda dan jadwalkan ritual transisi sore hari agar otak dapat benar-benar beristirahat saat kembali ke rumah.",
    ].join("\n\n"),
    actionTips: [
      "Catat 3 pemicu penguras energi terbesar Anda selama seminggu terakhir.",
      "Berikan ruang transisi 15 menit tanpa layar sebelum menutup hari kerja.",
      "Diskusikan prioritas ulang tugas lebih awal sebelum tenggat menumpuk.",
    ],
    readMinutes: 5,
    published: true,
    createdAt: "2026-11-11T09:00:00.000Z",
    updatedAt: "2026-11-11T09:00:00.000Z",
  },

  // 1B: STRESS_BURNOUT
  {
    id: "psy-1b-1",
    title: "Mengurai Burnout Kronis & Resolusi Konflik Antar-Tim Secara Sehat",
    slug: "mengurai-burnout-dan-resolusi-konflik-kerja",
    subCategory: "STRESS_BURNOUT",
    summary:
      "Kerangka praktis mengatasi gesekan komunikasi lintas divisi dan memulihkan energi saat menghadapi tekanan proyek beruntun.",
    content: [
      "Burnout sering kali diperparah oleh konflik peran yang ambigu dan ekspektasi lintas tim yang tidak selaras. Ketika dua tim memiliki prioritas berbeda, gesekan sering terasa personal padahal akarnya adalah struktur proses.",
      "Gunakan teknik komunikasi non-konfrontatif (Nonviolent Communication): fokus pada observasi objektif, dampak terhadap kapasitas kerja, dan usulan solusi konkret yang adil bagi kedua pihak.",
      "Saat tekanan memuncak, pisahkan masalah sistemik dari kesalahan individu, dan gunakan kesepakatan tertulis yang jelas untuk mencegah kesalahpahaman berulang.",
    ].join("\n\n"),
    actionTips: [
      "Gunakan kalimat 'Saya melihat risiko kapasitas pada...' alih-alih menyalahkan individu.",
      "Tawarkan opsi trade-off: 'Kita bisa menyelesaikan A hari Kamis, atau mendahulukan B.'",
      "Ambil jeda napas 60 detik sebelum membalas pesan kerja yang memicu emosi.",
    ],
    readMinutes: 5,
    published: true,
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
  },
  {
    id: "psy-1b-2",
    title: "De-Eskalasi Ketegangan & Pemulihan Pasca-Sprint Intensitas Tinggi",
    slug: "de-eskalasi-ketegangan-pasca-sprint",
    subCategory: "STRESS_BURNOUT",
    summary:
      "Protokol pemulihan sistem saraf dan evaluasi beban kerja yang jujur setelah melewati fase rilis atau tenggat kritis.",
    content: [
      "Setelah menyelesaikan proyek bertekanan tinggi, banyak tim langsung melompat ke target berikutnya tanpa fase dekompresi. Akibatnya, utang kelelahan (fatigue debt) terakumulasi dari bulan ke bulan.",
      "Sesi retrospektif yang sehat harus mengevaluasi keberlanjutan ritme kerja, bukan hanya kecepatan pengiriman fitur.",
      "Berikan ruang bagi anggota tim untuk menyampaikan hambatan secara terbuka dan jadwalkan blok kerja berintensitas rendah pasca-rilis besar.",
    ].join("\n\n"),
    actionTips: [
      "Jadwalkan setengah hari tanpa rapat (No-Meeting Block) pasca-tenggat besar.",
      "Evaluasi proses kerja yang memicu lembur berulang dalam retrospektif tim.",
      "Prioritaskan tidur berkualitas dan hidrasi selama fase pemulihan.",
    ],
    readMinutes: 4,
    published: true,
    createdAt: "2026-11-13T11:00:00.000Z",
    updatedAt: "2026-11-13T11:00:00.000Z",
  },

  // 1C: MOTIVASI_PRODUKTIF
  {
    id: "psy-1c-1",
    title: "Ritme Ultradian 90-Menit untuk Fokus Mendalam Tanpa Kelelahan",
    slug: "ritme-ultradian-90-menit-fokus-mendalam",
    subCategory: "MOTIVASI_PRODUKTIF",
    summary:
      "Selaraskan jadwal kerja analitis dengan siklus biologis otak 90 menit untuk menghasilkan karya berkualitas tinggi tanpa menguras energi.",
    content: [
      "Otak manusia tidak dirancang untuk mempertahankan fokus linear selama 8 jam berturut-turut. Secara biologis, kewaspadaan kita bergerak dalam gelombang ultradian: sekitar 90 menit fokus puncak diikuti oleh 15–20 menit penurunan energi alami.",
      "Memaksakan diri melewati fase penurunan dengan kafein berlebih justru meningkatkan tingkat kesalahan dan mempercepat kejenuhan.",
      "Kelompokkan pekerjaan yang membutuhkan konsentrasi tinggi pada pagi hari dalam blok 90 menit bebas distraksi, lalu gunakan waktu sore untuk tugas administratif yang lebih ringan.",
    ].join("\n\n"),
    actionTips: [
      "Matikan seluruh notifikasi chat selama 1 blok fokus mendalam (60–90 menit).",
      "Ambil istirahat penuh tanpa layar selama 15 menit setelah satu siklus selesai.",
      "Selesaikan 1 tugas paling bermakna di pagi hari sebelum membuka kotak masuk.",
    ],
    readMinutes: 4,
    published: true,
    createdAt: "2026-11-14T08:30:00.000Z",
    updatedAt: "2026-11-14T08:30:00.000Z",
  },
  {
    id: "psy-1c-2",
    title: "Metode Micro-Stepping & Ritual Penutup Kerja Bebas Attention Residue",
    slug: "metode-micro-stepping-ritual-penutup-kerja",
    subCategory: "MOTIVASI_PRODUKTIF",
    summary:
      "Atasi penundaan (prokrastinasi) akibat tugas yang terasa terlalu besar dan bersihkan residu perhatian di akhir jam kerja.",
    content: [
      "Penundaan sering kali bukan disebabkan oleh kemalasan, melainkan respons kecemasan otak terhadap tugas yang tampak terlalu kompleks atau belum terdefinisi dengan jelas.",
      "Dengan memecah proyek besar menjadi langkah mikro berdurasi 15 menit (micro-stepping), hambatan memulai turun drastis dan momentum motivasi terbangun secara alami.",
      "Di akhir hari kerja, tuliskan satu langkah pertama untuk esok pagi di atas kertas agar memori kerja Anda berhenti memikirkan tugas yang belum selesai saat malam hari.",
    ].join("\n\n"),
    actionTips: [
      "Pecah tugas besar menjadi langkah mikro pertama yang bisa selesai dalam 15 menit.",
      "Batasi daftar prioritas utama harian maksimal 3 item inti (Rule of Three).",
      "Tulis catatan 'Langkah Pertama Besok Pagi' sebelum menutup laptop.",
    ],
    readMinutes: 3,
    published: true,
    createdAt: "2026-11-15T09:30:00.000Z",
    updatedAt: "2026-11-15T09:30:00.000Z",
  },
];

export const INITIAL_EMPLOYEE_VOICE_ENTRIES: SerializedEmployeeVoiceEntry[] = [
  {
    id: "ev-3a-1",
    receiptCode: "SV-4829",
    type: "COMPLAINT",
    categoryTag: "Beban Kerja",
    message:
      "Pengiriman pesan tugas mendadak di luar jam kerja setelah pukul 20.00 pada grup [Tim Proyek] membuat anggota tim sulit beristirahat dengan tenang tanpa rasa cemas.",
    isPublicOnWall: true,
    status: "UNDER_REVIEW",
    adminResponse:
      "Terima kasih atas laporan anonim ini. Tim People Ops sedang menyusun kebijakan Quiet Hours (tanpa ping non-darurat setelah pukul 18.00) bersama para Lead.",
    upvotes: 18,
    createdAt: "2026-11-14T10:15:00.000Z",
    reviewedAt: "2026-11-15T14:00:00.000Z",
  },
  {
    id: "ev-3a-2",
    receiptCode: "SV-3194",
    type: "COMPLAINT",
    categoryTag: "Komunikasi",
    message:
      "Perubahan spesifikasi mendadak di tengah sprint tanpa penyesuaian tenggat waktu menyebabkan beban lembur berulang pada [Divisi Teknis].",
    isPublicOnWall: true,
    status: "ACKNOWLEDGED",
    adminResponse:
      "Sudah dicatat oleh komite Ombudsman. Mulai sprint depan, setiap penambahan scope wajib disertai pengurangan tiket setara atau perpanjangan timeline.",
    upvotes: 14,
    createdAt: "2026-11-15T11:30:00.000Z",
    reviewedAt: "2026-11-16T09:20:00.000Z",
  },
  {
    id: "ev-3b-1",
    receiptCode: "SV-7052",
    type: "CRITIQUE_SUGGESTION",
    categoryTag: "Budaya Kerja",
    message:
      "Saran: Mengadakan blok 'Rabu Tanpa Rapat Internal' (No-Meeting Wednesday) selama 4 jam agar seluruh tim memiliki ruang fokus mendalam tanpa interupsi.",
    isPublicOnWall: true,
    status: "RESOLVED",
    adminResponse:
      "Usulan disetujui! Mulai pekan ini setiap Rabu pukul 09.00–13.00 ditetapkan sebagai Focus Block bebas rapat internal.",
    upvotes: 27,
    createdAt: "2026-11-13T09:00:00.000Z",
    reviewedAt: "2026-11-14T16:30:00.000Z",
  },
  {
    id: "ev-3b-2",
    receiptCode: "SV-6218",
    type: "CRITIQUE_SUGGESTION",
    categoryTag: "Fasilitas",
    message:
      "Menambahkan bilik hening (quiet pod) dan pencahayaan hangat di area ruang istirahat akan sangat membantu karyawan melakukan relaksasi singkat di siang hari.",
    isPublicOnWall: true,
    status: "ACKNOWLEDGED",
    adminResponse:
      "Tim Fasilitas telah memasukkan pengadaan 2 Quiet Focus Pod dan lampu warm-white ke anggaran kuartal ini.",
    upvotes: 15,
    createdAt: "2026-11-16T13:45:00.000Z",
    reviewedAt: "2026-11-17T10:00:00.000Z",
  },
];

export const INITIAL_WORK_COMFORT_PULSES: SerializedWorkComfortPulse[] = [
  {
    id: "wcp-1",
    overallComfort: 4,
    workloadBalance: 3,
    psychologicalSafety: 4,
    teamSupport: 5,
    departmentTag: "Engineering",
    environmentNote:
      "Dukungan rekan setim sangat baik, namun jadwal rapat lintas divisi masih cukup padat di awal pekan.",
    createdAt: "2026-11-15T09:00:00.000Z",
  },
  {
    id: "wcp-2",
    overallComfort: 4,
    workloadBalance: 4,
    psychologicalSafety: 5,
    teamSupport: 4,
    departmentTag: "Product & Design",
    environmentNote:
      "Budaya diskusi terbuka semakin nyaman dan blok fokus pagi sangat membantu produktivitas.",
    createdAt: "2026-11-16T10:30:00.000Z",
  },
  {
    id: "wcp-3",
    overallComfort: 3,
    workloadBalance: 3,
    psychologicalSafety: 4,
    teamSupport: 4,
    departmentTag: "Operasional",
    environmentNote:
      "Perlu sinkronisasi prioritas lebih awal saat pergantian shift proyek bulanan.",
    createdAt: "2026-11-17T11:15:00.000Z",
  },
];

let seedAttempted = false;

export interface RuntimeSanctuaryStore {
  psychologyArticles: SerializedPsychologyArticle[];
  voiceEntries: SerializedEmployeeVoiceEntry[];
  comfortPulses: SerializedWorkComfortPulse[];
}

const globalForStore = globalThis as unknown as {
  sanctuaryStore: RuntimeSanctuaryStore | undefined;
};

export function getRuntimeSanctuaryStore(): RuntimeSanctuaryStore {
  if (!globalForStore.sanctuaryStore) {
    globalForStore.sanctuaryStore = {
      psychologyArticles: [...INITIAL_PSYCHOLOGY_ARTICLES],
      voiceEntries: [...INITIAL_EMPLOYEE_VOICE_ENTRIES],
      comfortPulses: [...INITIAL_WORK_COMFORT_PULSES],
    };
  }
  return globalForStore.sanctuaryStore;
}

export function generateReceiptCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SV-${num}`;
}

/**
 * Automatically populates initial Bahasa Indonesia records into Supabase if tables are empty.
 * Non-blocking and safe when offline.
 */
export async function ensureSanctuarySeeded(): Promise<void> {
  if (seedAttempted) return;
  const env = getSafeEnv();
  if (!env.hasDatabase) return;
  seedAttempted = true;

  try {
    await withDbTimeout(
      (async () => {
        const [articleCount, voiceCount, pulseCount] = await Promise.all([
          prisma.psychologyArticle.count(),
          prisma.employeeVoiceEntry.count(),
          prisma.workComfortPulse.count(),
        ]);

        if (articleCount === 0) {
          await prisma.psychologyArticle.createMany({
            data: INITIAL_PSYCHOLOGY_ARTICLES.map((a) => ({
              title: a.title,
              slug: a.slug,
              subCategory: a.subCategory,
              summary: a.summary,
              content: a.content,
              actionTips: a.actionTips,
              readMinutes: a.readMinutes,
              published: a.published,
            })),
            skipDuplicates: true,
          });
        }

        if (voiceCount === 0) {
          await prisma.employeeVoiceEntry.createMany({
            data: INITIAL_EMPLOYEE_VOICE_ENTRIES.map((v) => ({
              receiptCode: v.receiptCode,
              type: v.type,
              categoryTag: v.categoryTag,
              message: v.message,
              isPublicOnWall: v.isPublicOnWall,
              status: v.status,
              adminResponse: v.adminResponse,
              upvotes: v.upvotes,
              reviewedAt: v.reviewedAt ? new Date(v.reviewedAt) : null,
            })),
            skipDuplicates: true,
          });
        }

        if (pulseCount === 0) {
          await prisma.workComfortPulse.createMany({
            data: INITIAL_WORK_COMFORT_PULSES.map((p) => ({
              overallComfort: p.overallComfort,
              workloadBalance: p.workloadBalance,
              psychologicalSafety: p.psychologicalSafety,
              teamSupport: p.teamSupport,
              departmentTag: p.departmentTag,
              environmentNote: p.environmentNote,
            })),
          });
        }
      })(),
      3200
    );
  } catch {
    // Allow fallback data to serve seamlessly if remote DB is unreachable
  }
}
