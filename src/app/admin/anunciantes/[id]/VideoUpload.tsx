'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, X, CheckCircle, Loader2 } from 'lucide-react'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

interface ArquivoFila {
  file: File
  titulo: string
  status: 'aguardando' | 'enviando' | 'concluido' | 'erro'
  progresso: number
  erro?: string
}

export function VideoUpload({ anuncianteId }: { anuncianteId: number }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fila, setFila] = useState<ArquivoFila[]>([])
  const [enviando, setEnviando] = useState(false)

  function handleArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    if (arquivos.length === 0) return

    const novos: ArquivoFila[] = arquivos.map((file) => ({
      file,
      titulo: file.name.replace(/\.[^/.]+$/, ''),
      status: 'aguardando',
      progresso: 0,
    }))

    setFila((prev) => [...prev, ...novos])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removerDaFila(idx: number) {
    setFila((prev) => prev.filter((_, i) => i !== idx))
  }

  function atualizarTitulo(idx: number, titulo: string) {
    setFila((prev) => prev.map((item, i) => (i === idx ? { ...item, titulo } : item)))
  }

  function atualizarProgresso(idx: number, progresso: number) {
    setFila((prev) => prev.map((item, i) => (i === idx ? { ...item, progresso } : item)))
  }

  function atualizarStatus(
    idx: number,
    status: ArquivoFila['status'],
    erro?: string,
  ) {
    setFila((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, status, erro } : item)),
    )
  }

  async function processarArquivo(item: ArquivoFila, idx: number): Promise<void> {
    if (!item.titulo.trim()) {
      atualizarStatus(idx, 'erro', 'Informe o título.')
      return
    }

    atualizarStatus(idx, 'enviando')
    atualizarProgresso(idx, 0)

    try {
      const meta = await lerMetadadosVideo(item.file)

      const res = await fetch('/api/admin/videos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: item.file.name, tipo: item.file.type }),
      })
      if (!res.ok) throw new Error('Falha ao obter URL de upload.')
      const { key } = await res.json()

      const proxyUrl = `/api/admin/videos/upload?key=${encodeURIComponent(key)}&tipo=${encodeURIComponent(item.file.type)}`
      await uploadComProgresso(item.file, proxyUrl, (pct) => atualizarProgresso(idx, pct))

      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anunciante_id: anuncianteId,
          titulo: item.titulo.trim(),
          r2_key: key,
          duracao_segundos: meta.duracao,
          largura: meta.largura,
          altura: meta.altura,
        }),
      })

      atualizarStatus(idx, 'concluido')
    } catch (e) {
      atualizarStatus(idx, 'erro', e instanceof Error ? e.message : 'Erro no upload.')
    }
  }

  async function enviarTodos() {
    const pendentes = fila
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.status === 'aguardando' || item.status === 'erro')

    if (pendentes.length === 0) return

    setEnviando(true)

    for (const { item, idx } of pendentes) {
      await processarArquivo(item, idx)
    }

    setEnviando(false)
    router.refresh()
  }

  const temPendentes = fila.some(
    (i) => i.status === 'aguardando' || i.status === 'erro',
  )

  return (
    <div className="bg-surface border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Upload size={14} className="text-muted" />
        <p className="text-[13px] font-medium text-muted">Enviar vídeos</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleArquivos}
        className="text-[13px] text-muted file:mr-3 file:py-1 file:px-3 file:rounded-[6px] file:border-0 file:bg-elevated file:text-[12px] file:text-muted file:cursor-pointer hover:file:bg-border"
      />

      {fila.length > 0 && (
        <div className="flex flex-col gap-2">
          {fila.map((item, idx) => (
            <div
              key={idx}
              className="bg-elevated border border-border rounded-[8px] p-3 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-subtle truncate mb-1">{item.file.name}</p>
                  <Field label="Título">
                    <input
                      value={item.titulo}
                      onChange={(e) => atualizarTitulo(idx, e.target.value)}
                      placeholder="Nome do vídeo"
                      disabled={item.status === 'enviando' || item.status === 'concluido'}
                    />
                  </Field>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <StatusIcone status={item.status} />
                  {item.status !== 'enviando' && item.status !== 'concluido' && (
                    <button
                      onClick={() => removerDaFila(idx)}
                      className="text-subtle hover:text-fg transition-colors"
                      aria-label="Remover da fila"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {item.status === 'enviando' && (
                <div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-online rounded-full transition-all duration-200"
                      style={{ width: `${item.progresso}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-subtle mt-1">{item.progresso}%</p>
                </div>
              )}

              {item.status === 'erro' && item.erro && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-error flex-shrink-0" />
                  <p className="text-[11px] text-error">{item.erro}</p>
                </div>
              )}

              {item.status === 'concluido' && (
                <p className="text-[11px] text-online">Enviado com sucesso.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {fila.length > 0 && (
        <div>
          <Button
            size="sm"
            onClick={enviarTodos}
            disabled={enviando || !temPendentes}
            loading={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar todos'}
          </Button>
        </div>
      )}
    </div>
  )
}

function StatusIcone({ status }: { status: ArquivoFila['status'] }) {
  if (status === 'enviando') return <Loader2 size={13} className="text-accent animate-spin" />
  if (status === 'concluido') return <CheckCircle size={13} className="text-online" />
  if (status === 'erro') return <AlertCircle size={13} className="text-error" />
  return null
}

function lerMetadadosVideo(arquivo: File): Promise<{ duracao: number; largura: number; altura: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(arquivo)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const result = {
        duracao: Math.round(video.duration),
        largura: video.videoWidth,
        altura: video.videoHeight,
      }
      URL.revokeObjectURL(url)
      resolve(result)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ duracao: 0, largura: 0, altura: 0 })
    }
    video.src = url
  })
}

function uploadComProgresso(
  arquivo: File,
  url: string,
  onProgresso: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload falhou: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('Erro de rede no upload.'))
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', arquivo.type)
    xhr.send(arquivo)
  })
}
