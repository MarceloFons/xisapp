import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Animation hook from PricingSection
function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
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

interface TouristSpot {
  title: string;
  image: string;
  history: string;
  visitInfo: string;
  distance: string;
  price: string;
  destination: string;
}

const spots: TouristSpot[] = [
  {
    title: 'Beto Carrero World',
    image: '/img/beto-carrero.jpg',
    history: 'Maior parque temático da América Latina, fundado em 1991 por João Batista Sérgio Murad (Beto Carrero), um lendário apresentador de circo. Com mais de 100 atrações, shows internacionais e um zoológico, é um destino imperdível para famílias.',
    visitInfo: 'Aberto diariamente 10h-18h (confira feriados). Melhores meses: primavera/verão. Ingressos a partir de R$ 150. Leve protetor solar e água.',
    distance: '285 km de Lages',
    price: 'R$ 850',
    destination: 'Beto Carrero World, Penha, SC',
  },
  {
    title: 'Serra do Rio do Rastro',
    image: '/img/serra-rio-rastro.png',
    history: 'Estrada construída em 1928, com 30 km e 284 curvas íngremes até 1.420m de altitude. Considerada uma das mais belas do mundo, atravessa a Mata Atlântica preservada.',
    visitInfo: 'Aberta 24h, gratuita. Ideal para road trips (dry season: abr-set). Mirante no topo com vista panorâmica. Cuidado com neblina e curvas.',
    distance: '192 km de Lages',
    price: 'R$ 530',
    destination: 'Serra do Rio do Rastro, Lauro Müller, SC',
  },
  {
    title: 'Vila Germânica',
    image: '/img/vila-germanica.jpg',
    history: 'Recriação da Alemanha em Blumenau, homenageando imigrantes alemães chegados nos anos 1820. Principal atração da Oktoberfest, maior festa alemã fora da Alemanha.',
    visitInfo: 'Oktoberfest: out (18 dias). Aberto sáb-dom outros meses. Cervejas artesanais, pratos típicos (chope R$ 15). Estacionamento pago.',
    distance: '250 km de Lages',
    price: 'R$ 650',
    destination: 'Vila Germânica, Blumenau, SC',
  },
];

function TouristSpotCard({ spot, delay = 0 }: { spot: TouristSpot; delay?: number }) {
  const { ref, isVisible } = useIntersectionObserver();
  const phone = '5521983991349';
  const whatsappText = `Olá! Quero transfer para ${spot.title}\\nDe: Lages, SC → ${spot.destination}\\nDistância: ${spot.distance}\\nValor estimado: ${spot.price}\\nPode me atender?`;
  const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card className="bg-white/[0.03] backdrop-blur-md border-white/10 shadow-2xl overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-2 max-w-sm mx-auto">
        <AspectRatio ratio={16 / 9}>
          <img
            src={spot.image}
            alt={spot.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        </AspectRatio>
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-light text-white tracking-wide">
            {spot.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-white/90">
          <div>
            <CardDescription className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-1">
              <MapPin size={16} /> História
            </CardDescription>
            <p className="text-sm leading-relaxed">{spot.history}</p>
          </div>
          <div>
            <CardDescription className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
              <Clock size={16} /> Dicas de Visita
            </CardDescription>
            <p className="text-sm leading-relaxed">{spot.visitInfo}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs pt-4 border-t border-white/10">
            <span className="flex items-center gap-1 text-blue-400">
              <DollarSign size={14} /> {spot.price}
            </span>
            <span className="flex items-center gap-1 text-white/70">
              {spot.distance}
            </span>
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <MessageSquare size={18} /> Solicitar Transfer
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function TouristSpotsSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useIntersectionObserver();

  return (
    <section ref={sectionRef} id="pontos-turisticos" className="relative py-24 px-4 min-h-[80vh] flex flex-col justify-center bg-black">
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'url(/city-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className={`relative z-20 max-w-7xl mx-auto transition-all duration-1000 ${sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Transfers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              Pontos Turísticos
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Descubra os principais atrativos de Santa Catarina com transfers seguros e confortáveis saindo de Lages.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {spots.map((spot, index) => (
            <TouristSpotCard key={spot.title} spot={spot} delay={index * 200} />
          ))}
        </div>
      </div>
    </section>
  );
}
