enum Game {
  301 = "301",
  501 = "501",
  Cricket = "Cricket",
}

type Point = {
  x: number;
  y: number;
};

type Record = {
  timestamp: number;

  canvas: { width: number; height: number };
  point: Point;

  game: Game;
  player: string;
  thro: Throw;
};

enum ThrowKind {
  Double = "D",
  Single = "S",
  Triple = "T",

  Floor = "F",
  Out = "O",
}

type Throw = {
  kind: ThrowKind;

  multiplier: number;
  segment: number;
};
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

// parseThrow parses throw notation.
// [t|T] = triple
// [d|D] = double
// [o|O] = out
// [f|F] = floor
// \d+ = segment
function parseThrow(score: string): Throw | null {
  const re = new RegExp("^(?<kind>f)|(?<kind>[dot])?(?<segment>\\d+)$", "i");

  const results = re.exec(score);
  if (results === null) return null;

  if (results.groups.segment !== undefined) {
    const segment = parseInt(results.groups.segment);
    const kind =
      results.groups.kind !== undefined
        ? results.groups.kind.toUpperCase()
        : "S";
    const multiplier =
      kind === "T" ? 3 : kind === "D" ? 2 : kind === "O" ? 0 : 1;

    return { kind, segment, multiplier };
  }

  return { kind: "F", segment: -1, multipler: 0 };
}

class Dartboard {
  private center: Point;
  private ctx: CanvasRenderingContext2D;
  private table: HTMLTableElement;
  private thro: number = 0;
  private turn: number = 0;
  private remaining: number = 301;
  private out: bool = false;

  debug: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    size: number,
    score: HTMLTableElement,
    reset: HTMLButtonElement,
    xport: HTMLButtonElement,
    clear: HTMLButtonElement,
  ) {
    this.ctx = canvas.getContext("2d");

    this.ctx.canvas.width = size;
    this.ctx.canvas.height = size;
    this.center = { x: canvas.width / 2, y: canvas.height / 2 };
    this.table = score;

    clear.addEventListener("click", (event) => {
      if (window.confirm("Do you really want to clear local storage?")) {
        localStorage.setItem("records", "");
      }
    });

    xport.addEventListener("click", (event) => {
      const text = localStorage.getItem("records") || [];
      const name = `${Date.now()}.json`;

      const a = document.createElement("a");
      const file = new Blob([text], { type: "application/json" });
      a.href = URL.createObjectURL(file);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    reset.addEventListener("click", (event) => {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.table.innerHTML = "";
      this.thro = 0;
      this.turn = 0;
      this.remaining = 301;
      this.out = false;

      board.draw();
    });

    addEventListener("click", (event) => {
      if (this.out) {
        return;
      }

      const point: Point = this.getMousePos(this.ctx, event);

      if (point === undefined) {
        return;
      }

      const score = this.score(point);
      const thro = parseThrow(score);

      const record: Record = {
        timestamp: Date.now(),

        canvas: {
          width: this.ctx.canvas.width,
          height: this.ctx.canvas.height,
        },
        point,

        game: Game["301"],
        player: "jdb",
        thro,
      };

      const records = localStorage.getJSON("records") || [];
      records.push(record);
      localStorage.setJSON("records", records);

      if (this.thro === 0) {
        this.table.insertRow(this.turn);
        this.table.rows[this.turn].insertCell(-1).textContent = this.turn + 1;
        this.table.rows[this.turn].insertCell(-1).textContent = this.remaining;
      }

      if (thro.kind === "F") {
        this.table.rows[this.turn].insertCell(-1).textContent = "FLOOR";
        this.thro++;

        if (this.thro === 3) {
          this.thro = 0;
          this.turn++;
        }

        return;
      }

      const remaining = this.remaining - thro.segment * thro.multiplier;

      if (remaining === 0 && thro.kind === "D") {
        this.table.rows[this.turn].insertCell(-1).textContent =
          `${score} (OUT)`;
        this.out = true;

        return;
      }

      if (remaining < 2) {
        this.table.rows[this.turn].insertCell(-1).textContent =
          `${score} (BUST)`;

        this.thro = 0;
        this.turn++;

        return;
      }

      this.remaining = remaining;

      this.table.rows[this.turn].insertCell(-1).textContent = score;
      this.table.rows[this.turn].cells[1].textContent = this.remaining;
      this.thro++;

      if (this.thro === 3) {
        this.thro = 0;
        this.turn++;
      }

      this.drawDart(point);
    });
  }

  // getMousePos returns the mouse position relative to the canvas.
  // If the mouse is outside the canvas, it returns undefined.
  private getMousePos(
    ctx: CanvasRenderingContext2D,
    evt: MouseEvent,
  ): Point | undefined {
    if (
      evt.clientX < ctx.canvas.offsetLeft ||
      evt.clientX > ctx.canvas.offsetLeft + ctx.canvas.width ||
      evt.clientY < ctx.canvas.offsetTop ||
      evt.clientY > ctx.canvas.offsetTop + ctx.canvas.height
    ) {
      return undefined;
    }
    return {
      x: evt.clientX - ctx.canvas.offsetLeft,
      y: evt.clientY - ctx.canvas.offsetTop,
    };
  }

  // drawDart draws a dart marker.
  private drawDart(point: Point) {
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
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
        length,
        angle,
        angle + (Math.PI * 2) / SEGMENTS,
      );
      this.ctx.lineTo(this.center.x, this.center.y);
      this.ctx.fillStyle = fillStyle(i);
      this.ctx.lineWidth = WIRE_WIDTH;
      this.ctx.strokeStyle = WIRE_COLOR;
      this.ctx.fill();
      this.ctx.stroke();
    }
  }
  private drawCircle(center: Point, radius: number, fillStyle: string) {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillStyle;
    this.ctx.lineWidth = WIRE_WIDTH;
    this.ctx.strokeStyle = WIRE_COLOR;
    this.ctx.fill();
    this.ctx.stroke();
  }

  // Draw the dartboard from the outside in.
  draw() {
    // Outer edge.
    this.drawCircle(
      this.center,
      OVERALL_DART_BOARD_DIAMETER / 2,
      SEGMENT_A_COLOR,
    );
    // Numbers.
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = ((Math.PI * 2) / SEGMENTS) * i;
      const text = SEGMENT_MAPPINGS[(i + 5) % SEGMENTS].toString();

      this.ctx.font = "20px Arial";
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        text,
        this.center.x +
          Math.cos(angle) * (OVERALL_DART_BOARD_DIAMETER / 2 - 20),
        this.center.y +
          Math.sin(angle) * (OVERALL_DART_BOARD_DIAMETER / 2 - 20),
      );
    }

    // Doubles.
    this.drawSegments(DOUBLE_WIRE_TO_CENTER_BULL, (i) =>
      i % 2 === 0 ? INNER_BULL_COLOR : OUTER_BULL_COLOR,
    );
    // Outer singles.
    this.drawSegments(DOUBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH, (i) =>
      i % 2 === 0 ? SEGMENT_A_COLOR : SEGMENT_B_COLOR,
    );
    // Trebles.
    this.drawSegments(TREBLE_WIRE_TO_CENTER_BULL, (i) =>
      i % 2 === 0 ? INNER_BULL_COLOR : OUTER_BULL_COLOR,
    );
    // Inner singles.
    this.drawSegments(TREBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH, (i) =>
      i % 2 === 0 ? SEGMENT_A_COLOR : SEGMENT_B_COLOR,
    );
    // Outer bull.
    this.drawCircle(
      this.center,
      OUTER_BULL_INSIDE_DIAMETER / 2,
      OUTER_BULL_COLOR,
    );
    // Inner bull.
    this.drawCircle(
      this.center,
      INNER_BULL_INSIDE_DIAMETER / 2,
      INNER_BULL_COLOR,
    );

    if (this.debug) this.drawGridLines();
  }

  // Calculate the score of a dart throw.
  score(point: Point) {
    const distance = Math.sqrt(
      Math.pow(point.x - this.center.x, 2) +
        Math.pow(point.y - this.center.y, 2),
    );

    if (distance <= INNER_BULL_INSIDE_DIAMETER / 2) {
      return "b50";
    }

    if (distance <= OUTER_BULL_INSIDE_DIAMETER / 2) {
      return "b25";
    }

    if (distance > OVERALL_DART_BOARD_DIAMETER / 2) {
      return "f";
    }

    const angle = Math.atan2(point.y - this.center.y, point.x - this.center.x);

    // Calculate the segment hit.
    let segment = Math.floor(
      ((angle + Math.PI / SEGMENTS) / (Math.PI * 2)) * SEGMENTS,
    );

    // Draw the segment hit for debugging.
    if (this.debug) {
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.ctx.lineTo(
        this.center.x + (Math.cos(angle) * OVERALL_DART_BOARD_DIAMETER) / 2,
        this.center.y + (Math.sin(angle) * OVERALL_DART_BOARD_DIAMETER) / 2,
      );
      this.ctx.strokeStyle = "orange";
      this.ctx.stroke();
    }

    const segmentScore = SEGMENT_MAPPINGS[(segment + SEGMENTS + 5) % SEGMENTS];

    const multiplier =
      distance <= TREBLE_WIRE_TO_CENTER_BULL &&
      distance > TREBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH
        ? "t"
        : distance <= DOUBLE_WIRE_TO_CENTER_BULL &&
            distance > DOUBLE_WIRE_TO_CENTER_BULL - DOUBLE_TREBLE_WIDTH
          ? "d"
          : distance >= DOUBLE_WIRE_TO_CENTER_BULL
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

Storage.prototype.setJSON = function (key, element) {
  return this.setItem(key, JSON.stringify(element));
};
Storage.prototype.getJSON = function (key) {
  const item = this.getItem(key);
  if (!item) return undefined;

  return JSON.parse(item);
};

const table = document.getElementById("score") as HTMLTableElement;
const reset = document.getElementById("reset") as HTMLButtonElement;
const canvas = document.getElementById("dartboard") as HTMLCanvasElement;
const xport = document.getElementById("export") as HTMLButtonElement;
const clear = document.getElementById("clear") as HTMLButtonElement;
const board = new Dartboard(
  canvas,
  window.innerHeight,
  table,
  reset,
  xport,
  clear,
);
board.draw();
