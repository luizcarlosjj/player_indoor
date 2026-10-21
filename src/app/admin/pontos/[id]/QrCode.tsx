'use client'

import { QRCodeSVG } from 'qrcode.react'

export function QrCode({ url }: { url: string }) {
  return (
    <QRCodeSVG
      value={url}
      size={160}
      bgColor="transparent"
      fgColor="currentColor"
      className="text-fg"
    />
  )
}
