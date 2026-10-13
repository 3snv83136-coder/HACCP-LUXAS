"use client";

import { useRef } from "react";
import { Label } from "@/components/ui/label";

type LogoUploadProps = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
};

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    const dataUrl = await compresserLogo(file);
    onChange(dataUrl);
  }

  return (
    <div className="space-y-2">
      <Label>Logo de l’établissement</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-left text-sm text-slate-600"
      >
        {value ? (
          // Logo en data URL — next/image ne gère pas ce flux.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Logo établissement" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-xs text-slate-400">
            Logo
          </span>
        )}
        <span>{value ? "Remplacer le logo" : "Ajouter le logo (photo ou fichier)"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
    </div>
  );
}

function compresserLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture image impossible"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponible"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
