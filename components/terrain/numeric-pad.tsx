"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "-"] as const;

type NumericPadProps = {
  value: string;
  onChange: (next: string) => void;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  maxLength?: number;
};

export function NumericPad({
  value,
  onChange,
  allowNegative = true,
  allowDecimal = true,
  maxLength = 6,
}: NumericPadProps) {
  function press(key: string) {
    if (key === "." && (!allowDecimal || value.includes("."))) return;
    if (key === "-") {
      if (!allowNegative) return;
      onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
      return;
    }
    const next = value === "0" && key !== "." ? key : `${value}${key}`;
    if (next.replace("-", "").replace(".", "").length > maxLength) return;
    onChange(next);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <Button
          key={key}
          type="button"
          variant="outline"
          size="xl"
          className={cn("font-mono text-2xl", key === "-" && !allowNegative && "opacity-30")}
          onClick={() => press(key)}
        >
          {key === "-" ? "±" : key}
        </Button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="xl"
        className="col-span-3"
        onClick={() => onChange(value.slice(0, -1))}
        aria-label="Effacer"
      >
        <Delete className="h-6 w-6" />
      </Button>
    </div>
  );
}
