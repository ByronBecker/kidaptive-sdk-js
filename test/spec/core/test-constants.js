'use strict';

const completeOptions = {
  environment: 'dev',
  tier: 1,
  authMode: 'client',
  baseUrl: 'http://baseUrl',
  version: '1.0.0',
  build: '1.0.0.100',
  autoFlushInterval: 10000,
  autoFlushCallback: [() => {}, () => {}],
  loggingLevel: 'none'
};

const defaultApiKey = 'testApiKey';

const defaultState = {
  apiKey: defaultApiKey,
  initialized: true,
  options: {
    tier: 1, 
    authMode: 'client',
    environment: 'dev', 
    autoFlushInterval: 0, 
    loggingLevel: 'none'
  }
};

const minimumOptions = {
  environment: 'dev'
}

export default {
  completeOptions,
  defaultApiKey,
  defaultState,
  minimumOptions
}
