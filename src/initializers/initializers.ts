/* eslint-disable import/prefer-default-export */
import * as Sentry from '@sentry/react';
import mixpanel from 'mixpanel-browser';
import { BrowserTracing } from '@sentry/tracing';
import { CaptureConsole } from '@sentry/integrations';
import { IInitializeParams, EnvironmentType } from '../types/initializers.type';

const consoleInitializer = (enviroment: EnvironmentType, providerName: string): void => {
  if (enviroment === 'development') {
    console.log(`%c${providerName} initialized using bluefin`, 'color: red;');
  }
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

const mixPanelInitializer = (environment: EnvironmentType, token: string): void => {
  mixpanel.init(token, {
    debug: true,
    track_pageview: true,
    persistence: 'localStorage',
  });

  consoleInitializer(environment, 'MixpanelProvider');
};

export const initialize = (paramsArray: IInitializeParams | IInitializeParams[]): void => {
  const initializeProvider = (params: IInitializeParams): void => {
    const {
      providerName, environment, dsn = '', token = '',
    } = params;

    switch (providerName) {
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
