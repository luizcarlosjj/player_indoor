'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ItemPlaylist, PlaylistResponse, Horario, ExibicaoBatch } from '@/lib/tipos'

const VERSAO_PLAYER = '2.0.0'
const INTERVALO_VERSAO_MS  = 60_000
const INTERVALO_HEARTBEAT_MS = 3 * 60_000
const BATCH_INTERVALO_MS   = 60_000
const BATCH_MAX   = 50
const CROSSFADE_MS = 300

// ── UUID fallback (crypto.randomUUID só funciona em HTTPS) ─────────────────
function gerarUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch { /* fallback abaixo */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// ── IndexedDB ──────────────────────────────────────────────────────────────
let _db: Awaited<ReturnType<typeof openVideoDB>> | null = null

async function openVideoDB() {
  const { openDB } = await import('idb')
  return openDB('tenax-player-v2', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('v')) db.createObjectStore('v')
    },
  })
}

async function getDB() {
  if (!_db) _db = await openVideoDB()
  return _db
}

async function getOrFetchBlob(item: ItemPlaylist): Promise<string> {
  try {
    const db = await getDB()
    const key = `${item.video_id}:${item.atualizado_em}`
    const stored = await db.get('v', key)
    if (stored) return URL.createObjectURL(stored)
    const res = await fetch(item.url)
    if (!res.ok) return item.url
    const blob = await res.blob()
    await db.put('v', blob, key)
    return URL.createObjectURL(blob)
  } catch {
    return item.url
  }
}

// ── Working hours ──────────────────────────────────────────────────────────
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

function estaNoHorario(horario: Horario | null): boolean {
  if (!horario) return true
  const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const dia = DIAS[spNow.getDay()]
  const cfg = (horario as Record<string, { inicio: string; fim: string }>)[dia]
  if (!cfg) return false
  const mins = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
  const agora = spNow.getHours() * 60 + spNow.getMinutes()
  return agora >= mins(cfg.inicio) && agora < mins(cfg.fim)
}

// ── 4am reload ─────────────────────────────────────────────────────────────
function agendarReload4am(): ReturnType<typeof setTimeout> {
  const spNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const proximo = new Date(spNow)
  proximo.setHours(4, 0, 0, 0)
  if (proximo <= spNow) proximo.setDate(proximo.getDate() + 1)
  return setTimeout(() => window.location.reload(), proximo.getTime() - spNow.getTime())
}

// ── Rotation styles ─────────────────────────────────────────────────────────
function estiloRotacao(graus: number): React.CSSProperties {
  switch (graus) {
    case 90:  return { position: 'absolute', width: '100vh', height: '100vw', left: '100vw', top: 0, transform: 'rotate(90deg)', transformOrigin: 'top left' }
    case 180: return { position: 'absolute', inset: 0, transform: 'rotate(180deg)' }
    case 270: return { position: 'absolute', width: '100vh', height: '100vw', left: 0, top: '100vh', transform: 'rotate(270deg)', transformOrigin: 'top left' }
    default:  return { position: 'absolute', inset: 0 }
  }
}

// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerPage({ params }: { params: Promise<{ token: string }> }) {
  // React state (drives rendering)
  const [rotacao, setRotacao] = useState(0)
  const [dentroHorario, setDentroHorario] = useState(true)
  const [playlistVazia, setPlaylistVazia] = useState(false)
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0)        // which video el is on top
  const [opacidades, setOpacidades] = useState<[number, number]>([1, 0])
  const [debugLines, setDebugLines] = useState<string[]>([])

  // Refs (no re-render on change)
  const tokenRef         = useRef<string | null>(null)
  const playlistRef      = useRef<ItemPlaylist[]>([])
  const indiceRef        = useRef(0)
  const versaoRef        = useRef(0)
  const horarioRef       = useRef<Horario | null>(null)
  const exibicaoQueue    = useRef<ExibicaoBatch[]>([])
  const blobUrls         = useRef<Set<string>>(new Set())
  const videoRefs        = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([null, null])
  const slotItems        = useRef<[ItemPlaylist | null, ItemPlaylist | null]>([null, null])
  const wakeLockRef      = useRef<WakeLockSentinel | null>(null)
  const transitioningRef = useRef(false)
  const isDebugRef       = useRef(false)

  // ── Debug logger ───────────────────────────────────────────────────────
  const dbg = useCallback((msg: string) => {
    if (!isDebugRef.current) return
    const ts = new Date().toLocaleTimeString('pt-BR')
    setDebugLines((p) => [...p.slice(-24), `${ts} ${msg}`])
  }, [])

  // ── Blob tracking ─────────────────────────────────────────────────────
  const trackBlob = useCallback((url: string) => {
    if (url.startsWith('blob:')) blobUrls.current.add(url)
    return url
  }, [])

  // ── Exhibition queue ───────────────────────────────────────────────────
  const flushExibicoes = useCallback(async () => {
    const tok = tokenRef.current
    const q = exibicaoQueue.current
    if (!tok || q.length === 0) return
    const batch = q.splice(0, q.length)
    try {
      await fetch(`/api/player/${tok}/exibicoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      dbg(`flush ${batch.length} exibição(ões)`)
    } catch {
      exibicaoQueue.current.unshift(...batch)
    }
  }, [dbg])

  const queueExibicao = useCallback((videoId: number) => {
    exibicaoQueue.current.push({
      exibicao_uuid: gerarUUID(),
      video_id: videoId,
      inicio: new Date().toISOString(),
    })
    if (exibicaoQueue.current.length >= BATCH_MAX) flushExibicoes()
  }, [flushExibicoes])

  // ── Heartbeat ─────────────────────────────────────────────────────────
  const enviarHeartbeat = useCallback(async () => {
    const tok = tokenRef.current
    if (!tok) return
    try {
      await fetch(`/api/player/${tok}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versao: VERSAO_PLAYER }),
      })
    } catch { /* não crítico */ }
  }, [])

  // ── Wake Lock ──────────────────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen')
      dbg('wake lock ativo')
    } catch { /* não suportado ou negado */ }
  }, [dbg])

  // ── Load item into a slot ──────────────────────────────────────────────
  const loadIntoSlot = useCallback(async (slot: 0 | 1, item: ItemPlaylist) => {
    const src = trackBlob(await getOrFetchBlob(item))
    const el = videoRefs.current[slot]
    if (!el) return
    el.src = src
    el.load()
    slotItems.current[slot] = item
    dbg(`slot ${slot} ← ${item.titulo}`)
  }, [dbg, trackBlob])

  // ── Advance to next video (with crossfade) ─────────────────────────────
  const avancarVideo = useCallback(async () => {
    if (transitioningRef.current) return
    const lista = playlistRef.current
    if (lista.length === 0) return

    transitioningRef.current = true

    const novoIndice = (indiceRef.current + 1) % lista.length
    const novoItem = lista[novoIndice]
    const incoming = activeSlot === 0 ? 1 : 0

    // Load into inactive slot (may already be preloaded)
    const alreadyLoaded = slotItems.current[incoming]?.video_id === novoItem.video_id
      && slotItems.current[incoming]?.atualizado_em === novoItem.atualizado_em

    if (!alreadyLoaded) {
      await loadIntoSlot(incoming as 0 | 1, novoItem)
    }

    const incomingEl = videoRefs.current[incoming]
    if (incomingEl) {
      incomingEl.currentTime = 0
      await incomingEl.play().catch(() => {
        if (incomingEl) { incomingEl.muted = true; incomingEl.play().catch(() => {}) }
      })
    }

    // Fade in incoming, fade out active
    setOpacidades(incoming === 0 ? [1, 0] : [0, 1])
    setActiveSlot(incoming as 0 | 1)

    indiceRef.current = novoIndice
    queueExibicao(novoItem.video_id)

    setTimeout(() => {
      transitioningRef.current = false
      dbg(`playing: ${novoItem.titulo}`)

      // Preload next item into (now-inactive) slot
      const nextnext = lista[(novoIndice + 1) % lista.length]
      const outgoing = incoming === 0 ? 1 : 0
      if (nextnext.video_id !== novoItem.video_id) {
        loadIntoSlot(outgoing as 0 | 1, nextnext)
      }
    }, CROSSFADE_MS)
  }, [activeSlot, loadIntoSlot, queueExibicao, dbg])

  // ── Playlist fetch ─────────────────────────────────────────────────────
  const fetchPlaylist = useCallback(async () => {
    const tok = tokenRef.current
    if (!tok) return
    try {
      const res = await fetch(`/api/player/${tok}/playlist`)
      if (!res.ok) { dbg('playlist 404'); return }
      const data: PlaylistResponse = await res.json()

      versaoRef.current = data.programacao_versao
      horarioRef.current = data.horario
      setRotacao(data.rotacao_graus)

      playlistRef.current = data.itens
      setPlaylistVazia(data.itens.length === 0)

      if (indiceRef.current >= data.itens.length) indiceRef.current = 0

      dbg(`playlist v${data.programacao_versao}: ${data.itens.length} item(ns)`)

      // If player hasn't started yet, load first item
      if (data.itens.length > 0 && !slotItems.current[0]) {
        const primeiro = data.itens[0]
        await loadIntoSlot(0, primeiro)
        const el = videoRefs.current[0]
        if (el) {
          await el.play().catch(() => {
            if (el) { el.muted = true; el.play().catch(() => {}) }
          })
        }
        setOpacidades([1, 0])
        setActiveSlot(0)
        queueExibicao(primeiro.video_id)
        indiceRef.current = 0

        // Preload second item
        if (data.itens.length > 1) {
          loadIntoSlot(1, data.itens[1])
        }
      }
    } catch { /* mantém estado atual */ }
  }, [loadIntoSlot, queueExibicao, dbg])

  // ── Version check ──────────────────────────────────────────────────────
  const checkVersao = useCallback(async () => {
    const tok = tokenRef.current
    if (!tok) return
    try {
      const res = await fetch(`/api/player/${tok}/versao`)
      if (!res.ok) return
      const { versao } = await res.json()
      if (versao !== versaoRef.current) {
        dbg(`versão mudou ${versaoRef.current}→${versao}`)
        await fetchPlaylist()
      }
    } catch { /* silent */ }
  }, [fetchPlaylist, dbg])

  // ── Init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    params.then((p) => { tokenRef.current = p.token })
    if (typeof window !== 'undefined') {
      isDebugRef.current = new URLSearchParams(window.location.search).has('debug')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.cursor = 'none'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => {
    requestWakeLock()
    const onVisible = () => { if (document.visibilityState === 'visible') requestWakeLock() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [requestWakeLock])

  // Working hours polling
  useEffect(() => {
    const checar = () => setDentroHorario(estaNoHorario(horarioRef.current))
    checar()
    const t = setInterval(checar, 60_000)
    return () => clearInterval(t)
  }, [])

  // Main interval setup — wait for token to appear in ref
  useEffect(() => {
    let started = false
    const tryStart = setInterval(async () => {
      if (!tokenRef.current || started) return
      started = true
      clearInterval(tryStart)

      await fetchPlaylist()
      enviarHeartbeat()

      const t1 = setInterval(checkVersao, INTERVALO_VERSAO_MS)
      const t2 = setInterval(enviarHeartbeat, INTERVALO_HEARTBEAT_MS)
      const t3 = setInterval(flushExibicoes, BATCH_INTERVALO_MS)
      const t4 = agendarReload4am()

      // Cleanup registered separately since we can't return from async
      window.addEventListener('beforeunload', () => {
        clearInterval(t1); clearInterval(t2); clearInterval(t3); clearTimeout(t4)
        flushExibicoes()
        blobUrls.current.forEach((u) => URL.revokeObjectURL(u))
      })
    }, 200)

    return () => clearInterval(tryStart)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────

  // Empty playlist — "Anuncie aqui" screen
  if (playlistVazia) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 48, height: 48, background: '#C9A063', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="17 2 12 7 7 2" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#C9A063', fontSize: '0.6rem', letterSpacing: '0.3em', marginBottom: 6, fontFamily: 'system-ui' }}>TENAX INDOOR</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', fontFamily: 'system-ui' }}>Anuncie aqui</p>
        </div>
        {isDebugRef.current && <DebugOverlay lines={debugLines} />}
      </div>
    )
  }

  // Outside working hours — black screen
  if (!dentroHorario) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
        {isDebugRef.current && (
          <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>fora do horário</p>
            <DebugOverlay lines={debugLines} />
          </div>
        )}
      </div>
    )
  }

  // Normal playback
  const estilo = estiloRotacao(rotacao)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', cursor: 'none' }}>
      <div style={estilo}>
        {/* Slot 0 */}
        <video
          ref={(el) => { videoRefs.current[0] = el }}
          muted
          playsInline
          preload="auto"
          onEnded={activeSlot === 0 ? avancarVideo : undefined}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', background: '#000',
            opacity: opacidades[0],
            transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
            pointerEvents: 'none',
          }}
        />
        {/* Slot 1 */}
        <video
          ref={(el) => { videoRefs.current[1] = el }}
          muted
          playsInline
          preload="auto"
          onEnded={activeSlot === 1 ? avancarVideo : undefined}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', background: '#000',
            opacity: opacidades[1],
            transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
            pointerEvents: 'none',
          }}
        />
      </div>
      {isDebugRef.current && <DebugOverlay lines={debugLines} />}
    </div>
  )
}

function DebugOverlay({ lines }: { lines: string[] }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(0,0,0,0.85)',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#0f0',
      zIndex: 9999,
      maxHeight: '40vh',
      overflowY: 'auto',
    }}>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  )
}
