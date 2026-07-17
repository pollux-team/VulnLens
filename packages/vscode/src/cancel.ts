/**
 * Bridge VS Code CancellationToken to AbortSignal for engine scan requests.
 */
export function tokenToAbortSignal(token) {
  const controller = new AbortController()

  if (token.isCancellationRequested) {
    controller.abort()
    return controller.signal
  }

  const disposable = token.onCancellationRequested(() => {
    controller.abort()
  })

  // Best-effort: when signal aborts externally, dispose listener
  controller.signal.addEventListener(
    'abort',
    () => {
      disposable.dispose()
    },
    { once: true },
  )

  return controller.signal
}
