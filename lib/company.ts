/** Fixed details printed on every receipt. */
export const COMPANY = {
  name: "کۆمپانیای دیجیتاڵ میدیا ئۆفیس",
  shortName: "دیجیتاڵ میدیا ئۆفیس",
  tagline: "بۆ بازرگانی گشتی و ڕێکلام و چاپەمەنی /سنوردار - تایبەت",
  phones: ["0770 945 3777", "0750 945 3777"],
  address:
    "هەولێر / شەقامی زازا - نێوان شەقامی ٦٠ مەتر و شەقامی ٣٠ مەتری - نزیک ئەنجومەنی وەزیران و پەرلەمانی کوردستان",
} as const;

/** Number given to the very first receipt when the database is empty. */
export const FIRST_INVOICE_NUMBER = 1;

/** Dates and "today" are calculated in Kurdistan time. */
export const APP_TIME_ZONE = "Asia/Baghdad";
/** Iraq has no daylight saving time, so the offset is fixed. */
export const APP_UTC_OFFSET = "+03:00";
