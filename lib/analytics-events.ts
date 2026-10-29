export type ProductEventProperties = Record<string, string | number | boolean | null | undefined>

let sink: (eventName: string, properties: ProductEventProperties) => void = () => {}

export function configureProductEventSink(
  next: (eventName: string, properties: ProductEventProperties) => void
) {
  sink = next
}

/** Dependency-free bridge so the player remains independently testable. */
export function captureProductEvent(
  eventName: string,
  properties: ProductEventProperties = {}
) {
  sink(eventName, properties)
}

