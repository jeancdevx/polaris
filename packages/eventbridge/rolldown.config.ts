import { defineConfig } from 'rolldown'

import { createPackageBuildConfig } from '@polaris/build-config'

export default defineConfig({
  ...createPackageBuildConfig({ entry: 'src/index.ts' }),
  external: [/^node:/, /^@aws-sdk\//]
})
