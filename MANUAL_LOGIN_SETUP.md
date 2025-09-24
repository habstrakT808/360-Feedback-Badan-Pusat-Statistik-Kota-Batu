# 🔐 Manual Login Setup untuk BPS Feedback

## 📋 **Akun yang Tersedia di Database**

Berdasarkan data yang sudah ada di Supabase, berikut adalah akun yang bisa digunakan untuk login:

### **👑 Admin User**
- **Email**: `jhodywiraputra@gmail.com`
- **Nama**: Hafiyan Al Muqaffi Umary
- **Role**: Admin
- **Password**: Perlu di-set manual

### **👨‍💼 Supervisor User**
- **Email**: `herlina.sambodo@bps.go.id`
- **Nama**: Herlina Prasetyowati Sambodo, SST., M.Si
- **Role**: Supervisor
- **Position**: Kepala
- **Department**: BPS Kota Batu
- **Password**: Perlu di-set manual

## 🔧 **Cara Setup Password Manual**

### **Metode 1: Via Supabase Dashboard**

1. **Login ke Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Pilih project: `ltnuibppsxdrlbzrprtb`

2. **Buka Authentication → Users**
3. **Cari user berdasarkan email**
4. **Klik "Reset Password" atau "Update User"**
5. **Set password baru**

### **Metode 2: Via Supabase SQL Editor**

1. **Buka SQL Editor di Supabase Dashboard**
2. **Jalankan query berikut:**

```sql
-- Reset password untuk admin
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'jhodywiraputra@gmail.com';

-- Reset password untuk supervisor
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'herlina.sambodo@bps.go.id';
```

### **Metode 3: Via Supabase Auth API**

```javascript
// Script untuk reset password
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ltnuibppsxdrlbzrprtb.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
)

// Reset password untuk admin
await supabase.auth.admin.updateUserById(
  'USER_ID',
  { password: 'admin123' }
)
```

## 🚀 **Langkah Deployment Lengkap**

### **1. Setup Subdomain di Hostinger**

1. **Login ke Hostinger Control Panel**
2. **Buka DNS/Nameserver untuk `bpskotabatu.com`**
3. **Tambah DNS Record:**
   - **Type**: `A`
   - **Name**: `feedback`
   - **Points to**: `[IP Server Hostinger]`
   - **TTL**: `300`

### **2. Upload File ke Hostinger**

**File yang perlu di-upload:**
```
📁 public_html/feedback/
├── 📁 .next/           # Folder build
├── 📁 public/         # Static files
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .env.production  # Environment variables
└── 📄 next.config.ts
```

### **3. Environment Variables**

Buat file `.env.production` di server:
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
```

### **4. Install & Start**

```bash
cd public_html/feedback
npm install
npm start
```

## 🔐 **Login Credentials**

### **Admin Login:**
- **URL**: `https://feedback.bpskotabatu.com/login`
- **Email**: `jhodywiraputra@gmail.com`
- **Password**: `admin123` (setelah di-reset)

### **Supervisor Login:**
- **URL**: `https://feedback.bpskotabatu.com/login`
- **Email**: `herlina.sambodo@bps.go.id`
- **Password**: `admin123` (setelah di-reset)

## 📊 **Data User yang Tersedia**

Total **19 users** sudah ada di database:
- **1 Admin**: Hafiyan Al Muqaffi Umary
- **1 Supervisor**: Herlina Prasetyowati Sambodo
- **17 Regular Users**: Semua staff BPS Kota Batu

## 🎯 **Fitur yang Tersedia**

1. **✅ Authentication System** - Login/logout
2. **✅ User Management** - CRUD operations
3. **✅ Assessment System** - Sistem penilaian 360
4. **✅ Pin System** - Sistem pemberian pin
5. **✅ Notification System** - Sistem notifikasi
6. **✅ Admin Panel** - Panel administrasi
7. **✅ Export System** - Export data ke Excel
8. **✅ Role Management** - Admin/Supervisor/User roles

## 🔧 **Troubleshooting**

### **Jika Login Gagal:**
1. **Cek password di Supabase Dashboard**
2. **Reset password via Supabase**
3. **Cek environment variables**
4. **Cek koneksi ke Supabase**

### **Jika Aplikasi Tidak Bisa Diakses:**
1. **Cek DNS record subdomain**
2. **Cek file upload ke Hostinger**
3. **Cek dependencies (`npm install`)**
4. **Cek aplikasi running (`npm start`)**

---

## ✅ **Checklist Final**

- [ ] DNS subdomain sudah dibuat
- [ ] File aplikasi sudah di-upload
- [ ] Environment variables sudah di-set
- [ ] Dependencies sudah di-install
- [ ] Aplikasi sudah di-start
- [ ] Password admin sudah di-reset
- [ ] Bisa akses aplikasi
- [ ] Login berhasil

**🎉 Aplikasi siap digunakan!**
