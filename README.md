# webpack-federation-types-plugin

This plugin generates TypeScript type declaration files for the modules exposed by a remote application. It enables the automatic creation, sharing, and fetching of type definitions for your modules across different applications in a Webpack Module Federation setup.

The plugin compiles the exposed modules into TypeScript declaration files and shares them as public assets. On the consumer side, it automatically fetches these remote type declaration files and places them in the standard node_modules/@types directory. This ensures that the consuming application can seamlessly access the type definitions without any additional setup, making the integration of remote types effortless and transparent.

## Installation

You can install the plugin by running the following command in your terminal:

`npm i --save-dev webpack-federation-types-plugin`

`yarn add --dev webpack-federation-types-plugin`

## Usage

After installing the plugin, you can use it in your webpack configuration file as follows:

```javascript
const FederationTypesPlugin = require("webpack-federation-types-plugin")

module.exports = {
  // ...
  plugins: [new FederationTypesPlugin({excludeRemotes: ["remoteName"], importTypes: true, exposeTypes: true})],
}
```

- This plugin should be added to the browser config

## Plugin Options

The plugin takes an options object with the following properties:

##### exposeTypes

Type: boolean
Default: true
Description: create and share the declaration files

##### importTypes

Type: boolean
Default: true
Description: fetch the remotes declaration files and add them to the @types directory

##### excludeRemotes

Type: string[]
Default: undefined
Description: remotes to ignore

##### getTypesInterval

Type: string
Default: undefined
Description: the interval between types requests
Example: "5 minutes", "30 seconds"

##### federationConfig

Type: object
Description: Allows you to override certain configurations from the ModuleFederationPlugin. You can specify properties such as exposes and remotes to merge or replace the original settings.
