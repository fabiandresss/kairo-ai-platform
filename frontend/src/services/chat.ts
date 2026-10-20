import { sleep, uid } from '../lib/utils'
import type { ChatStep } from '../types'

export interface ChatEvents {
  onSteps: (steps: ChatStep[]) => void
  onToken: (text: string) => void
}

const PLAN: Omit<ChatStep, 'id' | 'state'>[] = [
  { agent: 'Orchestrator', label: 'Analizar la solicitud y crear un plan' },
  {
    agent: 'Researcher',
    label: 'Recopilar información',
    tools: [{ name: 'web.search', summary: 'Búsqueda simulada (sin integración conectada)' }],
  },
  { agent: 'Analyst', label: 'Analizar y comparar hallazgos' },
  { agent: 'Verifier', label: 'Verificar resultados' },
  { agent: 'Writer', label: 'Redactar la respuesta final' },
]

/**
 * Prototype chat run. The orchestration steps are SIMULATED (no LangGraph
 * backend yet). The final text comes from a local Ollama model if one is
 * reachable; otherwise a clearly-labelled placeholder is returned.
 * `simulated: true` means the final text was not model-generated.
 */
export async function runChat(prompt: string, ollamaUrl: string, model: string, ev: ChatEvents) {
  const steps: ChatStep[] = PLAN.map((s) => ({ ...s, id: uid('st'), state: 'pending' }))
  ev.onSteps(structuredClone(steps))

  for (let i = 0; i < steps.length; i++) {
    steps[i].state = 'running'
    ev.onSteps(structuredClone(steps))
    const t = 600 + Math.random() * 700
    await sleep(t)
    steps[i].state = 'done'
    steps[i].durationMs = Math.round(t)
    ev.onSteps(structuredClone(steps))
  }

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const tags = await fetch(`${ollamaUrl}/api/tags`, { signal: ctrl.signal })
    clearTimeout(timer)
    const names = ((await tags.json()) as { models?: { name: string }[] }).models?.map((m) => m.name) ?? []
    const chosen = names.includes(model) ? model : names[0]
    if (!chosen) throw new Error('no-models')
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: chosen, prompt, stream: true }),
    })
    if (!res.body) throw new Error('no-body')
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const l of lines) {
        if (!l.trim()) continue
        const j = JSON.parse(l) as { response?: string }
        if (j.response) ev.onToken(j.response)
      }
    }
    return { simulated: false, model: chosen }
  } catch {
    const text =
      'Respuesta de demostración. Ollama no está accesible, así que ningún modelo generó este texto. ' +
      'Los pasos del plan mostrados arriba también son una simulación de la interfaz.\n\n' +
      `Tu solicitud: «${prompt}»\n\nInicia Ollama (ollama serve), descarga un modelo (ollama pull llama3.1:8b) ` +
      'y vuelve a enviar el mensaje para obtener una respuesta real del modelo local.'
    for (const word of text.split(/(\s+)/)) {
      ev.onToken(word)
      await sleep(12)
    }
    return { simulated: true, model: 'demo' }
  }
}
