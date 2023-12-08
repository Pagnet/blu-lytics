/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
import * as Sentry from '@sentry/react';
import { init } from '@fullstory/browser';
import mixpanel from 'mixpanel-browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { IInitializeParams, EnvironmentType } from './initializers.types';

const consoleInitializer = (enviroment: EnvironmentType, providerName: string): void => {
  if (enviroment === 'development') {
    console.log(`%c${providerName} initialized using bluefin`, 'color: red;');
  }
};

const fullStoryInitializer = (environment: EnvironmentType, orgId: string): void => {
  init({ orgId, devMode: environment !== 'production' });

  consoleInitializer(environment, 'FullStory');
};

const mixPanelInitializer = (environment: EnvironmentType, token: string): void => {
  mixpanel.init(token, {
    debug: true,
    track_pageview: true,
    persistence: 'localStorage',
  });

  consoleInitializer(environment, 'MixpanelProvider');
};

const sentryInitializer = (environment: EnvironmentType, dsn: string): void => {
  Sentry.init({
    dsn,
    integrations: [
      new BrowserTracing(),
      new CaptureConsole({
        levels: ['warn', 'error'],
      }),
    ],
    environment,
    tracesSampleRate: 0.2,
    initialScope: {
      tags: {
        environment,
      },
    },
  });

  consoleInitializer(environment, 'SentryProvider');
};

export const initialize = (paramsArray: IInitializeParams | IInitializeParams[]): void => {
  const initializeProvider = (params: IInitializeParams): void => {
    const {
      providerName, environment, dsn = '', token = '', orgId = '',
    } = params;

    switch (providerName) {
      case 'FullStoryProvider':
        fullStoryInitializer(environment, orgId);
        break;
      case 'SentryProvider':
        sentryInitializer(environment, dsn);
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
