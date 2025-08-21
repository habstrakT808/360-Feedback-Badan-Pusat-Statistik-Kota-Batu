// src/lib/validation.ts
import { z } from 'zod';

// Assessment schemas
export const AssessmentResponseSchema = z.object({
  aspect: z.string().min(1, 'Aspek harus dipilih'),
  indicator: z.string().min(1, 'Indikator harus dipilih'),
  rating: z.number()
    .min(1, 'Rating minimal 1')
    .max(100, 'Rating maksimal 100'),
  comment: z.string().optional(),
});

export const AssessmentSubmissionSchema = z.object({
  assesseeId: z.string().uuid('ID assessee tidak valid'),
  periodId: z.string().uuid('ID periode tidak valid'),
  responses: z.array(AssessmentResponseSchema)
    .min(1, 'Minimal harus ada 1 response')
    .max(100, 'Maksimal 100 responses'),
});

// User profile schemas
export const UserProfileSchema = z.object({
  full_name: z.string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama hanya boleh berisi huruf dan spasi'),
  email: z.string().email('Email tidak valid'),
  position: z.string().optional(),
  department: z.string().optional(),
});

export const AvatarUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'File maksimal 5MB')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Format file tidak didukung'),
});

// Period schemas
export const AssessmentPeriodSchema = z.object({
  name: z.string().min(1, 'Nama periode harus diisi'),
  start_date: z.string().datetime('Tanggal mulai tidak valid'),
  end_date: z.string().datetime('Tanggal selesai tidak valid'),
  is_active: z.boolean().optional(),
});

// Utility functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function validateRating(rating: number): { isValid: boolean; message?: string } {
  if (rating < 1 || rating > 100) {
    return { isValid: false, message: 'Rating harus antara 1-100' };
  }
  if (!Number.isInteger(rating)) {
    return { isValid: false, message: 'Rating harus berupa angka bulat' };
  }
  return { isValid: true };
}

export function validateFileSize(file: File, maxSizeMB: number = 5): { isValid: boolean; message?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, message: `File terlalu besar. Maksimal ${maxSizeMB}MB` };
  }
  return { isValid: true };
}

export function validateFileType(file: File, allowedTypes: string[]): { isValid: boolean; message?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}` };
  }
  return { isValid: true };
}

// Error handling utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ');
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui';
}
