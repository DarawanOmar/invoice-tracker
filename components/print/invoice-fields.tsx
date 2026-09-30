"use client";

import { CalendarCheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { useId } from "react";

import { draftWords, type Draft } from "@/components/print/draft";
import { MoneyInput } from "@/components/print/number-inputs";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export type DraftErrors = { recipientName?: string };

export function InvoiceFields({
  draft,
  onChange,
  errors,
  today,
  requireRecipient = true,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  errors?: DraftErrors;
  today: string;
  requireRecipient?: boolean;
}) {
  const id = useId();
  const words = draftWords(draft);

  return (
    <FieldGroup className="gap-5">
      <Field>
        <FieldLabel htmlFor={`${id}-date`}>بەروار</FieldLabel>
        <InputGroup>
          <InputGroupInput
            id={`${id}-date`}
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ date: event.target.value })}
          />
          <InputGroupAddon align="inline-end">
            {draft.date !== today && (
              <InputGroupButton onClick={() => onChange({ date: today })}>
                <CalendarCheckIcon />
                ئەمڕۆ
              </InputGroupButton>
            )}
            {draft.date && (
              <InputGroupButton
                size="icon-xs"
                aria-label="لابردنی بەروار"
                title="لابردنی بەروار (بۆ نووسین بە دەست)"
                onClick={() => onChange({ date: "" })}
              >
                <XIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
        {!draft.date && (
          <FieldDescription>بەروار بەتاڵ چاپ دەکرێت بۆ ئەوەی بە دەست بنووسرێت.</FieldDescription>
        )}
      </Field>

      <Field data-invalid={errors?.recipientName ? true : undefined}>
        <FieldLabel htmlFor={`${id}-recipient`}>
          درا بە بەڕێز
          {requireRecipient && <span className="text-destructive">*</span>}
        </FieldLabel>
        <Input
          id={`${id}-recipient`}
          name="recipientName"
          autoComplete="off"
          placeholder="ناوی وەرگر"
          value={draft.recipientName}
          aria-invalid={errors?.recipientName ? true : undefined}
          onChange={(event) => onChange({ recipientName: event.target.value })}
        />
        <FieldError>{errors?.recipientName}</FieldError>
      </Field>

      <FieldSet className="gap-2">
        <FieldLegend variant="label" className="mb-1">
          بڕی پارە (دینار & دۆلار)
        </FieldLegend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MoneyInput
            currency="IQD"
            aria-label="بڕی پارە بە دینار"
            value={draft.amountIqd}
            onChange={(amountIqd) => onChange({ amountIqd })}
          />
          <MoneyInput
            currency="USD"
            aria-label="بڕی پارە بە دۆلار"
            value={draft.amountUsd}
            onChange={(amountUsd) => onChange({ amountUsd })}
          />
        </div>
      </FieldSet>

      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={`${id}-words`}>بڕی پارە بە نووسین</FieldLabel>
          {draft.wordsAuto && (
            <Badge variant="secondary" className="gap-1">
              <SparklesIcon className="size-3" />
              خۆکار
            </Badge>
          )}
        </div>
        <InputGroup>
          <InputGroupTextarea
            id={`${id}-words`}
            rows={2}
            className="min-h-14"
            placeholder="بە پیت دەنووسرێت، بۆ نموونە: سەد هەزار دینار"
            value={words}
            onChange={(event) => onChange({ amountInWords: event.target.value, wordsAuto: false })}
          />
          {!draft.wordsAuto && (
            <InputGroupAddon align="block-end" className="border-t">
              <InputGroupButton
                variant="secondary"
                onClick={() => onChange({ wordsAuto: true, amountInWords: "" })}
              >
                <SparklesIcon />
                نووسینی خۆکار لە بڕی پارە
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        {draft.wordsAuto && (
          <FieldDescription>لە بڕی پارەوە خۆکارانە دەنووسرێت؛ دەتوانیت دەستکاری بکەیت.</FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-purpose`}>لە بڕی</FieldLabel>
        <Input
          id={`${id}-purpose`}
          autoComplete="off"
          placeholder="بۆ نموونە: چاپکردنی بانەر"
          value={draft.purpose}
          onChange={(event) => onChange({ purpose: event.target.value })}
        />
      </Field>

      <FieldSet className="gap-2">
        <FieldLegend variant="label" className="mb-1">
          باقی حیساب
        </FieldLegend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MoneyInput
            currency="IQD"
            aria-label="باقی حیساب بە دینار"
            value={draft.remainingIqd}
            onChange={(remainingIqd) => onChange({ remainingIqd })}
          />
          <MoneyInput
            currency="USD"
            aria-label="باقی حیساب بە دۆلار"
            value={draft.remainingUsd}
            onChange={(remainingUsd) => onChange({ remainingUsd })}
          />
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
