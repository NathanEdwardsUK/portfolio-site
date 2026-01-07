export class Cell {
  constructor(coordinates, state, liveNeighboursCount = 0) {
    this.coordinates = coordinates;
    this.liveNeighboursCount = liveNeighboursCount;
    // state is what is considered when calculating the rules of game of life
    this.state = state;
    // indicativeState can override state when the cell is rendered on the canvas but
    // it does not influence the game's evolution. It can only have a visual effect.
    this.indicativeState = null;
    this.nextState = state;
  }

  getCoordinates() {
    return this.coordinates;
  }

  getLiveNeighboursCount() {
    return this.liveNeighboursCount;
  }

  setLiveNeighboursCount(count) {
    this.liveNeighboursCount = count;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
  }

  getDisplayState() {
    return this.indicativeState === null ? this.state : this.indicativeState;
  }

  getIndicativeState() {
    return this.indicativeState;
  }

  setIndicativeState(state) {
    this.indicativeState = state;
  }

  toggleState(isIndicative) {
    if (this.state === 1) {
      if (!isIndicative) {
        this.state = 0;
      } else {
        this.indicativeState = 0;
      }
    } else if (this.state === 0) {
      if (!isIndicative) {
        this.state = 1;
      } else {
        this.indicativeState = 1;
      }
    }
  }

  updateState() {
    this.state = this.nextState;
  }

  calculateNextState() {
    /*
    In this small variation of Game of Life I have 3 states
    0 = dead cell
    1 = alive cell
    2 = zombie cell (dead but rendered as alive. Can be overwritten with alive cell)

    Rules:
    - No cell can be alive next to an immortal cell
    - If an alive cell has 2 or 3 alive neighbours it stays alive, otherwise death.
    - If a dead cell has exactly 3 alive neighbours it will come to life
    - Zombie cells wont die, they can only be overwritten by live cells
    */
    if (this.state == 1 && this.liveNeighboursCount == 2) {
      this.nextState = 1;
    } else if (this.liveNeighboursCount == 3) {
      this.nextState = 1;
    } else if (this.state == 2) {
      this.nextState = 2;
    } else {
      this.nextState = 0;
    }
  }
}
