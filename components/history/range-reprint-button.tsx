"use client";

import { ListOrderedIcon } from "lucide-react";
import { useState } from "react";

import { ReprintDialog } from "@/components/history/reprint-dialog";
import { Button } from "@/components/ui/button";

export function RangeReprintButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ListOrderedIcon />
        چاپکردنەوە بە مەودا
      </Button>
      <ReprintDialog target={{ kind: "range" }} open={open} onOpenChange={setOpen} />
    </>
  );
}
