/**
 * Draws the inside of the cha chaan teng for the storefront animation.
 *
 * The room is described as simple 3D boxes (walls, booths, tables) and
 * flattened into SVG shapes with one-point perspective, so everything lines up
 * on the same vanishing point. Colours come from CSS classes (see
 * StorefrontInterior.astro), which read the --room-* tokens.
 */

/** The SVG drawing area. */
export const ROOM_VIEW = { width: 1600, height: 900 };

/** Where the aisle disappears to, and how wide the lens is. */
const CENTRE_X = 800;
const CENTRE_Y = 380;
const FOCAL = 800;

/** Sizes in metres. x = left/right of the aisle, y = below (+) or above (-) eye level, z = distance ahead. */
const HALF_WIDTH = 2.2;
const FLOOR = 1.5;
const CEILING = -1.3;
const NEAR = 0.9;
const FAR = 12;
const DADO = 0.3; // where the wall tiles stop and the wood panelling starts
const AISLE = 0.95; // inner edge of the booths
const BACK_TOP = 0.6; // top of a booth back
const SEAT = 1.05; // top of a seat cushion
const TABLE = 0.75; // table top
const BACK_THICK = 0.2;
const SEAT_DEPTH = 0.5;

type Point3 = [x: number, y: number, z: number];

export interface RoomShape {
  kind: 'polygon' | 'polyline';
  cls: string;
  points: string;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Flattens a point in the room onto the drawing. */
export function project([x, y, z]: Point3): [number, number] {
  return [round(CENTRE_X + (FOCAL * x) / z), round(CENTRE_Y + (FOCAL * y) / z)];
}

export function buildRoom(): RoomShape[] {
  const shapes: RoomShape[] = [];
  const points = (list: Point3[]) => list.map((point) => project(point).join(',')).join(' ');
  const quad = (cls: string, a: Point3, b: Point3, c: Point3, d: Point3) =>
    shapes.push({ kind: 'polygon', cls, points: points([a, b, c, d]) });
  const line = (cls: string, a: Point3, b: Point3) => shapes.push({ kind: 'polyline', cls, points: points([a, b]) });

  // ----- ceiling and floor -----
  quad('r-ceiling', [-HALF_WIDTH, CEILING, NEAR], [HALF_WIDTH, CEILING, NEAR], [HALF_WIDTH, CEILING, FAR], [-HALF_WIDTH, CEILING, FAR]);
  quad('r-floor', [-HALF_WIDTH, FLOOR, NEAR], [HALF_WIDTH, FLOOR, NEAR], [HALF_WIDTH, FLOOR, FAR], [-HALF_WIDTH, FLOOR, FAR]);
  for (let x = -1.8; x <= 1.81; x += 0.4) line('r-grout', [x, FLOOR, NEAR], [x, FLOOR, FAR]);
  for (let z = 1.2; z <= FAR; z += 0.4) line('r-grout', [-HALF_WIDTH, FLOOR, z], [HALF_WIDTH, FLOOR, z]);

  // ----- side walls: tiles below, wood panelling above, paper menus stuck on -----
  const posters: [from: number, to: number, cls: string][] = [
    [2.6, 3.5, 'r-paper-yellow'],
    [4.2, 5.0, 'r-paper-pink'],
    [5.8, 6.9, 'r-paper'],
    [7.6, 8.4, 'r-paper-yellow'],
    [9.2, 10.2, 'r-paper-mint'],
  ];
  for (const side of [-1, 1]) {
    const wall = side * HALF_WIDTH;
    quad('r-wall-upper', [wall, CEILING, NEAR], [wall, CEILING, FAR], [wall, DADO, FAR], [wall, DADO, NEAR]);
    quad('r-wall-tile', [wall, DADO, NEAR], [wall, DADO, FAR], [wall, FLOOR, FAR], [wall, FLOOR, NEAR]);
    quad('r-rail', [wall, DADO - 0.07, NEAR], [wall, DADO - 0.07, FAR], [wall, DADO, FAR], [wall, DADO, NEAR]);
    for (let z = 1; z <= FAR; z += 0.5) line('r-grout', [wall, DADO, z], [wall, FLOOR, z]);
    for (const y of [0.7, 1.1]) line('r-grout', [wall, y, NEAR], [wall, y, FAR]);
    for (const [from, to, cls] of posters) {
      quad(cls, [wall, -0.8, from], [wall, -0.8, to], [wall, -0.1, to], [wall, -0.1, from]);
      for (const y of [-0.62, -0.45, -0.28]) line('r-ink', [wall, y, from + 0.12], [wall, y, to - 0.12]);
    }
  }

  // ----- back wall: kitchen hatch over a red counter, menu boards either side of the clock -----
  quad('r-wall-upper', [-HALF_WIDTH, CEILING, FAR], [HALF_WIDTH, CEILING, FAR], [HALF_WIDTH, DADO, FAR], [-HALF_WIDTH, DADO, FAR]);
  quad('r-wall-tile', [-HALF_WIDTH, DADO, FAR], [HALF_WIDTH, DADO, FAR], [HALF_WIDTH, FLOOR, FAR], [-HALF_WIDTH, FLOOR, FAR]);
  quad('r-dark', [-1.15, -0.45, FAR], [1.15, -0.45, FAR], [1.15, 0.55, FAR], [-1.15, 0.55, FAR]);
  quad('r-glow', [-0.95, -0.3, FAR], [0.95, -0.3, FAR], [0.95, 0.5, FAR], [-0.95, 0.5, FAR]);
  quad('r-counter', [-1.35, 0.55, FAR], [1.35, 0.55, FAR], [1.35, FLOOR, FAR], [-1.35, FLOOR, FAR]);
  quad('r-chrome', [-1.4, 0.48, FAR], [1.4, 0.48, FAR], [1.4, 0.58, FAR], [-1.4, 0.58, FAR]);
  for (const side of [-1, 1]) {
    quad('r-paper-yellow', [side * 0.55, -1.12, FAR], [side * 1.95, -1.12, FAR], [side * 1.95, -0.62, FAR], [side * 0.55, -0.62, FAR]);
    for (const y of [-1.0, -0.87, -0.74]) line('r-ink', [side * 0.7, y, FAR], [side * 1.8, y, FAR]);
  }

  // ----- strip lights down the ceiling -----
  for (const z of [10.4, 8.4, 6.4, 4.4, 2.4]) {
    quad('r-light', [-0.45, CEILING + 0.01, z], [0.45, CEILING + 0.01, z], [0.45, CEILING + 0.01, z + 0.3], [-0.45, CEILING + 0.01, z + 0.3]);
  }

  // ----- booths, drawn from the far end towards us so nearer ones cover farther ones -----
  const benches = [10.2, 8.6, 7.0, 5.4, 3.8, 2.2];
  benches.forEach((z0, index) => {
    for (const side of [-1, 1]) {
      const wall = side * HALF_WIDTH;
      const inner = side * AISLE;
      const backEnd = z0 + BACK_THICK;

      // the seat behind this back (it faces the next table along)
      quad('r-leather-side', [inner, SEAT, backEnd], [inner, SEAT, backEnd + SEAT_DEPTH], [inner, FLOOR, backEnd + SEAT_DEPTH], [inner, FLOOR, backEnd]);

      // the table between this bench and the one beyond it
      if (index > 0) {
        const tableNear = z0 + 0.55;
        const tableFar = z0 + 1.25;
        const edge = side * 1.0;
        quad('r-table', [wall, TABLE, tableNear], [edge, TABLE, tableNear], [edge, TABLE, tableFar], [wall, TABLE, tableFar]);
        quad('r-paper', [side * 1.95, TABLE - 0.005, tableNear + 0.18], [side * 1.35, TABLE - 0.005, tableNear + 0.18], [side * 1.35, TABLE - 0.005, tableFar - 0.12], [side * 1.95, TABLE - 0.005, tableFar - 0.12]);
        quad('r-table-edge', [edge, TABLE, tableNear], [edge, TABLE, tableFar], [edge, TABLE + 0.07, tableFar], [edge, TABLE + 0.07, tableNear]);
        quad('r-table-edge', [wall, TABLE, tableNear], [edge, TABLE, tableNear], [edge, TABLE + 0.07, tableNear], [wall, TABLE + 0.07, tableNear]);
      }

      // the padded back
      quad('r-leather-side', [inner, BACK_TOP, z0], [inner, BACK_TOP, backEnd], [inner, FLOOR, backEnd], [inner, FLOOR, z0]);
      quad('r-leather-top', [wall, BACK_TOP, z0], [inner, BACK_TOP, z0], [inner, BACK_TOP, backEnd], [wall, BACK_TOP, backEnd]);
      quad('r-leather', [wall, BACK_TOP, z0], [inner, BACK_TOP, z0], [inner, FLOOR, z0], [wall, FLOOR, z0]);
      for (const fraction of [0.33, 0.66]) {
        const x = inner + (wall - inner) * fraction;
        line('r-seam', [x, BACK_TOP + 0.06, z0], [x, SEAT, z0]);
      }

      // the seat in front of the back (it faces us)
      const seatFront = z0 - SEAT_DEPTH;
      quad('r-leather-top', [wall, SEAT, seatFront], [inner, SEAT, seatFront], [inner, SEAT, z0], [wall, SEAT, z0]);
      quad('r-leather-side', [inner, SEAT, seatFront], [inner, SEAT, z0], [inner, FLOOR, z0], [inner, FLOOR, seatFront]);
      quad('r-leather-front', [wall, SEAT, seatFront], [inner, SEAT, seatFront], [inner, FLOOR, seatFront], [wall, FLOOR, seatFront]);
    }
  });

  return shapes;
}

/** The wall clock on the back wall. */
export function clockPosition() {
  const [cx, cy] = project([0, -0.87, FAR]);
  return { cx, cy, r: round((FOCAL * 0.2) / FAR) };
}

/** The vanishing point as percentages, for CSS transform-origin. */
export const VANISHING_POINT = {
  x: `${(CENTRE_X / ROOM_VIEW.width) * 100}%`,
  y: `${round((CENTRE_Y / ROOM_VIEW.height) * 100)}%`,
};
