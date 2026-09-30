"use client";

import { useLayoutEffect, useRef } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { normalizeDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

function sanitizeAmount(value: string, allowDecimals: boolean) {
  let clean = normalizeDigits(value).replace(allowDecimals ? /[^\d.]/g : /\D/g, "");
  if (allowDecimals) {
    const [whole, ...rest] = clean.split(".");
    clean = rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
  }
  // Keep within the Decimal(15, 2) column.
  const [whole, fraction] = clean.split(".");
  const trimmed = whole.replace(/^0+(?=\d)/, "").slice(0, 13);
  return fraction === undefined ? trimmed : `${trimmed}.${fraction}`;
}

function withSeparators(raw: string) {
  const [whole, fraction] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/** Caret index in `display` that sits after `count` digits/dots. */
function caretAfter(display: string, count: number) {
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (seen === count) return i;
    if (display[i] !== ",") seen++;
  }
  return display.length;
}

/** Amount input: stores raw digits ("250000"), shows "250,000". */
export function MoneyInput({
  id,
  value,
  onChange,
  currency,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  currency: "IQD" | "USD";
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const display = withSeparators(value);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (pendingCaret.current === null || !input || document.activeElement !== input) return;
    const position = caretAfter(display, pendingCaret.current);
    input.setSelectionRange(position, position);
    pendingCaret.current = null;
  });

  return (
    <InputGroup>
      <InputGroupInput
        ref={inputRef}
        id={id}
        dir="ltr"
        inputMode={currency === "USD" ? "decimal" : "numeric"}
        autoComplete="off"
        placeholder="0"
        className="text-right tabular-nums"
        value={display}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        onChange={(event) => {
          const input = event.target;
          const beforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length);
          pendingCaret.current = sanitizeAmount(beforeCaret, currency === "USD").replace(/,/g, "").length;
          onChange(sanitizeAmount(input.value, currency === "USD"));
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{currency === "IQD" ? "دینار" : "دۆلار"}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Whole-number input that accepts Kurdish/Arabic digits. */
export function IntegerInput({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      {...props}
      type="text"
      dir="ltr"
      inputMode="numeric"
      autoComplete="off"
      className={cn("text-right tabular-nums", props.className)}
      value={value}
      onChange={(event) => onChange(normalizeDigits(event.target.value).replace(/\D/g, "").slice(0, 9))}
    />
  );
}
