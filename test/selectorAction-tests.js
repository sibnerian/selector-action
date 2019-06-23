import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import selectorAction from '../src/selectorAction';

chai.use(sinonChai);
const expect = chai.expect;

const actionCreatorErrorRegex = /Action creators must be functions/i;
const selectorErrorRegex = /Selectors must be functions/i;

const fakeDispatch = sinon.spy((x) => x);
const fakeAction = {
  type: 'FAKE',
  payload: false,
};

describe('selectorAction', () => {
  beforeEach(() => {
    fakeDispatch.reset();
  });

  it('throws if called without arguments', () => {
    expect(() => selectorAction()).to.throw(
      /selectorAction called with no arguments/i,
    );
  });

  it('throws if passed a non-function action creator', () => {
    expect(() => selectorAction('foo')).to.throw(actionCreatorErrorRegex);
    expect(() => selectorAction(42)).to.throw(actionCreatorErrorRegex);
    expect(() => selectorAction({ baz: true })).to.throw(
      actionCreatorErrorRegex,
    );
    expect(() => selectorAction([1, 2, 3])).to.throw(actionCreatorErrorRegex);
  });

  it('throws if passed a non-function selector', () => {
    const actionCreator = () => ({ type: 'FOO', payload: 'BAR' });
    expect(() => selectorAction('foo', actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction(42, actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction({ baz: true }, actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction([1, 2, 3], actionCreator)).to.throw(
      selectorErrorRegex,
    );
  });

  it('throws if passed a non-function selector (array case)', () => {
    const actionCreator = () => ({ type: 'FOO', payload: 'BAR' });
    expect(() => selectorAction(['foo'], actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction([42], actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction([{ baz: true }], actionCreator)).to.throw(
      selectorErrorRegex,
    );
    expect(() => selectorAction([[1, 2, 3]], actionCreator)).to.throw(
      selectorErrorRegex,
    );
  });

  it('dispatches actionCreator(state) if no selectors', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const generatedActionCreator = selectorAction(actionCreator);
    const state = { FOO: 'bar' };
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(state);
    expect(fakeDispatch).to.have.been.calledWith(fakeAction);
  });

  it('dispatches actionCreator(state) if no selectors (array case)', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const generatedActionCreator = selectorAction([], actionCreator);
    const state = { FOO: 'bar' };
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(state);
    expect(fakeDispatch).to.have.been.calledWith(fakeAction);
  });

  it('calls actionCreator with the results of 1 selector and the state', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const state = { FOO: 'bar' };
    const fooSelector = (s) => s.FOO;
    const generatedActionCreator = selectorAction(fooSelector, actionCreator);
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(state.FOO, state);
    expect(fakeDispatch).to.have.been.calledWith(fakeAction);
  });

  it('calls actionCreator with the results of 1 selector and the state (array case)', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const state = { FOO: 'bar' };
    const fooSelector = (s) => s.FOO;
    const generatedActionCreator = selectorAction([fooSelector], actionCreator);
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(state.FOO, state);
    expect(fakeDispatch).to.have.been.calledWith(fakeAction);
  });

  it('calls actionCreator with the results of 2 selectors and the state', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const state = { FOO: 'bar' };
    const fooSelector = (s) => s.FOO;
    const bazSelector = () => 'baz';
    const generatedActionCreator = selectorAction(
      fooSelector,
      bazSelector,
      actionCreator,
    );
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(
      state.FOO,
      'baz',
      state,
    );
    expect(fakeDispatch).to.have.been.calledWith(fakeAction);
  });

  it('calls actionCreator with the results of 2 selectors and the state (array case)', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const state = { FOO: 'bar' };
    const fooSelector = (s) => s.FOO;
    const bazSelector = () => 'baz';
    const generatedActionCreator = selectorAction(
      [fooSelector, bazSelector],
      actionCreator,
    );
    generatedActionCreator()(fakeDispatch, () => state);
    expect(actionCreator).to.have.been.calledWithExactly(
      state.FOO,
      'baz',
      state,
    );
  });

  it('exposes the original action creator so it can be tested directly', () => {
    const actionCreator = sinon.spy(() => fakeAction);
    const fooSelector = (s) => s.FOO;
    const bazSelector = () => 'baz';
    const generatedActionCreator = selectorAction(
      fooSelector,
      bazSelector,
      actionCreator,
    );
    expect(generatedActionCreator.originalActionCreator).to.equal(
      actionCreator,
    );
  });

  it('dispatches the action directly when used as a thunk', () => {
    const activeIdSelector = (state) => state.activeId;
    const setActiveItemName = (newName) =>
      selectorAction(activeIdSelector, (activeId) => ({
        type: 'SET_ITEM_NAME',
        payload: { activeId, newName },
      }));
    const thunk = setActiveItemName('johnny');
    expect(thunk).to.be.a('function');
    const action = thunk(fakeDispatch, () => ({ activeId: 42 }));
    const expectedAction = {
      type: 'SET_ITEM_NAME',
      payload: { activeId: 42, newName: 'johnny' },
    };
    expect(action).to.eql(expectedAction);
    expect(fakeDispatch).to.have.been.calledWith(expectedAction);
  });
});
