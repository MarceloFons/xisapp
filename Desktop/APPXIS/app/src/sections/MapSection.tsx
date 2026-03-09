import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Navigation, Route, X, ArrowRightLeft } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AddressAutocomplete from '../components/AddressAutocomplete';

// Fix Leaflet default icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons
const originIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #2d8a4e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background: #4a9eff; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
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
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

export default function MapSection() {
  const [originInput, setOriginInput] = useState('Centro, Lages');
  const [destInput, setDestInput] = useState('');
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destLocation, setDestLocation] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
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
          distance: routeData.distance / 1000,
          duration: routeData.duration / 60,
          coordinates: coords
        };
      }
      return null;
    } catch (err) {
      console.error('Routing error:', err);
      return null;
    }
  }, []);

  // Handle origin selection from autocomplete
  const handleOriginSelect = (suggestion: Suggestion) => {
    setOriginLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      displayName: suggestion.display_name
    });
  };

  // Handle destination selection from autocomplete
  const handleDestSelect = (suggestion: Suggestion) => {
    setDestLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      displayName: suggestion.display_name
    });
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

    try {
      const routeInfo = await calculateRoute(originLocation, destLocation);
      
      if (routeInfo) {
        setRoute(routeInfo);
        
        const latLngs = [
          L.latLng(originLocation.lat, originLocation.lng),
          L.latLng(destLocation.lat, destLocation.lng),
          ...routeInfo.coordinates.map(coord => L.latLng(coord[0], coord[1]))
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
  };

  // Quick select from pricing tables
  const quickSelectRoute = (origem: string, destino: string) => {
    setOriginInput(origem);
    setDestInput(destino);
    
    // Geocode both addresses
    Promise.all([
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(origem + ', Santa Catarina, Brasil')}&limit=1`).then(r => r.json()),
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino + ', Santa Catarina, Brasil')}&limit=1`).then(r => r.json())
    ]).then(([origData, destData]) => {
      if (origData[0] && destData[0]) {
        const orig = {
          lat: parseFloat(origData[0].lat),
          lng: parseFloat(origData[0].lon),
          displayName: origData[0].display_name
        };
        const dest = {
          lat: parseFloat(destData[0].lat),
          lng: parseFloat(destData[0].lon),
          displayName: destData[0].display_name
        };
        
        setOriginLocation(orig);
        setDestLocation(dest);
        
        // Auto calculate route
        calculateRoute(orig, dest).then(routeInfo => {
          if (routeInfo) {
            setRoute(routeInfo);
            const latLngs = [
              L.latLng(orig.lat, orig.lng),
              L.latLng(dest.lat, dest.lng),
              ...routeInfo.coordinates.map(coord => L.latLng(coord[0], coord[1]))
            ];
            setBounds(L.latLngBounds(latLngs));
          }
        });
      }
    });
  };

  return (
    <section className="relative py-16 px-4">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/city-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Geometric Pattern */}
      <div className="geometric-pattern z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-2">
            Calcule sua Rota
          </h2>
          <p className="text-white/70">
            Digite o endereço de origem e destino para visualizar o itinerário
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-[#2d2d2d]/80 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
            {/* Origin */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#2d8a4e] font-medium">
                <MapPin size={20} />
                <span>Origem</span>
              </div>
              <AddressAutocomplete
                value={originInput}
                onChange={setOriginInput}
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
                onChange={setDestInput}
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

          {/* Route Info */}
          {route && (
            <div className="mt-4 p-4 bg-[#2d8a4e]/20 border border-[#2d8a4e]/40 rounded-lg">
              <div className="flex flex-wrap gap-6 text-white">
                <div>
                  <span className="text-white/60 text-sm">Distância</span>
                  <p className="text-xl font-semibold">{route.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Tempo estimado</span>
                  <p className="text-xl font-semibold">
                    {Math.floor(route.duration / 60)}h {Math.round(route.duration % 60)}min
                  </p>
                </div>
              </div>
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
            
            {/* Origin Marker */}
            {originLocation && (
              <Marker 
                position={[originLocation.lat, originLocation.lng]} 
                icon={originIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong className="text-[#2d8a4e]">Origem</strong>
                    <p className="mt-1">{originLocation.displayName}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Destination Marker */}
            {destLocation && (
              <Marker 
                position={[destLocation.lat, destLocation.lng]} 
                icon={destIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong className="text-[#4a9eff]">Destino</strong>
                    <p className="mt-1">{destLocation.displayName}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Route Line */}
            {route && (
              <Polyline
                positions={route.coordinates}
                color="#2d8a4e"
                weight={5}
                opacity={0.8}
                dashArray="10, 10"
              />
            )}
            
            {/* Map Updater for bounds */}
            <MapUpdater bounds={bounds} />
          </MapContainer>
        </div>

        {/* Quick Select from Tables */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Rotas pré-definidas</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { origem: 'Centro, Lages', destino: 'Garden Shopping, Lages' },
              { origem: 'Centro, Lages', destino: 'Posto Serrano 8, Lages' },
              { origem: 'Lages, Santa Catarina', destino: 'Mafra, Santa Catarina' },
              { origem: 'Lages, Santa Catarina', destino: 'Correia Pinto, Santa Catarina' },
              { origem: 'Centro, Lages', destino: 'Coxilha Rica, Lages' },
            ].map((rota, idx) => (
              <button
                key={idx}
                onClick={() => quickSelectRoute(rota.origem, rota.destino)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm rounded-full transition-all"
              >
                {rota.origem.split(',')[0]} → {rota.destino.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
