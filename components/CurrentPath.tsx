"use client";

import { useEffect, useState } from "react";

/** Menampilkan host + path yang sedang dibuka, misal klikaje.my.id/abc. */
export default function CurrentPath() {
  const [text, setText] = useState("ini");
  useEffect(() => {
    setText(window.location.host + window.location.pathname);
  }, []);
  return <code>{text}</code>;
}
