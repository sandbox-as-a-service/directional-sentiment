// No HTTP knowledge — generic log helpers
export function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}

export function logError(error: unknown) {
  const e = toError(error)
  console.error({
    name: e.name,
    message: e.message,
    cause: e.cause,
    stack: e.stack,
  })
}
