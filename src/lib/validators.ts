import { z } from 'zod';

export const phoneSchema = z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Invalid phone number');

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(6, 'Password too short'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name required'),
  businessName: z.string().trim().min(2, 'Business name required'),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const productSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  image: z.string().trim().optional(),
  baseUnit: z.string().default('piece'),
  purchasePrice: z.number().int().nonnegative().default(0),
  sellingPrice: z.number().int().nonnegative().default(0),
  minimumStock: z.number().int().nonnegative().default(0),
  taxRate: z.number().min(0).max(1).default(0),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1),
  phone: phoneSchema,
  whatsappPhone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().trim().optional(),
});

export const saleSchema = z.object({
  branchId: z.string().min(1),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    unit: z.string().optional(),
    unitPrice: z.number().int().nonnegative(),
    discount: z.number().int().nonnegative().optional(),
    taxRate: z.number().min(0).max(1).optional(),
  })).min(1, 'At least one item required'),
  payments: z.array(z.object({
    method: z.enum(['CASH', 'CARD', 'BANK', 'ONLINE', 'CREDIT', 'OTHER']),
    amount: z.number().int().nonnegative(),
  })).default([]),
});

export const themeSchema = z.object({
  themeKey: z.string().min(1),
  brandName: z.string().trim().min(1).optional(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().trim().optional(),
});

export const purchaseSchema = z.object({
  branchId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  reference: z.string().trim().optional(),
  paidAmount: z.number().int().nonnegative().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCost: z.number().int().nonnegative(),
  })).min(1, 'At least one item required'),
});

export const messageSchema = z.object({
  to: z.string().trim().min(3),
  type: z.enum(['INVOICE', 'RECEIPT', 'CREDIT_REMINDER', 'MARKETING', 'PROMO']),
  body: z.string().min(1),
  customerId: z.string().optional(),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1),
  message: z.string().trim().min(1),
  targetSegment: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'CREDIT', 'VIP', 'HIGH_VALUE']),
});

export const bulkMessageSchema = z.object({
  type: z.enum(['MARKETING', 'CREDIT_REMINDER', 'PROMO']),
  body: z.string().min(1),
  recipients: z.array(z.object({ phone: z.string().min(3), name: z.string().optional() })).min(1),
});

export const createTenantSchema = z.object({
  businessName: z.string().trim().min(2),
  ownerName: z.string().trim().min(2),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8),
  planKey: z.string().min(1),
  status: z.enum(['TRIAL', 'ACTIVE']).default('ACTIVE'),
});
