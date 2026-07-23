// Product categories are free-text set by the admin (e.g. "Flatbreads",
// "Snacks"), not a fixed list, so this is a best-effort emoji lookup with a
// sensible fallback rather than a strict enum.
const ICONS = {
  flatbreads: '🫓',
  breads: '🫓',
  rotis: '🫓',
  snacks: '🍢',
  starters: '🍢',
  curries: '🍛',
  rice: '🍚',
  biryani: '🍚',
  drinks: '🥤',
  beverages: '🥤',
  desserts: '🍮',
  sweets: '🍮',
};

export function iconForCategory(category) {
  if (!category) return '🍽️';
  return ICONS[category.trim().toLowerCase()] || '🍽️';
}
