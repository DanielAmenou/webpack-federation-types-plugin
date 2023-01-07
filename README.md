# webpack-federation-types-plugin

This plugin adds type declaration for remote modules.
It compiles the exposed files into type declaration files and shares them as public files
On the consumer side this plugin will fetch the remote types declaration files and will add them to the "node_modules/@types" directory

## Installation

`npm i --save-dev webpack-federation-types-plugin`

`yarn add --dev webpack-federation-types-plugin`

## Usage

```javascript
const FederationTypesPlugin = require("webpack-federation-types-plugin")

module.exports = {
  // ...
  plugins: [new FederationTypesPlugin({excludeRemotes: ["remoteName"], importTypes: true, exposeTypes: true})],
}
```

- This plugin should be added to the browser config

## Plugin Options

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

