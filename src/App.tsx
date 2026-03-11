import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import MapSection from './sections/MapSection';
import './App.css';

// Intersection Observer hook
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
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return { ref, isVisible };
}

function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 py-6 px-4">
 <div className="max-w-4xl mx-auto text-center space-y-6">
  {/* Gatilho de Status e Exclusividade */}
  <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tighter">
    Sua rota, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Xis.</span>
  </h1>
</div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="absolute inset-0 z-0 opacity-0" style={{ backgroundImage: 'url(/city-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'fadeIn 1.2s var(--ease-out-expo) forwards' }}>
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="geometric-pattern z-10 opacity-0" style={{ animation: 'fadeIn 1s var(--ease-out-expo) 200ms forwards' }} />
      <div className="relative z-20 w-full max-w-4xl mx-auto opacity-0 animate-card-float" style={{ animation: 'fadeIn 1s var(--ease-out-expo) 600ms forwards, cardFloat 6s ease-in-out infinite 1.6s', perspective: '1000px' }}>
        <div className="hero-card">
          <img src="/car-hero.jpg" alt="Carro" className="w-full h-auto object-cover" />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12">
            <h2 className="text-3xl md:text-5xl font-light text-white leading-tight max-w-lg opacity-0" style={{ animation: 'fadeInUp 0.8s var(--ease-out-expo) 1s forwards' }}>
              Mobilidade inteligente para o seu dia a dia.
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/80 italic opacity-0" style={{ animation: 'slideInLeft 0.6s var(--ease-smooth) 1.2s forwards' }}>
              Seu App para transportes.
            </p>
            <div className="mt-8 opacity-0" style={{ animation: 'scaleIn 0.5s var(--ease-elastic) 1.5s forwards' }}>
              <a href="https://forms.gle/jnV4h1nqGKnmGmvF9" target="_blank" rel="noopener noreferrer" className="btn-primary">
                <MessageSquare size={20} /> Feedback
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-20 mt-8 opacity-0" style={{ animation: 'bounceIn 0.7s var(--ease-bounce) 1.7s forwards' }}>
        <a href="https://api.whatsapp.com/send/?phone=5521983991349" target="_blank" rel="noopener noreferrer" className="btn-cta">
          <Check size={20} /> Solicite sua Viagem
        </a>
      </div>
    </section>
  );
}

interface PricingRow { embarque: string; desembarque: string; valor: string; distancia: string; }
interface PricingTableProps { title: string; rows: PricingRow[]; delay?: number; }

function PricingTable({ title, rows, delay = 0 }: PricingTableProps) {
  const { ref, isVisible } = useIntersectionObserver();
  return (
    <div ref={ref} className={`w-full max-w-4xl mx-auto mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${delay}ms` }}>
      <h3 className="text-2xl font-light text-white text-center mb-8 tracking-[0.2em] uppercase">
        {title}
        <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
      </h3>
      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.05]">
                <th className="text-left text-blue-400 text-[10px] uppercase tracking-tighter p-6">Origem / Destino</th>
                <th className="text-center text-blue-400 text-[10px] uppercase tracking-tighter p-6">Valores</th>
                <th className="text-right text-blue-400 text-[10px] uppercase tracking-tighter p-6">Distância</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="text-white font-medium">{row.embarque}</div>
                    <div className="text-white/40 text-sm">para {row.desembarque}</div>
                  </td>
                  <td className="p-6 text-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{row.valor}</td>
                  <td className="p-6 text-right text-white/60 font-mono text-sm">{row.distancia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PricingSection() {
  const cityData = [
    { embarque: 'Lages, SC', desembarque: 'Campos novos, SC', valor: 'R$ 350', distancia: '124 km' },
    { embarque: 'Lages, SC', desembarque: 'Correia Pinto, SC', valor: 'R$ 110', distancia: '30 km' },
    { embarque: 'Lages, SC', desembarque: 'Mafra, SC', valor: 'R$ 650', distancia: '250 km' },
    { embarque: 'Lages, SC', desembarque: 'Capão Alto, SC', valor: 'R$ 130', distancia: '34 km' },
    { embarque: 'Lages, SC', desembarque: 'Criciuma, SC', valor: 'R$ 530', distancia: '192 km' },
    { embarque: 'Lages, SC', desembarque: 'Curitiba, PR', valor: 'R$ 820', distancia: '362 km' },
    { embarque: 'Lages, SC', desembarque: 'São josé do cerrito, SC', valor: 'R$ 120', distancia: '40 km' },

  ];
  const localData = [
    { embarque: 'Centro', desembarque: 'Garden Shopping', valor: 'R$ 22', distancia: '8 km' },
    { embarque: 'Centro', desembarque: 'Posto Serrano 8', valor: 'R$ 25', distancia: '7 km' },
    { embarque: 'Posto Peruzzo', desembarque: 'Área Industrial', valor: 'R$ 40', distancia: '14 km' },
    { embarque: 'Centro', desembarque: 'Coxilha Rica', valor: 'R$ 300', distancia: '76 km' },
    { embarque: 'Centro', desembarque: 'Índios', valor: 'R$ 50', distancia: '16 km' },
  ];

  return (
    <section className="relative py-20 px-4 min-h-[80vh] flex flex-col justify-center">
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url(/city-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Gradiente que suaviza o topo mas mantém o fundo da cidade no final */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black/40" />
      </div>
      <div className="geometric-pattern z-10 opacity-30" />
      <div className="relative z-20">
        <PricingTable title="Tabela por Cidades" rows={cityData} delay={0} />
        <PricingTable title="Tabela local ( Lages )" rows={localData} delay={400} />
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
        <PricingSection />
      </main>
      {/* Footer removido para terminar nas tabelas com o fundo da cidade */}
    </div>
  );
}

export default App;