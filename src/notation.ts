import { Game } from "./game";

export type Point = {
  x: number;
  y: number;
};

export type ThrowRecord = {
  timestamp: number;

  canvas: { width: number; height: number };
  point: Point;

  game: Game;
  player: string;
  throw: Throw;
};

export type Throw = {
  kind: ThrowKind;

  multiplier: number;
  segment: number;
};

export enum ThrowKind {
  Single = "S",

  Double = "D",

  Treble = "T",

  Floor = "F",
  Out = "O",
}

export const SymbolToKind: { [key: string]: ThrowKind } = {
  S: ThrowKind.Single,

  D: ThrowKind.Double,

  T: ThrowKind.Treble,

  F: ThrowKind.Floor,
  O: ThrowKind.Out,
};

export const ThrowMultiplier = {
  [ThrowKind.Single]: 1,

  [ThrowKind.Double]: 2,

  [ThrowKind.Treble]: 3,

  [ThrowKind.Floor]: 0,
  [ThrowKind.Out]: 0,
};

// Parse parses throw notation.
// [t|T] = triple
// [d|D] = double
// [o|O] = out
// [f|F] = floor
// \d+ = segment
export function Parse(score: string): Throw | null {
  const re = new RegExp("^(?<kind>f)|(?<kind>[dot])?(?<segment>\\d+)$", "i");

  const results = re.exec(score);
  if (results === null) return null;

  if (results.groups?.segment !== undefined) {
    const segment = parseInt(results.groups.segment);
    const kind: ThrowKind =
      results.groups.kind !== undefined
        ? SymbolToKind[results.groups.kind.toUpperCase()]
        : ThrowKind.Single;
    const multiplier = ThrowMultiplier[kind];

    return { kind, segment, multiplier };
  }

  return {
    kind: ThrowKind.Floor,
    segment: -1,
    multiplier: 0,
  };
}
