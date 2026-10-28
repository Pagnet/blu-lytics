<h1 align="center">
  <img alt="blu-lytics" src="https://github.com/Pagnet/blu-lytics/assets/102989712/7d06f590-85c6-4373-bec5-c672aa46a68b">
</h1>


## How it works
Main goals include: being the sole entry point, simplifying integration between monitoring tools, and enabling centralized sending of messages and events.
These goals offer developers the following benefits:

- **Unified messages and events** <br>
  Allows messages and events to be propagated across all monitoring tools through a single entry point.

- **Centralized and simplified configuration (Zero config)** <br>
  Enables initializing tools by providing only their key or token, without the need for prior configuration, saving time and reducing code.

- **Scalability** <br>
  Facilitates the removal or addition of a tool, as the library contains all necessary configuration for operation. Flexibility that enhances the efficiency of monitoring tool management.


## Installation
```sh
yarn add @useblu/blu-lytics
```
or
```sh
npm i @useblu/blu-lytics
```
## Usage
### Importing Library

#### Destructuring the import
```js

import { initializeProviders } from 'blu-lytics';

```
#### Importing all functionalities
```js

import * as blu-lytics from 'blu-lytics';

```

### Method: `initializeProviders`
This method simplifies the connection to one or more monitoring tools, eliminating the need for pre-configurations. Simply provide the name of the tool to be used and its API key 'apiKey'.

To establish a connection with a single tool, it is necessary to pass an object as a parameter, containing the fields providerName, apiKey, and another object with the environment (the latter is optional, with the default value being 'production').
```js
initializeProviders({providerName: 'track-tool-name', apiKey: 'your-api-key'}, {environment: 'development'});
```

To connect to more than one tool, it is necessary to pass an array (list) of objects as a parameter, maintaining the fields providerName, apiKey, and another object containing environment (optional).
```js
initializeProviders([
    { providerName: 'track-tool-name', apiKey: 'your-api-key'},
    { providerName: 'another-track-tool-name', apiKey: 'your-api-key'}
], {environment: 'development'});
```

#### Statsig identity
`statsigOptions.identity` decides who goes in the Statsig `userID`. `customIDs.client_uuid` always carries the client (from `_bl_props`), for gates with ID type `client_uuid`:
```
identity: 'client' (default)          identity: 'user'
userID                = client_uuid   userID                = user_id (none without a person)
customIDs.client_uuid = client_uuid   customIDs.client_uuid = client_uuid
custom.user_id        = user_id       custom.user_id        = user_id
```
The person comes from `user_id` in `setDefaultProperties` (stored in `_bl_props`, survives a reload) or, right after login, from `sendUserIdentification`.

#### Statsig session replay
Statsig only receives the events listed in `statsigOptions.events`. With `statsigOptions.sessionReplay: true`, the Statsig client also runs the triggered session replay (`@statsig/session-replay`): recordings start only through the triggers configured in the Statsig console (*Project Settings > Analytics & Session Replay*), and every text and input is masked on the client side.
```js
initializeProviders([{ providerName: 'Statsig', apiKey: 'client-key' }], {
  environment: 'production',
  statsigOptions: { events: ['transfer_accountlist_view'], sessionReplay: true },
});
```

### Method: `checkGate`
Evaluates a Statsig gate on the client for the current `client_uuid` (from `_bl_props`), after the SDK loads the values for that user. Resolves to `false` when Statsig is not initialized, without `client_uuid` or on any error. The evaluation logs the client-side exposure, which is what fires the session replay triggers by gate configured in the console.
```js
const enabled = await checkGate('frequent_payees_transfer');
```

### Method: `sendScreenEvent`
This method sends a message that will be propagated and recorded in all tools that have been previously initialized through the initializeProviders method. To use it, only a string needs to be provided as a parameter.
```js
sendScreenEvent('page_view');
```

### Method: `sendCustomEvent`
This method sends an event with a message and additional optional parameters, which will be propagated and recorded in all tools that have been previously initialized through the initializeProviders method.

To use it, two parameters need to be provided: a string to describe the event and an object containing the additional optional fields.
```js
sendCustomEvent('your_custom_page', {
    props1: 'any-information',
    props2: true,
  });
```

### Method: `sendUserIdentification`
This method sends relevant information related to user identification, such as their name, email, and ID, for example.

To use, it is possible to provide two parameters: a string representing a unique identifier and an object containing additional and optional fields.
```js
sendUserIdentification('user-id', {
    name: 'user name',
    email: 'user@email.com',
  });
```

## Supported tracking tools
- Sentry
- Fullstory
- Mixpanel

## Incoming Updates
### - Suport for Microsoft Clarity

## Contributing
Whether you're helping us fix bugs, improve the docs, or spread the word, we'd love to have you as part of this project! Read below to learn how you can take part of it.
### Code of Conduct
We adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](.github/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.
### Contributing Guide
Read our [contributing guide](.github/CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes.
### Release to NPM
To release a new version on NPM registry, just bump version on *`package.json`* and merge it into master to automatically publish a new version.
## License
All packages are licensed under the terms of the MIT License.
