"use client";

import React from "react";
import { Lease, Tenant, Unit, Organization } from "@/types";
import { formatCurrency, numberToWordsFrench } from "@/lib/utils";
import {
  defaultLeaseEndDate,
  destinationLabel,
  documentReference,
  formatDocumentDate,
  frequencyLabel,
  leaseTypeLabel,
} from "@/lib/document-format";
import { X, Printer, ShieldCheck, FileSignature } from "lucide-react";

interface ContratBailModalProps {
  lease: Lease;
  tenant: Tenant;
  unit: Unit;
  organization: Organization;
  onClose: () => void;
}

export function ContratBailModal({
  lease,
  tenant,
  unit,
  organization,
  onClose,
}: ContratBailModalProps) {
  const currency = organization.defaultCurrency;
  const money = (amount: number) => formatCurrency(amount, currency);
  const amountInWords =
    currency === "XOF"
      ? ` (soit ${numberToWordsFrench(Math.round(lease.rentAmount + lease.chargesAmount))})`
      : "";
  const endDate = lease.endDate || defaultLeaseEndDate(lease.startDate);
  const depositMonths =
    lease.rentAmount > 0 ? Math.round((lease.depositAmount / lease.rentAmount) * 100) / 100 : 0;
  const reference = documentReference(lease.id, "BAIL");
  const today = formatDocumentDate(new Date());

  const sectionTitle = (number: number, title: string) => (
    <h2 className="avoid-break mt-6 mb-2 flex items-baseline gap-2 border-b border-slate-300 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-800">
      <span className="text-emerald-800">Article {number}</span>
      <span>{title}</span>
    </h2>
  );

  return (
    <div className="document-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="document-modal-shell relative my-4 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Actions – exclues de l'impression */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-bold">Aperçu du contrat de bail</p>
              <p className="text-[11px] text-slate-400">Document prêt à imprimer ou enregistrer en PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer / PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer l'aperçu"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document officiel – A4 */}
        <article className="document-print mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white px-8 py-10 font-serif text-[12px] leading-[1.65] text-slate-800 sm:px-14 sm:py-14">
          {/* En-tête */}
          <header className="avoid-break border-b-2 border-slate-900 pb-5">
            <div className="mb-6 flex items-start justify-between gap-6 font-sans">
              <div className="min-w-0">
                {organization.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organization.logoUrl}
                    alt={`Logo ${organization.name}`}
                    className="mb-2 h-12 w-12 rounded-lg border border-slate-200 object-contain"
                  />
                ) : (
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800 text-sm font-black text-white">
                    LT
                  </div>
                )}
                <p className="truncate text-[13px] font-extrabold uppercase tracking-wide text-slate-900">
                  {organization.name}
                </p>
                <p className="text-[10px] leading-snug text-slate-500">{organization.address}</p>
                <p className="text-[10px] text-slate-500">
                  Tél. {organization.phone} · {organization.email}
                </p>
              </div>
              <div className="shrink-0 text-right text-[10px] uppercase tracking-wider text-slate-500">
                <p className="font-bold text-emerald-800">Contrat de bail</p>
                <p className="mt-1 font-mono text-slate-700">Réf. {reference}</p>
                <p className="mt-0.5 normal-case tracking-normal">Édité le {today}</p>
              </div>
            </div>
            <h1 className="text-center text-[19px] font-black uppercase tracking-[0.08em] text-slate-900">
              Contrat de bail {leaseTypeLabel(lease.leaseType)}
            </h1>
            <p className="mt-1 text-center font-sans text-[10px] uppercase tracking-widest text-slate-500">
              Entre le bailleur et le preneur ci-après désignés
            </p>
          </header>

          {/* Parties */}
          <section className="avoid-break mt-6 font-sans">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Le bailleur
                </p>
                <p className="text-[12px] font-bold text-slate-900">{organization.name}</p>
                <p className="text-[11px] text-slate-600">{organization.address}</p>
                <p className="text-[11px] text-slate-600">
                  Tél. {organization.phone} · {organization.email}
                </p>
                <p className="mt-2 text-[10px] italic text-slate-500">
                  {organization.managementType === "AGENCY"
                    ? "Agence gestionnaire mandatée"
                    : "Propriétaire ou représentant mandaté"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Le preneur (locataire)
                </p>
                <p className="text-[12px] font-bold text-slate-900">
                  {tenant.firstName} {tenant.lastName}
                </p>
                <p className="text-[11px] text-slate-600">
                  Pièce d&apos;identité {tenant.identityType} n° {tenant.identityNumber}
                </p>
                <p className="text-[11px] text-slate-600">
                  Profession : {tenant.profession || "Non renseignée"}
                  {tenant.employer ? ` · Employeur : ${tenant.employer}` : ""}
                </p>
                <p className="text-[11px] text-slate-600">
                  Tél. {tenant.phone}
                  {tenant.email ? ` · ${tenant.email}` : ""}
                </p>
                {tenant.guarantorName ? (
                  <p className="mt-2 text-[10px] text-slate-500">
                    Garant : {tenant.guarantorName}
                    {tenant.guarantorPhone ? ` · ${tenant.guarantorPhone}` : ""}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-[11px] italic text-slate-500">
              Ci-après dénommés individuellement « le Bailleur » et « le Preneur », et collectivement
              « les Parties ».
            </p>
          </section>

          {/* Article 1 */}
          <section className="avoid-break">
            {sectionTitle(1, "Désignation du bien et destination")}
            <p>
              Le Bailleur donne en location au Preneur le logement suivant, situé dans la résidence{" "}
              <strong>{unit.buildingName}</strong> :
            </p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-sans text-[11px]">
              <dt className="font-bold text-slate-600">Lot / unité</dt>
              <dd>{unit.unitNumber}</dd>
              <dt className="font-bold text-slate-600">Type</dt>
              <dd>{unit.type.replace(/_/g, " ").toLowerCase()}</dd>
              <dt className="font-bold text-slate-600">Consistance</dt>
              <dd>
                {unit.roomsCount} pièce{unit.roomsCount > 1 ? "s" : ""} · {unit.surfaceM2} m²
              </dd>
              <dt className="font-bold text-slate-600">Compteurs</dt>
              <dd>
                Électricité : {unit.electricityMeter || "à convenir"} · Eau :{" "}
                {unit.waterMeter || "à convenir"}
              </dd>
            </dl>
            <p className="mt-2">
              Les lieux sont destinés exclusivement à {destinationLabel(lease.leaseType)}. Le Preneur
              ne peut les affecter à un autre usage ni les sous-louer sans accord écrit du Bailleur.
            </p>
          </section>

          {/* Article 2 */}
          <section className="avoid-break">
            {sectionTitle(2, "Durée du bail")}
            <p>
              Le présent bail prend effet le <strong>{formatDocumentDate(lease.startDate)}</strong>{" "}
              et prend fin le <strong>{formatDocumentDate(endDate)}</strong>, sauf renouvellement ou
              résiliation anticipée dans les conditions prévues au présent contrat. Le bail est
              renouvelable par tacite reconduction sauf préavis écrit de trois (3) mois notifié par
              l&apos;une des Parties avant l&apos;échéance.
            </p>
          </section>

          {/* Article 3 */}
          <section className="avoid-break">
            {sectionTitle(3, "Conditions financières et règlement")}
            <table className="mt-2 w-full border-collapse font-sans text-[11px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 pr-3 text-slate-600">Loyer de base</td>
                  <td className="py-1.5 text-right font-semibold">{money(lease.rentAmount)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 pr-3 text-slate-600">Charges locatives</td>
                  <td className="py-1.5 text-right font-semibold">{money(lease.chargesAmount)}</td>
                </tr>
                <tr className="border-b-2 border-slate-800 font-bold">
                  <td className="py-2 pr-3">Total exigible par échéance</td>
                  <td className="py-2 text-right text-emerald-900">
                    {money(lease.rentAmount + lease.chargesAmount)}
                    {amountInWords}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2">
              La fréquence de facturation est <strong>{frequencyLabel(lease.billingFrequency)}</strong>
              . Le règlement est exigible au plus tard le <strong>{lease.paymentDueDay}</strong> de
              chaque période, par Mobile Money, virement bancaire ou espèces, contre quittance
              officielle délivrée par le système LOUTIGUI.
            </p>
            <p>
              Tout retard au-delà d&apos;un délai de grâce de {lease.gracePeriodDays} jour
              {lease.gracePeriodDays > 1 ? "s" : ""} entraîne l&apos;application d&apos;une pénalité
              de retard de {lease.lateFeePercentage} % sur le montant exigible.
            </p>
          </section>

          {/* Article 4 */}
          <section className="avoid-break">
            {sectionTitle(4, "Dépôt de garantie")}
            <p>
              À titre de garantie de l&apos;exécution de ses obligations, le Preneur verse un dépôt de
              garantie de <strong>{money(lease.depositAmount)}</strong>
              {depositMonths > 0 ? `, soit l'équivalent de ${depositMonths} mois de loyer de base` : ""}
              . Ce dépôt sera restitué en fin de bail après état des lieux de sortie contradictoire,
              déduction faite des éventuels dommages ou créances restant dus.
            </p>
          </section>

          {/* Article 5 */}
          <section className="avoid-break">
            {sectionTitle(5, "Obligations et résiliation")}
            <p>
              Le Preneur s&apos;engage à régler les échéances aux dates convenues, à entretenir les
              lieux en bon état, à respecter la destination du bien et à signaler sans délai toute
              dégradation ou anomalie. Le Bailleur s&apos;engage à garantir la jouissance paisible
              des lieux et à assurer les gros travaux ne résultant pas d&apos;une faute du Preneur.
            </p>
            <p>
              En cas de manquement grave à ses obligations, notamment le non-paiement des loyers,
              l&apos;une des Parties peut notifier la résiliation du bail par écrit. Les Parties
              s&apos;efforcent de résoudre à l&apos;amiable tout différend ; à défaut, le litige est
              porté devant la juridiction compétente du lieu de situation du bien.
            </p>
          </section>

          {/* Signature */}
          <section className="avoid-break mt-10 border-t border-slate-300 pt-5 font-sans">
            <p className="mb-8 text-[10px] italic text-slate-500">
              Fait en deux exemplaires originaux, pour servir et valoir ce que de droit.
            </p>
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                  Pour le Bailleur
                </p>
                <div className="mt-12 border-t border-slate-500 pt-1.5 text-[10px] text-slate-500">
                  Signature et cachet · {organization.name}
                </div>
                <p className="mt-3 text-[10px] text-slate-500">Fait le : ................................</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                  Pour le Preneur
                </p>
                <div className="mt-12 border-t border-slate-500 pt-1.5 text-[10px] text-slate-500">
                  Précédée de la mention « Lu et approuvé » · {tenant.firstName} {tenant.lastName}
                </div>
                <p className="mt-3 text-[10px] text-slate-500">Fait le : ................................</p>
              </div>
            </div>
          </section>

          <footer className="avoid-break mt-10 flex items-center justify-between border-t border-slate-200 pt-3 font-sans text-[9px] uppercase tracking-wider text-slate-400">
            <span>Document généré par LOUTIGUI</span>
            <span className="flex items-center gap-1 font-mono normal-case tracking-normal">
              <ShieldCheck className="h-3 w-3" /> Réf. {reference}
            </span>
          </footer>
        </article>
      </div>
    </div>
  );
}
