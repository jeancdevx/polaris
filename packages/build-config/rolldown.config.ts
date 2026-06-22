import type { RolldownOptions } from 'rolldown'
import { defineConfig } from 'rolldown'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
    sourcemap: true
  },
  platform: 'node',
  treeshake: true,
  external: [/^node:/, /^@aws-sdk\//]
} satisfies RolldownOptions)
