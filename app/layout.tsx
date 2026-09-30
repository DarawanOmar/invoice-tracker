import type { Metadata } from "next";
import { Noto_Kufi_Arabic } from "next/font/google";

import { PrintProvider } from "@/components/invoice/print-provider";
import { SiteHeader } from "@/components/site-header";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import "./globals.css";

// Used by the whole UI and by the printed receipts.
const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-kufi",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "سیستەمی پسوڵە — دیجیتاڵ میدیا ئۆفیس",
    template: "%s — دیجیتاڵ میدیا ئۆفیس",
  },
  description: "چاپکردن و تۆمارکردنی پسوڵەکانی کۆمپانیای دیجیتاڵ میدیا ئۆفیس",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ckb" dir="rtl" className={cn(kufi.variable, "h-full antialiased")}>
      <body className="flex min-h-full flex-col">
        <DirectionProvider dir="rtl">
          <TooltipProvider>
            <PrintProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <Toaster position="top-center" dir="rtl" richColors closeButton />
            </PrintProvider>
          </TooltipProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
