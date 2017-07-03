# State-aware actions with [reselect](https://github.com/reactjs/reselect) syntax

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

In this example, we have to pass in the active ID to our action _even though it’s actually available
as part of the Redux state!_ This pollutes our React components with unnecessary props, and makes
the actions themselves more complicated than they need to be. We could make this a little 
nicer with [`redux-thunk`](https://github.com/gaearon/redux-thunk):

```js
export function reloadActiveItem() {
  return (dispatch, getState) => {
    // Clever clever! We can access the current state by returning a thunk.
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

This is already a lot better! However, if you do this enough times, you'll notice that there's a lot
of boilerplate here. There's even more boilerplate when you’re testing this action creator: you need
to mock `getState` so that your selectors return the right values, then spy on `dispatch` to make
sure that the right action is being dispatched.

## Using `selector-action`

Let's simplify this contrived example by using `selectorAction`. Instead of doing the dispatching
and the action-creating ourselves, we’ll pass in a the selector and an action creator that uses
the selector's results.

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

As you can see, this looks a lot like the syntax of Reselect. You pass in one or more selectors,
then an action creator that takes the selectors’ return values as its arguments. The result of the
action creator function is what's dispatched.

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
to compute a new state. Using `selectorAction`, you can create an action like this using a
higher-order function:

```js
export function setActiveItemName(newName) {
  return selectorAction(activeIdSelector, activeId => ({
    type: 'SET_ITEM_NAME',
    payload: { activeId, newName },
  }));
}
```

This works because `selectorAction` normally returns a generated action creator that takes no
arguments. However, if it is called with `dispatch` and `getState` as args, then it will return
a _thunk action_ instead.

## License

MIT
