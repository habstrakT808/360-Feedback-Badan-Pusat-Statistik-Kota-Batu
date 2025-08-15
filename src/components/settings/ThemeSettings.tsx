// src/components/settings/ThemeSettings.tsx
"use client";
import { motion } from "framer-motion";
import { Palette, Sun, Check } from "lucide-react";

const themes = [
  {
    id: "light",
    name: "Terang",
    description: "Tema terang untuk penggunaan siang hari",
    icon: Sun,
    preview: "bg-gradient-to-br from-white to-gray-100",
  },
];

export function ThemeSettings() {
  const currentTheme = "light";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Palette className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tema</h2>
          <p className="text-gray-600">Pilih tema tampilan yang Anda sukai</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <motion.div
              key={theme.id}
              className="relative p-6 rounded-xl border-2 border-blue-500 bg-blue-50 transition-all duration-200"
            >
              {/* Preview */}
              <div
                className={`w-full h-20 rounded-lg mb-4 ${theme.preview} relative overflow-hidden`}
              >
                <div className="absolute inset-2 bg-white/20 rounded backdrop-blur-sm"></div>
                <theme.icon
                  className={`absolute top-2 right-2 w-5 h-5 ${
                    theme.id === "light"
                      ? "text-yellow-600"
                      : theme.id === "dark"
                      ? "text-blue-200"
                      : "text-white"
                  }`}
                />
              </div>

              {/* Theme Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {theme.name}
                </h3>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </div>

              {/* Selected Indicator */}
              {currentTheme === theme.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Current Theme Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            {(() => {
              const activeTheme = themes.find((t) => t.id === currentTheme);
              const Icon = activeTheme?.icon || Sun;
              return <Icon className="w-6 h-6 text-blue-600" />;
            })()}
            <div>
              <h3 className="font-semibold text-blue-900">
                Tema Aktif: {themes.find((t) => t.id === currentTheme)?.name}
              </h3>
              <p className="text-sm text-blue-800">
                {themes.find((t) => t.id === currentTheme)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Features */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fitur Tema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Responsif di semua perangkat
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Mengikuti preferensi sistem
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Transisi halus antar tema
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Optimasi untuk mata</span>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Segera Hadir
          </h3>
          <p className="text-purple-800 mb-4">
            Fitur kustomisasi tema yang akan datang:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
            <div>• Pilihan warna aksen custom</div>
            <div>• Mode high contrast</div>
            <div>• Tema berdasarkan waktu</div>
            <div>• Preset warna untuk departemen</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
