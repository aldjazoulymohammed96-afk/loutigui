import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Numéro de téléphone invalide.")
  .max(30, "Numéro de téléphone trop long.");

export const emailSchema = z.string().trim().email("Adresse email invalide.").max(160);

export const moneySchema = z.coerce
  .number()
  .finite("Montant invalide.")
  .min(0, "Le montant ne peut pas être négatif.")
  .max(1_000_000_000, "Montant trop élevé.");

export const positiveMoneySchema = moneySchema.refine((v) => v > 0, {
  message: "Le montant doit être supérieur à 0.",
});

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Date invalide (format attendu AAAA-MM-JJ).");

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Identifiant obligatoire.").max(160),
  password: z.string().min(1, "Mot de passe obligatoire.").max(200),
});

const roleSchema = z.enum([
  "OWNER",
  "AGENCY_ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "FIELD_AGENT",
]);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200),
  role: roleSchema.optional(),
  managementType: z.enum(["OWNER", "AGENCY", "DIASPORA"]).optional(),
  startEmpty: z.boolean().optional(),
});

export const onboardingSchema = z.object({
  orgName: z.string().trim().min(2).max(160),
  countryCode: z.string().trim().length(2).default("CI"),
  defaultCurrency: z.enum(["XOF", "EUR", "USD"]),
  managementType: z.enum(["OWNER", "AGENCY", "DIASPORA"]),
  paymentDueDay: z.coerce.number().int().min(1).max(28).optional(),
  gracePeriodDays: z.coerce.number().int().min(0).max(60).optional(),
  lateFeePercentage: z.coerce.number().min(0).max(100).optional(),
  startEmpty: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel obligatoire.").max(200),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères.").max(200),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1).max(160),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(16).max(200),
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200),
});

/* -------------------------------------------------------------------------- */
/* Organisation                                                               */
/* -------------------------------------------------------------------------- */

export const organizationPatchSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  countryCode: z.string().trim().length(2).optional(),
  logoUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  defaultCurrency: z.enum(["XOF", "EUR", "USD"]).optional(),
  managementType: z.enum(["OWNER", "AGENCY", "DIASPORA"]).optional(),
  settings: z
    .object({
      lateFeePercentage: z.coerce.number().min(0).max(100).optional(),
      gracePeriodDays: z.coerce.number().int().min(0).max(60).optional(),
      autoReminders: z.boolean().optional(),
      paymentDueDay: z.coerce.number().int().min(1).max(28).optional(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      whatsappNotifications: z.boolean().optional(),
      reminderDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
      dailyDigest: z.boolean().optional(),
      receiptFooter: z.string().max(1000).optional(),
      showQrCode: z.boolean().optional(),
      receiptLanguage: z.enum(["fr", "en"]).optional(),
    })
    .strict()
    .optional(),
}).strict();

/* -------------------------------------------------------------------------- */
/* Property                                                                   */
/* -------------------------------------------------------------------------- */

export const buildingCreateSchema = z.object({
  name: z.string().trim().min(2, "Le nom de l'immeuble est obligatoire.").max(160),
  city: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().min(1).max(80),
  address: z.string().trim().min(2).max(300),
  country: z.string().trim().min(2).max(80).default("Côte d'Ivoire"),
  description: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

export const unitCreateSchema = z.object({
  buildingId: z.string().trim().min(1, "Immeuble obligatoire."),
  unitNumber: z.string().trim().min(1, "Numéro de lot obligatoire.").max(30),
  type: z.enum(["APARTMENT", "STUDIO", "VILLA", "COMMERCIAL", "ROOM", "FURNISHED"]),
  surfaceM2: moneySchema.default(0),
  roomsCount: z.coerce.number().int().min(0).max(50).default(0),
  rentAmount: moneySchema,
  chargesAmount: moneySchema.default(0),
  depositAmount: moneySchema.default(0),
  status: z.enum(["OCCUPIED", "VACANT", "MAINTENANCE"]).optional(),
  waterMeter: z.string().trim().max(60).optional(),
  electricityMeter: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const unitUpdateSchema = unitCreateSchema.partial().omit({ buildingId: true });

/* -------------------------------------------------------------------------- */
/* Tenant                                                                     */
/* -------------------------------------------------------------------------- */

export const tenantCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  identityType: z.enum(["CNI", "PASSPORT", "ATTESTATION", "CONSULAR_CARD"]).default("CNI"),
  identityNumber: z.string().trim().min(1, "Le numéro de pièce est obligatoire.").max(60),
  profession: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
  guarantorName: z.string().trim().max(120).optional(),
  guarantorPhone: phoneSchema.optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/* Lease                                                                      */
/* -------------------------------------------------------------------------- */

export const leaseCreateSchema = z.object({
  unitId: z.string().trim().min(1, "Lot obligatoire."),
  tenantId: z.string().trim().min(1, "Locataire obligatoire."),
  leaseType: z.enum(["RESIDENTIAL", "COMMERCIAL", "FURNISHED", "VERBAL_RECORDED"]).default("RESIDENTIAL"),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional().or(z.literal("")),
  rentAmount: positiveMoneySchema,
  chargesAmount: moneySchema.default(0),
  depositAmount: moneySchema.default(0),
  billingFrequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),
  paymentDueDay: z.coerce.number().int().min(1).max(28).default(5),
  gracePeriodDays: z.coerce.number().int().min(0).max(60).default(5),
  lateFeePercentage: z.coerce.number().min(0).max(100).default(5),
});

export const leaseUpdateSchema = leaseCreateSchema.partial();

export const leaseActionSchema = z.object({
  action: z.enum(["terminate", "renew", "notice"]),
  endDate: isoDateSchema.optional(),
  newEndDate: isoDateSchema.optional(),
  reason: z.string().trim().max(1000).optional(),
});

/* -------------------------------------------------------------------------- */
/* Payments / reminders                                                       */
/* -------------------------------------------------------------------------- */

export const paymentCreateSchema = z.object({
  installmentId: z.string().trim().min(1, "Échéance obligatoire."),
  amount: positiveMoneySchema,
  paymentMethod: z.enum(["MOBILE_MONEY", "CASH", "BANK_TRANSFER", "CHECK"]),
  provider: z.enum(["WAVE", "ORANGE_MONEY", "MTN_MOMO", "MOOV", "CINETPAY"]).optional(),
  externalTransactionRef: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const paymentIntentSchema = z.object({
  installmentId: z.string().trim().min(1, "Échéance obligatoire."),
  amount: positiveMoneySchema,
  provider: z.enum(["WAVE", "ORANGE_MONEY", "MTN_MOMO", "MOOV", "CINETPAY"]).optional(),
});

export const reminderCreateSchema = z.object({
  installmentId: z.string().trim().min(1, "Échéance requise."),
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP"]),
  sequence: z.enum(["J_MINUS_3", "DAY_J", "J_PLUS_3", "J_PLUS_7", "NOTICE_OF_DEFAULT"]),
});

export const maintenanceCreateSchema = z.object({
  unitId: z.string().trim().min(1, "Lot obligatoire."),
  title: z.string().trim().min(3, "Le titre est obligatoire.").max(160),
  description: z.string().trim().min(5, "La description est obligatoire.").max(2000),
  category: z.enum(["PLUMBING", "ELECTRICITY", "AC", "MASONRY", "CARPENTRY", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedCost: moneySchema.optional(),
  vendorName: z.string().trim().max(120).optional(),
  vendorPhone: phoneSchema.optional().or(z.literal("")),
  tenantId: z.string().trim().optional(),
});

export const maintenanceUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "QUOTED", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimatedCost: moneySchema.optional(),
  vendorName: z.string().trim().max(120).optional(),
  vendorPhone: phoneSchema.optional().or(z.literal("")),
});

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional().or(z.literal("")),
  avatarUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  password: z.string().min(8).max(200),
  role: z.enum(["AGENCY_ADMIN", "MANAGER", "ACCOUNTANT", "FIELD_AGENT"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type LeaseCreateInput = z.infer<typeof leaseCreateSchema>;
