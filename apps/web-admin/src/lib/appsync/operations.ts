export const AVAILABILITY_QUERY = /* GraphQL */ `
  query Availability {
    availability {
      totalSpots
      totalAvailable
      totalOccupied
      totalReserved
      totalVisitors
      updatedAt
      spots {
        spotId
        zone
        status
        userId
        vehiclePlate
        reservationId
        occupiedSince
      }
    }
  }
`

export const ON_OCCUPANCY_CHANGED_SUBSCRIPTION = /* GraphQL */ `
  subscription OnOccupancyChanged {
    onOccupancyChanged {
      spotId
      zone
      status
      previousStatus
      deviceId
      sensorType
      occurredAt
    }
  }
`
