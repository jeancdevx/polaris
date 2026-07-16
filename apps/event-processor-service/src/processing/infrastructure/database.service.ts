import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit
} from '@nestjs/common'

import { createDataSource, createDataSourceAsync } from '@polaris/database'

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name)
  private dataSource: ReturnType<typeof createDataSource> | undefined
  private initPromise: Promise<ReturnType<typeof createDataSource>> | undefined

  async onModuleInit(): Promise<void> {
    await this.getDataSource()
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy()
    }
  }

  async getDataSource(): Promise<ReturnType<typeof createDataSource>> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource
    }

    if (!this.initPromise) {
      this.initPromise = this.connect().catch(error => {
        this.initPromise = undefined
        throw error
      })
    }

    return this.initPromise
  }

  private async connect(): Promise<ReturnType<typeof createDataSource>> {
    this.logger.log('Initializing database connection')
    const dataSource = await createDataSourceAsync()
    await dataSource.initialize()
    this.dataSource = dataSource
    this.logger.log('Database connection ready')
    return dataSource
  }
}
