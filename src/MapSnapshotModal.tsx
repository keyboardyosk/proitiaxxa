import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Route } from './types';
import html2canvas from 'html2canvas';
import { generatePDF } from './pdfGenerator';

interface MapSnapshotModalProps {
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

export default function MapSnapshotModal({ route, onClose }: MapSnapshotModalProps) {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const handleCapture = async () => {
    if (!mapContainerRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
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
      // Используем первый снимок как карту для PDF
      const mapImage = snapshots.length > 0 ? snapshots[0] : undefined;
      
      // Генерируем PDF с картой
      generatePDF(route, mapImage);
      
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-paper w-full max-w-6xl h-[90vh] flex flex-col border border-line-soft">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-soft">
          <div>
            <h2 className="font-display text-xl text-ink">Снимки карты</h2>
            <p className="text-xs text-ink-muted font-technical mt-1">
              Выберите масштаб и сделайте снимки
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapContainerRef} className="absolute inset-0">
              <MapContainer
                center={[59.9343, 30.3351]}
                zoom={12}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToRoute route={route} />
              </MapContainer>
            </div>
            
            {/* Capture button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="px-6 py-3 bg-ink text-paper font-technical text-xs uppercase tracking-widest hover:bg-ink-soft transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
                    Захват...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="w-64 border-l border-line-soft bg-paper-dark/30 overflow-y-auto">
            <div className="p-4">
              <div className="font-technical text-[10px] uppercase tracking-widest text-ink-muted mb-3">
                Снимки ({snapshots.length})
              </div>
              
              {snapshots.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  Сделайте снимки карты в нужном масштабе
                </p>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snapshot, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={snapshot}
                        alt={`Снимок ${i + 1}`}
                        className="w-full h-32 object-cover border border-line-soft"
                      />
                      <button
                        onClick={() => handleRemoveSnapshot(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-ink/80 text-paper rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-1 left-1 bg-ink/80 text-paper text-[10px] px-2 py-0.5 font-technical">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-line-soft">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-paper border border-line-soft text-ink font-technical text-xs uppercase tracking-widest hover:bg-paper-dark transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={snapshots.length === 0 || isGeneratingPDF}
            className="px-8 py-3 bg-ink text-paper font-technical text-xs uppercase tracking-widest hover:bg-ink-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                Создать PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
