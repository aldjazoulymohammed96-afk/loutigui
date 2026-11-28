import crypto from "crypto";
import {
  Organization,
  Building,
  Unit,
  Tenant,
  Lease,
  Installment,
  Payment,
  Receipt,
  MaintenanceTicket,
  ReminderLog,
  DashboardStats,
  Currency,
  User,
  UserRole,
  SubscriptionPlanType,
  SubscriptionStatus,
  SubscriptionInfo,
  AuditLog,
} from "@/types";
import type { DatabaseSchema, PasswordResetToken } from "@/lib/db-types";
import {
  currentDb,
  emptyDatabase,
  markDirty,
  withState,
  type NormalizeResult,
} from "@/lib/db-state";
import { hashPassword, isLegacyPasswordHash, verifyPassword } from "@/lib/password";
import { normalizePlan, planLimit } from "@/lib/plans";

const CURRENT_SCHEMA_VERSION = 2;

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

class DataStore {
  /** Isolated working copy supplied by withState() for the current operation. */
  private get db(): DatabaseSchema {
    return currentDb();
  }

  /** Normalise legacy data before every operation, including password hashing. */
  public normalize(raw: unknown): NormalizeResult {
    if (!raw || typeof raw !== "object") {
      return { db: emptyDatabase(), changed: true };
    }
    return this.migrate(raw as Record<string, unknown>);
  }

  /** The backend always supplies a fresh snapshot for the operation. */
  private ensureFreshData(): void {
    // Nothing to do: state is loaded by withState().
  }

  /**
   * Migrate the legacy single-organisation shape into the multi-tenant shape
   * and hash any plaintext password found in the file.
   */
  private migrate(parsed: Record<string, unknown>): { db: DatabaseSchema; changed: boolean } {
    const base = emptyDatabase();
    let changed = parsed.schemaVersion !== CURRENT_SCHEMA_VERSION;

    let organizations: Organization[] = [];
    if (Array.isArray(parsed.organizations)) {
      organizations = parsed.organizations as Organization[];
    } else if (parsed.organization && typeof parsed.organization === "object") {
      organizations = [parsed.organization as Organization];
      changed = true;
    }

    const rawUsers = Array.isArray(parsed.users) ? (parsed.users as User[]) : [];
    const orgIds = new Set(organizations.map((o) => o.id));
    const users: User[] = [];

    for (const raw of rawUsers) {
      if (!raw || !raw.organizationId || !orgIds.has(raw.organizationId)) {
        // Orphan account (its organisation no longer exists) or demo account:
        // drop it instead of keeping a credential nobody can use.
        changed = true;
        continue;
      }
      const user: User = { ...raw };
      if (user.password && !user.passwordHash) {
        user.passwordHash = hashPassword(user.password);
        changed = true;
      } else if (user.passwordHash && isLegacyPasswordHash(user.passwordHash)) {
        user.passwordHash = hashPassword(user.passwordHash);
        changed = true;
      }
      if (user.password !== undefined) {
        delete user.password;
        changed = true;
      }
      users.push(user);
    }

    // Keep only organisations that still have at least one member.
    const activeOrgIds = new Set(users.map((u) => u.organizationId));
    const keptOrganizations = organizations.filter((o) => activeOrgIds.has(o.id));
    if (keptOrganizations.length !== organizations.length) changed = true;
    organizations = keptOrganizations;

    const assign = <T extends { organizationId?: string }>(items: T[] | undefined): T[] =>
      Array.isArray(items) ? items : [];

    const buildings = assign(parsed.buildings as Building[] | undefined);
    const buildingOrg = new Map(buildings.map((b) => [b.id, b.organizationId]));

    const units = assign(parsed.units as Unit[] | undefined).map((u) => {
      if (!u.organizationId) changed = true;
      return {
        ...u,
        organizationId: u.organizationId || buildingOrg.get(u.buildingId) || organizations[0]?.id,
      };
    });

    const installments = assign(parsed.installments as Installment[] | undefined);
    const installmentOrg = new Map(installments.map((i) => [i.id, i.organizationId]));

    const reminders = assign(parsed.reminders as ReminderLog[] | undefined).map((r) => {
      if (!r.organizationId) changed = true;
      return {
        ...r,
        organizationId: r.organizationId || installmentOrg.get(r.installmentId) || organizations[0]?.id,
      };
    });

    // Drop records that no longer belong to an existing organisation.
    const keep = <T extends { organizationId?: string }>(items: T[]) => {
      const filtered = items.filter((item) => !item.organizationId || activeOrgIds.has(item.organizationId));
      if (filtered.length !== items.length) changed = true;
      return filtered;
    };

    const receipts = assign(parsed.receipts as Receipt[] | undefined);

    const normalizedOrganizations = organizations.map((o) => {
      const normalized = normalizePlan(o.subscriptionPlan);
      // Never restart receipt numbering at 1 over already-issued receipts.
      const maxIssued = receipts
        .filter((r) => r.organizationId === o.id)
        .reduce((max, r) => {
          const match = /-(\d+)\s*$/.exec(r.receiptNumber || "");
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);
      const receiptSeq = Math.max(o.receiptSeq || 0, maxIssued);
      if (normalized !== o.subscriptionPlan || o.receiptSeq !== receiptSeq) changed = true;
      return { ...o, subscriptionPlan: normalized, receiptSeq };
    });

    return {
      changed,
      db: {
        ...base,
        organizations: normalizedOrganizations,
        users,
        buildings: keep(buildings),
        units: keep(units),
        tenants: keep(assign(parsed.tenants as Tenant[] | undefined)),
        leases: keep(assign(parsed.leases as Lease[] | undefined)),
        installments: keep(installments),
        payments: keep(assign(parsed.payments as Payment[] | undefined)),
        receipts: keep(receipts),
        tickets: keep(assign(parsed.tickets as MaintenanceTicket[] | undefined)),
        reminders: keep(reminders),
        auditLogs: assign(parsed.auditLogs as AuditLog[] | undefined),
        passwordResets: Array.isArray(parsed.passwordResets)
          ? (parsed.passwordResets as PasswordResetToken[])
          : [],
        nextReceiptSeq:
          typeof parsed.nextReceiptSeq === "number" ? (parsed.nextReceiptSeq as number) : 1,
      },
    };
  }

  /** The backend commits the document when the whole operation succeeded. */
  private markChanged(): void {
    markDirty();
  }

  /* ---------------------------------------------------------------------- */
  /* Organisations                                                          */
  /* ---------------------------------------------------------------------- */

  public getOrganizations(): Organization[] {
    this.ensureFreshData();
    return this.db.organizations;
  }

  public getOrganizationById(orgId: string): Organization | undefined {
    this.ensureFreshData();
    return this.db.organizations.find((o) => o.id === orgId);
  }

  public getOrganization(orgId: string): Organization {
    const org = this.getOrganizationById(orgId);
    if (!org) throw new Error("Organisation introuvable.");
    return org;
  }

  public updateOrganization(orgId: string, updates: Partial<Organization>): Organization {
    const org = this.getOrganization(orgId);
    Object.assign(org, updates);
    this.markChanged();
    return org;
  }

  public getSubscriptionInfo(orgId: string): SubscriptionInfo {
    const org = this.getOrganization(orgId);
    const now = new Date();

    if (!org.trialStartDate) {
      org.trialStartDate = org.createdAt || now.toISOString();
    }
    if (!org.trialEndDate) {
      const start = new Date(org.trialStartDate).getTime();
      org.trialEndDate = new Date(start + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    let status: SubscriptionStatus = "TRIAL";
    let daysRemaining = 0;
    let isExpired = false;

    if (org.subscriptionExpiresAt && new Date(org.subscriptionExpiresAt) > now) {
      status = "ACTIVE";
      daysRemaining = Math.max(
        0,
        Math.ceil((new Date(org.subscriptionExpiresAt).getTime() - now.getTime()) / 86_400_000)
      );
    } else if (org.trialEndDate && new Date(org.trialEndDate) > now) {
      status = "TRIAL";
      daysRemaining = Math.max(
        0,
        Math.ceil((new Date(org.trialEndDate).getTime() - now.getTime()) / 86_400_000)
      );
    } else {
      status = "EXPIRED";
      isExpired = true;
    }

    org.subscriptionStatus = status;

    return {
      status,
      plan: normalizePlan(org.subscriptionPlan),
      isTrial: status === "TRIAL",
      daysRemaining,
      isExpired,
      trialStartDate: org.trialStartDate,
      trialEndDate: org.trialEndDate,
      subscriptionExpiresAt: org.subscriptionExpiresAt,
      lastPaymentId: org.lastPaymentId,
    };
  }

  public activateSubscription(
    orgId: string,
    plan: SubscriptionPlanType,
    paymentRef?: string,
    durationDays: number = 30
  ): Organization {
    const org = this.getOrganization(orgId);
    const expiresAt = new Date(Date.now() + durationDays * 86_400_000).toISOString();
    org.subscriptionPlan = plan;
    org.subscriptionStatus = "ACTIVE";
    org.subscriptionExpiresAt = expiresAt;
    if (paymentRef) org.lastPaymentId = paymentRef;
    this.markChanged();
    return org;
  }

  /** Refuse writes that would exceed the organisation's plan quota. */
  public assertUnitQuota(orgId: string): void {
    if (this.getSubscriptionInfo(orgId).isExpired) {
      throw new Error("Votre abonnement a expiré. Renouvelez-le pour continuer.");
    }
    const org = this.getOrganization(orgId);
    const limits = planLimit(normalizePlan(org.subscriptionPlan));
    const count = this.getUnits(orgId).length;
    if (Number.isFinite(limits.units) && count >= limits.units) {
      throw new Error(
        `Votre forfait ${limits.label} est limité à ${limits.units} lots. Passez à un forfait supérieur pour en ajouter.`
      );
    }
  }

  public assertUserQuota(orgId: string): void {
    if (this.getSubscriptionInfo(orgId).isExpired) {
      throw new Error("Votre abonnement a expiré. Renouvelez-le pour continuer.");
    }
    const org = this.getOrganization(orgId);
    const limits = planLimit(normalizePlan(org.subscriptionPlan));
    const count = this.getUsers(orgId).length;
    if (Number.isFinite(limits.users) && count >= limits.users) {
      throw new Error(
        `Votre forfait ${limits.label} est limité à ${limits.users} utilisateur(s). Passez à un forfait supérieur.`
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Users & authentication                                                 */
  /* ---------------------------------------------------------------------- */

  public getUsers(orgId?: string): User[] {
    this.ensureFreshData();
    if (!orgId) return this.db.users;
    return this.db.users.filter((u) => u.organizationId === orgId);
  }

  public getUserById(id: string): User | undefined {
    this.ensureFreshData();
    return this.db.users.find((u) => u.id === id);
  }

  public findUserByIdentifier(identifier: string): User | undefined {
    this.ensureFreshData();
    const clean = identifier.trim().toLowerCase();
    const digits = identifier.replace(/[^0-9]/g, "");
    return this.db.users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === clean) ||
        (digits.length > 0 && u.phone.replace(/[^0-9]/g, "") === digits)
    );
  }

  public createUser(
    orgId: string,
    params: {
      name: string;
      phone: string;
      email?: string;
      password: string;
      role: UserRole;
    }
  ): User {
    this.assertUserQuota(orgId);
    if (this.findUserByIdentifier(params.phone) || (params.email && this.findUserByIdentifier(params.email))) {
      throw new Error("Un compte existe déjà avec ce numéro ou cet email.");
    }
    const user: User = {
      id: `usr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      organizationId: orgId,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: params.email?.trim() || undefined,
      passwordHash: hashPassword(params.password),
      role: params.role,
      createdAt: new Date().toISOString(),
    };
    this.db.users.push(user);
    this.markChanged();
    return user;
  }

  public updateUser(
    orgId: string,
    id: string,
    updates: Pick<Partial<User>, "name" | "phone" | "email" | "avatarUrl">
  ): User {
    const user = this.db.users.find((u) => u.id === id && u.organizationId === orgId);
    if (!user) throw new Error("Utilisateur introuvable.");

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name) throw new Error("Le nom est obligatoire.");
      user.name = name;
    }
    if (updates.phone !== undefined) {
      const phone = updates.phone.trim();
      if (!phone) throw new Error("Le téléphone est obligatoire.");
      const duplicate = this.findUserByIdentifier(phone);
      if (duplicate && duplicate.id !== user.id) {
        throw new Error("Ce numéro de téléphone est déjà utilisé.");
      }
      user.phone = phone;
    }
    if (updates.email !== undefined) {
      const email = updates.email.trim();
      if (email) {
        const duplicate = this.findUserByIdentifier(email);
        if (duplicate && duplicate.id !== user.id) {
          throw new Error("Cette adresse email est déjà utilisée.");
        }
      }
      user.email = email || undefined;
    }
    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl.trim() || undefined;
    }
    this.markChanged();
    return user;
  }

  public deleteUser(orgId: string, id: string): void {
    const orgUsers = this.getUsers(orgId);
    const target = orgUsers.find((u) => u.id === id);
    if (!target) throw new Error("Utilisateur introuvable.");
    const owners = orgUsers.filter((u) => u.role === "OWNER" || u.role === "AGENCY_ADMIN");
    if ((target.role === "OWNER" || target.role === "AGENCY_ADMIN") && owners.length <= 1) {
      throw new Error("Impossible de supprimer le dernier administrateur de l'organisation.");
    }
    this.db.users = this.db.users.filter((u) => u.id !== id);
    this.markChanged();
  }

  public changePassword(id: string, currentPassword: string, newPassword: string): void {
    this.ensureFreshData();
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new Error("Utilisateur introuvable.");
    if (!verifyPassword(currentPassword, user.passwordHash || user.password)) {
      throw new Error("Mot de passe actuel incorrect.");
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    }
    user.passwordHash = hashPassword(newPassword);
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    delete user.password;
    this.markChanged();
  }

  /** Create a single-use, one-hour password reset token (stored hashed). */
  public createPasswordReset(userId: string): { token: string; expiresAt: string } {
    this.ensureFreshData();
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    // Invalidate previous unused tokens for this user.
    this.db.passwordResets = this.db.passwordResets.filter((r) => r.userId !== userId || r.usedAt);
    this.db.passwordResets.push({ tokenHash, userId, expiresAt });
    this.markChanged();
    return { token, expiresAt };
  }

  public resetPasswordWithToken(token: string, newPassword: string): User {
    this.ensureFreshData();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = this.db.passwordResets.find((r) => r.tokenHash === tokenHash);
    if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
      throw new Error("Lien de réinitialisation invalide ou expiré.");
    }
    const user = this.getUserById(record.userId);
    if (!user) throw new Error("Utilisateur introuvable.");
    user.passwordHash = hashPassword(newPassword);
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    delete user.password;
    record.usedAt = new Date().toISOString();
    this.markChanged();
    return user;
  }

  public register(params: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    role?: UserRole;
    managementType?: "OWNER" | "AGENCY" | "DIASPORA";
  }): { user: User; organization: Organization } {
    if (this.findUserByIdentifier(params.phone) || (params.email && this.findUserByIdentifier(params.email))) {
      throw new Error("Un compte existe déjà avec ce numéro ou cet email.");
    }

    const nowIso = new Date().toISOString();
    const trialEndIso = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const orgId = `org-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const role: UserRole =
      params.role === "AGENCY_ADMIN" ? "AGENCY_ADMIN" : "OWNER";

    const organization: Organization = {
      id: orgId,
      name: `Patrimoine de ${params.name}`,
      countryCode: "CI",
      defaultCurrency: "XOF",
      subscriptionPlan: "STARTER",
      subscriptionStatus: "TRIAL",
      trialStartDate: nowIso,
      trialEndDate: trialEndIso,
      phone: params.phone,
      email: params.email || "",
      address: "Abidjan, Côte d'Ivoire",
      isVirgin: true,
      onboardingCompleted: false,
      managementType: params.managementType || (role === "AGENCY_ADMIN" ? "AGENCY" : "OWNER"),
      receiptSeq: 0,
      settings: {
        lateFeePercentage: 5,
        gracePeriodDays: 5,
        autoReminders: true,
        paymentDueDay: 5,
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: true,
        reminderDaysBefore: 3,
        dailyDigest: false,
        showQrCode: true,
        receiptLanguage: "fr",
      },
      createdAt: nowIso,
    };

    const user: User = {
      id: `usr-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      organizationId: orgId,
      name: params.name.trim(),
      phone: params.phone.trim(),
      email: params.email?.trim() || undefined,
      passwordHash: hashPassword(params.password),
      role,
      createdAt: nowIso,
    };

    this.db.organizations.push(organization);
    this.db.users.push(user);
    this.markChanged();
    return { user, organization };
  }

  public login(
    identifier: string,
    password?: string
  ): { user: User; organization: Organization } | null {
    const user = this.findUserByIdentifier(identifier);
    if (!user || !password) return null;
    if (!verifyPassword(password, user.passwordHash || user.password)) return null;

    // Opportunistic migration of a legacy plaintext password.
    if (user.password || isLegacyPasswordHash(user.passwordHash)) {
      user.passwordHash = hashPassword(password);
      delete user.password;
      this.markChanged();
    }

    const organization = this.getOrganizationById(user.organizationId);
    if (!organization) return null;
    return { user, organization };
  }

  public completeOnboarding(
    orgId: string,
    params: {
      orgName: string;
      countryCode: string;
      defaultCurrency: Currency;
      managementType: "OWNER" | "AGENCY" | "DIASPORA";
      paymentDueDay?: number;
      gracePeriodDays?: number;
      lateFeePercentage?: number;
      startEmpty?: boolean;
    }
  ): Organization {
    const org = this.getOrganization(orgId);
    if (params.startEmpty && org.onboardingCompleted === true) {
      throw new Error("Le nettoyage initial n'est autorisé qu'une seule fois.");
    }
    org.name = params.orgName || org.name;
    org.countryCode = params.countryCode || "CI";
    org.defaultCurrency = params.defaultCurrency || "XOF";
    org.managementType = params.managementType || "OWNER";
    org.onboardingCompleted = true;
    org.settings = {
      ...org.settings,
      paymentDueDay: params.paymentDueDay || 5,
      gracePeriodDays: params.gracePeriodDays ?? 5,
      lateFeePercentage: params.lateFeePercentage ?? 5,
    };

    if (params.startEmpty) {
      this.clearOrganizationData(orgId);
    }

    this.markChanged();
    return org;
  }

  public clearOrganizationData(orgId: string): void {
    this.db.buildings = this.db.buildings.filter((b) => b.organizationId !== orgId);
    this.db.units = this.db.units.filter((u) => u.organizationId !== orgId);
    this.db.tenants = this.db.tenants.filter((t) => t.organizationId !== orgId);
    this.db.leases = this.db.leases.filter((l) => l.organizationId !== orgId);
    this.db.installments = this.db.installments.filter((i) => i.organizationId !== orgId);
    this.db.payments = this.db.payments.filter((p) => p.organizationId !== orgId);
    this.db.receipts = this.db.receipts.filter((r) => r.organizationId !== orgId);
    this.db.tickets = this.db.tickets.filter((t) => t.organizationId !== orgId);
    this.db.reminders = this.db.reminders.filter((r) => r.organizationId !== orgId);
    const org = this.getOrganizationById(orgId);
    if (org) {
      org.isVirgin = true;
      org.receiptSeq = 0;
    }
    this.markChanged();
  }

  /* ---------------------------------------------------------------------- */
  /* Buildings & units                                                      */
  /* ---------------------------------------------------------------------- */

  public getBuildings(orgId: string): Building[] {
    this.ensureFreshData();
    return this.db.buildings.filter((b) => b.organizationId === orgId);
  }

  public getBuilding(orgId: string, id: string): Building | undefined {
    return this.getBuildings(orgId).find((b) => b.id === id);
  }

  public createBuilding(
    orgId: string,
    data: Omit<Building, "id" | "createdAt" | "organizationId" | "totalUnits">
  ): Building {
    const building: Building = {
      ...data,
      organizationId: orgId,
      id: `bld-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      totalUnits: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.buildings.unshift(building);
    this.markChanged();
    return building;
  }

  public updateBuilding(orgId: string, id: string, data: Partial<Building>): Building {
    const building = this.getBuilding(orgId, id);
    if (!building) throw new Error("Immeuble introuvable.");
    const allowed: (keyof Building)[] = [
      "name", "address", "city", "neighborhood", "country", "imageUrl", "description",
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        (building as unknown as Record<string, unknown>)[key] = data[key];
      }
    }
    this.markChanged();
    return building;
  }

  public deleteBuilding(orgId: string, id: string): void {
    const building = this.getBuilding(orgId, id);
    if (!building) throw new Error("Immeuble introuvable.");
    const units = this.getUnits(orgId).filter((u) => u.buildingId === id);
    if (units.length > 0) {
      throw new Error("Supprimez d'abord les lots de cet immeuble.");
    }
    this.db.buildings = this.db.buildings.filter((b) => b.id !== id);
    this.markChanged();
  }

  public getUnits(orgId: string): Unit[] {
    this.ensureFreshData();
    return this.db.units.filter((u) => u.organizationId === orgId);
  }

  public getUnit(orgId: string, id: string): Unit | undefined {
    return this.getUnits(orgId).find((u) => u.id === id);
  }

  public createUnit(
    orgId: string,
    data: Omit<Unit, "id" | "createdAt" | "organizationId" | "status"> & {
      status?: Unit["status"];
    }
  ): Unit {
    const building = this.getBuilding(orgId, data.buildingId);
    if (!building) throw new Error("Immeuble introuvable.");
    this.assertUnitQuota(orgId);

    const unit: Unit = {
      ...data,
      organizationId: orgId,
      buildingName: building.name,
      id: `unit-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      status: data.status || "VACANT",
      createdAt: new Date().toISOString(),
    };
    this.db.units.unshift(unit);
    building.totalUnits = this.getUnits(orgId).filter((u) => u.buildingId === building.id).length;
    this.markChanged();
    return unit;
  }

  public updateUnit(orgId: string, id: string, data: Partial<Unit>): Unit {
    const unit = this.getUnit(orgId, id);
    if (!unit) throw new Error("Lot introuvable.");
    const allowed: (keyof Unit)[] = [
      "unitNumber", "type", "surfaceM2", "roomsCount", "rentAmount", "chargesAmount",
      "depositAmount", "status", "waterMeter", "electricityMeter", "description",
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        (unit as unknown as Record<string, unknown>)[key] = data[key];
      }
    }
    this.markChanged();
    return unit;
  }

  public deleteUnit(orgId: string, id: string): void {
    const unit = this.getUnit(orgId, id);
    if (!unit) throw new Error("Lot introuvable.");
    const activeLease = this.getLeases(orgId).find((l) => l.unitId === id && l.status === "ACTIVE");
    if (activeLease) throw new Error("Ce lot est lié à un bail actif. Résiliez le bail d'abord.");
    this.db.units = this.db.units.filter((u) => u.id !== id);
    const building = this.getBuilding(orgId, unit.buildingId);
    if (building) {
      building.totalUnits = this.getUnits(orgId).filter((u) => u.buildingId === building.id).length;
    }
    this.markChanged();
  }

  /* ---------------------------------------------------------------------- */
  /* Tenants                                                                */
  /* ---------------------------------------------------------------------- */

  public getTenants(orgId: string): Tenant[] {
    this.ensureFreshData();
    return this.db.tenants.filter((t) => t.organizationId === orgId);
  }

  public getTenant(orgId: string, id: string): Tenant | undefined {
    return this.getTenants(orgId).find((t) => t.id === id);
  }

  public createTenant(
    orgId: string,
    data: Omit<Tenant, "id" | "createdAt" | "organizationId">
  ): Tenant {
    const tenant: Tenant = {
      ...data,
      organizationId: orgId,
      id: `tnt-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      createdAt: new Date().toISOString(),
    };
    this.db.tenants.unshift(tenant);
    const org = this.getOrganization(orgId);
    org.isVirgin = false;
    this.markChanged();
    return tenant;
  }

  public updateTenant(orgId: string, id: string, data: Partial<Tenant>): Tenant {
    const tenant = this.getTenant(orgId, id);
    if (!tenant) throw new Error("Locataire introuvable.");
    const allowed: (keyof Tenant)[] = [
      "firstName", "lastName", "phone", "email", "identityType", "identityNumber",
      "profession", "employer", "emergencyContactName", "emergencyContactPhone",
      "guarantorName", "guarantorPhone", "notes",
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        (tenant as unknown as Record<string, unknown>)[key] = data[key];
      }
    }
    // Keep denormalised names in sync on units and unpaid installments.
    const fullName = `${tenant.firstName} ${tenant.lastName}`;
    for (const unit of this.db.units.filter((u) => u.currentTenantId === id)) {
      unit.currentTenantName = fullName;
    }
    for (const inst of this.db.installments.filter((i) => i.tenantId === id && i.organizationId === orgId)) {
      inst.tenantName = fullName;
      inst.tenantPhone = tenant.phone;
    }
    this.markChanged();
    return tenant;
  }

  public deleteTenant(orgId: string, id: string): void {
    const tenant = this.getTenant(orgId, id);
    if (!tenant) throw new Error("Locataire introuvable.");
    const activeLease = this.getLeases(orgId).find((l) => l.tenantId === id && l.status === "ACTIVE");
    if (activeLease) throw new Error("Ce locataire a un bail actif. Résiliez le bail d'abord.");
    this.db.tenants = this.db.tenants.filter((t) => t.id !== id);
    for (const unit of this.db.units) {
      if (unit.currentTenantId === id) {
        unit.currentTenantId = undefined;
        unit.currentTenantName = undefined;
        unit.status = "VACANT";
      }
    }
    this.markChanged();
  }

  /* ---------------------------------------------------------------------- */
  /* Leases & installments                                                  */
  /* ---------------------------------------------------------------------- */

  public getLeases(orgId: string): Lease[] {
    this.ensureFreshData();
    return this.db.leases.filter((l) => l.organizationId === orgId);
  }

  public getLease(orgId: string, id: string): Lease | undefined {
    return this.getLeases(orgId).find((l) => l.id === id);
  }

  public createLease(
    orgId: string,
    data: Omit<Lease, "id" | "createdAt" | "organizationId" | "status">
  ): Lease {
    const unit = this.getUnit(orgId, data.unitId);
    if (!unit) throw new Error("Lot introuvable.");
    const tenant = this.getTenant(orgId, data.tenantId);
    if (!tenant) throw new Error("Locataire introuvable.");
    if (this.getLeases(orgId).some((l) => l.unitId === data.unitId && l.status === "ACTIVE")) {
      throw new Error("Ce lot est déjà occupé par un bail actif.");
    }

    const lease: Lease = {
      ...data,
      organizationId: orgId,
      id: `lease-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    this.db.leases.unshift(lease);

    unit.status = "OCCUPIED";
    unit.currentTenantId = tenant.id;
    unit.currentTenantName = `${tenant.firstName} ${tenant.lastName}`;

    const now = new Date();
    this.generateMonthlyInstallments(orgId, now.getFullYear(), now.getMonth() + 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    this.generateMonthlyInstallments(orgId, next.getFullYear(), next.getMonth() + 1);

    const org = this.getOrganization(orgId);
    org.isVirgin = false;
    this.markChanged();
    return lease;
  }

  public updateLease(orgId: string, id: string, data: Partial<Lease>): Lease {
    const lease = this.getLease(orgId, id);
    if (!lease) throw new Error("Bail introuvable.");
    const allowed: (keyof Lease)[] = [
      "leaseType", "startDate", "endDate", "rentAmount", "chargesAmount", "depositAmount",
      "billingFrequency", "paymentDueDay", "gracePeriodDays", "lateFeePercentage",
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        (lease as unknown as Record<string, unknown>)[key] = data[key];
      }
    }
    this.markChanged();
    return lease;
  }

  public terminateLease(orgId: string, id: string, endDate?: string, reason?: string): Lease {
    const lease = this.getLease(orgId, id);
    if (!lease) throw new Error("Bail introuvable.");
    if (lease.status === "TERMINATED") return lease;
    lease.status = "TERMINATED";
    lease.endDate = endDate || new Date().toISOString().slice(0, 10);
    if (reason) lease.terminationReason = reason;
    const unit = this.getUnit(orgId, lease.unitId);
    if (unit) {
      unit.status = "VACANT";
      unit.currentTenantId = undefined;
      unit.currentTenantName = undefined;
    }
    // Cancel future unpaid installments.
    const today = new Date().toISOString().slice(0, 10);
    for (const inst of this.db.installments) {
      if (inst.organizationId === orgId && inst.leaseId === id && inst.remainingDue > 0 && inst.dueDate > today) {
        inst.status = "CANCELLED";
      }
    }
    this.markChanged();
    return lease;
  }

  public renewLease(orgId: string, id: string, newEndDate: string): Lease {
    const lease = this.getLease(orgId, id);
    if (!lease) throw new Error("Bail introuvable.");
    lease.endDate = newEndDate;
    lease.status = "ACTIVE";
    const unit = this.getUnit(orgId, lease.unitId);
    const tenant = this.getTenant(orgId, lease.tenantId);
    if (unit && tenant) {
      unit.status = "OCCUPIED";
      unit.currentTenantId = tenant.id;
      unit.currentTenantName = `${tenant.firstName} ${tenant.lastName}`;
    }
    this.markChanged();
    return lease;
  }

  public getInstallments(orgId: string, status?: string): Installment[] {
    this.ensureFreshData();
    const list = this.db.installments.filter((i) => i.organizationId === orgId);
    if (status && status !== "ALL") return list.filter((i) => i.status === status);
    return list;
  }

  public getInstallment(orgId: string, id: string): Installment | undefined {
    return this.getInstallments(orgId).find((i) => i.id === id);
  }

  /**
   * Create the missing installments for a given month for every active lease.
   * Idempotent: calling it twice never duplicates an échéance.
   */
  public generateMonthlyInstallments(orgId: string, year: number, month: number): Installment[] {
    this.ensureFreshData();
    const created: Installment[] = [];
    const periodStart = new Date(year, month - 1, 1);
    const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
    const today = startOfDay(new Date());

    for (const lease of this.getLeases(orgId)) {
      if (lease.status !== "ACTIVE") continue;
      const leaseStart = new Date(`${lease.startDate}T00:00:00`);
      if (Number.isNaN(leaseStart.getTime()) || leaseStart > new Date(year, month - 1, 28, 23, 59, 59)) {
        continue;
      }
      if (lease.endDate) {
        const leaseEnd = new Date(`${lease.endDate}T00:00:00`);
        if (!Number.isNaN(leaseEnd.getTime()) && leaseEnd < periodStart) continue;
      }
      const exists = this.db.installments.some(
        (i) =>
          i.organizationId === orgId &&
          i.leaseId === lease.id &&
          i.periodYear === year &&
          i.periodMonth === month
      );
      if (exists) continue;

      const unit = this.getUnit(orgId, lease.unitId);
      const tenant = this.getTenant(orgId, lease.tenantId);
      if (!unit || !tenant) continue;

      const dueDay = Math.min(Math.max(lease.paymentDueDay || 5, 1), 28);
      const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
      const totalDue = lease.rentAmount + lease.chargesAmount;
      const isPast = new Date(`${dueDate}T00:00:00`) < today;

      const installment: Installment = {
        id: `inst-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        organizationId: orgId,
        leaseId: lease.id,
        tenantId: tenant.id,
        unitId: unit.id,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        tenantPhone: tenant.phone,
        unitNumber: unit.unitNumber,
        buildingName: unit.buildingName || "Immeuble",
        periodMonth: month,
        periodYear: year,
        periodLabel,
        dueDate,
        rentAmount: lease.rentAmount,
        chargesAmount: lease.chargesAmount,
        totalDue,
        amountPaid: 0,
        remainingDue: totalDue,
        penaltyApplied: 0,
        status: isPast ? "OVERDUE" : "UPCOMING",
        createdAt: new Date().toISOString(),
      };
      this.db.installments.unshift(installment);
      created.push(installment);
    }

    if (created.length > 0) this.markChanged();
    return created;
  }

  /**
   * Daily maintenance: UPCOMING → OVERDUE, apply the late fee once after the
   * grace period, and keep amounts consistent. Safe to call repeatedly.
   */
  public refreshInstallmentStatuses(orgId: string): void {
    this.ensureFreshData();
    const org = this.getOrganization(orgId);
    const today = startOfDay(new Date());
    let changed = false;

    for (const inst of this.db.installments) {
      if (inst.organizationId !== orgId) continue;
      if (inst.status === "PAID" || inst.status === "CANCELLED") continue;

      const due = new Date(`${inst.dueDate}T00:00:00`);
      if (Number.isNaN(due.getTime())) continue;

      if (due < today && inst.status === "UPCOMING") {
        inst.status = "OVERDUE";
        changed = true;
      }

      if (due < today && inst.penaltyApplied === 0 && inst.remainingDue > 0) {
        const lease = this.getLease(orgId, inst.leaseId);
        const graceDays = lease?.gracePeriodDays ?? org.settings.gracePeriodDays ?? 5;
        const penaltyPct = lease?.lateFeePercentage ?? org.settings.lateFeePercentage ?? 5;
        if (daysBetween(today, due) > graceDays && penaltyPct > 0) {
          const penalty = Math.round((inst.remainingDue * penaltyPct) / 100);
          if (penalty > 0) {
            inst.penaltyApplied = penalty;
            inst.totalDue += penalty;
            inst.remainingDue += penalty;
            changed = true;
          }
        }
      }
    }

    if (changed) this.markChanged();
  }

  /* ---------------------------------------------------------------------- */
  /* Payments & receipts                                                    */
  /* ---------------------------------------------------------------------- */

  public recordPayment(
    orgId: string,
    params: {
      installmentId: string;
      amount: number;
      paymentMethod: Payment["paymentMethod"];
      provider?: Payment["provider"];
      externalTransactionRef?: string;
      notes?: string;
      recordedByUserId?: string;
    }
  ): { payment: Payment; receipt: Receipt; installment: Installment } {
    this.ensureFreshData();
    const installment = this.getInstallment(orgId, params.installmentId);
    if (!installment) throw new Error("Échéance introuvable.");
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      throw new Error("Le montant du règlement doit être supérieur à 0.");
    }
    if (installment.status === "PAID" || Number(installment.remainingDue) <= 0) {
      throw new Error("Cette échéance est déjà entièrement réglée.");
    }

    const effectiveAmount = Math.min(params.amount, Number(installment.remainingDue) || 0);
    const org = this.getOrganization(orgId);
    const now = new Date().toISOString();
    const payId = `pay-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const rcptId = `rcpt-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

    org.receiptSeq = (org.receiptSeq || 0) + 1;
    const receiptNumber = `QUITT-${new Date().getFullYear()}-${String(org.receiptSeq).padStart(6, "0")}`;
    const verificationHash = crypto.randomBytes(24).toString("base64url");

    const payment: Payment = {
      id: payId,
      organizationId: orgId,
      installmentId: installment.id,
      leaseId: installment.leaseId,
      tenantId: installment.tenantId,
      unitId: installment.unitId,
      amount: effectiveAmount,
      currency: "XOF",
      exchangeRateToBase: 1,
      paymentMethod: params.paymentMethod,
      provider: params.provider,
      externalTransactionRef: params.externalTransactionRef || `TX-${Date.now()}`,
      status: "CONFIRMED",
      paidAt: now,
      recordedByUserId: params.recordedByUserId,
      receiptNumber,
      receiptId: rcptId,
      notes: params.notes,
      createdAt: now,
    };

    installment.amountPaid = Number(installment.amountPaid || 0) + effectiveAmount;
    installment.remainingDue = Math.max(0, installment.totalDue - installment.amountPaid);
    installment.lastPaymentDate = now;
    installment.receiptNumber = receiptNumber;
    installment.receiptId = rcptId;
    installment.status = installment.remainingDue === 0 ? "PAID" : "PARTIAL";

    const receipt: Receipt = {
      id: rcptId,
      organizationId: orgId,
      paymentId: payId,
      installmentId: installment.id,
      receiptNumber,
      verificationHash,
      issuedAt: now,
      tenantName: installment.tenantName,
      tenantPhone: installment.tenantPhone,
      unitNumber: installment.unitNumber,
      buildingName: installment.buildingName,
      periodLabel: installment.periodLabel,
      amountPaid: effectiveAmount,
      rentAmount: installment.rentAmount,
      chargesAmount: installment.chargesAmount,
      paymentMethod: params.paymentMethod,
      provider: params.provider,
      transactionRef: payment.externalTransactionRef,
      remainingDue: installment.remainingDue,
      organizationName: org.name,
      organizationPhone: org.phone,
      organizationAddress: org.address,
    };

    this.db.payments.unshift(payment);
    this.db.receipts.unshift(receipt);
    this.markChanged();
    return { payment, receipt, installment };
  }

  public getPayments(orgId: string): Payment[] {
    this.ensureFreshData();
    return this.db.payments.filter((p) => p.organizationId === orgId);
  }

  public getReceipts(orgId: string): Receipt[] {
    this.ensureFreshData();
    return this.db.receipts.filter((r) => r.organizationId === orgId);
  }

  public getReceiptById(orgId: string, id: string): Receipt | undefined {
    return this.getReceipts(orgId).find((r) => r.id === id);
  }

  /** Public verification endpoint: a hash is unguessable and acts as the key. */
  public getReceiptByHash(hash: string): Receipt | undefined {
    this.ensureFreshData();
    return this.db.receipts.find((r) => r.verificationHash === hash);
  }

  /* ---------------------------------------------------------------------- */
  /* Maintenance                                                            */
  /* ---------------------------------------------------------------------- */

  public getTickets(orgId: string): MaintenanceTicket[] {
    this.ensureFreshData();
    return this.db.tickets.filter((t) => t.organizationId === orgId);
  }

  public createTicket(
    orgId: string,
    data: Omit<MaintenanceTicket, "id" | "createdAt" | "status" | "organizationId">
  ): MaintenanceTicket {
    const unit = this.getUnit(orgId, data.unitId);
    if (!unit) throw new Error("Lot introuvable.");
    const ticket: MaintenanceTicket = {
      ...data,
      organizationId: orgId,
      unitNumber: unit.unitNumber,
      buildingName: unit.buildingName || "Immeuble",
      id: `tkt-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    this.db.tickets.unshift(ticket);
    this.markChanged();
    return ticket;
  }

  public updateTicket(
    orgId: string,
    id: string,
    data: Partial<Pick<MaintenanceTicket, "status" | "priority" | "estimatedCost" | "vendorName" | "vendorPhone">>
  ): MaintenanceTicket {
    const ticket = this.db.tickets.find((t) => t.id === id && t.organizationId === orgId);
    if (!ticket) throw new Error("Ticket introuvable.");
    if (data.status !== undefined) {
      ticket.status = data.status;
      if (data.status === "RESOLVED") ticket.resolvedAt = new Date().toISOString();
    }
    if (data.priority !== undefined) ticket.priority = data.priority;
    if (data.estimatedCost !== undefined) ticket.estimatedCost = data.estimatedCost;
    if (data.vendorName !== undefined) ticket.vendorName = data.vendorName;
    if (data.vendorPhone !== undefined) ticket.vendorPhone = data.vendorPhone;
    this.markChanged();
    return ticket;
  }

  public deleteTicket(orgId: string, id: string): void {
    const exists = this.db.tickets.some((t) => t.id === id && t.organizationId === orgId);
    if (!exists) throw new Error("Ticket introuvable.");
    this.db.tickets = this.db.tickets.filter((t) => t.id !== id);
    this.markChanged();
  }

  /* ---------------------------------------------------------------------- */
  /* Reminders & audit                                                      */
  /* ---------------------------------------------------------------------- */

  public getReminders(orgId: string): ReminderLog[] {
    this.ensureFreshData();
    return this.db.reminders.filter((r) => r.organizationId === orgId);
  }

  public logReminder(
    orgId: string,
    data: Omit<ReminderLog, "id" | "sentAt" | "status" | "organizationId"> & {
      status?: ReminderLog["status"];
    }
  ): ReminderLog {
    this.ensureFreshData();
    const { status = "SENT", ...details } = data;
    const reminder: ReminderLog = {
      ...details,
      organizationId: orgId,
      id: `rem-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      status,
      sentAt: new Date().toISOString(),
    };
    this.db.reminders.unshift(reminder);
    this.markChanged();
    return reminder;
  }

  public audit(input: {
    organizationId: string;
    userId?: string;
    userEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
  }): void {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      organizationId: input.organizationId,
      userId: input.userId,
      userEmail: input.userEmail,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
      ip: input.ip,
      createdAt: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(entry);
    // Keep the journal bounded to protect the JSON store.
    if (this.db.auditLogs.length > 10_000) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 10_000);
    }
    this.markChanged();
  }

  public getAuditLogs(orgId: string): AuditLog[] {
    this.ensureFreshData();
    return this.db.auditLogs.filter((a) => a.organizationId === orgId);
  }

  /* ---------------------------------------------------------------------- */
  /* Dashboard                                                              */
  /* ---------------------------------------------------------------------- */

  public getDashboardStats(orgId: string, currency: Currency = "XOF"): DashboardStats {
    this.ensureFreshData();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${currentYear}`;

    const installments = this.getInstallments(orgId);
    const monthInstallments = installments.filter(
      (i) => i.periodMonth === currentMonth && i.periodYear === currentYear
    );
    const activeInstallments = monthInstallments.length > 0 ? monthInstallments : installments;

    const expectedRent = activeInstallments.reduce((acc, i) => acc + i.totalDue, 0);
    const collectedRent = activeInstallments.reduce((acc, i) => acc + i.amountPaid, 0);
    const overdueRent = installments
      .filter((i) => i.remainingDue > 0 && i.status !== "PAID" && i.status !== "CANCELLED")
      .reduce((acc, i) => acc + i.remainingDue, 0);

    const collectionRate = expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0;

    const units = this.getUnits(orgId);
    const totalUnits = units.length;
    const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const activeTenantsCount = this.getLeases(orgId).filter((l) => l.status === "ACTIVE").length;
    const pendingTicketsCount = this.getTickets(orgId).filter((t) => t.status !== "RESOLVED").length;

    const today = startOfDay(now);
    const agingBalance = { under30Days: 0, from30to60Days: 0, from60to90Days: 0, over90Days: 0 };
    for (const inst of installments) {
      if (inst.remainingDue <= 0 || inst.status === "PAID" || inst.status === "CANCELLED") continue;
      const due = new Date(`${inst.dueDate}T00:00:00`);
      if (Number.isNaN(due.getTime()) || due >= today) continue;
      const lateDays = daysBetween(today, due);
      if (lateDays <= 30) agingBalance.under30Days += inst.remainingDue;
      else if (lateDays <= 60) agingBalance.from30to60Days += inst.remainingDue;
      else if (lateDays <= 90) agingBalance.from60to90Days += inst.remainingDue;
      else agingBalance.over90Days += inst.remainingDue;
    }

    return {
      currency,
      currentMonthLabel,
      expectedRent,
      collectedRent,
      overdueRent,
      collectionRate,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      activeTenantsCount,
      pendingTicketsCount,
      agingBalance,
      recentPayments: this.getPayments(orgId).slice(0, 5),
      urgentOverdues: installments.filter(
        (i) => i.remainingDue > 0 && (i.status === "OVERDUE" || i.status === "PARTIAL")
      ),
    };
  }
}

const storeInstance = new DataStore();

type AsyncStore = {
  [K in keyof typeof storeInstance]: (typeof storeInstance)[K] extends (
    ...args: infer A
  ) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : (typeof storeInstance)[K];
};

/**
 * Every public call opens its own transaction/state snapshot. Nested calls
 * inside the store stay synchronous and share that snapshot, so business
 * rules are untouched while the API becomes awaitable for serverless usage.
 */
export const dataStore = new Proxy(storeInstance, {
  get(target, prop) {
    const value = Reflect.get(target, prop);
    if (typeof value !== "function") return value;
    return (...args: unknown[]) =>
      withState(
        (raw) => target.normalize(raw),
        () => (value as (...a: unknown[]) => unknown).apply(target, args)
      );
  },
}) as unknown as AsyncStore;
