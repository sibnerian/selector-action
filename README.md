# State-aware Redux actions with Reselect syntax

[![Build Status](https://travis-ci.org/sibnerian/selector-action.svg?branch=master)](https://travis-ci.org/sibnerian/selector-action) [![Coverage Status](https://coveralls.io/repos/github/sibnerian/selector-action/badge.svg?branch=master)](https://coveralls.io/github/sibnerian/selector-action?branch=master) [![npm version](https://badge.fury.io/js/selector-action.svg?branch=master)](https://badge.fury.io/js/selector-action)

**selector-action** greatly simplifies a common Redux pattern: actions whose values depend on the
current Redux state. This is especially common with async actions, for example, when reloading some
data with an API call:

```js
// The active ID is in the Redux state, but we need it to make our API call. Sad!
export function reloadActiveItem(activeId) {
  return {
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  };
}
```

In this example, we have to pass in the active ID to the action creator, even though it’s actually
part of the Redux state. This pollutes our React components with unnecessary props, and makes
the action creators more complicated than they need to be. We could make it a little 
nicer with [`redux-thunk`](https://github.com/gaearon/redux-thunk):

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

This is already a lot better. However, you'll notice that there's a lot of boilerplate. We have to
get the state, call selectors on it, and then `dispatch` the resulting action. If we wanted to test
this action creator, there's even more boilerplate. We'd have to mock `getState` so that the
selectors return the right values, then spy on the `dispatch` function to assert that the correct
action was dispatched.

## Using `selector-action`

Let's simplify this contrived example by using `selectorAction`. Instead of doing the dispatching
and the action-creating ourselves, we’ll pass in a selector and an action creator function that uses
the selector's results. The end result is a `reloadActiveItem` function that's exactly equivalent
to the previous example.

```js
import selectorAction from 'selector-action';

// ...

export const reloadActiveItem = selectorAction(
  activeIdSelector,
  activeId => ({
    type: 'RELOAD_ACTIVE_ITEM',
    promise: fetch(`//website.com/items/${activeId}`),
  }),
);
```

As you can see, this looks a lot like the syntax of [Reselect](https://github.com/reactjs/reselect).
You pass in one or more selectors, then an action creator that takes the selectors’ return values as
its arguments. The result of this action creator function is what's dispatched.

To make testing easier, `selectorAction` exposes the original action creator as an
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

Note: Behind the scenes, `selectorAction` relies on `redux-thunk` to access the store’s `dispatch`
and `getState` functions . This means you still need to use `redux-thunk` as a middleware when using
this library.

## Other features

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
Here is an even more contrived example demonstrating this fact.

```js
export const awesomeAction = selectorAction([
  fooSelector,
  barSelector,
], (foo, bar) => ({ type: 'AWESOME!', payload: { foo, bar } }));
```

#### Using `selectorAction` as a thunk

You may run across a case where an action creator needs a mix of selector results and
regular arguments to compute an action. For instance, let’s say that the user has entered a new name
for the current active item. Your reducer will need both the new name AND the active item’s ID
to compute a new state. This can be done by wrapping `selectorAction` in a higher-order function.

```js
export function setActiveItemName(newName) {
  return selectorAction(activeIdSelector, activeId => ({
    type: 'SET_ITEM_NAME',
    payload: { activeId, newName },
  }));
}
```

`selectorAction` normally returns a generated action creator that takes no arguments.
However, if it is called with `dispatch` and `getState` as args, then it will return
a _thunk action_ instead. That's why this example works without having to call the result of
`selectorAction` as a function.

## License

MIT
