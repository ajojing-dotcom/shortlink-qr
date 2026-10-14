type P = { size?: number };
const base = (size = 17) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const IconLink = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);
export const IconCopy = ({ size }: P) => (
  <svg {...base(size)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>
);
export const IconQr = ({ size }: P) => (
  <svg {...base(size)}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18v2M18 14h2" /></svg>
);
export const IconEdit = ({ size }: P) => (<svg {...base(size)}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>);
export const IconPower = ({ size }: P) => (<svg {...base(size)}><path d="M12 3v9" /><path d="M6.3 7a8 8 0 1 0 11.4 0" /></svg>);
export const IconTrash = ({ size }: P) => (<svg {...base(size)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>);
export const IconSearch = ({ size = 16 }: P) => (<svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IconDownload = ({ size = 16 }: P) => (<svg {...base(size)}><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>);
export const IconCheck = ({ size = 15 }: P) => (<svg {...base(size)} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconBack = ({ size = 16 }: P) => (<svg {...base(size)} strokeWidth={2.2}><path d="M15 6l-6 6 6 6" /></svg>);
export const IconLogout = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h11" /></svg>);
export const IconImage = ({ size = 20 }: P) => (<svg {...base(size)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>);
