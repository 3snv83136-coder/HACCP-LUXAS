"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type LogoSanitraceProps = {
  size?: number;
  className?: string;
  secret?: boolean;
};

export function LogoSanitrace({ size = 88, className, secret = false }: LogoSanitraceProps) {
  const router = useRouter();

  const mark = (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#0f766e" />
      <path
        d="M40 14c-9 7-16 12-16 22 0 10 7 18 16 22 9-4 16-12 16-22 0-10-7-15-16-22Z"
        fill="#ecfdf5"
      />
      <path
        d="M28 40.5 36.5 49 54 30"
        fill="none"
        stroke="#0f766e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!secret) {
    return (
      <span className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
        {mark}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label="Sanitrace"
      onClick={() => router.push("/createurs/connexion")}
      className={cn("inline-flex cursor-default items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {mark}
    </button>
  );
}
