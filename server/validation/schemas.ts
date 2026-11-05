import { z } from 'zod';

// Lista de subdomínios reservados do sistema que clientes NÃO podem registrar
export const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'www',
  'app',
  'static',
  'mail',
  'cdn',
  'auth',
  'status',
  'webhook',
  'root',
  'localhost',
];

// Regex estrito para subdomínio RFC 1123: apenas letras minúsculas, números e traço interno
const subdomainRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

// Regex estrito para cores hexadecimais de 6 dígitos (#RRGGBB)
const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;

/**
 * Schema Zod para criação/cadastro de nova empresa (Tenant)
 * Usamos .strict() para bloquear Mass Assignment (impede envio de campos como isAdmin, id arbitrário, etc.)
 */
export const createTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'O nome da empresa não pode ultrapassar 100 caracteres'),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'O subdomínio deve ter pelo menos 3 caracteres')
    .max(63, 'O subdomínio não pode ultrapassar 63 caracteres')
    .regex(subdomainRegex, 'Subdomínio inválido. Use apenas letras minúsculas, números e hífens.')
    .refine((val) => !RESERVED_SUBDOMAINS.includes(val), {
      message: 'Este subdomínio é reservado pelo sistema central.',
    }),
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .max(255)
    .optional()
    .nullable(),
  logoUrl: z
    .string()
    .url('URL da logomarca inválida')
    .max(500)
    .optional()
    .nullable(),
  primaryColor: z
    .string()
    .regex(hexColorRegex, 'Cor primária deve estar no formato hexadecimal (#RRGGBB)'),
  secondaryColor: z
    .string()
    .regex(hexColorRegex, 'Cor secundária deve estar no formato hexadecimal (#RRGGBB)'),
  accentColor: z
    .string()
    .regex(hexColorRegex, 'Cor de destaque deve estar no formato hexadecimal (#RRGGBB)'),
  description: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),
  planMode: z.enum(['free', 'lite', 'pro']).optional().default('pro'),
  hasStreamAddon: z.boolean().optional().default(false),
}).strict(); // <-- PREVENÇÃO CONTRA MASS ASSIGNMENT

/**
 * Schema para atualização de identidade visual (White Label Branding)
 */
export const updateBrandingSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  logoUrl: z.string().url().max(500).optional().nullable(),
  primaryColor: z.string().regex(hexColorRegex).optional(),
  secondaryColor: z.string().regex(hexColorRegex).optional(),
  accentColor: z.string().regex(hexColorRegex).optional(),
  description: z.string().trim().max(255).optional().nullable(),
}).strict();

/**
 * Schema para Login Seguro do Superadmin
 */
export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail de administrador inválido'),
  password: z
    .string()
    .min(6, 'A senha deve conter no mínimo 6 caracteres')
    .max(128, 'Senha muito longa'),
}).strict();

/**
 * Schema para Alteração de Senha do Superadmin
 */
export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve possuir pelo menos 8 caracteres')
    .max(128),
}).strict();

/**
 * Schema para Atualização de Licença e Planos Comerciais (Pós-Venda)
 */
export const updateLicenseSchema = z.object({
  planMode: z.enum(['free', 'lite', 'pro']).optional(),
  hasStreamAddon: z.boolean().optional(),
  licenseStatus: z.enum(['active', 'suspended', 'trial', 'expired']).optional(),
  licenseExpiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;
