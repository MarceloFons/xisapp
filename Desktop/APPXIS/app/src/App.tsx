import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import MapSection from './sections/MapSection';
import './App.css';

// Intersection Observer hook for scroll animations
function useIntersectionObserver(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return { ref, isVisible };
}

// Header Component
function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-6 px-4">
      <div className="max-w-6xl mx-auto flex justify-center">
        <h1 
          className="text-xl font-medium text-white opacity-0 animate-fade-in"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          Meu Xis
        </h1>
      </div>
    </header>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* Background Image */}
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

      {/* Geometric Pattern Overlay */}
      <div 
        className="geometric-pattern z-10 opacity-0"
        style={{ animation: 'fadeIn 1s var(--ease-out-expo) 200ms forwards' }}
      />

      {/* Hero Card */}
      <div 
        className="relative z-20 w-full max-w-4xl mx-auto opacity-0 animate-card-float"
        style={{ 
          animation: 'fadeIn 1s var(--ease-out-expo) 600ms forwards, cardFloat 6s ease-in-out infinite 1.6s',
          perspective: '1000px'
        }}
      >
        <div className="hero-card">
          {/* Car Image */}
          <img 
            src="/car-hero.jpg" 
            alt="Carro para transporte"
            className="w-full h-auto object-cover"
          />
          
          {/* Text Overlay */}
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
              Seu App Lageano para transportes.
            </p>
            
            <p 
              className="mt-2 text-sm md:text-base text-white/70 italic opacity-0"
              style={{ animation: 'slideInLeft 0.6s var(--ease-smooth) 1.3s forwards' }}
            >
              Viagens Particulares: Preços fixos e agendamento direto.
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
                <MessageSquare size={20} />
                Feedback
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div 
        className="relative z-20 mt-8 opacity-0"
        style={{ animation: 'bounceIn 0.7s var(--ease-bounce) 1.7s forwards' }}
      >
        <a 
          href="https://api.whatsapp.com/send/?phone=5521983991349&text&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cta"
        >
          <Check size={20} />
          Faça aqui sua solicitação de Viagem
        </a>
      </div>
    </section>
  );
}

// Pricing Table Component
interface PricingRow {
  embarque: string;
  desembarque: string;
  valor: string;
  distancia: string;
}

interface PricingTableProps {
  title: string;
  rows: PricingRow[];
  delay?: number;
}

function PricingTable({ title, rows, delay = 0 }: PricingTableProps) {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <div 
      ref={ref}
      className={`w-full max-w-3xl mx-auto mb-12 transition-all duration-600 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <h3 className="text-xl font-medium text-white/90 text-center mb-6 italic">
        {title}
      </h3>
      
      <div className="pricing-table bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(59,130,246,0.2)]">
        <table className="w-full">
          <thead>
            <tr>
      
              <th className="text-left text-blue-400 font-bold uppercase tracking-widest text-[10px] pb-4 px-4">Embarque</th>
              <th className="text-left">Desembarque</th>
              <th className="text-left">Valores</th>
              <th className="text-left">Distância</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr 
                key={index}
                className={`transition-all duration-400 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                }`}
                style={{ 
                  transitionDelay: `${delay + 100 + index * 80}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <td>{row.embarque}</td>
                <td>{row.desembarque}</td>
                <td className="font-medium text-white">{row.valor}</td>
                <td>{row.distancia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pricing Section Component
function PricingSection() {
  const cityData: PricingRow[] = [
    { embarque: 'Lages, SC', desembarque: 'Campos novos, SC', valor: 'R$ 350', distancia: '124 km' },
    { embarque: 'Lages, SC', desembarque: 'Correia Pinto, SC', valor: 'R$ 110', distancia: '30 km' },
    { embarque: 'Lages, SC', desembarque: 'Mafra, SC', valor: 'R$ 650', distancia: '250 km' },
    { embarque: 'Lages, SC', desembarque: 'Capão Alto, SC', valor: 'R$ 130', distancia: '34 km' },
  ];

  const localData: PricingRow[] = [
    { embarque: 'Centro', desembarque: 'Garden Shopping', valor: 'R$ 22', distancia: '8 km' },
    { embarque: 'Centro', desembarque: 'Posto Serrano 8', valor: 'R$ 25', distancia: '7 km' },
    { embarque: 'Posto Peruzzo', desembarque: 'Área Industrial', valor: 'R$ 40', distancia: '14 km' },
    { embarque: 'Centro', desembarque: 'Coxilha Rica', valor: 'R$ 300', distancia: '76 km' },
    { embarque: 'Posto Peruzzo', desembarque: 'Boqueirão Hotel', valor: 'R$ 62', distancia: '17 km' },
  ];

  return (
    <section className="relative py-20 px-4">
      {/* Background continuation */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/city-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Geometric Pattern */}
      <div className="geometric-pattern z-10" />

      {/* Content */}
      <div className="relative z-20">
        <PricingTable title="Tabela por Cidades" rows={cityData} delay={0} />
        <PricingTable title="Tabela local ( Lages )" rows={localData} delay={400} />
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="w-full py-10 bg-black flex justify-center items-center">
      <p className="text-sm text-white/60 text-center">
        Feito com ❤️ em Lages, SC
      </p>
    </footer>
  );
}

// Main App Component
function App() {
  return (
    <div className="h-auto bg-[#1a1a1a]">
      <Header />
      <main>
        <HeroSection />
        <MapSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
