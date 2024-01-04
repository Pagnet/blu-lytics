/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import * as Sentry from '@sentry/react';
import { init } from '@fullstory/browser';
import mixpanel from 'mixpanel-browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { IInitializeParams, EnvironmentType } from './initializers.types';

const initializeConsole = (
  environment: EnvironmentType,
  providerName: string,
): void => {
  if (environment === 'development') {
    console.log(
      `[BLUEFIN] ${providerName} initialized using ${environment} environment`,
    );
  }
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
  init({ orgId: apiKey });

  initializeConsole(environment, 'FullStory');
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
  mixpanel.init(apiKey, {
    debug: true,
    track_pageview: true,
    persistence: 'localStorage',
  });

  initializeConsole(environment, 'MixpanelProvider');
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

  initializeConsole(environment, 'SentryProvider');
};

/**
 * Initializes error tracking providers based on the given parameters.
 * @param {IInitializeParams | IInitializeParams[]} paramsArray - Parameters for initialization.
 * @returns {void}
 */
export const initializeProviders = (
  paramsArray: IInitializeParams | IInitializeParams[],
): void => {
  const initialize = (params: IInitializeParams): void => {
    const {
      providerName,
      environment = 'production',
      tracesSampleRate = 0.1,
      apiKey = '',
    } = params;

    switch (providerName) {
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
  };

  if (Array.isArray(paramsArray)) {
    paramsArray.forEach(initialize);
  } else {
    initialize(paramsArray);
  }
};
