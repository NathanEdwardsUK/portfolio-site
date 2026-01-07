import { Canvas } from "./modules/canvas.js";
import { Game } from "./modules/game.js";
import { Board } from "./modules/board.js";
import { PATTERNS, WELCOME_MSG_STATE_MIN_2 } from "./modules/patterns.js";

const CONFIG = {
  cellSize: 10,
  minCellSize: 0.5,
  maxCellSize: 100,
  aliveColor: "rgb(0, 255, 42)",
  deadColor: "rgb(0, 0, 0)",
  refreshIntervalMs: 100,
  minRefreshIntervalMs: 5,
  maxRefreshIntervalMs: 2000,
  initialAliveProbability: 0.15,
  zoomSpeedFactor: 0.4,
};

let body = document.querySelector("body");
let htmlGameCanvas = document.getElementById("game-canvas");
let htmlPreviewCanvas = document.getElementById("preview-canvas");

// Control buttons and sliders
let speedSlider = document.getElementById("speed-slider");
let rotateButton = document.getElementById("rotate-button");
let runStopButton = document.getElementById("run-stop-button");
let stepButton = document.getElementById("step-button");
let clearButton = document.getElementById("clear-button");

// Create pattern selection dropdown menu
let patternDropdown = document.getElementById("pattern-dropdown");
for (const pattern in PATTERNS) {
  patternDropdown.options.add(new Option(pattern, pattern));
}

const mainCanvas = new Canvas(
  htmlGameCanvas,
  CONFIG.cellSize,
  CONFIG.aliveColor,
  CONFIG.deadColor
);

const game = new Game(
  mainCanvas,
  0.0,
  CONFIG.refreshIntervalMs,
  WELCOME_MSG_STATE_MIN_2
);

function resizeCanvas() {
  game.triggerCanvasResize(body.clientHeight, body.clientWidth);
}

window.addEventListener("resize", resizeCanvas);

// -------------------------------------------
// Handle Slider Interactions
// -------------------------------------------

function logSlider(minValue, maxValue, newValue) {
  // Allows a slider to linearly control a non linear variable by
  // logarithmically rescaling
  newValue = Math.max(minValue, Math.min(maxValue, newValue));
  let minLogValue = Math.log(minValue);
  let maxLogValue = Math.log(maxValue);
  let scale = (maxLogValue - minLogValue) / 100;
  let newLogValue = minLogValue + newValue * scale;

  return Math.exp(newLogValue);
}

function inverseLogSlider(minValue, maxValue, currentValue) {
  // Inverts the logSlider function by converting a value into a percentage
  let currentLogValue = Math.log(currentValue);
  let minLogValue = Math.log(minValue);
  let maxLogValue = Math.log(maxValue);
  let scale = (maxLogValue - minLogValue) / 100;
  let percentageValue = (currentLogValue - minLogValue) / scale;
  return percentageValue;
}

let minUpdatesPerS = 1000 / CONFIG.maxRefreshIntervalMs;
let maxUpdatesPerS = 1000 / CONFIG.minRefreshIntervalMs;
// Set the speed slider positions based on CONFIG values
speedSlider.value = inverseLogSlider(
  minUpdatesPerS,
  maxUpdatesPerS,
  1000 / game.getRefreshInterval()
);

speedSlider.addEventListener("input", (event) => {
  let newUpdatesPerS = logSlider(
    minUpdatesPerS,
    maxUpdatesPerS,
    event.target.value
  );

  let newRefreshInterval = 1000 / newUpdatesPerS;
  game.setRefreshInterval(newRefreshInterval);
});

// --------------------------------
// Handle Mouse Actions on Canvas
// --------------------------------

let mouseDown = false;
let mouseMoved = false;
let startX;
let startY;

htmlGameCanvas.addEventListener("pointerdown", (event) => {
  mouseDown = true;
  mouseMoved = false;
  startX = event.layerX;
  startY = event.layerY;
});

htmlGameCanvas.addEventListener("pointerup", (event) => {
  mouseDown = false;

  if (!mouseMoved) {
    game.handleCanvasClick(event.layerX, event.layerY);
  }
  startX = undefined;
  startY = undefined;
});

// In case the user mousedowns over the canvas and mouseups over another part of the window
window.addEventListener("pointerup", () => {
  mouseDown = false;
  startX = undefined;
  startY = undefined;
});

htmlGameCanvas.addEventListener("pointermove", (event) => {
  let cellSize = mainCanvas.getCellSize();

  if (
    mouseDown &&
    (Math.abs(event.layerX - startX) > cellSize / 2 ||
      Math.abs(event.layerY - startY) > cellSize / 2)
  ) {
    mouseMoved = true;
    game.clearBoardIndicativePatterns();
    game.recenterCanvas(-event.movementX, -event.movementY);
  } else {
    game.handleMouseMove(event);
  }
});

htmlGameCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();

  let currentLogScaleCellSize = inverseLogSlider(
    CONFIG.minCellSize,
    CONFIG.maxCellSize,
    game.getCellSize()
  );

  let newCellSize = logSlider(
    CONFIG.minCellSize,
    CONFIG.maxCellSize,
    currentLogScaleCellSize - event.deltaY * CONFIG.zoomSpeedFactor
  );

  game.setCellSize(newCellSize);
});

// --------------------
// Handle Touch Events
// --------------------

let startCellSize;
let startDist;
let touchEvents = [];

function copyTouch({ identifier, clientX, clientY }) {
  return { identifier, clientX, clientY };
}

htmlGameCanvas.addEventListener("touchstart", (event) => {
  // console.log(event);
  event.preventDefault();
  const touches = event.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    touchEvents.push(copyTouch(touches[i]));
  }

  if (touchEvents.length == 2) {
    startDist = euclideanDistance(touchEvents[0], touchEvents[1]);
    startCellSize = game.getCellSize();
  } else if (touchEvents.length > 2) {
    startDist = undefined;
    startCellSize = undefined;
  }
});

function euclideanDistance(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.clientY - point1.clientY, 2) +
    Math.pow(point2.clientX - point1.clientX, 2)
  );
}

htmlGameCanvas.addEventListener("touchmove", (event) => {
  event.preventDefault();

  if (event.touches.length == 2 && startDist) {
    const curDist = euclideanDistance(event.touches[0], event.touches[1]);
    let changeDist = startDist - curDist;
    let screenSize = Math.sqrt(
      (htmlGameCanvas.offsetHeight, 2) + Math.pow(htmlGameCanvas.offsetWidth, 2)
    );

    let cellSizePctChange =
      (CONFIG.zoomSpeedFactor * (100 * changeDist)) / screenSize;

    let startLogScaleCellSize = inverseLogSlider(
      CONFIG.minCellSize,
      CONFIG.maxCellSize,
      startCellSize
    );

    let newCellSize = logSlider(
      CONFIG.minCellSize,
      CONFIG.maxCellSize,
      startLogScaleCellSize - cellSizePctChange
    );

    game.setCellSize(newCellSize);
  } else {
    touchEvents = [];
  }
});

htmlGameCanvas.addEventListener("touchend", (event) => {
  game.clearBoardIndicativePatterns();

  event.preventDefault();
  touchEvents = [];
  startDist = undefined;
  startCellSize = undefined;
});

// --------------------
// Handle Button Clicks
// --------------------

rotateButton.addEventListener("click", () => {
  game.rotateSelectedPattern();
  drawPreviewBox(game.getSelectedPattern(), htmlPreviewCanvas);
});

runStopButton.addEventListener("click", (event) => {
  if (runStopButton.textContent === "Run") {
    game.start();
    runStopButton.textContent = "Stop";
  } else {
    game.pause();
    runStopButton.textContent = "Run";
  }
});

stepButton.addEventListener("click", (event) => {
  game.updateAndRenderBoard();
});

clearButton.addEventListener("click", (event) => {
  game.clearBoard();
});

patternDropdown.addEventListener("change", (event) => {
  let pattern = PATTERNS[patternDropdown.value];
  game.setSelectedPattern(pattern);

  if (!pattern) {
    htmlPreviewCanvas.style.display = "none";
    rotateButton.style.display = "none";
  } else {
    htmlPreviewCanvas.style.display = "block";
    rotateButton.style.display = "inline-block";
    drawPreviewBox(pattern);
  }
});

function drawPreviewBox(pattern) {
  let boardSize = Math.max(pattern.length, pattern[0].length);
  let cellSize = htmlPreviewCanvas.height / boardSize;
  let canvas = new Canvas(htmlPreviewCanvas, cellSize, "black", "white");

  // The coordinate at the center of the preview canvas will differ 
  // depending on odd or even number of cells
  if (boardSize % 2 == 1) {
    canvas.setCenterCoordinates(0.5 * cellSize, 0.5 * cellSize);
  } else {
    canvas.setCenterCoordinates(1 * cellSize, 1 * cellSize);
  }

  let previewBoard = new Board(pattern, 0);
  let cells = previewBoard.getCells();
  canvas.renderBoard(cells);
}

game.initNewGame();
resizeCanvas();
game.pause();
