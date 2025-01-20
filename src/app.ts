import { Dartboard } from "./dartboard";
import { Parse, Point, ThrowKind, ThrowRecord } from "./notation";
import { Game } from "./game";

class App {
  private darts: Array<ThrowRecord> = [];
  private out: boolean = false;
  private table: HTMLTableElement;

  private canvas: HTMLCanvasElement;
  private board: Dartboard;

  constructor() {
    this.table = document.getElementById("score") as HTMLTableElement;
    if (this.table === null) {
      throw new Error("Failed to get score table.");
    }
    const reset = document.getElementById("reset") as HTMLButtonElement;
    if (reset === null) {
      throw new Error("Failed to get reset button.");
    }
    this.canvas = document.getElementById("dartboard") as HTMLCanvasElement;
    if (this.canvas === null) {
      throw new Error("Failed to get dartboard canvas.");
    }
    const xport = document.getElementById("export") as HTMLButtonElement;
    if (xport === null) {
      throw new Error("Failed to get export button.");
    }
    const clear = document.getElementById("clear") as HTMLButtonElement;
    if (clear === null) {
      throw new Error("Failed to get clear button.");
    }
    const undo = document.getElementById("undo") as HTMLButtonElement;
    if (undo === null) {
      throw new Error("Failed to get undo button.");
    }
    const load = document.getElementById("load") as HTMLButtonElement;
    if (load === null) {
      throw new Error("Failed to get load button.");
    }

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
      };

      const records = localStorage.getJSON("records") || [];
      records.push(record);
      localStorage.setJSON("records", records);

      this.darts.push(record);

      this.updateTable();
      this.board.draw(this.darts);
    });

    clear.addEventListener("click", (event) => {
      if (window.confirm("Do you really want to clear local storage?")) {
        localStorage.setItem("records", "");
      }
    });

    xport.addEventListener("click", (event) => {
      const text = localStorage.getItem("records") || "[]";
      const now = new Date().toISOString();
      const name = `${now}.json`;

      const a = document.createElement("a");
      const file = new Blob([text], { type: "application/json" });
      a.href = URL.createObjectURL(file);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    load.addEventListener("click", async (event) => {
      const [fileHandle] = await window.showOpenFilePicker({
        excludeAcceptAllOption: true,
        multiple: false,
        startIn: "downloads",
        types: [
          {
            description: "JSON files",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      const file = await fileHandle.getFile();

      const contents = await file.text();
      localStorage.setItem("records", contents);
      const records = localStorage.getJSON("records") || [];

      this.darts = records;
      this.board.draw(this.darts);
    });

    reset.addEventListener("click", (event) => {
      this.board.reset();
      this.table.innerHTML = "";
      this.out = false;
      this.darts = [];

      this.board.draw(this.darts);
    });

    undo.addEventListener("click", (event) => {
      this.darts.pop();

      const records = localStorage.getJSON("records") || [];
      records.pop();
      localStorage.setItem("records", JSON.stringify(records));

      this.board.draw(this.darts);
      this.updateTable();
    });

    this.board = new Dartboard(
      this.canvas,
      window.innerHeight > window.innerWidth
        ? window.innerWidth
        : window.innerHeight
    );

    addEventListener("resize", () => {
      const size: number = Math.min(window.innerWidth, window.innerHeight);

      this.canvas.width = size;
      this.canvas.height = size;
      this.board.resize(size);

      this.darts = this.darts.map((dart) => {
        return {
          ...dart,
          point: {
            x: (dart.point.x / this.canvas.width) * size,
            y: (dart.point.y / this.canvas.height) * size,
          },
        };
      });
    });
  }

  private updateTable() {
    let remaining: number = 301;
    let startOfTurn: number = 301;
    let thro: number = 0;
    let turn: number = 0;

    this.table.innerHTML = "";

    for (const dart of this.darts) {
      if (thro === 0) {
        startOfTurn = remaining;

        this.table.insertRow(turn);
        this.table.rows[turn].insertCell(-1).textContent = `${turn + 1}`;
        this.table.rows[turn].insertCell(-1).textContent = `${remaining}`;
      }

      if (dart.throw.kind === ThrowKind.Floor) {
        this.table.rows[turn].insertCell(-1).textContent = "FLOOR";
        thro++;

        if (thro === 3) {
          thro = 0;
          turn++;
        }

        continue;
      }

      remaining -= dart.throw.segment * dart.throw.multiplier;

      if (remaining === 0 && dart.throw.kind === ThrowKind.Double) {
        this.table.rows[turn].insertCell(
          -1
        ).textContent = `${dart.throw.kind}${dart.throw.segment} (OUT)`;
        this.out = true;

        continue;
      }

      if (remaining < 2) {
        this.table.rows[turn].insertCell(
          -1
        ).textContent = `${dart.throw.kind}${dart.throw.segment} (BUST)`;

        remaining = startOfTurn;
        thro = 0;
        turn++;

        continue;
      }

      this.table.rows[turn].insertCell(
        -1
      ).textContent = `${dart.throw.kind}${dart.throw.segment}`;
      this.table.rows[turn].cells[1].textContent = `${remaining}`;
      thro++;

      if (thro === 3) {
        thro = 0;
        turn++;
      }
    }
  }
}

Storage.prototype.setJSON = function (key: string, element: any) {
  return this.setItem(key, JSON.stringify(element));
};
Storage.prototype.getJSON = function (key: string) {
  const item = this.getItem(key);
  if (!item) return undefined;

  return JSON.parse(item);
};

new App();
