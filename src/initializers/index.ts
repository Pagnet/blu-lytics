/* eslint-disable import/no-mutable-exports */
import * as Sentry from '@sentry/react';
import { init } from '@fullstory/browser';
import mixpanel from 'mixpanel-browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { clarity } from 'react-microsoft-clarity';
import { IInitializeParams, EnvironmentType } from './initializers.types';

/**
 * Checks if the environment is set to 'production'.
 * @param {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @returns {boolean} - True if the environment is 'production', false otherwise.
 */
const isProduction = (environment: EnvironmentType): boolean => environment === 'production';

/**
 * Initializes Microsoft Clarity for error tracking in a web environment.
 * @param {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @param {string} id - The Clarity project id.
 * @returns {void}
 */

const clarityInitializer = (
  environment: EnvironmentType,
  apiKey: string,
): void => {
  if (isProduction(environment)) clarity.init(apiKey);
};

/**
 * Initializes FullStory for error tracking in a web environment.
 * @param {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @param {string} orgId - The FullStory organization ID.
 * @returns {void}
 */

const fullStoryInitializer = (
  environment: EnvironmentType,
  apiKey: string,
): void => {
  if (isProduction(environment)) {
    init({ orgId: apiKey });
  } else {
    init({ orgId: apiKey, devMode: true });
  }
};

/**
 * Initializes MixPanel for error tracking in a web environment.
 * @param {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @param {string} credential - The MixPanel project token.
 * @returns {void}
 */

const mixPanelInitializer = (
  environment: EnvironmentType,
  apiKey: string,
): void => {
  if (isProduction(environment)) {
    localStorage.setItem('_bl_mp', apiKey);
    mixpanel.init(apiKey);
    localStorage.removeItem('_bl_init');
  }
};

/**
 * Initializes Sentry for error tracking in a web environment.
 * @param {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @param {string} dsn - The Sentry DSN (Data Source Name).
 * @param {number} tracesSampleRate - The percentage of transactions to be sampled (0 to 1).
 * @returns {void}
 */

const sentryInitializer = (
  environment: EnvironmentType,
  apiKey: string,
  tracesSampleRate = 0.5,
): void => {
  if (!isProduction(environment)) {
    return;
  }

  if (tracesSampleRate < 0 || tracesSampleRate > 1) {
    throw new Error('tracesSampleRate must be in the range [0, 1]');
  }

  Sentry.init({
    dsn: apiKey,
    integrations: [
      new BrowserTracing(),
      new CaptureConsole({
        levels: ['warn', 'error'],
      }),
    ],
    environment,
    tracesSampleRate,
    initialScope: {
      tags: {
        environment,
      },
    },
  });
};

/**
 * Represents the current environment setting for providers.
 * @type {EnvironmentType}
 * @description This variable stores the current environment setting
 *              used by providers. It is initially undefined and
 *              gets updated when the `initializeProviders` function is called.
 *              Make sure to call `initializeProviders` before accessing this value.
 */
let userSelectedEnvironment: EnvironmentType;

/**
 * Initializes error tracking providers based on the given parameters.
 * @param {IInitializeParams | IInitializeParams[]} paramsArray - Parameters for initialization.
 * @options {EnvironmentType} environment - The environment (e.g., 'production', 'development').
 * @returns {void}
 */
export const initializeProviders = (
  paramsArray: IInitializeParams | IInitializeParams[],
  options: { environment: EnvironmentType } = { environment: 'production' },
): void => {
  const { environment } = options;
  const initializedProviders: string[] = [];
  const initialize = (params: IInitializeParams): void => {
    const {
      providerName,
      tracesSampleRate = 0.1,
      apiKey = '',
    } = params;

    switch (providerName) {
      case 'Clarity':
        clarityInitializer(environment, apiKey);
        break;
      case 'FullStory':
        fullStoryInitializer(environment, apiKey);
        break;
      case 'Sentry':
        sentryInitializer(environment, apiKey, tracesSampleRate);
        break;
      case 'MixPanel':
        mixPanelInitializer(environment, apiKey);
        break;
      default:
        break;
    }
    initializedProviders.push(providerName);
    localStorage.setItem('_bl_providers', JSON.stringify(initializedProviders));
  };

  localStorage.setItem('_bl_env', environment);
  userSelectedEnvironment = environment;

  if (Array.isArray(paramsArray)) {
    paramsArray.forEach(initialize);
  } else {
    initialize(paramsArray);
  }

  if (initializedProviders.length > 0) {
    console.log('[blu-lytics] Initialized providers:', initializedProviders);
  }
};

export { userSelectedEnvironment };
