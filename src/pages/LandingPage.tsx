import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Car,
  Shield,
  Zap,
  CheckCircle2,
  Lock,
  Smartphone,
  ChevronRight,
  ParkingSquare,
  Users,
  Bell,
  ArrowRight,
  HelpCircle,
  Star,
  Sparkles,
  Building2,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { currentUser, userProfile, getDefaultRoute } = useAuth();

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: ParkingSquare,
      title: 'Real-Time Slot Allocation',
      description: 'Instant visualization of occupied, available, EV charging, and visitor slots with live Firestore updates.'
    },
    {
      icon: Smartphone,
      title: 'Digital Visitor Pass',
      description: 'Residents create timed digital passes for guests with instant QR pass generation and gate verification.'
    },
    {
      icon: Shield,
      title: 'Gate Security Operations',
      description: 'Streamlined check-in / check-out workflows for security guards with live entry logs and violation logging.'
    },
    {
      icon: Zap,
      title: 'Instant Violations & Fines',
      description: 'Identify unauthorized parking or expired guest stays immediately and notify owners automatically.'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Tailored portals for Residents, Security Guards, and Property Admins with granular Firestore permissions.'
    },
    {
      icon: Bell,
      title: 'Real-Time Alerts',
      description: 'Instant push notifications for visitor arrivals, slot assignments, and parking violation notices.'
    }
  ];

  const benefits = [
    'Zero Manual Gate Bookings & Paper Registers',
    'Guaranteed Allocated Slots for Residents & EV Users',
    'Automated Security Verification & Fast Check-In',
    'Detailed Property Analytics & Peak Hours Tracking'
  ];

  const testimonials = [
    {
      quote: "ParkWise eliminated our daily visitor parking chaos. Security logs entries in seconds, and residents get instant guest notifications.",
      author: "Marcus Vance",
      role: "Society President, Grand Residency",
      stars: 5
    },
    {
      quote: "Managing 120+ resident slots and EV charging points used to be a nightmare. ParkWise handles everything flawlessly with real-time Firebase tracking.",
      author: "Elena Rostova",
      role: "Property Manager, Skyline Heights",
      stars: 5
    }
  ];

  const faqs = [
    {
      q: "How does ParkWise integrate with our gate security?",
      a: "Security guards get a dedicated tablet dashboard to scan visitor booking codes or vehicle numbers, instantly logging entry and exit times to Firestore."
    },
    {
      q: "Can residents reserve visitor slots in advance?",
      a: "Yes! Residents can create visitor passes specifying dates and time slots with instant auto-approval or admin review."
    },
    {
      q: "How does Firebase power ParkWise?",
      a: "ParkWise uses Firebase Authentication for secure user logins, Firestore for live real-time synchronization across devices, and Storage for document photos."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">ParkWise</span>
              <span className="block text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                Smart Community Parking
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
            <a href="#testimonials" className="hover:text-emerald-400 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <Link
                to={getDefaultRoute()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Real-Time Firestore Parking Management</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight"
            >
              Smart Parking Simplified for Modern Residential Communities
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg text-slate-400 leading-relaxed"
            >
              ParkWise bridges residents, security guards, and property managers into one synchronized real-time ecosystem powered by Firebase.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all text-center"
              >
                Launch Live App
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base transition-all border border-slate-700 text-center"
              >
                Explore Features
              </a>
            </motion.div>
          </div>

          {/* Interactive Live Parking Grid Simulation Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>Grand Residency — Realtime Slot Map</span>
                </h3>
                <p className="text-xs text-slate-400">Live slot states updated directly via Firestore listeners</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Occupied</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> EV / Reserved</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { num: 'A-101', status: 'Occupied', type: 'Resident' },
                { num: 'A-102', status: 'Available', type: 'Resident' },
                { num: 'A-EV1', status: 'Reserved', type: 'EV Charge' },
                { num: 'V-01', status: 'Occupied', type: 'Visitor' },
                { num: 'V-02', status: 'Available', type: 'Visitor' },
                { num: 'B-201', status: 'Available', type: 'Resident' }
              ].map((slot, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    slot.status === 'Available'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : slot.status === 'Occupied'
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <Car className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <div className="text-xs font-bold">{slot.num}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{slot.type}</div>
                  <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-900/60">
                    {slot.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Built for Complete Community Control</h2>
            <p className="mt-3 text-slate-400 text-sm">
              Everything required to manage slots, visitors, vehicles, and violations in real time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-emerald-500/50 transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="about" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-snug">
              Why Property Management Teams Choose ParkWise
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Traditional paper registers and unmonitored visitor spots lead to frustration, unauthorized parking, and security loopholes. ParkWise delivers an intuitive cloud solution.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start space-x-3 text-sm text-slate-300">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Access Live Environment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl relative">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Total Society Parking Slots</div>
                  <div className="text-2xl font-bold text-white mt-1">120 Active Slots</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  92% Efficiency
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Today's Verified Visitors</div>
                  <div className="text-2xl font-bold text-teal-400 mt-1">28 Check-Ins</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Zero Violations
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Trusted by Leading Societies</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-slate-800/60 border border-slate-700 relative">
                <div className="flex items-center space-x-1 text-amber-400 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic mb-6">"{t.quote}"</p>
                <div>
                  <h4 className="font-bold text-white text-sm">{t.author}</h4>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-800/60 border border-slate-700/80 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-white text-sm"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Car className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-slate-300">ParkWise Smart Parking</span>
          </div>
          <p>© {new Date().getFullYear()} ParkWise. Powered by Direct Firebase Integration.</p>
        </div>
      </footer>
    </div>
  );
};
