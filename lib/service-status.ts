let unavailable = false
const listeners = new Set<(value: boolean) => void>()
type ServiceStatusGlobal = typeof globalThis & {
  __passageSetServiceUnavailable?: (value: boolean) => void
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

export function subscribeToServiceStatus(listener: (value: boolean) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

