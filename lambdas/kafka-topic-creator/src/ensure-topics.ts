import type { ITopicConfig } from 'kafkajs'

import { createMskAdmin } from './create-msk-admin.js'
import type { KafkaTopicCreatorEnv } from './read-env.js'

export type EnsureTopicsResult = {
  created: string[]
  existing: string[]
}

const MSK_IAM_PROPAGATION_DELAY_MS = 10_000
const MSK_IAM_PROPAGATION_MAX_ATTEMPTS = 6

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

const isMskAuthorizationError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    type?: string
    name?: string
    message?: string
    errors?: Array<{ type?: string; message?: string }>
  }

  if (candidate.type === 'TOPIC_AUTHORIZATION_FAILED') {
    return true
  }

  if (
    candidate.name === 'KafkaJSProtocolError' ||
    candidate.name === 'KafkaJSAggregateError'
  ) {
    return candidate.message?.includes('Topic authorization failed') ?? false
  }

  return (
    candidate.errors?.some(
      nested =>
        nested.type === 'TOPIC_AUTHORIZATION_FAILED' ||
        nested.message?.includes('Topic authorization failed')
    ) ?? false
  )
}

const runEnsureTopicsAttempt = async (
  topics: string[],
  env: KafkaTopicCreatorEnv
): Promise<EnsureTopicsResult> => {
  const admin = createMskAdmin(env)

  await admin.connect()

  try {
    const existingTopics = new Set(await admin.listTopics())
    const missingTopics = topics.filter(topic => !existingTopics.has(topic))

    if (missingTopics.length === 0) {
      return {
        created: [],
        existing: topics
      }
    }

    const topicConfigs: ITopicConfig[] = missingTopics.map(topic => ({
      topic,
      numPartitions: env.numPartitions,
      replicationFactor: env.replicationFactor,
      configEntries: [
        {
          name: 'min.insync.replicas',
          value: String(env.minInsyncReplicas)
        }
      ]
    }))

    await admin.createTopics({
      // MSK IAM policy updates can propagate after topics are created; waiting for
      // leaders triggers extra metadata checks that fail during that window.
      waitForLeaders: false,
      topics: topicConfigs
    })

    const topicsAfterCreate = new Set(await admin.listTopics())

    return {
      created: missingTopics.filter(topic => topicsAfterCreate.has(topic)),
      existing: topics.filter(topic => topicsAfterCreate.has(topic))
    }
  } finally {
    await admin.disconnect()
  }
}

export const ensureTopics = async (
  topics: string[],
  env: KafkaTopicCreatorEnv
): Promise<EnsureTopicsResult> => {
  let lastError: unknown

  for (
    let attempt = 1;
    attempt <= MSK_IAM_PROPAGATION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await runEnsureTopicsAttempt(topics, env)
    } catch (error) {
      lastError = error

      if (
        !isMskAuthorizationError(error) ||
        attempt === MSK_IAM_PROPAGATION_MAX_ATTEMPTS
      ) {
        throw error
      }

      await sleep(MSK_IAM_PROPAGATION_DELAY_MS)
    }
  }

  throw lastError
}
