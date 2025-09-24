# 🚀 Panduan Deployment BPS Feedback ke Hostinger

## 📋 **Langkah-langkah Deployment**

### **1. Setup Subdomain di Hostinger**

1. **Login ke Hostinger Control Panel**
2. **Buka DNS/Nameserver** untuk domain `bpskotabatu.com`
3. **Tambah DNS Record:**
   - **Type**: `A`
   - **Name**: `feedback`
   - **Points to**: `[IP Server Hostinger Anda]`
   - **TTL**: `300`

**Hasil**: `https://feedback.bpskotabatu.com`

### **2. Upload File ke Hostinger**

**File yang perlu di-upload:**
```
📁 public_html/feedback/
├── 📁 .next/           # Folder build (sudah dibuat)
├── 📁 public/         # Static files
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .env.production  # Environment variables
└── 📄 next.config.ts
```

### **3. Setup Environment Variables**

Buat file `.env.production` di server dengan isi:
```env
# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://ltnuibppsxdrlbzrprtb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjIyNTYsImV4cCI6MjA3MDczODI1Nn0.lIlhCPLJQM8kisjzZLOk_vHgaIKLrCeju-aunUeq63I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MjI1NiwiZXhwIjoyMDcwNzM4MjU2fQ.lTlV9OBPW0KyPZYay0QlzbseOL5qFFG00mK8Hv3CukM

# NextAuth Configuration
NEXTAUTH_SECRET=ZMOAjN+VS+w8++0g7PrWLnQaXBd8ziC9OtuIppQorbI=
NEXTAUTH_URL=https://feedback.bpskotabatu.com

# Application Configuration
NODE_ENV=production

# Email Configuration (Optional)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="noreply@bpskotabatu.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@bpskotabatu.com"
```

### **4. Install Dependencies & Start Server**

**Via SSH/Terminal Hostinger:**
```bash
cd public_html/feedback
npm install
npm start
```

**Atau via File Manager Hostinger:**
1. Upload semua file
2. Jalankan command di terminal Hostinger

### **5. Setup Process Manager (PM2)**

**Install PM2:**
```bash
npm install -g pm2
```

**Start aplikasi dengan PM2:**
```bash
pm2 start npm --name "bps-feedback" -- start
pm2 save
pm2 startup
```

## 🔐 **Login ke Aplikasi**

### **Akun Admin yang Tersedia:**

Berdasarkan data yang sudah ada di Supabase, kemungkinan akun admin:

1. **Hafiyan (Admin)**
   - Email: `[email dari database]`
   - Password: `[password yang sudah di-set]`

2. **Herlina (Supervisor)**
   - Email: `[email dari database]`
   - Password: `[password yang sudah di-set]`

### **Cara Cek Akun yang Ada:**

1. **Login ke Supabase Dashboard**
2. **Buka Table Editor → `profiles`**
3. **Cari user dengan role admin/supervisor**
4. **Cek email dan status akun**

### **Reset Password (jika diperlukan):**

Jika lupa password, bisa reset via Supabase Dashboard atau buat script reset.

## 🌐 **URL Aplikasi**

- **Main URL**: `https://feedback.bpskotabatu.com`
- **Login**: `https://feedback.bpskotabatu.com/login`
- **Admin**: `https://feedback.bpskotabatu.com/admin`

## 🔧 **Troubleshooting**

### **Jika Aplikasi Tidak Bisa Diakses:**

1. **Cek DNS Record** - Pastikan subdomain sudah pointing ke IP yang benar
2. **Cek File Upload** - Pastikan semua file sudah ter-upload
3. **Cek Environment** - Pastikan `.env.production` sudah benar
4. **Cek Dependencies** - Jalankan `npm install` di server
5. **Cek Port** - Pastikan aplikasi running di port yang benar

### **Jika Login Gagal:**

1. **Cek Supabase Connection** - Pastikan kredensial Supabase benar
2. **Cek User Data** - Pastikan user ada di database
3. **Reset Password** - Reset password via Supabase Dashboard

## 📞 **Support**

Jika ada masalah:
1. Cek log aplikasi di Hostinger
2. Cek Supabase Dashboard untuk database issues
3. Pastikan semua environment variables sudah benar

---

## ✅ **Checklist Deployment**

- [ ] DNS Record subdomain sudah dibuat
- [ ] File aplikasi sudah di-upload ke Hostinger
- [ ] Environment variables sudah di-set
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Aplikasi sudah di-start (`npm start` atau `pm2 start`)
- [ ] Bisa akses `https://feedback.bpskotabatu.com`
- [ ] Login berhasil dengan akun admin

**🎉 Aplikasi siap digunakan!**
