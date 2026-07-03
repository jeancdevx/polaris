import { OccupancyDashboard } from '@/components/occupancy-dashboard'

export default function DashboardPage() {
  return (
    <main className='relative min-h-screen overflow-hidden'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-grid opacity-25'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-noise'
      />

      <div className='relative mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-12'>
        <OccupancyDashboard />
      </div>
    </main>
  )
}
