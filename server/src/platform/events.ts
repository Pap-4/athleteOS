import { logger } from './logger.js'

/** The shared vocabulary of in-process events (see architectureDocumentation.md). */
export interface EventMap {
  'activity.logged': { userId: string; sessionId: string; type: string; occurredOn: string }
  'user.deactivated': { userId: string }
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void | Promise<void>

const handlers: { [K in keyof EventMap]?: Handler<K>[] } = {}

export function subscribe<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
  const list = (handlers[event] ??= []) as Handler<K>[]
  list.push(handler)
  return () => {
    const i = list.indexOf(handler)
    if (i >= 0) list.splice(i, 1)
  }
}

/**
 * Call this only AFTER the publisher's write has committed. Handlers run
 * asynchronously and each catches its own errors, so a failing handler can
 * never fail or roll back the write that triggered it.
 */
export function publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
  for (const handler of (handlers[event] ?? []) as Handler<K>[]) {
    void Promise.resolve()
      .then(() => handler(payload))
      .catch((err: unknown) => logger.error({ err, event }, 'Event handler failed'))
  }
}
