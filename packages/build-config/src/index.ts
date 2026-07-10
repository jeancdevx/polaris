import type { RolldownOptions } from 'rolldown'

type PackageBuildOptions = {
  entry: string
  outDir?: string
  platform?: 'node' | 'browser'
}

export const createPackageBuildConfig = (
  options: PackageBuildOptions
): RolldownOptions => ({
  input: options.entry,
  output: {
    dir: options.outDir ?? 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
    sourcemap: true
  },
  platform: options.platform ?? 'node',
  treeshake: true,
  external: [/^node:/, /^@aws-sdk\//]
})

type LambdaBuildOptions = {
  entry: string
  outDir?: string
}

export const createLambdaBuildConfig = (
  options: LambdaBuildOptions
): RolldownOptions => ({
  input: options.entry,
  output: {
    dir: options.outDir ?? 'dist',
    format: 'esm',
    entryFileNames: 'index.js',
    sourcemap: false,
    minify: false,
    inlineDynamicImports: true
  },
  platform: 'node',
  treeshake: {
    moduleSideEffects: id =>
      id.includes('node_modules/@smithy') ||
      id.includes('node_modules/@aws-crypto') ||
      id.includes('node_modules/@aws-sdk') ||
      id.includes('node_modules/@aws-lambda-powertools')
  },
  external: [/^@aws-sdk\//]
})
