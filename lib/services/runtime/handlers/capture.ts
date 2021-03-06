import { Node as BaseNode, Trace } from '@voiceflow/base-types';
import { Node as ChatNode } from '@voiceflow/chat-types';
import { Node as GeneralNode } from '@voiceflow/general-types';
import wordsToNumbers from 'words-to-numbers';

import { Action, HandlerFactory } from '@/runtime';

import { isIntentRequest } from '../types';
import { addButtonsIfExists, addRepromptIfExists } from '../utils';
import CommandHandler from './command';
import RepeatHandler from './repeat';

const utilsObj = {
  repeatHandler: RepeatHandler(),
  wordsToNumbers,
  commandHandler: CommandHandler(),
  addRepromptIfExists,
  addButtonsIfExists,
};

export const CaptureHandler: HandlerFactory<GeneralNode.Capture.Node | ChatNode.Capture.Node, typeof utilsObj> = (utils) => ({
  canHandle: (node) => !!node.variable,
  handle: (node, runtime, variables) => {
    if (runtime.getAction() === Action.RESPONSE) {
      utils.addRepromptIfExists(node, runtime, variables);
      utils.addButtonsIfExists(node, runtime, variables);
      // quit cycleStack without ending session by stopping on itself
      return node.id;
    }

    // request for this turn has been processed, set action to response
    runtime.setAction(Action.RESPONSE);

    // check if there is a command in the stack that fulfills request
    if (utils.commandHandler.canHandle(runtime)) {
      return utils.commandHandler.handle(runtime, variables);
    }

    if (utils.repeatHandler.canHandle(runtime)) {
      return utils.repeatHandler.handle(runtime);
    }

    const request = runtime.getRequest();

    if (isIntentRequest(request)) {
      const { query } = request.payload;
      if (query) {
        const num = utils.wordsToNumbers(query);

        if (typeof num !== 'number' || Number.isNaN(num)) {
          variables.set(node.variable, query);
        } else {
          variables.set(node.variable, num);
        }
      }
    }

    runtime.trace.addTrace<Trace.PathTrace>({
      type: BaseNode.Utils.TraceType.PATH,
      payload: { path: 'capture' },
    });
    return node.nextId || null;
  },
});

export default () => CaptureHandler(utilsObj);
