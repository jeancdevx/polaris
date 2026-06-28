import 'reflect-metadata'

import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { AppModule } from './app.module.js'

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  const config = app.get(ConfigService)
  const port = Number(config.get<string>('PORT', '3001'))
  const host = config.get<string>('HOST', '0.0.0.0')

  await app.listen(port, host)

  Logger.log(`api-service listening on ${host}:${port}`, 'Bootstrap')
}

bootstrap().catch(error => {
  Logger.error('Failed to start api-service', error, 'Bootstrap')
  process.exit(1)
})
