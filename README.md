<h1 align="center">
  Bluefin
</h1>

## How it works
Main goals include: being the sole entry point, simplifying integration between monitoring tools, and enabling centralized sending of messages and events.

These goals offer developers the following benefits:

- Unified messages and events
    - Allows messages and events to be propagated across all monitoring tools through a single entry point.

- Centralized and simplified configuration (Zero config)
    - Enables initializing tools by providing only their key or token, without the need for prior configuration, saving time and reducing code.

- Scalability
    - Facilitates the removal or addition of a tool, as the library contains all necessary configuration for operation. Flexibility that enhances the efficiency of monitoring tool management.


## Installation
```sh
yarn add @useblu/bluefin
```
or
```sh
npm i @useblu/bluefin
```
## Usage
### Javascript

#### Destructuring the import
```js

import { initializeProviders } from ‘bluefin’;

```
#### Importing all functionalities
```js

import * as bluefin from ‘bluefin’;

```

#### initializeProviders

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
