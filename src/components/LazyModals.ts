"use client";

import dynamic from "next/dynamic";

/**
 * Modals are only needed after a user action. Loading them lazily keeps them
 * out of the initial bundle of every page (including the global AppLayout),
 * which noticeably reduces Time-to-Interactive on the 10 main screens.
 */
const noop = () => null;

export const LazyEncaissementModal = dynamic(
  () => import("./EncaissementModal").then((m) => m.EncaissementModal),
  { ssr: false, loading: noop }
);

export const LazyQuittanceModal = dynamic(
  () => import("./QuittanceModal").then((m) => m.QuittanceModal),
  { ssr: false, loading: noop }
);

export const LazyRelanceModal = dynamic(
  () => import("./RelanceModal").then((m) => m.RelanceModal),
  { ssr: false, loading: noop }
);

export const LazyContratBailModal = dynamic(
  () => import("./ContratBailModal").then((m) => m.ContratBailModal),
  { ssr: false, loading: noop }
);

export const LazyTenantPaymentModal = dynamic(
  () => import("./TenantPaymentModal").then((m) => m.TenantPaymentModal),
  { ssr: false, loading: noop }
);

export const LazyMaintenanceRequestModal = dynamic(
  () => import("./MaintenanceRequestModal").then((m) => m.MaintenanceRequestModal),
  { ssr: false, loading: noop }
);

export const LazyOnboardingWizard = dynamic(
  () => import("./OnboardingWizard").then((m) => m.OnboardingWizard),
  { ssr: false, loading: noop }
);
