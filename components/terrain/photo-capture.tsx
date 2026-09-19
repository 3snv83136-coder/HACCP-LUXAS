"use client";

import { useRef } from "react";

type PhotoCaptureProps = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
};

export function PhotoCapture({ value, onChange, label }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    const dataUrl = await compressImage(file);
    onChange(dataUrl);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-2xl border border-dashed border-white/20 bg-black/20 px-4 py-6 text-sm text-white/70"
      >
        {value ? "Remplacer la photo" : "Prendre / importer une photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      {value ? (
        // Photo terrain (data URL) — next/image ne gère pas ce flux hors-ligne.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preuve photo" className="h-36 w-full rounded-2xl object-cover" />
      ) : null}
    </div>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture image impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("Image invalide"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
