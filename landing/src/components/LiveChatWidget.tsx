"use client";
import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://app.piyrox.shop/api/v1";

type Props = {
  showAlways?: boolean;
};

export default function LiveChatWidget({ showAlways = false }: Props) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setChecking(true);
      try {
        const res = await fetch(`${API.replace(/\/+$/, "")}/health`, { cache: "no-store" });
        if (!mounted) return;
        setOnline(res.ok);
      } catch (e) {
        if (!mounted) return;
        setOnline(false);
      } finally {
        if (!mounted) return;
        setChecking(false);
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, []);

  // If we want the widget restricted to certain pages in the landing app, use showAlways prop
  // Layout currently mounts with showAlways true for landing support — allow rendering.
  if (!showAlways) return null;

  return (
    <div style={{ position: "fixed", right: 16, bottom: 72, zIndex: 9999 }}>
      <a
        href="/support"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#0b84ff",
          color: "white",
          padding: "10px 14px",
          borderRadius: 999,
          boxShadow: "0 6px 18px rgba(11,132,255,0.24)",
          textDecoration: "none",
          fontWeight: 600,
        }}
        aria-label="Open support chat"
      >
        Live chat
        <span style={{ width: 8, height: 8, borderRadius: 8, background: checking ? "#ffc107" : online ? "#2ecc71" : "#e74c3c" }} />
      </a>
    </div>
  );
}
