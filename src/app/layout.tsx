// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { SupabaseErrorBoundary } from "@/components/ui/SupabaseErrorBoundary";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

export const metadata = {
  title: "BPS Kota Batu - 360° Feedback System",
  description: "Sistem Penilaian Kinerja Karyawan BPS Kota Batu",
  icons: {
    icon: [
      { url: "/logo-bps-optimized.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/logo-bps-optimized.svg", sizes: "16x16", type: "image/svg+xml" },
    ],
    shortcut: "/logo-bps-optimized.svg",
    apple: "/logo-bps-optimized.svg",
  },
  other: {
    'theme-color': '#1e40af',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={inter.className}>
        <SupabaseErrorBoundary>
          <ThemeProvider>
            <Providers>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1f2937",
                    color: "#fff",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </Providers>
          </ThemeProvider>
        </SupabaseErrorBoundary>
      </body>
    </html>
  );
}
