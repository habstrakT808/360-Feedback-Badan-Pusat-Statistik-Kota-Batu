// src/app/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  BarChart3,
  Users,
  Award,
  Star,
  ArrowRight,
  CheckCircle,
  Target,
  Zap,
  Shield,
  TrendingUp,
  MessageSquare,
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  ChevronDown,
  MapPin,
  Phone,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Globe,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  position: z.string().min(2, "Posisi minimal 2 karakter"),
  department: z.string().min(2, "Departemen minimal 2 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const { user, setUser } = useStore();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        router.push("/dashboard");
      }
    };
    getUser();
  }, [setUser, router]);

  // Scroll snap effect
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.deltaY > 0 && currentSection < sectionsRef.current.length - 1) {
        setCurrentSection((prev) => prev + 1);
      } else if (e.deltaY < 0 && currentSection > 0) {
        setCurrentSection((prev) => prev - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [currentSection]);

  useEffect(() => {
    const targetSection = sectionsRef.current[currentSection];
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowDown" &&
        currentSection < sectionsRef.current.length - 1
      ) {
        setCurrentSection((prev) => prev + 1);
      } else if (e.key === "ArrowUp" && currentSection > 0) {
        setCurrentSection((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSection]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;

      toast.success("Login berhasil!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            position: data.position,
            department: data.department,
          },
        },
      });

      if (error) throw error;

      toast.success("Registrasi berhasil! Silakan cek email untuk verifikasi.");
      setAuthMode("login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) toast.error(error.message);
  };

  const features = [
    {
      icon: BarChart3,
      title: "360° Feedback",
      description:
        "Penilaian komprehensif dari berbagai perspektif rekan kerja",
      color: "from-blue-500 to-blue-600",
      gradient: "from-blue-50 to-blue-100",
    },
    {
      icon: Users,
      title: "Manajemen Tim",
      description: "Kelola dan pantau performa seluruh tim dengan mudah",
      color: "from-green-500 to-green-600",
      gradient: "from-green-50 to-green-100",
    },
    {
      icon: Award,
      title: "Analisis Mendalam",
      description: "Laporan dan visualisasi data yang detail dan informatif",
      color: "from-purple-500 to-purple-600",
      gradient: "from-purple-50 to-purple-100",
    },
    {
      icon: Shield,
      title: "Anonim & Aman",
      description: "Feedback anonim untuk kejujuran dan keamanan data",
      color: "from-orange-500 to-orange-600",
      gradient: "from-orange-50 to-orange-100",
    },
  ];

  const stats = [
    { number: "18", label: "Karyawan", icon: Users },
    { number: "7", label: "Aspek Penilaian", icon: Target },
    { number: "100%", label: "Keamanan Data", icon: Shield },
    { number: "24/7", label: "Akses Sistem", icon: Zap },
  ];

  // Google Icon Component
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Navigation Dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === index
                ? "bg-blue-600 scale-125"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-30 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BPS Kota Batu</h1>
              <p className="text-xs text-gray-600">360° Feedback System</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span className="font-medium">Masuk</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Section 1: Hero */}
      <div
        ref={(el) => {
          sectionsRef.current[0] = el;
        }}
        className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center pt-20"
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  <Star className="w-4 h-4" />
                  <span>Sistem Penilaian Kinerja Modern</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight"
                >
                  360° Feedback
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    System
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-600 leading-relaxed"
                >
                  Platform penilaian kinerja komprehensif untuk Badan Pusat
                  Statistik Kota Batu. Dapatkan feedback anonim dari rekan kerja
                  dan tingkatkan performa tim.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setAuthMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Mulai Sekarang</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg border border-gray-200 font-semibold"
                  >
                    <span>Sudah Punya Akun</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <stat.icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20"
              />
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Section 2: Features */}
      <div
        ref={(el) => {
          sectionsRef.current[1] = el;
        }}
        className="h-screen bg-white flex items-center justify-center overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sistem penilaian yang dirancang khusus untuk meningkatkan kinerja
              dan kolaborasi tim di lingkungan BPS Kota Batu
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className={`group bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-100`}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: CTA */}
      <div
        ref={(el) => {
          sectionsRef.current[2] = el;
        }}
        className="h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Siap Meningkatkan
              <span className="block">Performa Tim?</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan sistem penilaian 360° dan rasakan perbedaannya
              dalam pengembangan karir dan kinerja tim yang lebih baik
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setAuthMode("register");
                  setIsAuthModalOpen(true);
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl hover:bg-gray-50 transition-colors shadow-2xl font-bold text-lg flex items-center space-x-3"
              >
                <UserPlus className="w-6 h-6" />
                <span>Mulai Gratis Sekarang</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setAuthMode("login");
                  setIsAuthModalOpen(true);
                }}
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl hover:bg-white/20 transition-colors border border-white/20 font-bold text-lg flex items-center space-x-3"
              >
                <LogIn className="w-6 h-6" />
                <span>Sudah Punya Akun</span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { icon: CheckCircle, text: "Setup dalam 5 menit" },
                { icon: Shield, text: "100% Aman & Anonim" },
                { icon: TrendingUp, text: "Peningkatan performa terbukti" },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 text-white"
                >
                  <benefit.icon className="w-6 h-6 text-green-300" />
                  <span className="text-lg">{benefit.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Section 4: Footer - DIPERBAIKI LAGI */}
      <div
        ref={(el) => {
          sectionsRef.current[3] = el;
        }}
        className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-6 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            {/* Logo & Brand - Lebih kecil */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl lg:text-2xl font-bold text-white">
                    BPS Kota Batu
                  </h1>
                  <p className="text-base text-blue-300">
                    360° Feedback System
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                Badan Pusat Statistik Kota Batu berkomitmen untuk terus
                meningkatkan kualitas pelayanan dan kinerja melalui sistem
                penilaian yang objektif.
              </p>
            </div>

            {/* Contact Grid - Lebih kompak */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-1 text-sm">
                  Alamat Kantor
                </h4>
                <p className="text-gray-300 text-xs">Jl. Veteran No. 10</p>
                <p className="text-gray-300 text-xs">
                  Kota Batu, Jawa Timur 65314
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-1 text-sm">
                  Kontak
                </h4>
                <p className="text-gray-300 text-xs">admin@bpsbatu.go.id</p>
                <p className="text-gray-300 text-xs">+62 341 123456</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-1 text-sm">
                  Jam Operasional
                </h4>
                <p className="text-gray-300 text-xs">Senin - Jumat</p>
                <p className="text-gray-300 text-xs">08:00 - 16:00 WIB</p>
              </motion.div>
            </div>

            {/* Social Media - Lebih kecil */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <h4 className="text-white font-semibold text-sm">Ikuti Kami</h4>
              <div className="flex justify-center space-x-2">
                {[
                  {
                    icon: Globe,
                    color: "bg-blue-600",
                    href: "https://bpsbatu.go.id",
                  },
                  { icon: Facebook, color: "bg-blue-700", href: "#" },
                  { icon: Twitter, color: "bg-sky-500", href: "#" },
                  { icon: Instagram, color: "bg-pink-600", href: "#" },
                  { icon: Linkedin, color: "bg-blue-800", href: "#" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-8 h-8 ${social.color} rounded-lg flex items-center justify-center hover:shadow-lg transition-all duration-300`}
                  >
                    <social.icon className="w-4 h-4 text-white" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Bottom Bar - Lebih kompak */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="border-t border-white/10 pt-4 space-y-2"
            >
              <p className="text-gray-400 text-xs">
                © 2024 Badan Pusat Statistik Kota Batu. Semua hak dilindungi
                undang-undang.
              </p>
              <div className="flex justify-center items-center space-x-3 text-gray-400 text-xs">
                <a href="#" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">
                  Syarat & Ketentuan
                </a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">
                  Bantuan
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements - Lebih kecil */}
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-full blur-2xl"></div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {authMode === "login" ? "Masuk" : "Daftar"}
                        </h2>
                        <p className="text-gray-600 text-sm">BPS Kota Batu</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                  {authMode === "login" ? (
                    <form
                      onSubmit={loginForm.handleSubmit(onLogin)}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...loginForm.register("email")}
                            type="email"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="nama@bpsbatu.go.id"
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...loginForm.register("password")}
                            type={showPassword ? "text" : "password"}
                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="mt-1 text-sm text-red-600">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span className="ml-2">Masuk...</span>
                          </div>
                        ) : (
                          "Masuk"
                        )}
                      </motion.button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">
                            atau
                          </span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      >
                        <div className="mr-2">
                          <GoogleIcon />
                        </div>
                        Masuk dengan Google
                      </motion.button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setAuthMode("register")}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Belum punya akun? Daftar sekarang
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={registerForm.handleSubmit(onRegister)}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap
                        </label>
                        <input
                          {...registerForm.register("fullName")}
                          type="text"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Nama lengkap Anda"
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="mt-1 text-sm text-red-600">
                            {registerForm.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          {...registerForm.register("email")}
                          type="email"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="nama@bpsbatu.go.id"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Posisi/Jabatan
                        </label>
                        <input
                          {...registerForm.register("position")}
                          type="text"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Statistisi, Kepala Seksi, dll"
                        />
                        {registerForm.formState.errors.position && (
                          <p className="mt-1 text-sm text-red-600">
                            {registerForm.formState.errors.position.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Departemen
                        </label>
                        <input
                          {...registerForm.register("department")}
                          type="text"
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Statistik Sosial, IPDS, dll"
                        />
                        {registerForm.formState.errors.department && (
                          <p className="mt-1 text-sm text-red-600">
                            {registerForm.formState.errors.department.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            {...registerForm.register("password")}
                            type={showPassword ? "text" : "password"}
                            className="block w-full pr-10 px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="mt-1 text-sm text-red-600">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span className="ml-2">Mendaftar...</span>
                          </div>
                        ) : (
                          "Daftar Sekarang"
                        )}
                      </motion.button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setAuthMode("login")}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Sudah punya akun? Masuk di sini
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
