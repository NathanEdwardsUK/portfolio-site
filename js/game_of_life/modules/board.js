import { Cell } from "./cell.js";

export class Board {
  constructor(
    initialStateArray = [[]], // Int array defining starting condition of board
    aliveProbability = 0.1
  ) {
    /*
      - initialStateArray is an array that contains a starting pattern placed at 
        the center of the board
      - aliveProbability is the probability that any random cells in the  created to fill in 
        gaps in the initialStateArray are alive
    */
    this.initialStateArray = initialStateArray;
    this.aliveProbability = aliveProbability;
    this.cells = new Map(); // All cells that are either alive or neighbour to a live cells
    this.indicativeCells = [];
    this.fillBoard();
  }

  fillBoard() {
    let arrayHeight = this.initialStateArray.length;
    let arrayWidth = this.initialStateArray[0].length;

    for (let j = 0; j < arrayHeight; j++) {
      for (let i = 0; i < arrayWidth; i++) {
        let cellState = this.initialStateArray[j][i];
        cellState =
          cellState == -1
            ? Number(Math.random() < this.aliveProbability)
            : cellState;

        if (cellState != 0) {
          let x = 1 + i - Math.round(arrayWidth / 2);
          let y = 1 + j - Math.round(arrayHeight / 2);
          let coordStr = this.coordinatesToString(x, y);
          let cell = new Cell([x, y], cellState);
          this.cells.set(coordStr, cell);
        }
      }
    }
  }

  toggleCellState(x, y, isIndicative) {
    let coordStr = this.coordinatesToString(x, y);
    let cell = this.cells.get(coordStr);

    if (!cell) {
      cell = new Cell([x, y], 0);
      this.cells.set(coordStr, cell);
    }

    cell.toggleState(isIndicative);
    if (isIndicative) {
      this.indicativeCells.push(cell);
    }
  }

  insertPattern(insertArray, x, y, isIndicative) {
    // Inserts int array into board setting boardCells[x, y] = insertArray[0,0]
    let insertHeight = insertArray.length;
    let insertWidth = insertArray[0].length;

    for (let j = 0; j < insertHeight; j++) {
      for (let i = 0; i < insertWidth; i++) {
        let coords = [
          Math.round(x - insertWidth / 2 + i),
          Math.round(y - insertHeight / 2 + j)
        ];
        let coordStr = this.coordinatesToString(coords[0], [coords[1]]);
        let cellState = insertArray[j][i];

        if (!this.cells.get(coordStr)) {
          this.cells.set(coordStr, new Cell(coords, 0));
        }

        let cell = this.cells.get(coordStr);

        if (!isIndicative) {
          cell.setState(cellState);
        } else {
          cell.setIndicativeState(cellState);
          this.indicativeCells.push(cell);
        }
      }
    }
  }

  clearIndicativeCells() {
    for (let i = 0; i < this.indicativeCells.length; i++) {
      this.indicativeCells[i].setIndicativeState(null);
    }

    this.indicativeCells = [];
  }

  updateCells() {
    let prevCells = structuredClone(this.cells);

    // First go through all cells, add them and their neighbours to this.cells, count number of live neighbours
    for (let [coordStr, obj] of prevCells.entries()) {
      let cell = this.cells.get(coordStr);
      if (cell.getState() == 1) {
        let [x, y] = this.stringToCoordinates(coordStr);
        this.addNeighboursToCells(x, y);
      }
    }

    // Then calculate and update every cell state
    for (let [coordStr, cell] of this.cells.entries()) {
      cell.calculateNextState();
      cell.updateState();
    }

    // Then delete all the dead cells and reset live neighbour counts to 0
    for (let [coordStr, cell] of this.cells.entries()) {
      if (cell.getState() == 0 && cell.getIndicativeState() === null) {
        this.cells.delete(coordStr);
      } else {
        cell.setLiveNeighboursCount(0);
      }
    }
  }

  clearCells() {
    this.cells = new Map();
  }

  addNeighboursToCells(x, y) {
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        if (i == x && j == y) continue;

        let coordStr = this.coordinatesToString(i, j);
        let cell = this.cells.get(coordStr);

        if (cell) {
          cell.setLiveNeighboursCount(cell.getLiveNeighboursCount() + 1);
        } else {
          cell = new Cell([i, j], 0, 1);
          this.cells.set(coordStr, cell);
        }
      }
    }
  }

  getCells() {
    return this.cells;
  }

  coordinatesToString(x, y) {
    return `${x},${y}`;
  }

  stringToCoordinates(str) {
    let x = Number(str.split(",")[0]);
    let y = Number(str.split(",")[1]);
    return [x, y];
  }
}
