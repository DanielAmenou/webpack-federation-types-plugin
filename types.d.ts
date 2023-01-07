declare interface FederationTypesPluginOptions {
  exposeTypes?: boolean
  importTypes?: boolean
  excludeRemotes?: string[]
}

declare class FederationTypesPlugin {
  constructor(options?: FederationTypesPluginOptions)
  apply(compiler: any): void
}

export default FederationTypesPlugin