import { useEffect, useRef, useState } from 'react';

// Hook para observar a interseção e animar a entrada
function useIntersectionObserver(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, ...options }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [options]);

  return { ref, isVisible };
}

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
      className={`w-full max-w-4xl mx-auto mb-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="text-2xl font-light text-white text-center mb-8 tracking-[0.2em] uppercase">
        {title}
        <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_#3b82f6]" />
      </h3>

      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.05]">
                <th className="text-left text-blue-400 text-xs uppercase font-semibold p-6 tracking-wider">Origem / Destino</th>
                <th className="text-center text-blue-400 text-xs uppercase font-semibold p-6 tracking-wider">Valores</th>
                <th className="text-right text-blue-400 text-xs uppercase font-semibold p-6 tracking-wider">Distância</th>
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

export function PricingSection() {
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
    <section id="precos" className="relative py-20 px-4 min-h-[80vh] flex flex-col justify-center bg-black">
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'url(/city-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="relative z-20">
        <PricingTable title="Tabela por Cidades" rows={cityData} delay={0} />
        <PricingTable title="Tabela local ( Lages )" rows={localData} delay={200} />
      </div>
    </section>
  );
}