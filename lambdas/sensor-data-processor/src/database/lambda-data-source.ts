import { createDataSourceAsync } from '@polaris/database'
import { sleep } from '@polaris/shared-utils'

type DataSource = Awaited<ReturnType<typeof createDataSourceAsync>>

const connectTimeoutMs = 10_000

let dataSource: DataSource | undefined
let initializePromise: Promise<DataSource> | undefined

const initializeWithTimeout = async (
  source: DataSource
): Promise<DataSource> => {
  await Promise.race([
    source.initialize(),
    sleep(connectTimeoutMs).then(() => {
      throw new Error(`RDS initialize timed out after ${connectTimeoutMs}ms`)
    })
  ])

  return source
}

export const getLambdaDataSource = async (): Promise<DataSource> => {
  if (dataSource?.isInitialized) {
    return dataSource
  }

  if (!initializePromise) {
    initializePromise = createDataSourceAsync()
      .then(source => {
        dataSource = source
        return initializeWithTimeout(source)
      })
      .catch(error => {
        initializePromise = undefined
        dataSource = undefined
        throw error
      })
  }

  return initializePromise
}

export const resetLambdaDataSourceForTests = (): void => {
  dataSource = undefined
  initializePromise = undefined
}
