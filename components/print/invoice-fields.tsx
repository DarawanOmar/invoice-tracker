"use client";

import { ClockIcon, SparklesIcon, XIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  now,
  requireRecipient = true,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  errors?: DraftErrors;
  /** Current Kurdistan time, shown while the date is automatic. */
  now: string;
  requireRecipient?: boolean;
}) {
  const id = useId();
  const words = draftWords(draft);
  const hasDate = draft.dateAuto || Boolean(draft.date);

  return (
    <FieldGroup className="gap-5">
      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={`${id}-date`}>بەروار و کات</FieldLabel>
          {draft.dateAuto && (
            <Badge variant="secondary" className="gap-1">
              <ClockIcon className="size-3" />
              ئێستا
            </Badge>
          )}
        </div>
        <InputGroup>
          <InputGroupInput
            id={`${id}-date`}
            type="datetime-local"
            value={draft.dateAuto ? now : draft.date}
            onChange={(event) => onChange({ date: event.target.value, dateAuto: false })}
          />
          <InputGroupAddon align="inline-end">
            {!draft.dateAuto && (
              <InputGroupButton onClick={() => onChange({ dateAuto: true, date: "" })}>
                <ClockIcon />
                ئێستا
              </InputGroupButton>
            )}
            {hasDate && (
              <InputGroupButton
                size="icon-xs"
                aria-label="لابردنی بەروار"
                title="لابردنی بەروار (بۆ نووسین بە دەست)"
                onClick={() => onChange({ date: "", dateAuto: false })}
              >
                <XIcon />
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>
        {draft.dateAuto ? (
          <FieldDescription>کاتی چاپکردن خۆکارانە دادەنرێت؛ دەتوانیت بیگۆڕیت.</FieldDescription>
        ) : (
          !draft.date && (
            <FieldDescription>بەروار بەتاڵ چاپ دەکرێت بۆ ئەوەی بە دەست بنووسرێت.</FieldDescription>
          )
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

      <Field>
        <FieldLabel htmlFor={`${id}-note`}>تێبینی</FieldLabel>
        <Textarea
          id={`${id}-note`}
          rows={2}
          maxLength={300}
          className="min-h-14"
          placeholder="هەر تێبینییەک کە دەتەوێت لەسەر پسوڵەکە بنووسرێت"
          value={draft.note}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </Field>
    </FieldGroup>
  );
}
