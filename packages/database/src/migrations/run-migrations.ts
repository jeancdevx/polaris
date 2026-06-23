import { createDataSource } from '../config/create-data-source.js'

export const runMigrations = async (): Promise<void> => {
  const dataSource = createDataSource()

  await dataSource.initialize()

  try {
    const migrations = await dataSource.runMigrations()

    if (migrations.length === 0) {
      return
    }
  } finally {
    await dataSource.destroy()
  }
}
