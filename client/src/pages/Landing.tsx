import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Heart, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';

export const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-6 md:px-12 flex flex-col items-center justify-center text-center gap-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_0%,#1e293b_100%)]" />
        {/* Colorful blobs */}
        <div className="absolute top-12 left-10 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-12 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-primary-100 text-xs font-semibold uppercase tracking-wider animate-fade-in">
            <Sparkles size={14} className="text-amber-300" />
            Hyperlocal School Supply Exchange
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-none">
            Swap School Supplies <br />
            <span className="text-gradient">Within Your School Community</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light">
            Indian families spend up to ₹12,000 annually per child on supplies. Save up to 60% by swapping, bartering, and donating textbooks, uniforms, and stationery with verified parents nearby.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link to="/auth">
              <Button size="lg" variant="primary" className="rounded-full shadow-lg shadow-primary-600/30">
                Get Started Now
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="rounded-full border-slate-500 text-white hover:bg-white/10">
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center gap-12">
        <div className="text-center max-w-2xl flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold text-slate-800">Designed for Education, Engineered for Trust</h2>
          <p className="text-slate-500">Traditional listing sites are full of spam. SchoolSwap coordinates exchanges securely inside authenticated school networks.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="bg-primary-50 text-primary-600 p-4 rounded-xl w-14 h-14 flex items-center justify-center">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">School-Verified Communities</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Every parent must join using their child's school registration code. Transactions occur only between families of the same campus, ensuring zero anonymous interactions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl w-14 h-14 flex items-center justify-center">
              <RefreshCw size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Double-Match Barter Engine</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Moving from Grade 8 to 9? Enter what books you have and what you need. Our system automatically pairs you with a parent transitioning in the opposite direction.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-xl w-14 h-14 flex items-center justify-center">
              <Heart size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Free Donation Corners</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Support low-income families and verified local NGOs. Donate outgrown uniforms, geometry boxes, and bags directly into our dedicated zero-cash Free Corner.
            </p>
          </div>
        </div>
      </section>

      {/* Social Impact section */}
      <section className="bg-slate-50 py-16 px-6 md:px-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl flex flex-col gap-6">
            <h2 className="text-3xl font-extrabold text-slate-800">Making Education Affordable & Sustainable</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-slate-600 text-sm">Save 40–60% on school textbooks and blazers compared to buying new.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-slate-600 text-sm">Zero-install Progressive Web App (PWA) runs smoothly on 2GB RAM phones.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-600 mt-1 flex-shrink-0" size={20} />
                <span className="text-slate-600 text-sm">Keep paper and fabrics out of landfills by recycling usable resources annually.</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-slate-100 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-slate-800 text-center">Ready to declutter?</h3>
            <p className="text-slate-500 text-sm text-center">Sign in with your phone number and look up your school in seconds.</p>
            <Link to="/auth" className="w-full mt-2">
              <Button className="w-full py-3" variant="primary">
                Login / Register with OTP
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm border-t border-slate-800">
        <p>© 2026 SchoolSwap. Built with care for Indian K–12 families. All rights reserved.</p>
      </footer>
    </div>
  );
};
