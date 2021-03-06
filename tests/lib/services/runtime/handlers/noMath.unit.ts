import { Node } from '@voiceflow/base-types';
import { expect } from 'chai';
import sinon from 'sinon';

import { EMPTY_AUDIO_STRING, NoMatchHandler } from '@/lib/services/runtime/handlers/noMatch';
import { StorageType } from '@/lib/services/runtime/types';
import { outputTrace } from '@/lib/services/runtime/utils';

const RepromptPathTrace = { type: 'path', payload: { path: 'reprompt' } };

describe('noMatch handler unit tests', () => {
  describe('canHandle', () => {
    it('false', () => {
      expect(NoMatchHandler({} as any).canHandle({} as any, { storage: { get: sinon.stub().returns(null) } } as any, {} as any, null as any)).to.eql(
        false
      );
    });

    it('true', () => {
      expect(
        NoMatchHandler({} as any).canHandle(
          { noMatches: ['speak1', 'speak2'] } as any,
          { storage: { get: sinon.stub().returns(1) } } as any,
          {} as any,
          null as any
        )
      ).to.eql(true);

      expect(
        NoMatchHandler({} as any).canHandle(
          { noMatches: ['speak1', 'speak2'] } as any,
          { storage: { get: sinon.stub().returns(null) } } as any,
          {} as any,
          null as any
        )
      ).to.eql(true);
    });
  });

  describe('handle', () => {
    it('with noMatch', () => {
      const node = {
        id: 'node-id',
        noMatches: ['the counter is {counter}'],
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({ counter: 5.2345 }),
      };

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists: sinon.stub() });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args).to.eql([
        [RepromptPathTrace],
        [
          {
            type: 'speak',
            payload: {
              message: 'the counter is 5.23',
              type: 'message',
            },
          },
        ],
      ]);

      // assert produce
      const cb1 = runtime.storage.produce.args[0][0];
      // sets counter
      const draft1 = {};
      cb1(draft1);
      expect(draft1).to.eql({ [StorageType.NO_MATCHES_COUNTER]: 1 });
      // increases counter
      const draft2 = { [StorageType.NO_MATCHES_COUNTER]: 2 };
      cb1(draft2);
      expect(draft2).to.eql({ [StorageType.NO_MATCHES_COUNTER]: 3 });
      // adds output
    });

    it('without noMatch', () => {
      const node = {
        id: 'node-id',
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists: sinon.stub() });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args).to.eql([
        [RepromptPathTrace],
        [
          {
            type: 'speak',
            payload: {
              message: '',
              type: 'message',
            },
          },
        ],
      ]);
    });

    it('with buttons', () => {
      const node = {
        id: 'node-id',
        buttons: [{ intent: 'address_intent' }, { event: { type: Node.Utils.EventType.INTENT, intent: 'phone_number_intent' } }],
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const addButtonsIfExists = sinon.stub();

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(addButtonsIfExists.args).to.eql([[node, runtime, variables]]);
      expect(runtime.trace.addTrace.args).to.eql([
        [RepromptPathTrace],
        [
          {
            type: 'speak',
            payload: {
              message: '',
              type: 'message',
            },
          },
        ],
      ]);
    });

    it('with noMatch randomized', () => {
      const node = {
        id: 'node-id',
        noMatches: ['A', 'B', 'C'],
        randomize: true,
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists: sinon.stub() });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(node.noMatches.includes(runtime.trace.addTrace.args[1][0].payload.message)).to.eql(true);
    });

    it('with noMatch null speak string', () => {
      const NON_NULL_STRING = 'Josh was here';
      const node = {
        id: 'node-id',
        noMatches: [null, NON_NULL_STRING],
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists: sinon.stub() });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args[1][0].payload.message).to.eql(NON_NULL_STRING);
    });

    it('with noMatch empty audio', () => {
      const NON_NULL_STRING = 'Josh was here';
      const node = {
        id: 'node-id',
        noMatches: [EMPTY_AUDIO_STRING, NON_NULL_STRING],
      };
      const runtime = {
        storage: {
          produce: sinon.stub(),
          get: sinon.stub().returns(1),
        },
        trace: {
          addTrace: sinon.stub(),
        },
      };
      const variables = {
        getState: sinon.stub().returns({}),
      };

      const noMatchHandler = NoMatchHandler({ outputTrace, addButtonsIfExists: sinon.stub() });
      expect(noMatchHandler.handle(node as any, runtime as any, variables as any, null as any)).to.eql(node.id);
      expect(runtime.trace.addTrace.args[1][0].payload.message).to.eql(NON_NULL_STRING);
    });
  });
});
