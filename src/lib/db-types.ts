import type {
  Organization,
  User,
  Building,
  Unit,
  Tenant,
  Lease,
  Installment,
  Payment,
  Receipt,
  MaintenanceTicket,
  ReminderLog,
  AuditLog,
} from "@/types";

/** Reset token: only the SHA-256 hash is ever stored. */
export interface PasswordResetToken {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

/** Shape persisted as a single transactional document. */
export interface DatabaseSchema {
  schemaVersion: number;
  organizations: Organization[];
  users: User[];
  buildings: Building[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  installments: Installment[];
  payments: Payment[];
  receipts: Receipt[];
  tickets: MaintenanceTicket[];
  reminders: ReminderLog[];
  auditLogs: AuditLog[];
  passwordResets: PasswordResetToken[];
  nextReceiptSeq: number;
}
