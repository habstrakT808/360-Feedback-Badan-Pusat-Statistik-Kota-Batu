# 🚀 BPS Feedback System - Deployment Guide

## 📋 Overview

Project ini telah dimigrasikan dari Supabase ke PostgreSQL dengan Prisma ORM untuk deployment ke Hostinger. Semua dependensi Supabase telah dihapus dan diganti dengan Prisma.

## 🔧 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your database credentials
nano .env.local
```

### 2. Setup Database
```bash
# Install dependencies
npm install

# Setup database (generate client + push schema)
npm run db:setup

# Test database connection
npm run db:test
```

### 3. Prepare for Deployment
```bash
# Build project and create deployment package
npm run deploy:prepare
```

## 📁 Project Structure

```
bps-feedback/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React Components
│   ├── lib/                 # Services & Utilities
│   │   ├── prisma.ts        # Prisma Client
│   │   ├── admin-service.ts # Admin Service (Prisma)
│   │   ├── team-service.ts  # Team Service (Prisma)
│   │   └── pin-service.ts   # Pin Service (Prisma)
│   └── types/               # TypeScript Types
├── prisma/
│   └── schema.prisma        # Database Schema
├── scripts/                 # Deployment Scripts
│   ├── setup-database.js    # Database Setup
│   ├── test-database.js     # Database Test
│   └── prepare-deployment.js # Build & Package
└── DEPLOYMENT_GUIDE.md      # Detailed Deployment Guide
```

## 🗄️ Database Schema

Project menggunakan PostgreSQL dengan Prisma ORM. Schema utama:

- **Profile**: User profiles
- **AssessmentPeriod**: Assessment periods
- **AssessmentAssignment**: User assignments
- **FeedbackResponse**: Feedback responses
- **EmployeePin**: Pin system
- **UserRole**: User roles (admin, supervisor, user)

## 🔐 Authentication

Menggunakan NextAuth.js dengan:
- Credentials provider
- Prisma adapter
- JWT sessions
- Password hashing dengan bcryptjs

## 📊 Features

- ✅ User Management
- ✅ Assessment System
- ✅ Pin System
- ✅ Admin Dashboard
- ✅ Team Performance
- ✅ Results & Analytics
- ✅ Notification System

## 🚀 Deployment Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:setup       # Full database setup
npm run db:test        # Test database connection

# Deployment
npm run deploy:prepare # Prepare deployment package
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key"

# Email (Optional)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
```

## 📝 Migration Notes

### Changes Made:
1. ✅ Removed all Supabase dependencies
2. ✅ Replaced Supabase client with Prisma
3. ✅ Updated all services to use Prisma
4. ✅ Configured NextAuth.js for authentication
5. ✅ Updated database schema for PostgreSQL
6. ✅ Created deployment scripts
7. ✅ Added comprehensive documentation

### Files Modified:
- `package.json` - Removed Supabase deps, added scripts
- `src/lib/*-service.ts` - Updated to use Prisma
- `src/app/layout.tsx` - Removed SupabaseErrorBoundary
- `prisma/schema.prisma` - PostgreSQL schema
- Added deployment scripts and documentation

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   ```bash
   npm run db:test
   ```

2. **Build Error**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Prisma Client Error**
   ```bash
   npm run db:generate
   ```

## 📞 Support

Jika mengalami masalah:
1. Check `DEPLOYMENT_GUIDE.md` untuk panduan lengkap
2. Verify environment variables
3. Test database connection
4. Check build logs

---

**Status**: ✅ Ready for Hostinger Deployment
**Last Updated**: $(date)
**Version**: 1.0.0
