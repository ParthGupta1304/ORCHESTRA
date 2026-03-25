"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function Providers({ children }: { children: React.ReactNode }) {
  // Provided or placeholder Google Client ID
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder_client_id_for_development";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
