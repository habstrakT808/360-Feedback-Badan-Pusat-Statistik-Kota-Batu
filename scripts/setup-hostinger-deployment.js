#!/usr/bin/env node

/**
 * Script untuk setup deployment aplikasi BPS Feedback di Hostinger
 * 
 * Langkah-langkah:
 * 1. Buat subdomain di Hostinger (feedback.bpskotabatu.com)
 * 2. Setup environment variables
 * 3. Build aplikasi
 * 4. Deploy ke Hostinger
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setup Deployment BPS Feedback untuk Hostinger\n');

// Environment variables untuk production
const envContent = `# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://ltnuibppsxdrlbzrprtb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjIyNTYsImV4cCI6MjA3MDczODI1Nn0.lIlhCPLJQM8kisjzZLOk_vHgaIKLrCeju-aunUeq63I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MjI1NiwiZXhwIjoyMDcwNzM4MjU2fQ.lTlV9OBPW0KyPZYay0QlzbseOL5qFFG00mK8Hv3CukM

# NextAuth Configuration
NEXTAUTH_SECRET=ZMOAjN+VS+w8++0g7PrWLnQaXBd8ziC9OtuIppQorbI=
NEXTAUTH_URL=https://feedback.bpskotabatu.com

# Application Configuration
NODE_ENV=production

# Email Configuration (Optional - untuk notifikasi)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="noreply@bpskotabatu.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@bpskotabatu.com"
`;

// Buat file .env.production
fs.writeFileSync('.env.production', envContent);
console.log('✅ File .env.production berhasil dibuat');

// Buat file .env.local untuk development
fs.writeFileSync('.env.local', envContent);
console.log('✅ File .env.local berhasil dibuat');

console.log('\n📋 Langkah-langkah Deployment:');
console.log('1. Login ke Hostinger Control Panel');
console.log('2. Buka "DNS/Nameserver" untuk domain bpskotabatu.com');
console.log('3. Tambah DNS Record:');
console.log('   - Type: A');
console.log('   - Name: feedback');
console.log('   - Points to: [IP Server Hostinger Anda]');
console.log('   - TTL: 300');
console.log('\n4. Upload file aplikasi ke Hostinger File Manager');
console.log('5. Jalankan: npm install && npm run build && npm start');

console.log('\n🔧 Script yang tersedia:');
console.log('- npm run build: Build aplikasi untuk production');
console.log('- npm start: Start aplikasi di production mode');

console.log('\n📁 File yang perlu di-upload ke Hostinger:');
console.log('- .next/ (folder build)');
console.log('- public/ (static files)');
console.log('- package.json');
console.log('- package-lock.json');
console.log('- .env.production (environment variables)');
console.log('- node_modules/ (atau jalankan npm install di server)');

console.log('\n🎯 URL Aplikasi: https://feedback.bpskotabatu.com');
console.log('\n✅ Setup selesai! Silakan ikuti langkah deployment di atas.');
