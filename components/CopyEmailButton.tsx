"use client";

import { ArrowRight } from "lucide-react";

export default function CopyEmailButton({
  email,
  className,
  style,
  label = "Contact me",
}: {
  email: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      // replace this with your toast if you want
      alert("Email copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button onClick={handleCopy} type="button" className={className} style={style}>
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}