import { Injectable, type OnModuleDestroy } from '@nestjs/common'

import { createDataSource } from '@polaris/database'

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private dataSource: ReturnType<typeof createDataSource> | undefined

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy()
    }
  }

  async getDataSource(): Promise<ReturnType<typeof createDataSource>> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource
    }

    this.dataSource = createDataSource()
    await this.dataSource.initialize()
    return this.dataSource
  }
}
