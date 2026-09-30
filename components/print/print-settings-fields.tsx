"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { normalizeDigits } from "@/lib/format";
import { MAX_COPIES, type PaperSize, type PrintSettings } from "@/lib/invoice";

const PAPER_OPTIONS: { value: PaperSize; title: string; hint: string }[] = [
  { value: "A5", title: "A5", hint: "یەک پسوڵە لە پەڕەیەکدا" },
  { value: "A4", title: "A4", hint: "دوو پسوڵە لە پەڕەیەکدا" },
];

export function PrintSettingsFields({
  settings,
  onChange,
}: {
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
}) {
  const id = useId();
  const setCopies = (copies: number) =>
    onChange({ ...settings, copies: Math.min(MAX_COPIES, Math.max(1, copies)) });

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <Field>
        <FieldLabel id={`${id}-paper`}>قەبارەی کاغەز</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          aria-labelledby={`${id}-paper`}
          className="w-full"
          value={settings.paperSize}
          onValueChange={(value) => {
            if (value) onChange({ ...settings, paperSize: value as PaperSize });
          }}
        >
          {PAPER_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-auto min-w-0 flex-1 flex-col gap-0.5 py-2 whitespace-normal data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <span className="font-semibold" dir="ltr">
                {option.title}
              </span>
              <span className="text-center text-xs font-normal text-muted-foreground">{option.hint}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-copies`}>ژمارەی کۆپی</FieldLabel>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="زیادکردنی کۆپی"
            disabled={settings.copies >= MAX_COPIES}
            onClick={() => setCopies(settings.copies + 1)}
          >
            <PlusIcon />
          </Button>
          <Input
            id={`${id}-copies`}
            dir="ltr"
            inputMode="numeric"
            className="w-14 text-center tabular-nums"
            value={settings.copies}
            onChange={(event) => {
              const n = Number(normalizeDigits(event.target.value).replace(/\D/g, ""));
              if (n) setCopies(n);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="کەمکردنەوەی کۆپی"
            disabled={settings.copies <= 1}
            onClick={() => setCopies(settings.copies - 1)}
          >
            <MinusIcon />
          </Button>
        </div>
      </Field>
    </div>
  );
}
