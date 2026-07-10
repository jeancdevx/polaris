import { defineConfig } from 'rolldown'

import { createLambdaBuildConfig } from '@polaris/build-config'

export default defineConfig({
  ...createLambdaBuildConfig({ entry: 'src/handler.ts' }),
  treeshake: false
})
