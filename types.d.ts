declare interface FederationTypesPluginOptions {
  exposeTypes?: boolean
  importTypes?: boolean
  headers?: object
  excludeRemotes?: string[]
  federationConfig?: object
  getTypesInterval?: string
}

declare class FederationTypesPlugin {
  constructor(options?: FederationTypesPluginOptions)
  apply(compiler: any): void
}

export default FederationTypesPlugin
