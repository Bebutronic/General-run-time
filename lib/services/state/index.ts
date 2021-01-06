import { Version } from '@voiceflow/api-sdk';
import { GeneralTrace } from '@voiceflow/general-types';
import { State } from '@voiceflow/runtime';

import { Context, InitContextHandler } from '@/types';

import { AbstractManager, injectServices } from '../utils';

export const utils = {};

const initializeStore = (variables: string[], defaultValue = 0) =>
  variables.reduce<Record<string, any>>((acc, variable) => {
    acc[variable] = defaultValue;
    return acc;
  }, {});

@injectServices({ utils })
class StateManager extends AbstractManager<{ utils: typeof utils }> implements InitContextHandler {
  /**
   * generate a context for a new session
   * @param versionID - project version to generate the context for
   */
  generate({ prototype, variables, rootDiagramID }: Version<any>): State {
    const entities = prototype?.model.slots.map(({ name }) => name) || [];

    const DEFAULT_STACK = [{ programID: rootDiagramID, storage: {}, variables: {} }];

    const stack =
      prototype?.context.stack?.map((frame) => ({
        ...frame,
        storage: frame.storage || {},
        variables: frame.variables || {},
      })) || DEFAULT_STACK;

    return {
      stack,
      variables: {
        // initialize all entities and variables to 0
        ...initializeStore(entities),
        ...initializeStore(variables),
        ...prototype?.context.variables,
      },
      storage: {
        ...prototype?.context.storage,
      },
    };
  }

  async handle(context: Partial<Context>) {
    if (!context.versionID) {
      throw new Error('context versionID not defined');
    }

    let version: undefined | Version<any>;
    const getVersion = async (): Promise<Version<any>> => {
      return version || this.services.dataAPI.getVersion(context.versionID!);
    };

    return {
      ...context,
      state: context.state || this.generate(await getVersion()),
      trace: [] as GeneralTrace[],
      request: context.request || null,
      versionID: context.versionID,
      data: { ...context.data, getVersion },
    };
  }
}

export default StateManager;
