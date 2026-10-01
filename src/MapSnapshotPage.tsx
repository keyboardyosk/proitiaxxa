import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Route } from './types';
import html2canvas from 'html2canvas';
import { generatePDF } from './pdfGenerator';

interface MapSnapshotPageProps {
  route: Route;
  onClose: () => void;
}

function FitToRoute({ route }: { route: Route }) {
  const map = useMap();
  
  useEffect(() => {
    if (route.geometry.length > 0) {
      const bounds = L.latLngBounds(route.geometry.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  
  return null;
}

// Маркеры для старта и финиша
const startIcon = new L.DivIcon({
  html: `<div style="background: #171717; width: 16px; height: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const finishIcon = new L.DivIcon({
  html: `<div style="background: #D92F2F; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapSnapshotPage({ route, onClose }: MapSnapshotPageProps) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const handleCapture = async () => {
    if (!mapContainerRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#E8E5DB',
        logging: false,
      });
      
      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      setSnapshots(prev => [...prev, imageData]);
    } catch (err) {
      console.error('Error capturing map:', err);
      alert('Не удалось захватить карту. Попробуйте ещё раз.');
    } finally {
      setIsCapturing(false);
    }
  };
  
  const handleRemoveSnapshot = (index: number) => {
    setSnapshots(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleGeneratePDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const mapImage = snapshots.length > 0 ? snapshots[0] : undefined;
      generatePDF(route, mapImage);
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ошибка при генерации PDF. Попробуйте ещё раз.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-paper border-b border-line-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-ink-muted hover:text-ink flex items-center gap-2 transition-colors font-technical text-[10px] uppercase tracking-[0.2em]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Назад</span>
          </button>
          
          <div className="text-center">
            <h1 className="font-display text-xl text-ink">Снимки карты</h1>
            <p className="text-xs text-ink-muted font-technical mt-1">
              Выберите масштаб и сделайте снимки
            </p>
          </div>
          
          <div className="w-16"></div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0">
            <MapContainer
              center={[59.9343, 30.3351]}
              zoom={12}
              className="w-full h-full"
              preferCanvas={true}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                crossOrigin="anonymous"
              />
              <Polyline
                positions={route.geometry}
                pathOptions={{ color: '#D92F2F', weight: 4, opacity: 0.9 }}
              />
              <Marker position={[route.start.lat, route.start.lon]} icon={startIcon}>
                <Popup>Старт</Popup>
              </Marker>
              <Marker position={[route.finish.lat, route.finish.lon]} icon={finishIcon}>
                <Popup>Финиш</Popup>
              </Marker>
              <FitToRoute route={route} />
            </MapContainer>
          </div>
          
          {/* Capture button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className="px-8 py-4 bg-ink text-paper font-technical text-xs uppercase tracking-widest hover:bg-ink-soft transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {isCapturing ? (
                <>
                  <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
                  Захват...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Сделать снимок
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Snapshots list */}
        <div className="w-80 border-l border-line-soft bg-paper-dark/30 overflow-y-auto">
          <div className="p-6">
            <div className="font-technical text-xs uppercase tracking-widest text-ink-muted mb-4">
              Снимки ({snapshots.length})
            </div>
            
            {snapshots.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-ink-muted/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-ink-muted">
                  Сделайте снимки карты в нужном масштабе
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {snapshots.map((snapshot, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={snapshot}
                      alt={`Снимок ${i + 1}`}
                      className="w-full h-48 object-cover border border-line-soft"
                    />
                    <button
                      onClick={() => handleRemoveSnapshot(i)}
                      className="absolute top-2 right-2 w-8 h-8 bg-ink/80 text-paper rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-ink/80 text-paper text-xs px-3 py-1 font-technical">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-line-soft bg-paper px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-paper border border-line-soft text-ink font-technical text-xs uppercase tracking-widest hover:bg-paper-dark transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={snapshots.length === 0 || isGeneratingPDF}
            className="px-10 py-3 bg-ink text-paper font-technical text-xs uppercase tracking-widest hover:bg-ink-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
                Генерация PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Создать PDF с картой
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
