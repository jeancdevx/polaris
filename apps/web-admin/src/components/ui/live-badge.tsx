type LiveBadgeProps = Readonly<{
  label?: string
}>

export const LiveBadge = ({ label = 'En vivo' }: LiveBadgeProps) => (
  <span className='inline-flex items-center gap-2 rounded-full border border-polaris-live/30 bg-polaris-live/10 px-3 py-1 text-xs font-medium tracking-wide text-amber-100 uppercase'>
    <span
      aria-hidden
      className='size-2 rounded-full bg-polaris-live animate-pulse-live'
    />
    {label}
  </span>
)
