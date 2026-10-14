import { site } from "@/config/site";
import { IconLink } from "./Icons";

/** Hiasan gigi balang (lisplang rumah Betawi). */
export function GigiBalang({ id, color = "var(--merah)", className = "gigi" }: { id: string; color?: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" width="100%" height="16">
      <defs>
        <pattern id={id} width="22" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 0H22L11 11.5Z" fill={color} />
          <circle cx="11" cy="13" r="2.4" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${id})`} />
    </svg>
  );
}

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <span style={{ color: "#fff", display: "flex" }}><IconLink size={Math.round(size * 0.56)} /></span>
    </span>
  );
}

/** "klik" merah-gelap + "aje" hijau, dari config. */
export function BrandName() {
  const n = site.name.toLowerCase();
  const cut = n.startsWith("klik") ? 4 : Math.ceil(n.length / 2);
  return (
    <span className="brand-name">
      {n.slice(0, cut)}
      <b>{n.slice(cut)}</b>
    </span>
  );
}
