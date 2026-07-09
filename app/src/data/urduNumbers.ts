/**
 * Convert an amount in rupees to spoken Urdu words for announcements.
 * e.g. 1200 -> "بارہ سو" (idiomatic: 12 hundred), 3500 -> "پینتیس سو"
 * Falls back to hazaar/lakh/crore composition for larger amounts.
 */

const ONES: string[] = [
  'صفر', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو',
  'دس', 'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
  'بیس', 'اکیس', 'بائیس', 'تئیس', 'چوبیس', 'پچیس', 'چھبیس', 'ستائیس', 'اٹھائیس', 'انتیس',
  'تیس', 'اکتیس', 'بتیس', 'تینتیس', 'چونتیس', 'پینتیس', 'چھتیس', 'سینتیس', 'اڑتیس', 'انتالیس',
  'چالیس', 'اکتالیس', 'بیالیس', 'تینتالیس', 'چوالیس', 'پینتالیس', 'چھیالیس', 'سینتالیس', 'اڑتالیس', 'انچاس',
  'پچاس', 'اکاون', 'باون', 'ترپن', 'چون', 'پچپن', 'چھپن', 'ستاون', 'اٹھاون', 'انسٹھ',
  'ساٹھ', 'اکسٹھ', 'باسٹھ', 'ترسٹھ', 'چونسٹھ', 'پینسٹھ', 'چھیاسٹھ', 'سڑسٹھ', 'اڑسٹھ', 'انہتر',
  'ستر', 'اکہتر', 'بہتر', 'تہتر', 'چوہتر', 'پچہتر', 'چھہتر', 'ستتر', 'اٹھتر', 'اناسی',
  'اسی', 'اکیاسی', 'بیاسی', 'تراسی', 'چوراسی', 'پچاسی', 'چھیاسی', 'ستاسی', 'اٹھاسی', 'نواسی',
  'نوے', 'اکانوے', 'بانوے', 'ترانوے', 'چورانوے', 'پچانوے', 'چھیانوے', 'ستانوے', 'اٹھانوے', 'ننانوے',
];

function below100(n: number): string {
  return ONES[n];
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${below100(h)} سو`;
  return rest === 0 ? head : `${head} ${below100(rest)}`;
}

export function amountToUrduWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return ONES[0];

  // Idiomatic "N sau" for 1,000..9,999 when it is a clean hundred (e.g. 1200 = بارہ سو)
  if (n >= 1000 && n < 10000 && n % 100 === 0) {
    return `${below100(n / 100)} سو`;
  }

  const parts: string[] = [];
  let rest = n;

  const crore = Math.floor(rest / 10_000_000);
  if (crore > 0) {
    parts.push(`${amountToUrduWords(crore)} کروڑ`);
    rest %= 10_000_000;
  }
  const lakh = Math.floor(rest / 100_000);
  if (lakh > 0) {
    parts.push(`${below100(lakh)} لاکھ`);
    rest %= 100_000;
  }
  const hazaar = Math.floor(rest / 1000);
  if (hazaar > 0) {
    parts.push(`${below100(hazaar)} ہزار`);
    rest %= 1000;
  }
  if (rest > 0) {
    parts.push(below1000(rest));
  }
  return parts.join(' ');
}

const SOURCE_URDU: Record<string, string> = {
  easypaisa: 'ایزی پیسہ',
  jazzcash: 'جاز کیش',
  bank: 'بینک',
};

/** Full Urdu announcement, e.g. "ایزی پیسہ سے بارہ سو روپے موصول ہوئے" */
export function announcementUrdu(source: string, amount: number): string {
  const src = SOURCE_URDU[source] ?? source;
  return `${src} سے ${amountToUrduWords(amount)} روپے موصول ہوئے`;
}

/** English announcement, e.g. "Received 1,200 rupees on Easypaisa" */
export function announcementEnglish(sourceLabel: string, amount: number): string {
  return `Received ${amount.toLocaleString('en-PK')} rupees on ${sourceLabel}`;
}
