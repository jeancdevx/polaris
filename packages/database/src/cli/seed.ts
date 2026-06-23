import { runSeed } from '../seed/run-seed.js'

const seedDatabase = async (): Promise<void> => {
  const result = await runSeed()

  console.log(
    `Seed complete: ${result.users} users, ${result.parkingSpots} parking spots, ${result.rfidTags} RFID tags.`
  )
}

seedDatabase().catch(error => {
  console.error('Seed failed:', error)
  process.exit(1)
})
