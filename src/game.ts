import { Dartboard } from "./dartboard";
import { Parse, ThrowKind, ThrowRecord } from "./notation";

export enum Game {
  Classic301 = "301",
  Classic501 = "501",
  Cricket = "Cricket",
}

export class Classic301 {
  private board: Dartboard;
  private canvas: HTMLCanvasElement;
  private content: HTMLDivElement;
  private game: HTMLDivElement;
  private table: HTMLTableElement;
  private players: number = 1;
  private out: boolean = false;

  darts: Array<ThrowRecord> = [];

  constructor(players: number) {
    this.game = document.getElementById("game") as HTMLDivElement;
    if (this.game === null) {
      throw new Error("Failed to get game element.");
    }

    this.canvas = document.getElementById("dartboard") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Failed to get dartboard canvas.");
    }

    this.content = document.getElementById("content") as HTMLDivElement;
    if (this.content === null) {
      throw new Error("Failed to get content element.");
    }

    this.board = new Dartboard(
      this.canvas,
      Math.min(this.content.offsetWidth, this.content.offsetHeight)
    );
    this.players = players;

    const heading = document.createElement("h2");
    heading.textContent = "301";
    this.game.appendChild(heading);
    const undo = document.createElement("button");
    undo.textContent = "Undo";
    undo.addEventListener("click", (event) => {
      this.darts.pop();

      const records = localStorage.getJSON("records") || [];
      records.pop();
      localStorage.setItem("records", JSON.stringify(records));

      this.board.reset();
      this.board.draw(this.darts);
      this.updateTable();
    });
    this.game.appendChild(undo);

    const reset = document.createElement("button");
    reset.textContent = "Reset";
    reset.addEventListener("click", (event) => {
      this.board.reset();

      if (this.table.tBodies.length > 0) {
        this.table.removeChild(this.table.tBodies[0]);
      }

      this.out = false;
      this.darts = [];

      this.board.draw(this.darts);
    });
    this.game.appendChild(reset);

    // Create a table of visit count, remaining score, and visit darts for each player.
    this.table = document.createElement("table");
    const thead = this.table.createTHead().insertRow(0);
    for (const [i, header] of [
      { text: "Visit", width: "25%" },
      { text: "Remaining", width: "25%" },
      { text: "Darts", width: "50%" },
    ].entries()) {
      thead.insertCell(i).textContent = header.text;
      thead.cells[i].style.width = header.width;
    }

    // Make the "Darts" table heading row span the three throws cells.
    thead.cells[2].colSpan = 3;

    this.game.appendChild(this.table);

    addEventListener("click", (event) => {
      if (this.out) {
        return;
      }

      const point = this.board.getMousePos(event);
      if (point === undefined) {
        return;
      }

      const score = this.board.score(point);
      const thro = Parse(score);
      if (thro === null) {
        throw new Error(`Failed to parse score: ${score}`);
      }

      const record: ThrowRecord = {
        timestamp: Date.now(),

        canvas: {
          width: this.canvas.width,
          height: this.canvas.height,
        },
        point,

        game: Game.Classic301,
        player: "jdb",
        throw: thro,

        context: {},
      };

      window.visualViewport.addEventListener("resize", () => {
        const size: number = Math.min(
          this.content.offsetWidth,
          this.content.offsetHeight
        );

        this.darts = this.darts.map((record) => {
          record.canvas.width = size;
          record.canvas.height = size;
          record.point = {
            x: (record.point.x / record.canvas.width) * size,
            y: (record.point.y / record.canvas.height) * size,
          };

          return record;
        });

        this.board.resize(size);
        this.draw();
      });

      const records = localStorage.getJSON("records") || [];
      records.push(record);
      localStorage.setJSON("records", records);

      this.darts.push(record);

      this.updateTable();
      this.board.draw(this.darts);
    });
  }

  draw() {
    this.board.reset();
    this.board.draw(this.darts);
  }

  private updateTable() {
    let remaining: number = 301;
    let startOfTurn: number = 301;
    let thro: number = 0;
    let turn: number = 0;

    let body: HTMLTableSectionElement = document.createElement("tbody");
    let row: HTMLTableRowElement;
    this.darts.map((dart) => {
      if (thro === 0) {
        startOfTurn = remaining;

        row = body.insertRow(turn);
        // Visit count.
        row.insertCell().textContent = `${turn + 1}`;
        // Remaining score.
        row.insertCell().textContent = `${remaining}`;
        // Throws.
        row.insertCell();
        row.insertCell();
        row.insertCell();
      }

      if (this.wasForDouble(remaining)) {
        dart.context.forDouble = true;
      }

      const remainingCell = row.cells[1];
      const throwCell = row.cells[2 + thro];

      if (dart.throw.kind === ThrowKind.Floor) {
        throwCell.textContent = "FLOOR";
        thro++;

        if (thro === 3) {
          thro = 0;
          turn++;
        }

        return dart;
      }

      remaining -= dart.throw.segment * dart.throw.multiplier;

      if (remaining === 0 && dart.throw.kind === ThrowKind.Double) {
        throwCell.textContent = `${dart.throw.kind}${dart.throw.segment} (OUT)`;
        this.out = true;

        return dart;
      }

      if (remaining < 2) {
        throwCell.textContent = `${dart.throw.kind}${dart.throw.segment} (BUST)`;

        remaining = startOfTurn;
        remainingCell.textContent = `${remaining}`;

        thro = 0;
        turn++;

        return dart;
      }

      throwCell.textContent = `${dart.throw.kind}${dart.throw.segment}`;
      remainingCell.textContent = `${remaining}`;
      thro++;

      if (thro === 3) {
        thro = 0;
        turn++;
      }
    });

    // Replace this table's body with the new body.
    if (this.table.tBodies.length === 0) {
      this.table.appendChild(body);
    } else {
      this.table.replaceChild(body, this.table.tBodies[0]);
    }
  }

  private wasForDouble(remaining: number): boolean {
    return remaining === 50 || (remaining <= 40 && remaining % 2 === 0);
  }
}
