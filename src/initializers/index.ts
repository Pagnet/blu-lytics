/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import * as Sentry from '@sentry/react';
import { init } from '@fullstory/browser';
import mixpanel from 'mixpanel-browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { IInitializeParams, EnvironmentType } from './initializers.types';

const initializeConsole = (enviroment: EnvironmentType, providerName: string): void => {
  if (enviroment === 'development') {
    console.log(`%c${providerName} initialized using bluefin`, 'color: red;');
  }
};

const fullStoryInitializer = (environment: EnvironmentType, orgId: string): void => {
  init({ orgId, devMode: environment !== 'production' });

  initializeConsole(environment, 'FullStory');
};

const mixPanelInitializer = (environment: EnvironmentType, token: string): void => {
  mixpanel.init(token, {
    debug: true,
    track_pageview: true,
    persistence: 'localStorage',
  });

  initializeConsole(environment, 'MixpanelProvider');
};

const sentryInitializer = (environment: EnvironmentType, dsn: string, tracesSampleRate: number):
void => {
  Sentry.init({
    dsn,
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

export const initialize = (paramsArray: IInitializeParams | IInitializeParams[]): void => {
  const initializeProvider = (params: IInitializeParams): void => {
    const {
      providerName, environment, dsn = '', token = '', orgId = '', tracesSampleRate = 0.1,
    } = params;

    switch (providerName) {
      case 'FullStoryProvider':
        fullStoryInitializer(environment, orgId);
        break;
      case 'SentryProvider':
        sentryInitializer(environment, dsn, tracesSampleRate);
        break;
      case 'MixpanelProvider':
        mixPanelInitializer(environment, token);
        break;
      default:
        break;
    }
  };

  if (Array.isArray(paramsArray)) {
    paramsArray.forEach(initializeProvider);
  } else {
    initializeProvider(paramsArray);
  }
};
