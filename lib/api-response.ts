export function ok<T>(data: T, message = 'ok') {
  return Response.json({ code: 0, message, data })
}

export function fail(message: string, code = 400, status = 400) {
  return new Response(JSON.stringify({ code, message, data: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
