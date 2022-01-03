export type Color = [r: number, g: number, b: number];

export function colorToString(color: Color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function interpolateColor(c1: Color, c2: Color, t: number): Color {
  return [
    Math.round(c1[0] * (1 - t) + c2[0] * t),
    Math.round(c1[1] * (1 - t) + c2[1] * t),
    Math.round(c1[2] * (1 - t) + c2[2] * t),
  ];
}

export function parseHexRgb(colorString: string): Color {
  const normal = colorString.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (normal) {
    return normal.slice(1).map((e) => parseInt(e, 16)) as Color;
  } else {
    throw new Error(`Unknown color '${colorString}'`);
  }
}
