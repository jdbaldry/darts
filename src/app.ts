import { Classic301 } from "./game";

class App {
  private game: Classic301;
  private out: boolean = false;
  private table: HTMLTableElement;

  private canvas: HTMLCanvasElement;

  constructor() {
    const xport = document.getElementById("export") as HTMLButtonElement;
    if (xport === null) {
      throw new Error("Failed to get export button.");
    }
    const clear = document.getElementById("clear") as HTMLButtonElement;
    if (clear === null) {
      throw new Error("Failed to get clear button.");
    }
    const load = document.getElementById("load") as HTMLButtonElement;
    if (load === null) {
      throw new Error("Failed to get load button.");
    }

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

      this.game.darts = records;
      this.game.draw();
    });

    this.game = new Classic301(1);
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
