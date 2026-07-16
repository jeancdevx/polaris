import { createDataSourceAsync } from '../config/create-data-source.js'

const showMigrations = async (): Promise<void> => {
  const dataSource = await createDataSourceAsync()

  await dataSource.initialize()
  const pending = await dataSource.showMigrations()

  try {
    const executed = await dataSource.query<{ name: string }[]>(
      `SELECT name FROM typeorm_migrations ORDER BY id`
    )

    console.log('Executed migrations:')
    if (executed.length === 0) {
      console.log('  (none)')
    } else {
      executed.forEach(row => console.log(`  ✓ ${row.name}`))
    }
  } catch {
    console.log('Executed migrations:')
    console.log('  (none — run pnpm db:migrate first)')
  }

  console.log(pending ? 'Pending migrations: yes' : 'Pending migrations: no')
  await dataSource.destroy()
}

showMigrations().catch(error => {
  console.error('Failed to show migrations:', error)
  process.exit(1)
})
