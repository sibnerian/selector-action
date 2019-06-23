function selectorAction(...args) {
  if (args.length === 0) {
    throw new Error('selectorAction called with no arguments');
  }
  // actionCreator: takes selector results as arguments, returns a Redux action
  const actionCreator = args[args.length - 1];
  // Selectors: functions of state -> any. May be passed in as a single array or multiple arguments.
  let selectors;
  if (args.length === 2 && Array.isArray(args[0])) {
    selectors = args[0];
  } else {
    selectors = args.slice(0, args.length - 1);
  }
  if (typeof actionCreator !== 'function') {
    throw new Error('Action creators must be functions');
  }
  selectors.forEach((selector) => {
    if (typeof selector !== 'function') {
      throw new Error('Selectors must be functions');
    }
  });
  const generatedActionCreator = function generatedActionCreator(
    dispatchArg,
    getStateArg,
  ) {
    const action = function internalGeneratedSelectorAction(
      dispatch,
      getState,
    ) {
      const state = getState();
      const appliedSelectors = selectors.map((selector) => selector(state));
      return dispatch(actionCreator(...appliedSelectors, state));
    };
    action.IS_SELECTOR_ACTION = true;
    // If this action creator is called as a thunk, we can dispatch directly.
    if (dispatchArg && getStateArg) {
      return action(dispatchArg, getStateArg);
    }
    // Otherwise this is a bonafide action creator which returns a thunk action
    return action;
  };
  // expose the original action creator for testing
  generatedActionCreator.originalActionCreator = actionCreator;
  generatedActionCreator.IS_SELECTOR_ACTION = true;
  return generatedActionCreator;
}

module.exports = selectorAction;
