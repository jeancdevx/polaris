export type AppSyncOccupancyPublisherEnv = Readonly<{
  appsyncGraphqlEndpoint: string
  awsRegion: string
}>

export const readAppSyncOccupancyPublisherEnv =
  (): AppSyncOccupancyPublisherEnv => {
    const appsyncGraphqlEndpoint = process.env.APPSYNC_GRAPHQL_ENDPOINT
    const awsRegion = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION

    if (!appsyncGraphqlEndpoint) {
      throw new Error('APPSYNC_GRAPHQL_ENDPOINT is required')
    }

    if (!awsRegion) {
      throw new Error('AWS_REGION is required')
    }

    return {
      appsyncGraphqlEndpoint,
      awsRegion
    }
  }
