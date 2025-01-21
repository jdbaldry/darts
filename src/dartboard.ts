import { Point, ThrowRecord } from "./notation";

/*
https://www.reddragondarts.com/pages/darts-rules

Double and Treble dimensions to be;

– for conventional wire boards, measured inside to inside           = 8.0mm +/- 0.2mm
– for boards manufactured with strip material measured apex to apex = 9.6mm +/- 0.2mm

‘Bull’ inside diameter                        = 12.7 mm.  +/- 0.2 mm
’25’ ring inside diameter                     = 31.8mm    +/- 0.3 mm
Outside edge of ‘Double’ wire to Centre Bull  = 170.0 mm. +/- 0.2 mm
Outside edge of ‘Treble’ wire to Centre Bull  = 107.0 mm. +/- 0.2 mm
Outside edge of ‘Double’ wire to outside edge = 340.0 mm. +/- 0.5 mm
Of ‘Double’ wire
Overall dartboard diameter {+/- 3.0 mm.}      = 451.0 mm. +/- 3.0 mm
*/
const INNER_BULL_INSIDE_DIAMETER = 12.7;
const OUTER_BULL_INSIDE_DIAMETER = 31.8;
const DOUBLE_WIRE_TO_CENTER_BULL = 170;
const TREBLE_WIRE_TO_CENTER_BULL = 107;
const DOUBLE_WIRE_TO_OUTSIDE_EDGE = 340;
const OVERALL_DART_BOARD_DIAMETER = 451;
const DOUBLE_TREBLE_WIDTH = 8;
const WIRE_WIDTH = 1;

const SEGMENTS = 20;
const SEGMENT_MAPPINGS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];
const WIRE_COLOR = "grey";
const INNER_BULL_COLOR = "red";
const OUTER_BULL_COLOR = "green";
const SEGMENT_A_COLOR = "#2e343a";
const SEGMENT_B_COLOR = "#fde1d0";

export class Dartboard {
  private center: Point;
  private ctx: CanvasRenderingContext2D;
  private scale: number;

  debug: boolean = false;

  constructor(canvas: HTMLCanvasElement, size: number) {
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Failed to get canvas context.");
    }
    this.ctx = ctx;

    this.ctx.canvas.width = size;
    this.ctx.canvas.height = size;

    this.center = { x: canvas.width / 2, y: canvas.height / 2 };
    this.scale = size / OVERALL_DART_BOARD_DIAMETER;

    this.draw();
  }

  reset() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.draw();
  }

  resize(size: number) {
    this.center = { x: size / 2, y: size / 2 };
    this.scale = size / OVERALL_DART_BOARD_DIAMETER;
  }

  // drawDart draws a dart marker.
  private drawDart(point: Point) {
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    this.ctx.arc(point.x, point.y, 3 * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = "orange";
    this.ctx.fill();

    // Draw lines extending from the center of the point to the edge of the canvas for debugging.
    if (this.debug) {
      this.ctx.moveTo(point.x, point.y);
      this.ctx.lineTo(this.center.x, this.center.y);
      this.ctx.stroke();
    }
  }

  private drawSegments(length: number, fillStyle: (i: number) => string) {
    for (let i = 0; i < SEGMENTS; i++) {
      // Offset the start angle by half the angle of a segment.
      const angle =
        (Math.PI * 2) / SEGMENTS / 2 + ((Math.PI * 2) / SEGMENTS) * i;

      this.ctx.beginPath();
      this.ctx.moveTo(this.center.x, this.center.y);
      this.ctx.arc(
        this.center.x,
        this.center.y,
        length * this.scale,
        angle,
        angle + (Math.PI * 2) / SEGMENTS
      );
      this.ctx.lineTo(this.center.x, this.center.y);
      this.ctx.fillStyle = fillStyle(i);
      this.ctx.lineWidth = WIRE_WIDTH * this.scale;
      this.ctx.strokeStyle = WIRE_COLOR;
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  private drawCircle(center: Point, radius: number, fillStyle: string) {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = fillStyle;
    this.ctx.lineWidth = WIRE_WIDTH * this.scale;
    this.ctx.strokeStyle = WIRE_COLOR;
    this.ctx.fill();
    this.ctx.stroke();
  }

  // Draw the dartboard from the outside in.
  draw(darts: Array<ThrowRecord> = []) {
    // Outer edge.
    this.drawCircle(
      this.center,
      OVERALL_DART_BOARD_DIAMETER / 2,
      SEGMENT_A_COLOR
    );
    // Numbers.
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = ((Math.PI * 2) / SEGMENTS) * i;
      const text = SEGMENT_MAPPINGS[(i + 5) % SEGMENTS].toString();

      this.ctx.font = `${20 * this.scale}px Arial`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        text,
        this.center.x +
          Math.cos(angle) *
            ((OVERALL_DART_BOARD_DIAMETER / 2 - 20) * this.scale),
        this.center.y +
          Math.sin(angle) *
            ((OVERALL_DART_BOARD_DIAMETER / 2 - 20) * this.scale)
      );
    }

    // Doubles.
    this.drawSegments(DOUBLE_WIRE_TO_CENTER_BULL, (i) =>
      i % 2 === 0 ? INNER_BULL_COLOR : OUTER_BULL_COLOR
    );
    // Outer singles.
    this.drawSegments(DOUBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH, (i) =>
      i % 2 === 0 ? SEGMENT_A_COLOR : SEGMENT_B_COLOR
    );
    // Trebles.
    this.drawSegments(TREBLE_WIRE_TO_CENTER_BULL, (i) =>
      i % 2 === 0 ? INNER_BULL_COLOR : OUTER_BULL_COLOR
    );
    // Inner singles.
    this.drawSegments(TREBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH, (i) =>
      i % 2 === 0 ? SEGMENT_A_COLOR : SEGMENT_B_COLOR
    );
    // Outer bull.
    this.drawCircle(
      this.center,
      OUTER_BULL_INSIDE_DIAMETER / 2,
      OUTER_BULL_COLOR
    );
    // Inner bull.
    this.drawCircle(
      this.center,
      INNER_BULL_INSIDE_DIAMETER / 2,
      INNER_BULL_COLOR
    );

    if (this.debug) this.drawGridLines();

    for (const dart of darts) {
      this.drawDart(dart.point);
    }
  }

  // getMousePos returns the mouse position relative to the canvas.
  // If the mouse is outside the canvas, it returns undefined.
  getMousePos(evt: MouseEvent): Point | undefined {
    if (
      evt.clientX < this.ctx.canvas.offsetLeft ||
      evt.clientX > this.ctx.canvas.offsetLeft + this.ctx.canvas.width ||
      evt.clientY < this.ctx.canvas.offsetTop ||
      evt.clientY > this.ctx.canvas.offsetTop + this.ctx.canvas.height
    ) {
      return undefined;
    }

    return {
      x: evt.clientX - this.ctx.canvas.offsetLeft,
      y: evt.clientY - this.ctx.canvas.offsetTop,
    };
  }

  // Calculate the score of a dart throw.
  score(point: Point) {
    const distance = Math.sqrt(
      Math.pow(point.x - this.center.x, 2) +
        Math.pow(point.y - this.center.y, 2)
    );

    if (distance <= (INNER_BULL_INSIDE_DIAMETER / 2) * this.scale) {
      return "b50";
    }

    if (distance <= (OUTER_BULL_INSIDE_DIAMETER / 2) * this.scale) {
      return "b25";
    }

    if (distance > (OVERALL_DART_BOARD_DIAMETER / 2) * this.scale) {
      return "f";
    }

    const angle = Math.atan2(point.y - this.center.y, point.x - this.center.x);

    // Calculate the segment hit.
    let segment = Math.floor(
      ((angle + Math.PI / SEGMENTS) / (Math.PI * 2)) * SEGMENTS
    );

    // Draw the segment hit for debugging.
    if (this.debug) {
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.ctx.lineTo(
        this.center.x + (Math.cos(angle) * OVERALL_DART_BOARD_DIAMETER) / 2,
        this.center.y + (Math.sin(angle) * OVERALL_DART_BOARD_DIAMETER) / 2
      );
      this.ctx.strokeStyle = "orange";
      this.ctx.stroke();
    }

    const segmentScore = SEGMENT_MAPPINGS[(segment + SEGMENTS + 5) % SEGMENTS];

    const multiplier =
      distance <= TREBLE_WIRE_TO_CENTER_BULL * this.scale &&
      distance > (TREBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH) * this.scale
        ? "t"
        : distance <= DOUBLE_WIRE_TO_CENTER_BULL * this.scale &&
          distance >
            (DOUBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH) * this.scale
        ? "d"
        : distance >= DOUBLE_WIRE_TO_CENTER_BULL * this.scale
        ? "o"
        : "";

    return `${multiplier}${segmentScore}`;
  }

  // Draw a grid of count rows and columns across the canvas from the center.
  private drawGridLines(count: number = 10) {
    for (let i = 0; i < count; i++) {
      const x = (this.ctx.canvas.width / count) * i;
      const y = (this.ctx.canvas.height / count) * i;

      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.ctx.canvas.height);
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.ctx.canvas.width, y);
      this.ctx.strokeStyle = "grey";
      this.ctx.stroke();
    }
  }
}
