'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle } from 'lucide-react'
import { Field } from '@/components/ui/field'
import { Button } from '@/components/ui/button'

export function VideoUpload({ anuncianteId }: { anuncianteId: number }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progresso, setProgresso] = useState<number | null>(null)
  const [erro, setErro] = useState('')
  const [titulo, setTitulo] = useState('')
  const [arquivoSelecionado, setArquivoSelecionado] = useState(false)

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')
    setTitulo(arquivo.name.replace(/\.[^/.]+$/, ''))
    setArquivoSelecionado(true)
  }

  async function handleUpload() {
    const arquivo = inputRef.current?.files?.[0]
    if (!arquivo || !titulo.trim()) { setErro('Informe o título.'); return }

    setErro('')
    setProgresso(0)

    try {
      const meta = await lerMetadadosVideo(arquivo)

      const res = await fetch('/api/admin/videos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: arquivo.name, tipo: arquivo.type }),
      })
      if (!res.ok) throw new Error('Falha ao obter URL de upload.')
      const { url, key } = await res.json()

      await uploadComProgresso(arquivo, url, setProgresso)

      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anunciante_id: anuncianteId,
          titulo: titulo.trim(),
          r2_key: key,
          duracao_segundos: meta.duracao,
          largura: meta.largura,
          altura: meta.altura,
        }),
      })

      setProgresso(null)
      setTitulo('')
      setArquivoSelecionado(false)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro no upload.')
      setProgresso(null)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Upload size={14} className="text-muted" />
        <p className="text-[13px] font-medium text-muted">Enviar vídeo</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleArquivo}
        className="text-[13px] text-muted file:mr-3 file:py-1 file:px-3 file:rounded-[6px] file:border-0 file:bg-elevated file:text-[12px] file:text-muted file:cursor-pointer hover:file:bg-border"
      />

      {arquivoSelecionado && (
        <Field label="Título">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nome do vídeo"
          />
        </Field>
      )}

      {progresso !== null && (
        <div>
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-online rounded-full transition-all duration-200"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-[11px] text-subtle mt-1">{progresso}%</p>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-2">
          <AlertCircle size={13} className="text-error flex-shrink-0" />
          <p className="text-[12px] text-error">{erro}</p>
        </div>
      )}

      <div>
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={progresso !== null}
          loading={progresso !== null}
        >
          {progresso !== null ? 'Enviando...' : 'Enviar vídeo'}
        </Button>
      </div>
    </div>
  )
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
