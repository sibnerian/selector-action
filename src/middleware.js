// Adapted from redux-thunk (https://github.com/gaearon/redux-thunk)

function createModifiedThunkMiddleware() {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function' && action.IS_SELECTOR_ACTION) {
      return action(dispatch, getState);
    }

    return next(action);
  };
}

const thunk = createModifiedThunkMiddleware();
export default thunk;
