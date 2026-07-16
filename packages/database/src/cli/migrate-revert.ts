import { createDataSourceAsync } from '../config/create-data-source.js'

const revertLastMigration = async (): Promise<void> => {
  const dataSource = await createDataSourceAsync()

  await dataSource.initialize()
  await dataSource.undoLastMigration()
  console.log('Reverted last migration.')
  await dataSource.destroy()
}

revertLastMigration().catch(error => {
  console.error('Migration revert failed:', error)
  process.exit(1)
})
