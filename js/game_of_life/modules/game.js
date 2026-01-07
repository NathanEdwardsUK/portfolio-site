import { Board } from "./board.js";

export class Game {
  constructor(canvas, initialAliveProbability, refreshInterval, initialState) {
    this.canvas = canvas;
    this.initialAliveProbability = initialAliveProbability;
    this.refreshInterval = refreshInterval;
    this.initialState = initialState;
    this.selectedPattern = null;
    this.mouseOverCell = null;
  }

  handleCanvasClick(x, y) {
    let [boardX, boardY] = this.canvas.canvasToBoardCoordinates(x, y);
    this.insertBoardPatternAndRender(boardX, boardY, false);
  }

  handleMouseMove(event) {
    if (!event.clientX) {
      // Ignore smartphone touch events
      return;
    }

    let [x, y] = this.canvas.canvasToBoardCoordinates(
      event.layerX,
      event.layerY
    );

    let coordStr = this.board.coordinatesToString(x, y);

    if (!this.mouseOverCell) {
      this.insertBoardPatternAndRender(x, y, true);
      this.mouseOverCell = this.board.getCells().get(coordStr);
      return;
    }

    let [prevX, prevY] = this.mouseOverCell.getCoordinates();
    if (x === prevX && y === prevY) {
      return;
    }

    this.board.clearIndicativeCells();
    this.insertBoardPatternAndRender(x, y, true);
    this.mouseOverCell = this.board.getCells().get(coordStr);
  }

  insertBoardPatternAndRender(x, y, isIndicative) {
    if (!this.selectedPattern) {
      this.board.toggleCellState(x, y, isIndicative);
    } else {
      this.board.insertPattern(this.selectedPattern, x, y, isIndicative);
    }

    // Ensure that an indicative pattern is not left overlaying the newly placed pattern on smartphones
    if (!isIndicative) {
      this.board.clearIndicativeCells();
    }

    this.canvas.renderBoard(this.board.getCells());
  }

  clearBoardIndicativePatterns() {
    this.board.clearIndicativeCells();
    this.canvas.renderBoard(this.board.getCells());
  }

  handleStartButtonClick() {
    if (this.loopIntervalID === undefined) {
      this.start();
    }
  }

  initNewGame() {
    this.board = new Board(this.initialState, this.initialAliveProbability);
    this.canvas.renderBoard(this.board.getCells());
  }

  triggerCanvasResize(height, width) {
    this.canvas.resize(height, width);
    this.canvas.renderBoard(this.board.getCells());
  }

  recenterCanvas(x, y) {
    this.canvas.setCenterCoordinates(x, y);
    this.canvas.renderBoard(this.board.getCells());
  }

  updateAndRenderBoard() {
    this.board.updateCells();
    this.canvas.renderBoard(this.board.getCells());
  }

  pause() {
    this.state = "stopped";
  }

  start() {
    this.state = "running";
    this.nextTurn();
  }

  nextTurn() {
    if (this.state == "running") {
      setTimeout(() => {
        this.updateAndRenderBoard();
        this.nextTurn();
      }, this.refreshInterval);
    }
  }

  setRefreshInterval(newIntervalMs) {
    this.refreshInterval = newIntervalMs;
  }

  getRefreshInterval(newIntervalMs) {
    return this.refreshInterval;
  }

  getCellSize() {
    return this.canvas.getCellSize();
  }

  setCellSize(newCellSize) {
    this.canvas.setCellSize(newCellSize);
    this.canvas.renderBoard(this.board.getCells());
  }

  clearBoard() {
    this.board.clearCells();
    this.updateAndRenderBoard();
  }

  setSelectedPattern(pattern) {
    this.selectedPattern = pattern;
  }

  getSelectedPattern() {
    return this.selectedPattern;
  }

  rotateSelectedPattern() {
    if (!this.selectedPattern) return;

    const M = this.selectedPattern.length;
    const N = this.selectedPattern[0].length;

    let rotatedPattern = new Array(N);
    for (let i = 0; i < N; i++) {
      rotatedPattern[i] = new Array(M);
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        rotatedPattern[i][j] = this.selectedPattern[M - j - 1][i];
      }
    }

    this.selectedPattern = rotatedPattern;
  }
}
