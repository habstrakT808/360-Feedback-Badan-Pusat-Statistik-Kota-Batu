# 🚀 Panduan Deployment BPS Feedback System ke Hostinger

## 📋 Prerequisites

Sebelum memulai deployment, pastikan Anda memiliki:
- Akun Hostinger dengan akses ke hPanel
- Database PostgreSQL di Hostinger
- Domain yang sudah terhubung ke Hostinger
- Node.js v18+ di komputer lokal
- Git terinstall

## 🗄️ Langkah 1: Setup Database PostgreSQL di Hostinger

### 1.1 Buat Database PostgreSQL
1. Login ke hPanel Hostinger
2. Pergi ke **Databases** → **PostgreSQL Databases**
3. Klik **Create New Database**
4. Isi detail database:
   - **Database Name**: `bps_feedback` (atau sesuai keinginan)
   - **Username**: `app` (atau sesuai keinginan)
   - **Password**: Buat password yang kuat
   - **Host**: `localhost` (atau IP yang diberikan Hostinger)
   - **Port**: `5432` (default PostgreSQL)

### 1.2 Catat Informasi Database
Simpan informasi berikut untuk konfigurasi:
```
Database Name: bps_feedback
Username: app
Password: [password_anda]
Host: localhost (atau IP yang diberikan)
Port: 5432
```

## 🔧 Langkah 2: Konfigurasi Environment Variables

### 2.1 Buat File .env.local
Buat file `.env.local` di root project dengan konfigurasi berikut:

```env
# Database Configuration (Hostinger PostgreSQL)
DATABASE_URL="postgresql://app:[password_anda]@localhost:5432/bps_feedback?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Email Configuration (Optional - for notifications)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="your-email@yourdomain.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@yourdomain.com"

# Application Configuration
NODE_ENV="production"
```

### 2.2 Generate NextAuth Secret
Gunakan command berikut untuk generate secret key:
```bash
openssl rand -base64 32
```

## 🏗️ Langkah 3: Setup Database Schema

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Generate Prisma Client
```bash
npx prisma generate
```

### 3.3 Push Schema ke Database
```bash
npx prisma db push
```

### 3.4 (Optional) Seed Data
Jika ada data awal yang perlu diimport:
```bash
# Import data dari backup CSV
node scripts/import-from-backup.js
```

## 🚀 Langkah 4: Build dan Deploy ke Hostinger

### 4.1 Build Project
```bash
npm run build
```

### 4.2 Upload ke Hostinger
1. **Via File Manager hPanel:**
   - Login ke hPanel
   - Buka **File Manager**
   - Navigasi ke folder `public_html`
   - Upload semua file dari folder `.next` dan file-file lainnya

2. **Via FTP/SFTP:**
   - Gunakan FileZilla atau FTP client lainnya
   - Connect ke server Hostinger
   - Upload semua file ke folder `public_html`

### 4.3 Upload File yang Diperlukan
Pastikan file-file berikut terupload:
```
public_html/
├── .next/
├── public/
├── package.json
├── package-lock.json
├── next.config.ts
├── prisma/
└── .env.local
```

## ⚙️ Langkah 5: Konfigurasi Server Hostinger

### 5.1 Install Node.js di Hostinger
1. Login ke hPanel
2. Pergi ke **Advanced** → **Node.js**
3. Pilih versi Node.js 18+ atau 20+
4. Set **Application Root** ke folder project Anda

### 5.2 Install Dependencies di Server
1. Buka **Terminal** di hPanel
2. Navigasi ke folder project:
   ```bash
   cd public_html
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### 5.3 Generate Prisma Client di Server
```bash
npx prisma generate
```

### 5.4 Setup Database di Server
```bash
npx prisma db push
```

## 🔐 Langkah 6: Konfigurasi Domain dan SSL

### 6.1 Setup Domain
1. Di hPanel, pergi ke **Domains**
2. Pastikan domain sudah terhubung ke folder `public_html`
3. Set **Document Root** ke folder project

### 6.2 Setup SSL Certificate
1. Di hPanel, pergi ke **SSL**
2. Aktifkan **Free SSL Certificate**
3. Pastikan HTTPS sudah aktif

## 🧪 Langkah 7: Testing dan Verifikasi

### 7.1 Test Database Connection
1. Buka website Anda
2. Coba login dengan akun admin
3. Periksa apakah data ter-load dengan benar

### 7.2 Test Fitur Utama
- [ ] Login/Logout
- [ ] Dashboard loading
- [ ] Assessment submission
- [ ] Pin system
- [ ] Admin functions

## 🔧 Langkah 8: Troubleshooting

### 8.1 Common Issues

**Database Connection Error:**
```bash
# Check database connection
npx prisma db pull
```

**Build Error:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Permission Error:**
```bash
# Fix file permissions
chmod -R 755 public_html
```

### 8.2 Log Files
Check log files di hPanel:
- **Error Logs**: Advanced → Error Logs
- **Access Logs**: Advanced → Raw Access Logs

## 📊 Langkah 9: Monitoring dan Maintenance

### 9.1 Regular Backups
1. Backup database secara berkala
2. Backup file project
3. Simpan backup di tempat aman

### 9.2 Performance Monitoring
1. Monitor penggunaan CPU dan RAM
2. Check response time website
3. Monitor database performance

## 🆘 Support dan Bantuan

Jika mengalami masalah:
1. Check log files di hPanel
2. Periksa konfigurasi environment variables
3. Pastikan semua dependencies terinstall
4. Verify database connection

## 📝 Checklist Deployment

- [ ] Database PostgreSQL dibuat dan dikonfigurasi
- [ ] Environment variables diset dengan benar
- [ ] Prisma schema di-push ke database
- [ ] Project di-build tanpa error
- [ ] File di-upload ke Hostinger
- [ ] Node.js dikonfigurasi di server
- [ ] Dependencies diinstall di server
- [ ] Domain dan SSL dikonfigurasi
- [ ] Website dapat diakses
- [ ] Fitur utama berfungsi normal
- [ ] Database connection berhasil
- [ ] Login/logout berfungsi
- [ ] Admin panel dapat diakses

## 🎉 Selamat!

Jika semua checklist sudah terpenuhi, website BPS Feedback System Anda sudah berhasil di-deploy ke Hostinger!

---

**Catatan Penting:**
- Simpan backup database dan file project secara berkala
- Monitor performa website secara rutin
- Update dependencies secara berkala untuk keamanan
- Pastikan SSL certificate selalu aktif
