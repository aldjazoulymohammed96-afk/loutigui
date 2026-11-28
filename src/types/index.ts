export type Currency = 'XOF' | 'EUR' | 'USD';

export type SubscriptionPlanType = 'STARTER' | 'PRO' | 'AGENCE';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: SubscriptionPlanType;
  isTrial: boolean;
  daysRemaining: number;
  isExpired: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionExpiresAt?: string;
  lastPaymentId?: string;
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'AGENCY_ADMIN'
  | 'MANAGER'
  | 'ACCOUNTANT'
  | 'FIELD_AGENT'
  | 'TENANT'
  | 'VENDOR';

export interface Organization {
  id: string;
  name: string;
  countryCode: string; // 'CI', 'SN', etc.
  defaultCurrency: Currency;
  subscriptionPlan: 'STARTER' | 'PRO' | 'AGENCE' | 'DIASPORA' | 'AGENCY' | 'ENTERPRISE';
  subscriptionStatus?: SubscriptionStatus;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionExpiresAt?: string;
  lastPaymentId?: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  isVirgin?: boolean;
  onboardingCompleted?: boolean;
  managementType?: 'OWNER' | 'AGENCY' | 'DIASPORA';
  /** Monotonic per-organisation receipt sequence. */
  receiptSeq?: number;
  /** Date (YYYY-MM-DD) of the last real daily digest email. */
  lastDigestSentOn?: string;
  settings: {
    lateFeePercentage?: number;
    gracePeriodDays?: number;
    autoReminders?: boolean;
    paymentDueDay?: number;
    /** Notification channels used by the reminder engine. */
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    whatsappNotifications?: boolean;
    reminderDaysBefore?: number;
    dailyDigest?: boolean;
    /** Receipt branding / legal mentions. */
    receiptFooter?: string;
    showQrCode?: boolean;
    receiptLanguage?: "fr" | "en";
  };
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  /** scrypt hash. Never exposed by the API. */
  passwordHash?: string;
  /** @deprecated Legacy plaintext password, migrated to passwordHash on load. */
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  /** Incremented on password change/reset to revoke older session cookies. */
  sessionVersion?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  organization: Organization;
  token: string;
}

export interface Building {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
  country: string;
  totalUnits: number;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export type UnitType = 'APARTMENT' | 'STUDIO' | 'VILLA' | 'COMMERCIAL' | 'ROOM' | 'FURNISHED';
export type UnitStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';

export interface Unit {
  id: string;
  organizationId?: string;
  buildingId: string;
  buildingName?: string;
  unitNumber: string;
  type: UnitType;
  surfaceM2: number;
  roomsCount: number;
  rentAmount: number; // in minor units / integer (FCFA)
  chargesAmount: number;
  depositAmount: number;
  status: UnitStatus;
  waterMeter?: string;
  electricityMeter?: string;
  description?: string;
  currentTenantId?: string;
  currentTenantName?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string; // WhatsApp enabled
  email?: string;
  identityType: 'CNI' | 'PASSPORT' | 'ATTESTATION' | 'CONSULAR_CARD';
  identityNumber: string;
  profession?: string;
  employer?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  notes?: string;
  createdAt: string;
}

export type LeaseType = 'RESIDENTIAL' | 'COMMERCIAL' | 'FURNISHED' | 'VERBAL_RECORDED';
export type LeaseStatus = 'ACTIVE' | 'NOTICE_GIVEN' | 'TERMINATED' | 'DRAFT';

export interface Lease {
  id: string;
  organizationId: string;
  unitId: string;
  tenantId: string;
  leaseType: LeaseType;
  status: LeaseStatus;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  chargesAmount: number;
  depositAmount: number;
  billingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  paymentDueDay: number; // e.g. 5
  gracePeriodDays: number; // e.g. 5
  lateFeePercentage: number; // e.g. 5%
  terminationReason?: string;
  createdAt: string;
}

export type InstallmentStatus = 'UPCOMING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Installment {
  id: string;
  organizationId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  tenantName: string;
  tenantPhone: string;
  unitNumber: string;
  buildingName: string;
  periodMonth: number; // 1-12
  periodYear: number;
  periodLabel: string; // e.g. "Novembre 2026"
  dueDate: string; // YYYY-MM-DD
  rentAmount: number;
  chargesAmount: number;
  totalDue: number;
  amountPaid: number;
  remainingDue: number;
  penaltyApplied: number;
  status: InstallmentStatus;
  lastPaymentDate?: string;
  receiptNumber?: string;
  receiptId?: string;
  createdAt: string;
}

export type PaymentMethod = 'MOBILE_MONEY' | 'CASH' | 'BANK_TRANSFER' | 'CHECK';
export type MobileMoneyProvider = 'WAVE' | 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV' | 'CINETPAY';

export interface Payment {
  id: string;
  organizationId: string;
  installmentId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  amount: number;
  currency: Currency;
  exchangeRateToBase: number;
  paymentMethod: PaymentMethod;
  provider?: MobileMoneyProvider;
  externalTransactionRef?: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REVERSED';
  paidAt: string;
  recordedByUserId?: string;
  receiptId?: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  organizationId: string;
  paymentId: string;
  installmentId: string;
  receiptNumber: string; // e.g. QUITT-2026-000142
  verificationHash: string; // unique hash for QR code
  issuedAt: string;
  tenantName: string;
  tenantPhone: string;
  unitNumber: string;
  buildingName: string;
  periodLabel: string;
  amountPaid: number;
  rentAmount: number;
  chargesAmount: number;
  paymentMethod: PaymentMethod;
  provider?: MobileMoneyProvider;
  transactionRef?: string;
  remainingDue: number;
  organizationName: string;
  organizationPhone: string;
  organizationAddress: string;
}

export type TicketCategory = 'PLUMBING' | 'ELECTRICITY' | 'AC' | 'MASONRY' | 'CARPENTRY' | 'OTHER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'QUOTED' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MaintenanceTicket {
  id: string;
  organizationId: string;
  unitId: string;
  unitNumber: string;
  buildingName: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  estimatedCost?: number;
  vendorName?: string;
  vendorPhone?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReminderLog {
  id: string;
  organizationId?: string;
  installmentId: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  sequence: 'J_MINUS_3' | 'DAY_J' | 'J_PLUS_3' | 'J_PLUS_7' | 'NOTICE_OF_DEFAULT';
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  messageBody: string;
  sentAt: string;
}

export interface DashboardStats {
  currency: Currency;
  currentMonthLabel: string;
  expectedRent: number;
  collectedRent: number;
  overdueRent: number;
  collectionRate: number; // percentage (0-100)
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number; // percentage (0-100)
  activeTenantsCount: number;
  pendingTicketsCount: number;
  agingBalance: {
    under30Days: number;
    from30to60Days: number;
    from60to90Days: number;
    over90Days: number;
  };
  recentPayments: Payment[];
  urgentOverdues: Installment[];
}
