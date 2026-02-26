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
  Ocean:       ['#023e8a', '#0096c7', '#48cae4', '#00b4d8', '#ade8f4'],
  Ember:       ['#d62828', '#e76f51', '#f4a261', '#fcbf49', '#e63946'],
  Candy:       ['#ff9ff3', '#ffeaa7', '#a29bfe', '#74b9ff', '#55efc4'],
  Copper:      ['#8b1a1a', '#bf4e30', '#d4833c', '#e0b04d', '#3e5f8a'],
  Solar:       ['#ffd60a', '#f9c74f', '#f3722c', '#f94144', '#43aa8b'],
};

const paletteNames = Object.keys(PALETTES);

export function getRandomPalette() {
  const name = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  return { name, colors: PALETTES[name] };
}

export function getPalette(name) {
  return PALETTES[name] || PALETTES.Lavender;
}
