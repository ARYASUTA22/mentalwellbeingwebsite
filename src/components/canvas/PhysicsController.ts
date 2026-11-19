import type { SubStationCode } from "@/lib/seed";

export type ZoneId = "psychology" | "self-care" | "employee-voice";
export type FacingDirection = "down" | "left" | "right" | "up";

export type WorldPropAnimationKind =
  | "tree"
  | "lantern"
  | "static"
  | "fountain";

export interface WorldBuildingSprite {
  id: ZoneId;
  title: string;
  defaultStationCode: SubStationCode;
  /** Column index in buildings-sprites.png (0 = Library, 1 = Greenhouse, 2 = Treehouse) */
  sheetCol: number;
  /** Bottom-center X/Y anchor on the 2400x1350 floor map */
  x: number;
  y: number;
  /** Rendered width and height in world space */
  drawWidth: number;
  drawHeight: number;
  /** Y-sort baseline */
  footY: number;
  /** Ground oval shadow radii underneath the building base */
  shadowRx: number;
  shadowRy: number;
}

export interface FeatureSubStation {
  code: SubStationCode;
  zoneId: ZoneId;
  title: string;
  shortLabel: string;
  subtitle: string;
  /** Row index in feature-stations.png (0..2) */
  sheetRow: number;
  /** Column index in feature-stations.png (0..2) */
  sheetCol: number;
  /** Bottom-center X/Y anchor on the 2400x1350 floor map */
  x: number;
  y: number;
  /** Rendered dimensions in world space */
  drawWidth: number;
  drawHeight: number;
  /** Y-sort baseline */
  footY: number;
  /** Walk-up / fast-travel coordinates */
  approachX: number;
  approachY: number;
  /** Ground collision ellipse radii */
  colliderRx: number;
  colliderRy: number;
  /** Proximity detection radius */
  promptRadius: number;
}

export interface WorldForegroundProp {
  id: string;
  label: string;
  /** Row in garden-structures.png / nature-details.png (0 or 1) */
  sheetRow: number;
  /** Column in garden-structures.png / nature-details.png (0..3) */
  sheetCol: number;
  /** Ground-anchor (bottom-center) coordinates on the 2400x1350 map */
  x: number;
  y: number;
  /** Rendered width/height in world space */
  drawWidth: number;
  drawHeight: number;
  /** Y-sort baseline */
  footY: number;
  /** Ground collision ellipse radii */
  colliderRx: number;
  colliderRy: number;
  animKind: WorldPropAnimationKind;
  phase: number;
}

export interface NpcDialogueChoice {
  id: string;
  label: string;
  reply: string;
  actionLabel?: string;
  targetStationCode?: SubStationCode;
}

export interface ZoneStation {
  id: ZoneId;
  defaultStationCode: SubStationCode;
  title: string;
  shortLabel: string;
  npcName: string;
  npcRole: string;
  npcSpeech: string;
  npcGreeting: string;
  npcChoices: NpcDialogueChoice[];
  npcDefaultFacing: FacingDirection;
  /** Ground-anchor (foot center) coordinates for the NPC on the 2400x1350 map */
  npcX: number;
  npcY: number;
  /** Center X/Y of the station's visual core on the 2400x1350 map */
  x: number;
  y: number;
  /** Floating building nameplate coordinates */
  promptX: number;
  promptY: number;
  /** Bounding dimensions */
  width: number;
  height: number;
  /** Walk-up / fast-travel coordinates */
  approachX: number;
  approachY: number;
  /** Proximity detection radius */
  promptRadius: number;
}

export interface PolygonCollider {
  id: string;
  points: Array<[number, number]>;
}

export interface EllipseCollider {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: FacingDirection;
  clickTarget: { x: number; y: number } | null;
}

export interface PhysicsInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  locked: boolean;
}

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1350;
export const WORLD_PADDING = 44;

export const SPRITE_FRAME_W = 92;
export const SPRITE_FRAME_H = 92;

export const PLAYER_ACCEL = 0.72;
export const PLAYER_FRICTION = 0.84;
export const PLAYER_MAX_SPEED = 4.2;
export const PLAYER_FOOT_RX = 17;
export const PLAYER_FOOT_RY = 10;
export const NPC_FOOT_RX = 20;
export const NPC_FOOT_RY = 12;

/**
 * 3 Modular Y-Sorted Building Sprites from /assets/buildings-sprites.png (1 row x 3 cols):
 */
export const WORLD_BUILDINGS: WorldBuildingSprite[] = [
  {
    id: "psychology",
    title: "Cozy Library Nook",
    defaultStationCode: "1A",
    sheetCol: 0,
    x: 535,
    y: 655,
    drawWidth: 620,
    drawHeight: 620,
    footY: 510,
    shadowRx: 255,
    shadowRy: 95,
  },
  {
    id: "self-care",
    title: "Zen Greenhouse Patio",
    defaultStationCode: "2A",
    sheetCol: 1,
    x: 2025,
    y: 550,
    drawWidth: 540,
    drawHeight: 540,
    footY: 465,
    shadowRx: 245,
    shadowRy: 92,
  },
  {
    id: "employee-voice",
    title: "Treehouse Post Office",
    defaultStationCode: "3A",
    sheetCol: 2,
    x: 1385,
    y: 1335,
    drawWidth: 680,
    drawHeight: 680,
    footY: 1170,
    shadowRx: 235,
    shadowRy: 88,
  },
];

/**
 * 9 Interactive Sub-Feature Stations sliced from /assets/feature-stations.png (3 rows x 3 cols):
 * Each station opens its own strictly isolated modal (1A, 1B, 1C, 2A, 2B, 2C, 3A, 3B, 3C).
 */
export const FEATURE_STATIONS: FeatureSubStation[] = [
  // ZONE 1: PSYCHOLOGY CORNER (Row 0 of feature-stations.png)
  {
    code: "1A",
    zoneId: "psychology",
    title: "1A · Edukasi Kesehatan Mental",
    shortLabel: "1A Edukasi Mental",
    subtitle: "Buku Panduan Keamanan Psikologis & Literasi Mental Kerja",
    sheetRow: 0,
    sheetCol: 0,
    x: 235,
    y: 645,
    drawWidth: 148,
    drawHeight: 148,
    footY: 630,
    approachX: 235,
    approachY: 705,
    colliderRx: 44,
    colliderRy: 22,
    promptRadius: 155,
  },
  {
    code: "1B",
    zoneId: "psychology",
    title: "1B · Stres, Burnout & Konflik",
    shortLabel: "1B Stres & Burnout",
    subtitle: "Rak Apotek & Panduan Resolusi Konflik Kerja",
    sheetRow: 0,
    sheetCol: 1,
    x: 410,
    y: 740,
    drawWidth: 154,
    drawHeight: 154,
    footY: 725,
    approachX: 410,
    approachY: 800,
    colliderRx: 46,
    colliderRy: 24,
    promptRadius: 155,
  },
  {
    code: "1C",
    zoneId: "psychology",
    title: "1C · Motivasi & Produktivitas",
    shortLabel: "1C Motivasi & Fokus",
    subtitle: "Papan Strategi Ritme Ultradian & Micro-Stepping",
    sheetRow: 0,
    sheetCol: 2,
    x: 795,
    y: 550,
    drawWidth: 152,
    drawHeight: 152,
    footY: 535,
    approachX: 795,
    approachY: 615,
    colliderRx: 46,
    colliderRy: 22,
    promptRadius: 155,
  },

  // ZONE 2: SELF-CARE CORNER (Row 1 of feature-stations.png)
  {
    code: "2A",
    zoneId: "self-care",
    title: "2A · Pernapasan Lotus 4-7-8",
    shortLabel: "2A Napas Lotus",
    subtitle: "Matras Meditasi Teratai & Relaksasi Otot Terpandu",
    sheetRow: 1,
    sheetCol: 0,
    x: 1720,
    y: 565,
    drawWidth: 152,
    drawHeight: 152,
    footY: 550,
    approachX: 1685,
    approachY: 625,
    colliderRx: 44,
    colliderRy: 22,
    promptRadius: 155,
  },
  {
    code: "2B",
    zoneId: "self-care",
    title: "2B · Roda Regulasi Emosi",
    shortLabel: "2B Roda Emosi",
    subtitle: "Asesmen Emosi Harian & Rekomendasi Grounding AI",
    sheetRow: 1,
    sheetCol: 1,
    x: 1605,
    y: 430,
    drawWidth: 154,
    drawHeight: 154,
    footY: 415,
    approachX: 1605,
    approachY: 495,
    colliderRx: 46,
    colliderRy: 24,
    promptRadius: 155,
  },
  {
    code: "2C",
    zoneId: "self-care",
    title: "2C · Ritual Teh & Kebiasaan Mikro",
    shortLabel: "2C Ritual & Quest",
    subtitle: "Baki Teh Bonsai & Daftar Kebiasaan Self-Care Harian",
    sheetRow: 1,
    sheetCol: 2,
    x: 1895,
    y: 660,
    drawWidth: 152,
    drawHeight: 152,
    footY: 645,
    approachX: 1855,
    approachY: 720,
    colliderRx: 46,
    colliderRy: 22,
    promptRadius: 155,
  },

  // ZONE 3: EMPLOYEE VOICE (Row 2 of feature-stations.png)
  {
    code: "3A",
    zoneId: "employee-voice",
    title: "3A · Kotak Keluhan Anonim",
    shortLabel: "3A Keluhan Anonim",
    subtitle: "Formulir Keluhan Terenkripsi AI & Lacak Kode Resi (SV-XXXX)",
    sheetRow: 2,
    sheetCol: 0,
    x: 1095,
    y: 1255,
    drawWidth: 152,
    drawHeight: 152,
    footY: 1240,
    approachX: 1095,
    approachY: 1310,
    colliderRx: 40,
    colliderRy: 22,
    promptRadius: 155,
  },
  {
    code: "3B",
    zoneId: "employee-voice",
    title: "3B · Papan Kritik & Saran",
    shortLabel: "3B Kritik & Saran",
    subtitle: "Kartu Pos Aspirasi Konstruktif & Dinding Suara Publik",
    sheetRow: 2,
    sheetCol: 1,
    x: 1675,
    y: 1285,
    drawWidth: 158,
    drawHeight: 158,
    footY: 1270,
    approachX: 1675,
    approachY: 1325,
    colliderRx: 48,
    colliderRy: 24,
    promptRadius: 155,
  },
  {
    code: "3C",
    zoneId: "employee-voice",
    title: "3C · Evaluasi Kenyamanan Kerja",
    shortLabel: "3C Kenyamanan Kerja",
    subtitle: "Survei 5 Ekspresi Kenyamanan Lingkungan Kerja & Skor Divisi",
    sheetRow: 2,
    sheetCol: 2,
    x: 1885,
    y: 1205,
    drawWidth: 156,
    drawHeight: 156,
    footY: 1190,
    approachX: 1885,
    approachY: 1265,
    colliderRx: 48,
    colliderRy: 24,
    promptRadius: 155,
  },
];

/**
 * 3 Zone Guide NPCs from /assets/zone-npcs.png (4x4 directional sheet):
 */
export const ZONE_STATIONS: ZoneStation[] = [
  {
    id: "psychology",
    defaultStationCode: "1A",
    title: "Cozy Library Nook",
    shortLabel: "Library Nook",
    npcName: "Dr. Maya Lin",
    npcRole: "Psikolog Kerja",
    npcSpeech:
      "Halo! Tekan [E] atau klik saya untuk mengobrol seputar psikologi kerja.",
    npcGreeting:
      "Halo! Saya Dr. Maya Lin, Psikolog Kerja di Cozy Library Nook. Ada topik kesehatan mental, kelelahan kerja, atau fokus yang ingin kamu diskusikan hari ini?",
    npcChoices: [
      {
        id: "psych-1a",
        label: "Apa itu keamanan psikologis & kesehatan mental di tempat kerja?",
        reply:
          "Keamanan psikologis berarti kamu bisa bertanya, menyampaikan ide, atau meminta bantuan kapasitas kerja tanpa takut dihakimi. Di Pos 1A, saya sudah menyiapkan buku panduan lengkap tentang literasi kesehatan mental kerja dan cara mengenali batas emosional sejak dini.",
        actionLabel: "Buka Pos 1A · Edukasi Kesehatan Mental",
        targetStationCode: "1A",
      },
      {
        id: "psych-1b",
        label: "Saya merasa kewalahan, burnout, atau mengalami gesekan di tim.",
        reply:
          "Perasaan kewalahan itu sinyal biologis yang valid, bukan kelemahan. Saat beban kognitif menumpuk atau komunikasi menegang, kamu butuh protokol pemulihan terstruktur dan skrip komunikasi asertif yang tenang. Mari kita lihat rak pemulihan di Pos 1B.",
        actionLabel: "Buka Pos 1B · Stres, Burnout & Konflik",
        targetStationCode: "1B",
      },
      {
        id: "psych-1c",
        label: "Bagaimana cara menjaga fokus dan motivasi tanpa menguras energi?",
        reply:
          "Kuncinya adalah bekerja mengikuti ritme ultradian (fokus mendalam 25–50 menit diikuti jeda pemulihan nyata) serta teknik micro-stepping. Di Pos 1C tersedia papan strategi fokus lengkap dengan pengatur waktu Pomodoro 25:00.",
        actionLabel: "Buka Pos 1C · Motivasi & Produktivitas",
        targetStationCode: "1C",
      },
      {
        id: "psych-tip",
        label: "Punya satu tips psikologi singkat sebelum saya lanjut berkeliling?",
        reply:
          "Tentu: pisahkan identitas dirimu dari daftar tugas hari ini. Setiap kali berpindah dari satu rapat ke tugas berikutnya, ambil jeda 60 detik tanpa layar agar 'residu perhatian' di otakmu bersih kembali.",
      },
    ],
    npcDefaultFacing: "down",
    npcX: 590,
    npcY: 690,
    x: 535,
    y: 425,
    promptX: 535,
    promptY: 135,
    width: 580,
    height: 440,
    approachX: 735,
    approachY: 575,
    promptRadius: 145,
  },
  {
    id: "self-care",
    defaultStationCode: "2A",
    title: "Zen Greenhouse Patio",
    shortLabel: "Zen Greenhouse",
    npcName: "Sora Takahashi",
    npcRole: "Fasilitator Self-Care",
    npcSpeech:
      "Mari rehat sejenak! Tekan [E] atau klik saya untuk memilih latihan self-care.",
    npcGreeting:
      "Selamat datang di Zen Greenhouse Patio! Saya Sora Takahashi. Udara di sini tenang dan bebas dari dering notifikasi. Apa yang paling dibutuhkan tubuh dan pikiranmu saat ini?",
    npcChoices: [
      {
        id: "self-2a",
        label: "Detak jantung dan pikiran saya terasa cepat, butuh relaksasi napas.",
        reply:
          "Saat sistem saraf simpatik terlalu aktif, pernapasan ritmis 0.25Hz atau pola 4-7-8 pada bantalan teratai akan mengaktifkan saraf vagus dan menurunkan ketegangan otot hanya dalam beberapa siklus.",
        actionLabel: "Mulai Pos 2A · Pernapasan Lotus 4-7-8",
        targetStationCode: "2A",
      },
      {
        id: "self-2b",
        label: "Saya ingin mengecek kondisi emosi & mendapat saran regulasi diri.",
        reply:
          "Menamai emosi secara spesifik adalah langkah pertama untuk menjinakkannya. Dengan Roda Regulasi Emosi di Pos 2B, kamu bisa memetakan suasana hati dan tingkat stres untuk mendapatkan langkah grounding yang dipersonalisasi.",
        actionLabel: "Putar Pos 2B · Roda Regulasi Emosi",
        targetStationCode: "2B",
      },
      {
        id: "self-2c",
        label: "Saya ingin membangun kebiasaan self-care kecil & mengumpulkan XP.",
        reply:
          "Pemulihan terbaik datang dari ritual mikro yang konsisten—seperti peregangan leher, minum air hangat, atau jeda mata 20-20-20. Di Pos 2C kamu bisa menyelesaikan misi harian dan meningkatkan Calm Level-mu!",
        actionLabel: "Lihat Pos 2C · Ritual Teh & Kebiasaan Mikro",
        targetStationCode: "2C",
      },
      {
        id: "self-tip",
        label: "Boleh minta panduan grounding 10 detik di tempat saya berdiri?",
        reply:
          "Mari lakukan bersama: turunkan bahumu menjauh dari telinga, lepaskan katupan rahangmu, lalu tarik napas perlahan lewat hidung sambil memperhatikan suara gemericik kolam koi di sebelah timur.",
      },
    ],
    npcDefaultFacing: "down",
    npcX: 1495,
    npcY: 555,
    x: 2025,
    y: 385,
    promptX: 2025,
    promptY: 115,
    width: 540,
    height: 410,
    approachX: 1755,
    approachY: 615,
    promptRadius: 145,
  },
  {
    id: "employee-voice",
    defaultStationCode: "3A",
    title: "Treehouse Post Office",
    shortLabel: "Post Office",
    npcName: "Devon Park",
    npcRole: "Ombudsman Anonim",
    npcSpeech:
      "100% Anonim! Tekan [E] atau klik saya untuk berdiskusi tentang aspirasi kerja.",
    npcGreeting:
      "Halo! Saya Devon Park, Ombudsman Anonim di Treehouse Post Office. Di sini suaramu dilindungi sepenuhnya tanpa pelacakan identitas maupun IP. Apa yang ingin kamu sampaikan atau tanyakan?",
    npcChoices: [
      {
        id: "voice-3a",
        label: "Saya ingin menyampaikan keluhan kerja secara privat atau cek kode resi.",
        reply:
          "Di Pos 3A, setiap laporan yang kamu tulis otomatis disensor dari data pribadi (PII) sebelum masuk ke peninjauan. Kamu juga akan memperoleh Kode Resi unik (SV-XXXX) untuk memantau tanggapan resmi manajemen secara anonim.",
        actionLabel: "Buka Pos 3A · Kotak Keluhan Anonim",
        targetStationCode: "3A",
      },
      {
        id: "voice-3b",
        label: "Saya punya kritik membangun & saran untuk budaya atau fasilitas kantor.",
        reply:
          "Ide konstruktifmu sangat berharga! Di Pos 3B, kamu bisa menempelkan kartu pos saran ke Papan Gabus Publik dan memberikan dukungan (upvote) pada aspirasi rekan-rekan lain agar menjadi prioritas bersama.",
        actionLabel: "Buka Pos 3B · Papan Kritik & Saran",
        targetStationCode: "3B",
      },
      {
        id: "voice-3c",
        label: "Saya ingin mengisi evaluasi tingkat kenyamanan lingkungan kerja.",
        reply:
          "Melalui Barometer & Sempoa Kenyamanan di Pos 3C, kamu dapat memberikan skor 1–5 untuk keseimbangan beban kerja, keamanan psikologis, dan dukungan tim di divisimu dalam waktu kurang dari satu menit.",
        actionLabel: "Buka Pos 3C · Evaluasi Kenyamanan Kerja",
        targetStationCode: "3C",
      },
      {
        id: "voice-privacy",
        label: "Bagaimana sistem ini menjamin laporan saya benar-benar 100% anonim?",
        reply:
          "Kami tidak menyimpan akun pengguna, alamat IP, maupun sidik jari perangkat pada tabel Employee Voice. Ditambah lagi, penyaring AI otomatis menghapus nama orang, email, dan nomor telepon sebelum pesan disimpan.",
      },
    ],
    npcDefaultFacing: "left",
    npcX: 1235,
    npcY: 1285,
    x: 1385,
    y: 1115,
    promptX: 1385,
    promptY: 705,
    width: 580,
    height: 390,
    approachX: 1215,
    approachY: 1295,
    promptRadius: 145,
  },
];

/**
 * Garden Structures (/assets/garden-structures.png) & Nature Details (/assets/nature-details.png):
 */
export const WORLD_FOREGROUND_PROPS: WorldForegroundProp[] = [
  // Central Cobblestone Plaza Structures
  {
    id: "prop-central-stone-fountain",
    label: "Town Square Fountain",
    sheetRow: 1,
    sheetCol: 0,
    x: 1200,
    y: 695,
    drawWidth: 215,
    drawHeight: 215,
    footY: 580,
    colliderRx: 86,
    colliderRy: 48,
    animKind: "fountain",
    phase: 0,
  },
  {
    id: "prop-plaza-wooden-bench",
    label: "Plaza Wooden Bench",
    sheetRow: 1,
    sheetCol: 3,
    x: 1365,
    y: 465,
    drawWidth: 175,
    drawHeight: 175,
    footY: 430,
    colliderRx: 68,
    colliderRy: 28,
    animKind: "static",
    phase: 0,
  },
  {
    id: "prop-crossroads-signpost",
    label: "Sanctuary Signpost",
    sheetRow: 0,
    sheetCol: 2,
    x: 955,
    y: 455,
    drawWidth: 145,
    drawHeight: 145,
    footY: 445,
    colliderRx: 20,
    colliderRy: 12,
    animKind: "static",
    phase: 0,
  },

  // 4 Pathway Lantern Posts
  {
    id: "prop-lantern-library-path",
    label: "Library Path Lantern",
    sheetRow: 0,
    sheetCol: 1,
    x: 865,
    y: 655,
    drawWidth: 115,
    drawHeight: 115,
    footY: 648,
    colliderRx: 16,
    colliderRy: 10,
    animKind: "lantern",
    phase: 0.5,
  },
  {
    id: "prop-lantern-south-plaza",
    label: "South Plaza Lantern",
    sheetRow: 0,
    sheetCol: 1,
    x: 1065,
    y: 815,
    drawWidth: 115,
    drawHeight: 115,
    footY: 808,
    colliderRx: 16,
    colliderRy: 10,
    animKind: "lantern",
    phase: 1.4,
  },
  {
    id: "prop-lantern-north-plaza",
    label: "Bench Path Lantern",
    sheetRow: 0,
    sheetCol: 1,
    x: 1455,
    y: 495,
    drawWidth: 115,
    drawHeight: 115,
    footY: 488,
    colliderRx: 16,
    colliderRy: 10,
    animKind: "lantern",
    phase: 2.3,
  },
  {
    id: "prop-lantern-east-path",
    label: "Greenhouse Path Lantern",
    sheetRow: 0,
    sheetCol: 1,
    x: 1635,
    y: 725,
    drawWidth: 115,
    drawHeight: 115,
    footY: 718,
    colliderRx: 16,
    colliderRy: 10,
    animKind: "lantern",
    phase: 3.1,
  },

  // 5 Perimeter Oak Trees (nature-details.png)
  {
    id: "prop-oak-tree-nw",
    label: "Northwest Oak Tree",
    sheetRow: 0,
    sheetCol: 0,
    x: 175,
    y: 340,
    drawWidth: 280,
    drawHeight: 280,
    footY: 320,
    colliderRx: 38,
    colliderRy: 20,
    animKind: "tree",
    phase: 0.3,
  },
  {
    id: "prop-oak-tree-west",
    label: "West Meadow Oak Tree",
    sheetRow: 0,
    sheetCol: 0,
    x: 165,
    y: 940,
    drawWidth: 260,
    drawHeight: 260,
    footY: 920,
    colliderRx: 36,
    colliderRy: 18,
    animKind: "tree",
    phase: 1.2,
  },
  {
    id: "prop-oak-tree-sw",
    label: "Southwest Meadow Oak Tree",
    sheetRow: 0,
    sheetCol: 0,
    x: 620,
    y: 1290,
    drawWidth: 260,
    drawHeight: 260,
    footY: 1270,
    colliderRx: 36,
    colliderRy: 18,
    animKind: "tree",
    phase: 2.1,
  },
  {
    id: "prop-oak-tree-north",
    label: "North Meadow Oak Tree",
    sheetRow: 0,
    sheetCol: 0,
    x: 1495,
    y: 250,
    drawWidth: 250,
    drawHeight: 250,
    footY: 230,
    colliderRx: 34,
    colliderRy: 18,
    animKind: "tree",
    phase: 3.0,
  },
  {
    id: "prop-oak-tree-se",
    label: "Southeast Meadow Oak Tree",
    sheetRow: 0,
    sheetCol: 0,
    x: 2240,
    y: 1040,
    drawWidth: 265,
    drawHeight: 265,
    footY: 1020,
    colliderRx: 36,
    colliderRy: 18,
    animKind: "tree",
    phase: 3.9,
  },
];

export const WORLD_POLYGON_COLLIDERS: PolygonCollider[] = [
  {
    id: "library-cabin-base",
    points: [
      [260, 485],
      [515, 645],
      [665, 565],
      [815, 455],
      [560, 355],
    ],
  },
  {
    id: "greenhouse-dome-base",
    points: [
      [1805, 415],
      [2025, 355],
      [2245, 415],
      [2265, 515],
      [2025, 555],
      [1795, 505],
    ],
  },
  {
    id: "treehouse-trunk-and-stilts-base",
    points: [
      [1135, 1145],
      [1395, 1065],
      [1585, 1125],
      [1610, 1285],
      [1445, 1315],
      [1145, 1225],
    ],
  },
];

export const WORLD_ELLIPSE_COLLIDERS: EllipseCollider[] = [
  { id: "koi-pond", cx: 2155, cy: 675, rx: 175, ry: 65 },
  { id: "bush-se", cx: 2335, cy: 1265, rx: 95, ry: 85 },
];

export function createInitialPlayerState(): PlayerPhysicsState {
  return {
    x: 1035,
    y: 645,
    vx: 0,
    vy: 0,
    facing: "down",
    clickTarget: null,
  };
}

function pointInPolygon(
  px: number,
  py: number,
  points: Array<[number, number]>
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegmentSquared(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

function overlapsPolygonFootprint(
  px: number,
  py: number,
  rx: number,
  ry: number,
  points: Array<[number, number]>
): boolean {
  if (pointInPolygon(px, py, points)) return true;

  const sampleAngles = [
    0,
    Math.PI * 0.25,
    Math.PI * 0.5,
    Math.PI * 0.75,
    Math.PI,
    Math.PI * 1.25,
    Math.PI * 1.5,
    Math.PI * 1.75,
  ];
  for (const angle of sampleAngles) {
    const sx = px + Math.cos(angle) * rx;
    const sy = py + Math.sin(angle) * ry;
    if (pointInPolygon(sx, sy, points)) return true;
  }

  const minRadiusSq = Math.min(rx, ry) * Math.min(rx, ry);
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    if (
      distToSegmentSquared(
        px,
        py,
        points[j][0],
        points[j][1],
        points[i][0],
        points[i][1]
      ) < minRadiusSq
    ) {
      return true;
    }
  }
  return false;
}

function overlapsEllipseFootprint(
  px: number,
  py: number,
  playerRx: number,
  playerRy: number,
  cx: number,
  cy: number,
  obsRx: number,
  obsRy: number
): boolean {
  const combinedRx = playerRx + obsRx;
  const combinedRy = playerRy + obsRy;
  const dx = (px - cx) / combinedRx;
  const dy = (py - cy) / combinedRy;
  return dx * dx + dy * dy < 1;
}

export function hitsAnyCollider(px: number, py: number): boolean {
  for (const station of ZONE_STATIONS) {
    if (
      overlapsEllipseFootprint(
        px,
        py,
        PLAYER_FOOT_RX,
        PLAYER_FOOT_RY,
        station.npcX,
        station.npcY - 2,
        NPC_FOOT_RX,
        NPC_FOOT_RY
      )
    ) {
      return true;
    }
  }

  for (const sub of FEATURE_STATIONS) {
    if (
      overlapsEllipseFootprint(
        px,
        py,
        PLAYER_FOOT_RX,
        PLAYER_FOOT_RY,
        sub.x,
        sub.footY,
        sub.colliderRx,
        sub.colliderRy
      )
    ) {
      return true;
    }
  }

  for (const prop of WORLD_FOREGROUND_PROPS) {
    if (prop.colliderRx > 0 && prop.colliderRy > 0) {
      if (
        overlapsEllipseFootprint(
          px,
          py,
          PLAYER_FOOT_RX,
          PLAYER_FOOT_RY,
          prop.x,
          prop.footY,
          prop.colliderRx,
          prop.colliderRy
        )
      ) {
        return true;
      }
    }
  }

  for (const ell of WORLD_ELLIPSE_COLLIDERS) {
    if (
      overlapsEllipseFootprint(
        px,
        py,
        PLAYER_FOOT_RX,
        PLAYER_FOOT_RY,
        ell.cx,
        ell.cy,
        ell.rx,
        ell.ry
      )
    ) {
      return true;
    }
  }

  for (const poly of WORLD_POLYGON_COLLIDERS) {
    if (
      overlapsPolygonFootprint(
        px,
        py,
        PLAYER_FOOT_RX,
        PLAYER_FOOT_RY,
        poly.points
      )
    ) {
      return true;
    }
  }

  return false;
}

export function getStationById(zoneId: ZoneId): ZoneStation {
  return ZONE_STATIONS.find((s) => s.id === zoneId) ?? ZONE_STATIONS[0];
}

export function getFeatureSubStationByCode(
  code: SubStationCode
): FeatureSubStation {
  return FEATURE_STATIONS.find((s) => s.code === code) ?? FEATURE_STATIONS[0];
}

export function getSurfaceTypeAt(
  x: number,
  y: number
): "path" | "wood" | "grass" {
  if (
    (x >= 1660 && x <= 2180 && y >= 480 && y <= 655) ||
    (x >= 1150 && x <= 1350 && y >= 1190 && y <= 1335)
  ) {
    return "wood";
  }

  const distToPlaza = Math.hypot(x - 1200, y - 615);
  const onDiagonalRoad = Math.abs(y - (1320 - x * 0.56)) < 115;
  const onEastRoad = x >= 1150 && Math.abs(y - (460 + (x - 1150) * 0.42)) < 95;
  const onNorthRoad = x >= 830 && x <= 1190 && y <= 550;

  if (distToPlaza < 240 || onDiagonalRoad || onEastRoad || onNorthRoad) {
    return "path";
  }

  return "grass";
}

/**
 * Hit-tests whether a pointer click/hover at (worldX, worldY) is directly on a Zone Guide NPC.
 */
export function hitTestNpc(
  worldX: number,
  worldY: number
): ZoneStation | null {
  for (const station of ZONE_STATIONS) {
    const nearNpc =
      Math.abs(worldX - station.npcX) <= 58 &&
      worldY >= station.npcY - 114 &&
      worldY <= station.npcY + 26;
    if (nearNpc) {
      return station;
    }
  }
  return null;
}

/**
 * Returns the nearest Zone Guide NPC if the player is within interaction range.
 */
export function getNearbyNpcStation(
  playerX: number,
  playerY: number
): ZoneStation | null {
  let closestNpc: ZoneStation | null = null;
  let closestDist = Infinity;

  for (const station of ZONE_STATIONS) {
    const distNpc = Math.hypot(playerX - station.npcX, playerY - station.npcY);
    if (distNpc <= 135 && distNpc < closestDist) {
      closestDist = distNpc;
      closestNpc = station;
    }
  }

  return closestNpc;
}

/**
 * Hit-tests whether a pointer click/hover at (worldX, worldY) is on one of the 9
 * sub-feature stations (1A..3C) or a Zone Building.
 */
export function hitTestSubStation(
  worldX: number,
  worldY: number
): FeatureSubStation | null {
  // 1. Check the 9 dedicated sub-feature stations (1A..3C) first
  for (const sub of FEATURE_STATIONS) {
    const withinSub =
      Math.abs(worldX - sub.x) <= sub.drawWidth * 0.54 &&
      worldY >= sub.y - sub.drawHeight &&
      worldY <= sub.y + 24;
    if (withinSub) {
      return sub;
    }
  }

  // 2. Check Zone Buildings (maps to their zone's default sub-station)
  for (const station of ZONE_STATIONS) {
    const nearBuilding =
      worldX >= station.x - station.width / 2 &&
      worldX <= station.x + station.width / 2 &&
      worldY >= station.y - station.height / 2 &&
      worldY <= station.y + station.height / 2;

    if (nearBuilding) {
      return getFeatureSubStationByCode(station.defaultStationCode);
    }
  }

  return null;
}

export function hitTestStation(
  worldX: number,
  worldY: number
): ZoneStation | null {
  const sub = hitTestSubStation(worldX, worldY);
  return sub ? getStationById(sub.zoneId) : null;
}

export function computeNpcFacing(
  station: ZoneStation,
  playerX: number,
  playerY: number,
  turnRadius = 260
): FacingDirection {
  const dx = playerX - station.npcX;
  const dy = playerY - station.npcY;
  const dist = Math.hypot(dx, dy);
  if (dist > turnRadius) {
    return station.npcDefaultFacing;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

function resolveGroundMovement(
  state: PlayerPhysicsState,
  dx: number,
  dy: number
): boolean {
  const clampX = (v: number) =>
    Math.max(WORLD_PADDING, Math.min(WORLD_WIDTH - WORLD_PADDING, v));
  const clampY = (v: number) =>
    Math.max(WORLD_PADDING, Math.min(WORLD_HEIGHT - WORLD_PADDING, v));

  const fullX = clampX(state.x + dx);
  const fullY = clampY(state.y + dy);

  if (!hitsAnyCollider(fullX, fullY)) {
    state.x = fullX;
    state.y = fullY;
    return true;
  }

  let moved = false;
  if (Math.abs(dx) > 1e-4 && !hitsAnyCollider(fullX, state.y)) {
    state.x = fullX;
    moved = true;
  } else {
    state.vx = 0;
  }

  if (Math.abs(dy) > 1e-4 && !hitsAnyCollider(state.x, fullY)) {
    state.y = fullY;
    moved = true;
  } else {
    state.vy = 0;
  }

  if (moved) return true;

  const baseAngle = Math.atan2(dy, dx);
  const stepLen = Math.hypot(dx, dy) * 0.72;
  const slideOffsets = [
    Math.PI / 6,
    -Math.PI / 6,
    Math.PI / 3,
    -Math.PI / 3,
    Math.PI * 0.42,
    -Math.PI * 0.42,
  ];

  for (const offset of slideOffsets) {
    const testX = clampX(state.x + Math.cos(baseAngle + offset) * stepLen);
    const testY = clampY(state.y + Math.sin(baseAngle + offset) * stepLen);
    if (!hitsAnyCollider(testX, testY)) {
      state.x = testX;
      state.y = testY;
      return true;
    }
  }

  state.vx = 0;
  state.vy = 0;
  return false;
}

/**
 * Steps player movement and returns the nearest active SubStationCode (1A..3C)
 * when within proximity range.
 */
export function updatePlayerPhysics(
  state: PlayerPhysicsState,
  input: PhysicsInput,
  dtRatio = 1
): SubStationCode | null {
  let ax = 0;
  let ay = 0;

  if (!input.locked) {
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;

    if (ax !== 0 || ay !== 0) {
      state.clickTarget = null;
      if (Math.abs(ax) >= Math.abs(ay)) {
        state.facing = ax > 0 ? "right" : "left";
      } else {
        state.facing = ay > 0 ? "down" : "up";
      }
      const len = Math.hypot(ax, ay);
      ax /= len;
      ay /= len;
    } else if (state.clickTarget) {
      const dx = state.clickTarget.x - state.x;
      const dy = state.clickTarget.y - state.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        ax = dx / dist;
        ay = dy / dist;
        if (Math.abs(dx) >= Math.abs(dy)) {
          state.facing = dx > 0 ? "right" : "left";
        } else {
          state.facing = dy > 0 ? "down" : "up";
        }
      } else {
        state.clickTarget = null;
      }
    }
  } else {
    state.clickTarget = null;
  }

  if (ax === 0 && ay === 0) {
    state.vx = 0;
    state.vy = 0;
  } else {
    state.vx =
      (state.vx + ax * PLAYER_ACCEL * dtRatio) *
      Math.pow(PLAYER_FRICTION, dtRatio);
    state.vy =
      (state.vy + ay * PLAYER_ACCEL * dtRatio) *
      Math.pow(PLAYER_FRICTION, dtRatio);

    const speed = Math.hypot(state.vx, state.vy);
    if (speed > PLAYER_MAX_SPEED) {
      state.vx = (state.vx / speed) * PLAYER_MAX_SPEED;
      state.vy = (state.vy / speed) * PLAYER_MAX_SPEED;
    }

    const moved = resolveGroundMovement(
      state,
      state.vx * dtRatio,
      state.vy * dtRatio
    );
    if (!moved && state.clickTarget) {
      state.clickTarget = null;
    }
  }

  let closestCode: SubStationCode | null = null;
  let closestDist = Infinity;

  // Check proximity to each of the 9 sub-feature stations (1A..3C)
  for (const sub of FEATURE_STATIONS) {
    const distCenter = Math.hypot(state.x - sub.x, state.y - sub.footY);
    const distApproach = Math.hypot(
      state.x - sub.approachX,
      state.y - sub.approachY
    );
    const d = Math.min(distCenter, distApproach);
    if (d <= sub.promptRadius && d < closestDist) {
      closestDist = d;
      closestCode = sub.code;
    }
  }

  // Also check proximity to the 3 Zone Guide NPCs
  for (const station of ZONE_STATIONS) {
    const distNpc = Math.hypot(state.x - station.npcX, state.y - station.npcY);
    if (distNpc <= station.promptRadius && distNpc < closestDist) {
      closestDist = distNpc;
      closestCode = station.defaultStationCode;
    }
  }

  return closestCode;
}
