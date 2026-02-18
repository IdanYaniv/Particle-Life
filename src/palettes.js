// Color palette definitions
// Each palette has 5 colors for 5 species

export const PALETTES = {
  Lavender:    ['#c4b5fd', '#93c5fd', '#fda4af', '#86efac', '#fde68a'],
  Royalty:     ['#2c3e50', '#8e44ad', '#3498db', '#e74c3c', '#f39c12'],
  Aurora:      ['#9b5de5', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4'],
  Sunset:      ['#ff6b6b', '#feca57', '#ff9f43', '#48dbfb', '#54a0ff'],
  Forest:      ['#184e77', '#34a0a4', '#52b788', '#d9ed92', '#b5e48c'],
  Coral:       ['#ff6b6b', '#ee5a6f', '#cc527a', '#e8175d', '#474747'],
  Pastel:      ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff'],
  Synthwave:   ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
};

const paletteNames = Object.keys(PALETTES);

export function getRandomPalette() {
  const name = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  return { name, colors: PALETTES[name] };
}

export function getPalette(name) {
  return PALETTES[name] || PALETTES.Lavender;
}
