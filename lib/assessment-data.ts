// lib/assessment-data.ts
export const ASSESSMENT_ASPECTS = [
    {
      id: 'kolaboratif',
      name: 'Kolaboratif',
      description: 'Kemampuan bekerja sama dan berkolaborasi dengan berbagai pihak',
      indicators: [
        'Memberi kesempatan kepada berbagai pihak untuk berkontribusi',
        'Terbuka dalam bekerja sama untuk menghasilkan nilai tambah',
        'Menggerakkan pemanfaatan berbagai sumberdaya untuk tujuan bersama'
      ],
      combinedIndicator: 'Kemampuan berkolaborasi dan bekerja sama dengan berbagai pihak untuk mencapai tujuan bersama'
    },
    {
      id: 'adaptif',
      name: 'Adaptif',
      description: 'Kemampuan menyesuaikan diri dan berinovasi menghadapi perubahan',
      indicators: [
        'Cepat menyesuaikan diri menghadapi perubahan',
        'Terus berinovasi dan mengembangkan kreativitas',
        'Bertindak proaktif'
      ],
      combinedIndicator: 'Kemampuan beradaptasi, berinovasi, dan bertindak proaktif menghadapi perubahan'
    },
    {
      id: 'loyal',
      name: 'Loyal',
      description: 'Kesetiaan terhadap ideologi, negara, dan instansi',
      indicators: [
        'Memegang teguh ideologi Pancasila, UUD 1945, setia kepada NKRI',
        'Menjaga nama baik sesama ASN, Pimpinan, Instansi, dan Negara',
        'Menjaga rahasia jabatan dan negara'
      ],
      combinedIndicator: 'Kesetiaan dan komitmen terhadap ideologi Pancasila, NKRI, dan instansi'
    },
    {
      id: 'harmonis',
      name: 'Harmonis',
      description: 'Kemampuan membangun hubungan harmonis dan lingkungan kerja yang kondusif',
      indicators: [
        'Menghargai setiap orang apapun latar belakangnya',
        'Suka menolong orang lain',
        'Membangun lingkungan kerja yang kondusif'
      ],
      combinedIndicator: 'Kemampuan membangun hubungan harmonis dan lingkungan kerja yang kondusif'
    },
    {
      id: 'kompeten',
      name: 'Kompeten',
      description: 'Kemampuan profesional dan pengembangan diri yang berkelanjutan',
      indicators: [
        'Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah',
        'Membantu orang lain belajar',
        'Melaksanakan tugas dengan kualitas terbaik'
      ],
      combinedIndicator: 'Kompetensi profesional dan pengembangan diri yang berkelanjutan'
    },
    {
      id: 'akuntabel',
      name: 'Akuntabel',
      description: 'Integritas dan tanggung jawab dalam melaksanakan tugas',
      indicators: [
        'Melaksanakan tugas dengan jujur, bertanggungjawab, cermat, disiplin dan berintegritas tinggi',
        'Menggunakan kekayaan dan barang milik negara secara bertanggungjawab, efektif, dan efisien',
        'Tidak menyalahgunakan kewenangan jabatan'
      ],
      combinedIndicator: 'Integritas, tanggung jawab, dan akuntabilitas dalam melaksanakan tugas'
    },
    {
      id: 'berorientasi_pelayanan',
      name: 'Berorientasi Pelayanan',
      description: 'Kemampuan memberikan pelayanan yang berkualitas kepada masyarakat',
      indicators: [
        'Memahami dan memenuhi kebutuhan masyarakat',
        'Ramah, cekatan, solutif, dan dapat diandalkan',
        'Melakukan perbaikan tiada henti'
      ],
      combinedIndicator: 'Kemampuan memberikan pelayanan berkualitas dan solutif kepada masyarakat'
    }
  ]