import chai from 'chai';
import thunkMiddleware from '../src/middleware';
import selectorAction from '../src/selectorAction';

describe('custom thunk middleware', () => {
  const doDispatch = () => {};
  const doGetState = () => {};
  const nextHandler = thunkMiddleware({
    dispatch: doDispatch,
    getState: doGetState,
  });

  it('must return a function to handle next', () => {
    chai.assert.isFunction(nextHandler);
    chai.assert.strictEqual(nextHandler.length, 1);
  });

  describe('handle next', () => {
    it('must return a function to handle action', () => {
      const actionHandler = nextHandler();

      chai.assert.isFunction(actionHandler);
      chai.assert.strictEqual(actionHandler.length, 1);
    });

    describe('handle action', () => {
      it('must run the given action as a thunk if IS_SELECTOR_ACTION = true', (done) => {
        const actionHandler = nextHandler();
        const action = (dispatch, getState) => {
          chai.assert.strictEqual(dispatch, doDispatch);
          chai.assert.strictEqual(getState, doGetState);
          done();
        };
        action.IS_SELECTOR_ACTION = true;
        actionHandler(action);
      });

      it('must pass action to next if not a function', (done) => {
        const actionObj = {};

        const actionHandler = nextHandler((action) => {
          chai.assert.strictEqual(action, actionObj);
          done();
        });

        actionHandler(actionObj);
      });

      it('must pass action to next if it is a function but IS_SELECTOR_ACTION != true', (done) => {
        const actionFunc = () => {};

        const actionHandler = nextHandler((action) => {
          chai.assert.strictEqual(action, actionFunc);
          done();
        });

        actionHandler(actionFunc);
      });

      it('must return the return value of next if not a function', () => {
        const expected = 'redux';
        const actionHandler = nextHandler(() => expected);

        const outcome = actionHandler();
        chai.assert.strictEqual(outcome, expected);
      });

      it('must return the return value of next IS_SELECTOR_ACTION != true', () => {
        const expected = 'redux';
        const actionHandler = nextHandler(() => expected);

        const outcome = actionHandler(() => {});
        chai.assert.strictEqual(outcome, expected);
      });

      it('must return value as expected if a function and IS_SELECTOR_ACTION = true', () => {
        const expected = 'rocks';
        const actionHandler = nextHandler();
        const action = () => expected;
        action.IS_SELECTOR_ACTION = true;

        const outcome = actionHandler(action);
        chai.assert.strictEqual(outcome, expected);
      });

      it('must be invoked synchronously if a function', () => {
        const actionHandler = nextHandler();
        let mutated = 0;
        const action = () => mutated++;
        action.IS_SELECTOR_ACTION = true;

        actionHandler(action);
        chai.assert.strictEqual(mutated, 1);
      });

      it('works with selectorAction', () => {
        // selectorAction will dispatch once internally before finally calculating the action
        // so we use the identity function to assert that the right thing got returned eventually
        const nextHandlerWithIdentityDispatch = thunkMiddleware({
          dispatch: (x) => x,
          getState: doGetState,
        });
        const expected = 'rocks';
        const actionHandler = nextHandlerWithIdentityDispatch();
        const action = selectorAction(() => expected);

        const outcome = actionHandler(action);
        chai.assert.strictEqual(outcome, expected);
      });
    });
  });

  describe('handle errors', () => {
    it('must throw if argument is non-object', (done) => {
      try {
        thunkMiddleware();
      } catch (err) {
        done();
      }
    });
  });
});
