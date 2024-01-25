<h1 align="center">
 ![image](https://github.com/Pagnet/bluefin/assets/102989712/30df8c4f-fa3d-40d4-9205-44b14bb163f6)
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
yarn add @useblu/bluefin
```
or
```sh
npm i @useblu/bluefin
```
## Usage
### Importing Library

#### Destructuring the import
```js

import { initializeProviders } from ‘bluefin’;

```
#### Importing all functionalities
```js

import * as bluefin from ‘bluefin’;

```

### Method: `initializeProviders`
This method simplifies the connection to one or more monitoring tools, eliminating the need for pre-configurations. Simply provide the name of the tool to be used and its API key 'apiKey'.

To establish a connection with a single tool, it is necessary to pass an object as a parameter, containing the fields providerName, apiKey, and another object with the environment (the latter is optional, with the default value being 'production').
```js
initializeProviders({providerName: 'track-tool-name', apiKey: 'your-api-key'}, {environment: ‘development’});
```

To connect to more than one tool, it is necessary to pass an array (list) of objects as a parameter, maintaining the fields providerName, apiKey, and another object containing environment (optional).
```js
initializeProviders([
    { providerName: 'track-tool-name', apiKey: 'your-api-key'},
    { providerName: 'another-track-tool-name', apiKey: 'your-api-key'}
], {environment: ‘development’});
```

### Method: `sendScreenEvent`
This method sends a message that will be propagated and recorded in all tools that have been previously initialized through the initializeProviders method. To use it, only a string needs to be provided as a parameter.
```js
sendScreenEvent(‘page_view’);
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
