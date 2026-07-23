// Design tokens derived from the Roti & More (CJ) crest logo:
// forest green shield, gold/amber lettering and chef hat trim, warm cream backdrop.

export const colors = {
  primary: '#1B7A3C',       // crest green
  primaryDark: '#0F5C2A',   // deep green for pressed states / headers
  primaryLight: '#E7F3EA',  // pale green tint for chips/backgrounds
  gold: '#F0A500',          // crest gold
  goldDark: '#C9870A',
  cream: '#FFFBF2',         // warm background
  surface: '#FFFFFF',
  ink: '#20261F',           // near-black with a green cast, for headings
  slate: '#6B7267',         // secondary text
  border: '#E7E2D6',
  success: '#1B7A3C',
  danger: '#C6432B',
  overlay: 'rgba(15, 32, 20, 0.55)',
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: 0.2 },
  h1: { fontSize: 22, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, fontWeight: '400', color: colors.ink },
  caption: { fontSize: 13, fontWeight: '500', color: colors.slate },
  price: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
};
