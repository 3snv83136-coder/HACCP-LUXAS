"use client";

export function PdfDownloadButton() {
  return (
    <a
      href="/api/export-pdf?jours=7"
      className="rounded-2xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
    >
      Télécharger le PDF
    </a>
  );
}
