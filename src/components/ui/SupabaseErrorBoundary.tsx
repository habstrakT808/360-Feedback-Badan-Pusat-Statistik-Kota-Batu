// src/components/ui/SupabaseErrorBoundary.tsx
"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Supabase Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Konfigurasi Supabase Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              Terjadi kesalahan dalam konfigurasi Supabase. Pastikan environment variables sudah diatur dengan benar.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Langkah perbaikan:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Buat file <code className="bg-gray-200 px-1 rounded">.env.local</code> di root project</li>
                <li>2. Tambahkan konfigurasi Supabase:</li>
                <li className="pl-4">
                  <code className="bg-gray-200 px-1 rounded block mt-1">
                    NEXT_PUBLIC_SUPABASE_URL=your_url
                  </code>
                  <code className="bg-gray-200 px-1 rounded block mt-1">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
                  </code>
                </li>
                <li>3. Restart development server</li>
              </ol>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
