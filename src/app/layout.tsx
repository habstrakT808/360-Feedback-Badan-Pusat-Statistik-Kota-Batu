// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BPS Kota Batu - 360° Feedback System",
  description: "Sistem Penilaian Kinerja Karyawan BPS Kota Batu",
  icons: {
    icon: "/logo-bps.png",
    shortcut: "/logo-bps.png",
    apple: "/logo-bps.png",
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
      <body className={inter.className}>
        <ThemeProvider>
          <AuthSessionProvider>
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
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
