"use client";

import { useEffect, useRef } from "react";
import type QRCodeStylingType from "qr-code-styling";
import { DEFAULT_STYLE, loadQr, qrOptions, type QrStyle } from "@/lib/qr";

/** Pratinjau QR hidup. Ukuran tampilan via CSS; digambar 2x supaya tajam. */
export default function QrView({ data, style = DEFAULT_STYLE, size = 160, label }: { data: string; style?: QrStyle; size?: number; label?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<QRCodeStylingType | null>(null);
  const opts = qrOptions(data, style, size * 2);
  const key = JSON.stringify(opts);

  useEffect(() => {
    let off = false;
    loadQr().then((QR) => {
      if (off || !host.current) return;
      // Buat ulang tiap opsi berubah (lebih andal daripada update, misal saat logo dihapus).
      inst.current = new QR(opts);
      host.current.innerHTML = "";
      inst.current.append(host.current);
    });
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={label ?? `Kode QR untuk ${data}`}
      className="qr-host"
      style={{ width: size, height: size, lineHeight: 0 }}
    />
  );
}
