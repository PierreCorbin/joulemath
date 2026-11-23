// Permanent redirects for merged pages. One list feeds both dist/_redirects (written by build.mjs) and the
// middleware, because Pages Functions can answer a path before _redirects is applied.
// Nov 23, 2026: the thin Antminer S21 XP, S21 Pro and S19 XP pages (0 Google impressions, not indexed) were merged
// into their own sections on /asic/.
export const REDIRECTS=[
  ['/asic/antminer-s21-xp/','/asic/#antminer-s21-xp'],
  ['/asic/antminer-s21-pro/','/asic/#antminer-s21-pro'],
  ['/asic/antminer-s19-xp/','/asic/#antminer-s19-xp'],
];
// Exact path, with or without the trailing slash.
export function redirectFor(pathname){
  const p=pathname.endsWith('/')?pathname:pathname+'/';
  const hit=REDIRECTS.find(([from])=>from===p);
  return hit?hit[1]:null;
}
