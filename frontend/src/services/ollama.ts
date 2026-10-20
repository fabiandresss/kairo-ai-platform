export interface ConnectionResult {
  ok: boolean
  message: string
  models?: string[]
}

/** Real request to a local Ollama server (GET /api/tags). */
export async function testOllama(baseUrl: string): Promise<ConnectionResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3000)
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: ctrl.signal })
    if (!res.ok) return { ok: false, message: `El servidor respondió ${res.status}.` }
    const data = (await res.json()) as { models?: { name: string }[] }
    const models = (data.models ?? []).map((m) => m.name)
    return { ok: true, message: `Conectado. ${models.length} modelo(s) instalado(s).`, models }
  } catch {
    return {
      ok: false,
      message: 'No se pudo conectar. Comprueba que Ollama esté ejecutándose (ollama serve) y que la URL sea correcta.',
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Real reachability test for plain HTTP endpoints. MCP over stdio cannot be tested from a browser. */
export async function testEndpoint(kind: 'mcp' | 'local' | 'http', endpoint: string): Promise<ConnectionResult> {
  if (endpoint.startsWith('stdio://')) {
    return {
      ok: false,
      message: 'Los servidores MCP por stdio los lanzará el backend; el navegador no puede probarlos todavía.',
    }
  }
  if (kind === 'local' && endpoint.includes('11434')) return testOllama(endpoint)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3000)
  try {
    await fetch(endpoint, { signal: ctrl.signal, mode: 'no-cors' })
    return { ok: true, message: 'El endpoint responde.' }
  } catch {
    return { ok: false, message: 'Sin respuesta del endpoint. Verifica que el servicio esté activo.' }
  } finally {
    clearTimeout(timer)
  }
}
