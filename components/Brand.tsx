import { site } from "@/config/site";

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

/** Logo kecil: rantai merah-hijau (public/brand/mark.svg). */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.svg" alt="" width={size} height={size} style={{ display: "block", flex: "none" }} />
  );
}

/** Logo lengkap: ondel-ondel + rantai + klikaje.my.id. */
export function BrandHero({ width = 440 }: { width?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/klikaje-logo.webp"
      alt={`Logo ${site.name}: sepasang ondel-ondel mengapit rantai link merah-hijau dan tulisan ${site.domain}`}
      width={width}
      height={Math.round((width * 1024) / 1536)}
      style={{ display: "block", width: "100%", maxWidth: width, height: "auto" }}
    />
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
