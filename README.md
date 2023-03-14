# webpack-federation-types-plugin

This plugin generates TypeScript type declaration files for the modules that are exposed by a remote application.
With this plugin, you can get type definitions for your modules and use them in your consuming applications without having to manually import and maintain them.

It compiles the exposed files into type declaration files and shares them as public files
On the consumer side, the plugin fetches the remote types declaration files and adds them to the "node_modules/@types" directory. This is the standard location for TypeScript type definitions that are used by the consuming application. By placing the generated type declaration files in this directory, the plugin makes them available to the consuming application without the need for any additional configuration.

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