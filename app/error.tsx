"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>هەڵەیەک ڕوویدا</EmptyTitle>
          <EmptyDescription>
            نەتوانرا زانیارییەکان لە بنکەدراوە بهێنرێن. پەیوەندیی ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەرەوە.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>
            <RotateCcwIcon />
            دووبارە هەوڵدانەوە
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
