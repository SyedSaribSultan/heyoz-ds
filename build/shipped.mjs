/**
 * shipped.mjs - the values that were live in globals.css before this system.
 *
 * Used for ONE purpose: the "what actually changes in production" diff in
 * test/index.html (section 02). Nothing in tokens/ or dist/ reads this file.
 * Delete it once the migration is signed off.
 *
 * RECOVERED 2026-07-31 from the payload inlined in test/index.html, which was
 * the only surviving copy after the module went missing. Verified to reproduce
 * test/index.html byte-for-byte before any other fix was applied.
 *
 * These are the pre-migration values, so the known bugs are PRESERVED here on
 * purpose - they are what the diff measures against:
 *   light  ring === primary  (#FF3D00)   the invisible focus ring, A4
 *   light  accent === muted  (#E2E1DF)   hover lost against muted, A6
 *   light  border === input  (#DBDBDB)   off-ramp neutral, B18
 *   dark   card === border === input     invisible edges, A1
 */
export const SHIPPED = {
  "light": {
    "background": "#FFFFFF",
    "foreground": "#070605",
    "card": "#F7F5F4",
    "card-foreground": "#070605",
    "popover": "#FFFFFF",
    "popover-foreground": "#070605",
    "primary": "#FF3D00",
    "primary-foreground": "#FFFFFF",
    "secondary": "#EFEDEC",
    "secondary-foreground": "#070605",
    "muted": "#E2E1DF",
    "muted-foreground": "#2E2C2B",
    "accent": "#E2E1DF",
    "accent-foreground": "#070605",
    "destructive": "#E63C65",
    "destructive-foreground": "#FFFFFF",
    "success": "#2F8E56",
    "success-soft": "#D9F2E1",
    "warning": "#C58516",
    "warning-soft": "#F8E8C9",
    "info": "#2D5AB4",
    "info-soft": "#DAE3F6",
    "border": "#DBDBDB",
    "input": "#DBDBDB",
    "ring": "#FF3D00",
    "chart-1": "#E56E43",
    "chart-2": "#BF78E2",
    "chart-3": "#47A3D1",
    "chart-4": "#F2CC5A",
    "chart-5": "#DF497B",
    "sidebar": "#EFEDEC",
    "sidebar-foreground": "#070605",
    "sidebar-primary": "#FF3D00",
    "sidebar-primary-foreground": "#FFFFFF",
    "sidebar-accent": "#E2E1DF",
    "sidebar-accent-foreground": "#070605",
    "sidebar-border": "#F7F5F4",
    "sidebar-ring": "#FF3D00"
  },
  "dark": {
    "background": "#070605",
    "foreground": "#EFEDEC",
    "card": "#151312",
    "card-foreground": "#EFEDEC",
    "popover": "#201F1D",
    "popover-foreground": "#EFEDEC",
    "primary": "#FF3D00",
    "primary-foreground": "#FFFFFF",
    "secondary": "#201F1D",
    "secondary-foreground": "#EFEDEC",
    "muted": "#2E2C2B",
    "muted-foreground": "#C2C0BF",
    "accent": "#2E2C2B",
    "accent-foreground": "#EFEDEC",
    "destructive": "#E63C65",
    "destructive-foreground": "#FFFFFF",
    "success": "#45B574",
    "success-soft": "#1C402B",
    "warning": "#D59C39",
    "warning-soft": "#453417",
    "info": "#6186D1",
    "info-soft": "#172645",
    "border": "#151312",
    "input": "#151312",
    "ring": "#FF3D00",
    "chart-1": "#E56E43",
    "chart-2": "#BF78E2",
    "chart-3": "#47A3D1",
    "chart-4": "#F2CC5A",
    "chart-5": "#DF497B",
    "sidebar": "#0D0C0A",
    "sidebar-foreground": "#EFEDEC",
    "sidebar-primary": "#FF3D00",
    "sidebar-primary-foreground": "#FFFFFF",
    "sidebar-accent": "#2E2C2B",
    "sidebar-accent-foreground": "#EFEDEC",
    "sidebar-border": "#151312",
    "sidebar-ring": "#FF3D00"
  }
};
