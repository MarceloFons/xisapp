import { MessageSquare, Check } from 'lucide-react';
import MapSection from './sections/MapSection';
import { TouristSpotsSection } from './sections/TouristSpotsSection';
import './App.css';

function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-4 md:py-6 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl md:text-7xl font-bold text-white tracking-tighter">
          Sua rota,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Xis.
          </span>
        </h1>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8 md:pt-24 md:pb-12">
      <div
        className="absolute inset-0 z-0 opacity-0"
        style={{
          backgroundImage: 'url(/city-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'fadeIn 1.2s var(--ease-out-expo) forwards',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div
        className="relative z-20 w-full max-w-4xl mx-auto opacity-0 animate-card-float"
        style={{
          animation:
            'fadeIn 1s var(--ease-out-expo) 600ms forwards, cardFloat 6s ease-in-out infinite 1.6s',
          perspective: '1000px',
        }}
      >
        <div className="hero-card">
          <img src="/car-hero.jpg" alt="Carro" className="w-full h-auto object-cover" />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12">
            <h2
              className="text-3xl md:text-5xl font-light text-white leading-tight max-w-lg opacity-0"
              style={{ animation: 'fadeInUp 0.8s var(--ease-out-expo) 1s forwards' }}
            >
              Mobilidade inteligente para o seu dia a dia.
            </h2>

            <p
              className="mt-4 text-base md:text-lg text-white/80 italic opacity-0"
              style={{ animation: 'slideInLeft 0.6s var(--ease-smooth) 1.2s forwards' }}
            >
              Seu App para transportes.
            </p>

            <div
              className="mt-8 opacity-0"
              style={{ animation: 'scaleIn 0.5s var(--ease-elastic) 1.5s forwards' }}
            >
              <a
                href="https://forms.gle/jnV4h1nqGKnmGmvF9"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageSquare size={20} /> Feedback
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Premium: CTA leva para calcular (não abre WhatsApp direto) */}
      <div
        className="relative z-20 mt-8 opacity-0"
        style={{ animation: 'bounceIn 0.7s var(--ease-bounce) 1.7s forwards' }}
      >
        <a href="#rota" className="btn-cta">
          <Check size={20} /> Solicite sua viagem
        </a>
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="h-auto bg-[#1a1a1a] overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <MapSection />
        <TouristSpotsSection />
      </main>
    </div>
  );
}

export default App;
