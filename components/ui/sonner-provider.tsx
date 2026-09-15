"use client";

import { Toaster as SonnerToaster } from "sonner";

export function SonnerProvider() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className: "font-sans",
        duration: 5000,
      }}
    />
  );
}
