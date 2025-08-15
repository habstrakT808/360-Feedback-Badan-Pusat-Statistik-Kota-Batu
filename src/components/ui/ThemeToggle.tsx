// src/components/ui/ThemeToggle.tsx
"use client";
import { motion } from "framer-motion";
import { Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme } = useTheme();

  const themes = [
    {
      id: "light" as const,
      name: "Light",
      icon: Sun,
      description: "Light theme",
    },
  ];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.id;

          return (
                         <motion.button
               key={themeOption.id}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}

               className={`relative p-2 rounded-md transition-all duration-200 ${
                 isActive
                   ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                   : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
               }`}
               title={themeOption.description}
             >
              <Icon className="w-4 h-4" />
              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
