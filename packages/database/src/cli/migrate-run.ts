import { createDataSourceAsync } from '../config/create-data-source.js'

const runMigrations = async (): Promise<void> => {
  const dataSource = await createDataSourceAsync()

  await dataSource.initialize()
  const migrations = await dataSource.runMigrations()

  if (migrations.length === 0) {
    console.log('No pending migrations.')
  } else {
    console.log(
      `Applied migrations: ${migrations.map(migration => migration.name).join(', ')}`
    )
  }

  await dataSource.destroy()
}

runMigrations().catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})
