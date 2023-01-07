const validate = require("schema-utils").validate
const ts = require("typescript")
const axios = require("axios")
const fs = require("fs-extra")
const path = require("path")

const PLUGIN_NAME = "FederationTypesPlugin"
const MF_TYPES_DIR = "federation-types"
const DECLARATION_FILE_EXT = ".d.ts"

const tscOptions = {
  allowJs: true,
  declaration: true,
  emitDeclarationOnly: true,
}

const optionsSchema = {
  type: "object",
  properties: {
    ignoreRemotes: {
      type: "array",
    },
    exposeTypes: {
      type: "boolean",
    },
    importTypes: {
      type: "boolean",
    },
  },
}

const getAssetData = (content) => {
  const fileBuffer = Buffer.from(content, "utf-8")
  const fileData = {
    source: () => fileBuffer,
    size: () => fileBuffer.length,
  }
  return fileData
}

class FederationTypesPlugin {
  constructor(options = {}) {
    validate(optionsSchema, options)
    this._options = options
  }

  /**
   * @param {import("webpack").Compiler} compiler
   */
  apply(compiler) {
    const federationPlugin =
      compiler.options.plugins && compiler.options.plugins.find((plugin) => plugin.constructor.name === "ModuleFederationPlugin")
    if (!federationPlugin) throw new Error("No ModuleFederationPlugin found.")
    const logger = compiler.getInfrastructureLogger(PLUGIN_NAME)

    const exposes = Object.fromEntries(Object.entries(federationPlugin._options.exposes || {}).map(([k, v]) => [k.replace("./", ""), v]))

    const modulesPathsMap = Object.fromEntries(
      Object.entries(exposes).map(([name, currentPath]) => {
        const absPath = path.resolve(process.cwd(), currentPath)
        const extension = path.extname(currentPath) ? "" : fs.existsSync(absPath + ".jsx") ? ".jsx" : ".js"
        return [name, path.join(process.cwd(), currentPath + extension).replace(/\\/g, "/")]
      })
    )

    const declarationFileToExposeNameMap = Object.entries(modulesPathsMap).reduce(
      (result, [key, val]) => Object.assign(result, {[val.replace(/\.jsx?$/, DECLARATION_FILE_EXT)]: key}),
      {}
    )

    const modulesPaths = Object.values(modulesPathsMap)

    const createTypesDefinitions = (compilation) => {
      const host = ts.createCompilerHost(tscOptions)

      const createdFiles = {}
      host.writeFile = (fileName, fileContent) => {
        const isExposedModules = modulesPaths.some((current) => current.startsWith(fileName.replace(/\.d\.ts/, "")))
        if (isExposedModules) {
          createdFiles[fileName] = fileContent
        }
      }

      const program = ts.createProgram(modulesPaths, tscOptions, host)
      program.emit()

      // create definitions files
      modulesPaths.forEach((modulePath) => {
        const typeDefFilePath = modulePath.replace(/\.jsx?$/, DECLARATION_FILE_EXT)
        const typeDefFileContent = createdFiles[typeDefFilePath]
        if (typeDefFileContent) {
          compilation.emitAsset(
            path.join(MF_TYPES_DIR, declarationFileToExposeNameMap[typeDefFilePath] + DECLARATION_FILE_EXT),
            getAssetData(typeDefFileContent)
          )
        } else {
          logger.warn(`failed to create ${typeDefFilePath}`)
        }
      })

      // create index.json
      const modulesNames = Object.keys(exposes).map((moduleName) => moduleName + DECLARATION_FILE_EXT)
      compilation.emitAsset(path.join(MF_TYPES_DIR, "index.json"), getAssetData(JSON.stringify(modulesNames)))
    }

    const getRemoteDeclareDirPath = (remoteName) => path.resolve(process.cwd(), "node_modules", "@types", remoteName)

    const getTypesDefinitions = async () => {
      const remotes = federationPlugin._options.remotes
      if (!remotes) return

      const ignoreRemotes = this._options.ignoreRemotes || []
      const wantedRemotes = Object.entries(remotes).filter((remote) => ignoreRemotes.find((c) => c !== remote[0]))

      for (const [remoteName, remoteEntryUri] of wantedRemotes) {
        const {origin, pathname} = new URL(remoteEntryUri.split("@")[1])
        const remotePublicUrl = origin + pathname.slice(0, pathname.lastIndexOf("/") + 1)
        const remoteDeclareDirPath = getRemoteDeclareDirPath(remoteName)
        const federationTypesUrl = remotePublicUrl + MF_TYPES_DIR + "/"

        axios
          // get types index from the current remote
          .get(federationTypesUrl + "index.json")
          .catch((error) => {
            if (error.response?.status === 404) logger.warn(`WARNING: remote ${remoteName} has no types`)
            else logger.error("Failed to get remote types index", error.message)
          })
          .then((response) => response?.data)
          .then((modulesNames) => {
            if (!modulesNames) return
            // for each remote module get his types
            modulesNames.forEach((moduleName) => {
              const moduleDeclarationFileUrl = federationTypesUrl + moduleName
              axios
                .get(moduleDeclarationFileUrl)
                .catch((error) => {
                  logger.error(`Failed to get ${moduleDeclarationFileUrl} ${error.message}`)
                })
                .then((declarationFileResponse) => {
                  if (!declarationFileResponse) return
                  const declarationFileContent = declarationFileResponse.data
                  const decFilePath = path.join(remoteDeclareDirPath, moduleName)
                  fs.writeFile(decFilePath, declarationFileContent, {recursive: true})
                  fs.promises
                    .mkdir(path.dirname(decFilePath), {recursive: true})
                    .catch((error) => logger.error(`Failed to write dir: ${decFilePath}`, error))
                    .then(() => fs.writeFile(decFilePath, declarationFileContent, {recursive: true}))
                    .catch((error) => logger.error(`Failed to write declaration file: ${decFilePath}`, error))
                })
                .catch((error) => {
                  logger.error(`Failed to get ${moduleDeclarationFileUrl} ${error.message}`)
                })
            })
          })
          .catch((error) => {
            logger.error("Failed to add declaration file", error.message)
          })
      }
    }

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const pluginOptions = this._options || {}
      compilation.hooks.beforeCodeGeneration.tap(PLUGIN_NAME, () => {
        if (pluginOptions.exposeTypes !== false) createTypesDefinitions(compilation)
        if (compilation.options.mode === "development" && pluginOptions.importTypes !== false) {
          getTypesDefinitions()
          // TODO - call getTypesDefinitions using setInterval
        }
      })
    })
  }
}

module.exports = FederationTypesPlugin
