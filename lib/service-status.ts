let unavailable = false
const listeners = new Set<(value: boolean) => void>()
type ServiceStatusGlobal = typeof globalThis & {
  __passageSetServiceUnavailable?: (value: boolean) => void
  __passageRequestHealthCheck?: () => void
}

export function isServiceUnavailable() {
  return unavailable
}

export function setServiceUnavailable(value: boolean) {
  if (unavailable === value) return
  unavailable = value
  listeners.forEach((listener) => listener(value))
}

;(globalThis as ServiceStatusGlobal).__passageSetServiceUnavailable = setServiceUnavailable

// A 503 from any single endpoint must not blank the whole app (audit H-4): it
// only *asks* the maintenance guard to confirm the outage against `/health`.
// The guard (ServiceAvailability) registers the real checker here; only a
// confirmed `/health` 503 actually flips `unavailable`.
let healthCheckRequester: (() => void) | null = null

export function setHealthCheckRequester(fn: (() => void) | null) {
  healthCheckRequester = fn
}

export function requestHealthCheck() {
  healthCheckRequester?.()
}

;(globalThis as ServiceStatusGlobal).__passageRequestHealthCheck = requestHealthCheck

export function subscribeToServiceStatus(listener: (value: boolean) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

