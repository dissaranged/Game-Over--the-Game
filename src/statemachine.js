export class StateMachine {
  constructor(initialState, possibleStates, stateArgs = []) {
    this.initialState = initialState;
    this.possibleStates = {};
    this.stateArgs = [...stateArgs];
    this.state = null;

    // State instances get access to the state machine via this.
    for ( const [key, state] of Object.entries(possibleStates) ) {
      this.possibleStates[key] = {
	enter: state.enter.bind(this),
	execute: state.execute.bind(this),
      }
    }
  }

  step() {
    // On the first step, the state is null and we need to initialize the first state.
    if (this.state === null) {
      this.state = this.initialState;
      this.possibleStates[this.state].enter(...this.stateArgs);
    }

    // Run the current state's execute
    this.possibleStates[this.state].execute(...this.stateArgs);
  }

  transition(newState, ...enterArgs) {
    this.state = newState;
    this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs);
  }
}

export class State {
  enter() {

  }

  execute() {

  }
}
