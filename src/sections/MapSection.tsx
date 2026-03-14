import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Navigation, Route, X, ArrowRightLeft, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AddressAutocomplete from '../components/AddressAutocomplete';

// Fix Leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons
const originIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #2d8a4e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #4a9eff; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map bounds updater component
function MapUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

interface Location {
  lat: number;
  lng: number;
  displayName: string;
}

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface RouteInfo {
  distance: number; // km
  duration: number; // min
  coordinates: [number, number][]; // [lat, lng]
}

// ====== PRICING (SUAS REGRAS REAIS) ======
const PRICING = {
  baseFare: 10,     // Tarifa base: R$ 10
  perKm: 2.8,       // R$ 2,80 por KM
  minimumFare: 10,  // Mínimo: R$ 10
};

function calculateFare(distanceKm: number) {
  const raw = PRICING.baseFare + distanceKm * PRICING.perKm;
  return Math.max(raw, PRICING.minimumFare);
}

function formatDuration(durationMin: number) {
  const h = Math.floor(durationMin / 60);
  const m = Math.round(durationMin % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

async function geocode(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.[0] ?? null;
}

async function reverseGeocode(lat: number, lon: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.display_name as string | undefined;
}

export default function MapSection() {
  const [originInput, setOriginInput] = useState('Centro, Lages');
  const [destInput, setDestInput] = useState('');
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destLocation, setDestLocation] = useState<Location | null>(null);

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [fare, setFare] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [error, setError] = useState('');
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  // Lages, SC coordinates (default center)
  const defaultCenter: [number, number] = [-27.815, -50.326];
  const defaultZoom = 13;

  // Calculate route using OSRM
  const calculateRoute = useCallback(async (start: Location, end: Location): Promise<RouteInfo | null> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];

        const coords: [number, number][] = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        return {
          distance: routeData.distance / 1000, // meters -> km
          duration: routeData.duration / 60,   // seconds -> minutes
          coordinates: coords,
        };
      }

      return null;
    } catch (err) {
      console.error('Routing error:', err);
      return null;
    }
  }, []);

  // Premium: tenta geocodificar a origem padrão automaticamente 1x (Centro, Lages)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (originLocation) return;
      if (!originInput?.trim()) return;

      try {
        const result = await geocode(`${originInput}, Santa Catarina, Brasil`);
        if (cancelled) return;

        if (result) {
          setOriginLocation({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: result.display_name,
          });
        }
      } catch {
        // silencioso
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle origin selection from autocomplete
  const handleOriginSelect = (suggestion: Suggestion) => {
    setOriginLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      displayName: suggestion.display_name,
    });
    setError('');
  };

  // Handle destination selection from autocomplete
  const handleDestSelect = (suggestion: Suggestion) => {
    setDestLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      displayName: suggestion.display_name,
    });
    setError('');
  };

  // Premium: usar minha localização (GPS)
  const handleUseMyLocation = async () => {
    if (!('geolocation' in navigator)) {
      setError('Seu navegador não suporta geolocalização.');
      return;
    }

    setLocating(true);
    setError('');
    setRoute(null);
    setBounds(null);
    setFare(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const displayName = (await reverseGeocode(lat, lng)) ?? 'Minha localização';

          setOriginLocation({ lat, lng, displayName });
          setOriginInput(displayName);
        } catch {
          setOriginLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, displayName: 'Minha localização' });
          setOriginInput('Minha localização');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error(err);
        setLocating(false);

        if (err.code === 1) setError('Permissão de localização negada. Ative para usar sua localização.');
        else if (err.code === 2) setError('Não foi possível obter sua localização (indisponível).');
        else setError('Erro ao obter localização. Tente novamente.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  // Handle route calculation
  const handleCalculateRoute = async () => {
    if (!originLocation || !destLocation) {
      setError('Por favor, selecione origem e destino nas sugestões.');
      return;
    }

    setLoading(true);
    setError('');
    setRoute(null);
    setBounds(null);
    setFare(null);

    try {
      const routeInfo = await calculateRoute(originLocation, destLocation);

      if (routeInfo) {
        setRoute(routeInfo);
        setFare(calculateFare(routeInfo.distance));

        const latLngs = [
          L.latLng(originLocation.lat, originLocation.lng),
          L.latLng(destLocation.lat, destLocation.lng),
          ...routeInfo.coordinates.map((coord) => L.latLng(coord[0], coord[1])),
        ];
        setBounds(L.latLngBounds(latLngs));
      } else {
        setError('Não foi possível calcular a rota. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao calcular a rota. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Swap origin and destination
  const handleSwap = () => {
    const tempInput = originInput;
    setOriginInput(destInput);
    setDestInput(tempInput);

    const tempLoc = originLocation;
    setOriginLocation(destLocation);
    setDestLocation(tempLoc);

    setRoute(null);
    setBounds(null);
    setFare(null);
    setError('');
  };

  // Clear all data
  const handleClear = () => {
    setOriginInput('');
    setDestInput('');
    setOriginLocation(null);
    setDestLocation(null);
    setRoute(null);
    setError('');
    setBounds(null);
    setFare(null);
  };

  // Quick select from pricing tables
  const quickSelectRoute = (origem: string, destino: string) => {
    setOriginInput(origem);
    setDestInput(destino);

    Promise.all([
      geocode(`${origem}, Santa Catarina, Brasil`),
      geocode(`${destino}, Santa Catarina, Brasil`),
    ]).then(async ([origData, destData]) => {
      if (origData && destData) {
        const orig: Location = {
          lat: parseFloat(origData.lat),
          lng: parseFloat(origData.lon),
          displayName: origData.display_name,
        };
        const dest: Location = {
          lat: parseFloat(destData.lat),
          lng: parseFloat(destData.lon),
          displayName: destData.display_name,
        };

        setOriginLocation(orig);
        setDestLocation(dest);

        const routeInfo = await calculateRoute(orig, dest);
        if (routeInfo) {
          setRoute(routeInfo);
          setFare(calculateFare(routeInfo.distance));

          const latLngs = [
            L.latLng(orig.lat, orig.lng),
            L.latLng(dest.lat, dest.lng),
            ...routeInfo.coordinates.map((coord) => L.latLng(coord[0], coord[1])),
          ];
          setBounds(L.latLngBounds(latLngs));
        }
      }
    });
  };

  // WhatsApp link com mensagem pré-preenchida (Click-to-Chat)
  // Referência: WhatsApp Help Center [Source](https://faq.whatsapp.com/5913398998672934)
  const whatsappLink = (() => {
    if (!originLocation || !destLocation || !route || fare == null) return null;

    const phone = '5521983991349';
    const text =
      `Olá! Quero solicitar uma viagem.\n` +
      `Origem: ${originLocation.displayName}\n` +
      `Destino: ${destLocation.displayName}\n` +
      `Distância: ${route.distance.toFixed(1)} km\n` +
      `Tempo estimado: ${formatDuration(route.duration)}\n` +
      `Valor estimado: R$ ${fare.toFixed(2)}\n\n` +
      `Pode me atender?`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  })();

  return (
    <section id="rota" className="relative py-16 px-4">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url(/city-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
            Calcule sua{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Rota
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-3xl mx-auto">
            Digite os endereços para visualizar o itinerário, a distância e o valor estimado da sua viagem.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-[#2d2d2d]/80 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Origin */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#2d8a4e] font-medium">
                  <MapPin size={20} />
                  <span>Origem</span>
                </div>

                {/* Premium: usar minha localização */}
                <button
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white/80 text-xs transition-all"
                  title="Usar minha localização"
                >
                  {locating ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LocateFixed size={14} />
                  )}
                  {locating ? 'Localizando...' : 'Usar minha localização'}
                </button>
              </div>

              <AddressAutocomplete
                value={originInput}
                onChange={(v: string) => {
                  setOriginInput(v);
                  setOriginLocation(null);
                  setRoute(null);
                  setBounds(null);
                  setFare(null);
                }}
                onSelect={handleOriginSelect}
                placeholder="Ex: Centro, Lages"
                iconColor="#2d8a4e"
              />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:pt-8">
              <button
                onClick={handleSwap}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                title="Trocar origem e destino"
              >
                <ArrowRightLeft size={20} className="text-white/70" />
              </button>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#4a9eff] font-medium">
                <Navigation size={20} />
                <span>Destino</span>
              </div>

              <AddressAutocomplete
                value={destInput}
                onChange={(v: string) => {
                  setDestInput(v);
                  setDestLocation(null);
                  setRoute(null);
                  setBounds(null);
                  setFare(null);
                }}
                onSelect={handleDestSelect}
                placeholder="Ex: Garden Shopping, Lages"
                iconColor="#4a9eff"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleCalculateRoute}
              disabled={loading || !originLocation || !destLocation}
              className="flex items-center gap-2 px-6 py-3 bg-[#2d8a4e] hover:bg-[#247a43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Route size={20} />
              )}
              {loading ? 'Calculando...' : 'Traçar Rota'}
            </button>

            {(originLocation || destLocation || route) && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
              >
                <X size={20} />
                Limpar
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Route Info + Price + WhatsApp CTA (desktop/tablet) */}
          {route && (
            <div className="mt-4 p-4 bg-[#2d8a4e]/20 border border-[#2d8a4e]/40 rounded-lg">
              <div className="flex flex-wrap gap-6 text-white items-end justify-between">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <span className="text-white/60 text-sm">Distância</span>
                    <p className="text-xl font-semibold">{route.distance.toFixed(1)} km</p>
                  </div>

                  <div>
                    <span className="text-white/60 text-sm">Tempo estimado</span>
                    <p className="text-xl font-semibold">{formatDuration(route.duration)}</p>
                  </div>

                  <div>
                    <span className="text-white/60 text-sm">Valor estimado</span>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      {fare != null ? `R$ ${fare.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>

                {/* Desktop CTA */}
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:inline-flex mt-4 md:mt-0 items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1fb658] text-black font-semibold rounded-lg transition-all"
                    title="Abrir WhatsApp com a rota e o valor"
                  >
                    Solicitar no WhatsApp
                  </a>
                )}
              </div>

              <p className="mt-3 text-white/60 text-xs">
               
              </p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden shadow-2xl" style={{ height: '500px' }}>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {originLocation && (
              <Marker position={[originLocation.lat, originLocation.lng]} icon={originIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong className="text-[#2d8a4e]">Origem</strong>
                    <p className="mt-1">{originLocation.displayName}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {destLocation && (
              <Marker position={[destLocation.lat, destLocation.lng]} icon={destIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong className="text-[#4a9eff]">Destino</strong>
                    <p className="mt-1">{destLocation.displayName}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {route && (
              <Polyline
                positions={route.coordinates}
                color="#2d8a4e"
                weight={5}
                opacity={0.85}
                dashArray="10, 10"
              />
            )}

            <MapUpdater bounds={bounds} />
          </MapContainer>
        </div>

        {/* Quick Select */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Rotas pré-definidas</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { origem: 'Lages, SC', destino: 'Beto Carrero World, Penha, SC' },
              { origem: 'Lages, SC', destino: 'Serra do Rio do Rastro, Lauro Müller, SC' },
              { origem: 'Lages, SC', destino: 'Praia do Rosa, Imbituba, SC' },
              { origem: 'Lages, SC', destino: 'Vila Germânica, Blumenau, SC' },
              { origem: 'Lages, SC', destino: 'Bombinhas, SC' },
            ].map((rotaItem, idx) => (
              <button
                key={idx}
                onClick={() => quickSelectRoute(rotaItem.origem, rotaItem.destino)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm rounded-full transition-all"
              >
                {rotaItem.origem.split(',')[0]} → {rotaItem.destino.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Premium: CTA fixo no rodapé (apenas mobile) quando já tem preço */}
      {whatsappLink && fare != null && (
        <div className="md:hidden fixed left-0 right-0 bottom-0 z-[9999] p-3">
          <div className="max-w-6xl mx-auto rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl p-3 flex items-center justify-between gap-3">
            <div className="text-white">
              <div className="text-xs text-white/60">Valor estimado</div>
              <div className="text-lg font-bold">
                R$ {fare.toFixed(2)}
              </div>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1fb658] text-black font-semibold transition-all"
            >
              Solicitar no WhatsApp
            </a>
          </div>

          {/* espaço para não cobrir conteúdo */}
          <div className="h-10" />
        </div>
      )}
    </section>
  );
}
