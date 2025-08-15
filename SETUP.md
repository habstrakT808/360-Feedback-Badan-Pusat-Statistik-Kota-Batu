# Setup Guide - BPS Feedback System

## Environment Variables Setup

### 1. Create Environment File

Buat file `.env.local` di root project dengan konfigurasi berikut:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Get Supabase Credentials

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda atau buat project baru
3. Pergi ke **Settings** > **API**
4. Copy **Project URL** dan **anon public** key

### 3. Example Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzQ1NjI0MDAsImV4cCI6MTk1MDEzODQwMH0.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYzNDU2MjQwMCwiZXhwIjoxOTUwMTM4NDAwfQ.example
```

### 4. Restart Development Server

Setelah menambahkan environment variables, restart development server:

```bash
npm run dev
```

### 5. Verify Setup

Jika setup berhasil, aplikasi akan berjalan tanpa error di `http://localhost:3000`

## Troubleshooting

### Error: "supabaseKey is required"

- Pastikan file `.env.local` ada di root project
- Pastikan nama variable benar: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart development server setelah menambah environment variables

### Error: "Missing Supabase environment variables"

- Periksa console browser untuk pesan error detail
- Pastikan semua required variables sudah diisi
- Periksa format URL dan key Supabase

## Development Notes

- File `.env.local` tidak akan di-commit ke git (sudah di `.gitignore`)
- Gunakan `env.example` sebagai template
- Untuk production, set environment variables di hosting platform
