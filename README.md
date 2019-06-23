# State-aware Redux actions with Reselect syntax

[![Build Status](https://travis-ci.org/sibnerian/selector-action.svg?branch=master)](https://travis-ci.org/sibnerian/selector-action) [![Coverage Status](https://coveralls.io/repos/github/sibnerian/selector-action/badge.svg?branch=master)](https://coveralls.io/github/sibnerian/selector-action?branch=master) [![npm version](https://badge.fury.io/js/selector-action.svg?branch=master)](https://badge.fury.io/js/selector-action)

### Basic Usage

```js
import selectorAction from 'selector-action';

// ...

export const reloadActiveItem = selectorAction(
  activeIdSelector,
  (activeId) => ({
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  }),
);
```

### Background

**selector-action** simplifies a common Redux pattern: actions that depend on the
current Redux state. For example, when you're reloading an "active" item's data with an API call:

```js
// The active ID is in the Redux state, but we need it to make our API call. Sad!
export function reloadActiveItem(activeId) {
  return {
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  };
}
```

In this example, we have to pass `activeId` to the action creator, even though it’s actually
part of the Redux state! This pollutes our React components with unnecessary props, and makes
the action creators more complicated than they need to be. We could try using [`redux-thunk`](https://github.com/gaearon/redux-thunk) to eliminat the argument, but that adds a lot of boilerplate:

```js
export function reloadActiveItem() {
  // We can access the current state by returning a thunk.
  return (dispatch, getState) => {
    const state = getState();
    const activeId = activeIdSelector(state);
    // Now we just have to dispatch the action...
    return dispatch({
      type: 'RELOAD_ACTIVE_ITEM',
      promise: fetch(`//website.com/items/${activeId}`),
    });
  };
}
```

We have to get the state, call selectors on it, and finally `dispatch` the resulting action.
And if we wanted to test this action creator, there's even _more_ boilerplate - we'd have to mock
`getState`, then spy on the `dispatch` function...it's not pretty.

## Using `selector-action`

`selectorAction` makes this pattern a breeze. Instead of doing the dispatching
and the action-creating ourselves, we’ll pass in a selector and an action creator function that uses
the selector's results. The end result is a `reloadActiveItem` function that's exactly equivalent
to the previous example.

```js
import selectorAction from 'selector-action';

// ...

export const reloadActiveItem = selectorAction(
  activeIdSelector,
  (activeId) => ({
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  }),
);
```

As you can see, this looks a lot like the syntax of [Reselect](https://github.com/reactjs/reselect).
You pass in one or more selectors, then an action creator that takes the selectors’ return values as
its arguments. The result of this action creator function is what's dispatched.

### Testing

`selectorAction` exposes the original action creator as an
`originalActionCreator` property of the generated function. This allows for testing the
underlying action creator without using a fake state or stubbing `dispatch`.

```js
describe('reloadActiveItem', () => {
  it('returns an action with the correct type', () => {
    const activeId = 1234;
    const action = reloadActiveItem.originalActionCreator(activeId);
    expect(action.type).to.eql('RELOAD_ACTIVE_ITEM');
  });
});
```

## middleware

If you're already using [`redux-thunk`](https://github.com/gaearon/redux-thunk), you don't need to
do anything to start using `selectorAction` - it’s fully compatible with the thunk middleware.

If you don’t _want_ to use `redux-thunk` (and there are some
[good](https://twitter.com/intelligibabble/status/800103510624727040)
[reasons](http://blog.isquaredsoftware.com/2017/01/idiomatic-redux-thoughts-on-thunks-sagas-abstraction-and-reusability/)
to not want to
), then `selector-action` provides a middleware for you to use instead:

```js
import { createStore, applyMiddleware } from 'redux';
import selectorActionMiddleware from 'selector-action/middleware';
import rootReducer from './reducers/index';

const store = createStore(
  rootReducer,
  applyMiddleware(selectorActionMiddleware),
);
```

`selector-action`'s middleware only runs when `selectorAction`s are dispatched. Similar to
`redux-thunk`, it plays nice with other common middlewares like
[`redux-pack`](https://github.com/lelandrichardson/redux-pack).

### Advanced features

#### `state` as an argument

In addition to the results of the selectors, `state` is passed in as the last argument to the action
creator. If you don't specify any selectors, then `state` is the _only_ argument. This can be useful
for converting actions that already use the `getState` trick shown above.

```js
export const reloadActiveItem = selectorAction((state) => {
  const activeId = activeIdSelector(state);
  return {
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  };
});
```

#### Arrays of selectors

Like Reselect, you can pass in an array of selectors instead of passing them as separate arguments.
Here is a contrived example demonstrating this feature.

```js
export const awesomeAction = selectorAction(
  [fooSelector, barSelector],
  (foo, bar) => ({ type: 'AWESOME!', payload: { foo, bar } }),
);
```

#### `selectorAction` with arguments

You'll probably run across a case where an action creator needs a _mix_ of selector results and
regular arguments to compute an action. For instance, let’s say that the user has entered a new name
for the current active item. Your reducer will need both the new name AND the active item’s ID
to compute a new state. This can be done by wrapping `selectorAction` in a higher-order function.

```js
export function setActiveItemName(newName) {
  return selectorAction(activeIdSelector, (activeId) => ({
    type: 'SET_ITEM_NAME',
    payload: { activeId, newName },
  }));
}
```

## License

MIT
