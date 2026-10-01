import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Route } from './types';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

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
      // Создаём контейнер для PDF
      const container = document.createElement('div');
      container.style.width = '210mm';
      container.style.fontFamily = 'Inter, sans-serif';
      container.style.color = '#171717';
      container.style.backgroundColor = '#F1EFE8';
      
      const routeNum = String(route.routeNumber).padStart(5, '0');
      const startName = route.start.name 
        ? route.start.name.split(',').slice(0, 2).join(',')
        : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`;
      const finishName = route.finish.name 
        ? route.finish.name.split(',').slice(0, 2).join(',')
        : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`;
      
      // Группируем шаги по улицам
      const streetSegments: { name: string; distance: number }[] = [];
      let currentStreet = '';
      let currentDistance = 0;
      for (const step of route.steps) {
        const streetName = step.name || '—';
        if (streetName !== currentStreet) {
          if (currentStreet && currentDistance > 50) {
            streetSegments.push({ name: currentStreet, distance: currentDistance });
          }
          currentStreet = streetName;
          currentDistance = step.distance;
        } else {
          currentDistance += step.distance;
        }
      }
      if (currentStreet && currentDistance > 50) {
        streetSegments.push({ name: currentStreet, distance: currentDistance });
      }
      
      // Генерируем HTML
      container.innerHTML = `
        <!-- СТРАНИЦА 1: ОБЛОЖКА -->
        <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
          <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
          
          <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
            <!-- Верх -->
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.1em;">
              <span>59.9°N · 30.3°E · САНКТ-ПЕТЕРБУРГ</span>
              <span>EST. 2026</span>
            </div>
            
            <!-- Логотип -->
            <div style="margin-top: 15mm; display: flex; align-items: center; gap: 2mm;">
              <div style="width: 4mm; height: 4mm; background: #171717;"></div>
              <div style="flex: 1; height: 0.5mm; background: #171717;"></div>
              <div style="width: 4mm; height: 4mm; border-radius: 50%; background: #D92F2F;"></div>
            </div>
            
            <!-- Заголовок -->
            <div style="margin-top: 25mm; text-align: center;">
              <div style="font-size: 54pt; font-weight: 800; letter-spacing: -0.02em; line-height: 0.95; color: #171717;">ПРОЙТИ</div>
              <div style="font-size: 28pt; font-weight: 800; letter-spacing: -0.02em; line-height: 0.95; color: #171717; margin-top: 5mm;">САНКТ-ПЕТЕРБУРГЪ</div>
            </div>
            
            <!-- Разделитель -->
            <div style="margin-top: 10mm; display: flex; justify-content: center;">
              <div style="width: 60mm; height: 0.3mm; background: #B8B5AD;"></div>
            </div>
            
            <!-- Номер маршрута -->
            <div style="margin-top: 10mm; text-align: center;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10pt; color: #626262; letter-spacing: 0.2em;">МАРШРУТ</div>
              <div style="font-size: 48pt; font-weight: 700; color: #171717; margin-top: 3mm;">№${routeNum}</div>
            </div>
            
            <!-- Направление -->
            <div style="margin-top: 10mm; text-align: center;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 11pt; color: #626262; letter-spacing: 0.15em;">НАПРАВЛЕНИЕ</div>
              <div style="font-size: 16pt; font-weight: 700; color: #171717; margin-top: 2mm;">${route.direction}</div>
            </div>
            
            <!-- Расстояние -->
            <div style="margin-top: 12mm; text-align: center;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 10pt; color: #626262; letter-spacing: 0.15em;">РАССТОЯНИЕ</div>
              <div style="margin-top: 3mm;">
                <span style="font-size: 42pt; font-weight: 700; color: #D92F2F;">${(route.distanceMeters / 1000).toFixed(1)}</span>
                <span style="font-size: 20pt; font-weight: 700; color: #D92F2F; margin-left: 2mm;">КМ</span>
              </div>
            </div>
            
            <!-- Старт / Финиш -->
            <div style="margin-top: 15mm;">
              <div style="margin-bottom: 4mm;">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">СТАРТ</div>
                <div style="display: flex; align-items: center; gap: 2mm; margin-top: 1mm;">
                  <div style="width: 3mm; height: 3mm; background: #171717;"></div>
                  <div style="font-size: 11pt; font-weight: 700; color: #171717;">${startName}</div>
                </div>
              </div>
              <div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">ФИНИШ</div>
                <div style="display: flex; align-items: center; gap: 2mm; margin-top: 1mm;">
                  <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
                  <div style="font-size: 11pt; font-weight: 700; color: #171717;">${finishName}</div>
                </div>
              </div>
            </div>
            
            <!-- Время и дата -->
            <div style="margin-top: auto; display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262;">
              <span>≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}</span>
              <span>${route.createdAt.toLocaleDateString('ru-RU')}</span>
            </div>
            
            <!-- Слоган -->
            <div style="margin-top: 5mm; text-align: center; font-style: italic; font-size: 10pt; color: #626262;">
              Не гулять. Пересечь город.
            </div>
          </div>
        </div>
        
        ${snapshots.map((snapshot, i) => `
          <!-- СТРАНИЦА ${i + 2}: КАРТА ${snapshots.length > 1 ? i + 1 : ''} -->
          <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
            <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
            
            <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
              <!-- Заголовок -->
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5mm;">
                <div>
                  <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">ПЕЧАТНАЯ КАРТА${snapshots.length > 1 ? ` · ${i + 1}/${snapshots.length}` : ''}</div>
                  <div style="font-size: 16pt; font-weight: 700; color: #171717; margin-top: 2mm;">Маршрут №${routeNum}</div>
                </div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; text-align: right;">
                  <div>${route.direction}</div>
                  <div style="margin-top: 1mm;">${formatDistance(route.distanceMeters)}</div>
                </div>
              </div>
              
              <!-- Карта -->
              <div style="flex: 1; position: relative; border: 0.3mm solid #B8B5AD; overflow: hidden; background: #E8E5DB;">
                <img src="${snapshot}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
              </div>
              
              <!-- Легенда -->
              <div style="margin-top: 4mm; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 5mm; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <div style="width: 3mm; height: 3mm; background: #171717;"></div>
                    <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.1em;">A · СТАРТ</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
                    <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.1em;">B · ФИНИШ</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <div style="width: 8mm; height: 0.8mm; background: #D92F2F;"></div>
                    <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.1em;">МАРШРУТ</span>
                  </div>
                </div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262;">
                  © OpenStreetMap
                </div>
              </div>
            </div>
          </div>
        `).join('')}
        
        <!-- СТРАНИЦА: МАРШРУТНЫЙ ЛИСТ -->
        <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
          <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
          
          <div style="position: relative; z-index: 1;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 5mm;">
              <span>МАРШРУТНЫЙ ЛИСТ</span>
              <span>№${routeNum}</span>
            </div>
            
            <div style="font-size: 18pt; font-weight: 700; color: #171717; margin-bottom: 5mm;">${route.direction}</div>
            
            <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
            
            <!-- Старт -->
            <div style="display: flex; align-items: center; gap: 2mm; margin-bottom: 3mm;">
              <div style="width: 2.5mm; height: 2.5mm; background: #171717;"></div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; font-weight: 700; color: #171717; letter-spacing: 0.1em;">A · СТАРТ</div>
              <div style="flex: 1;"></div>
              <div style="font-size: 10pt; color: #171717;">${startName}</div>
            </div>
            
            <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
            
            <!-- Путь -->
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ПУТЬ</div>
            
            <div style="margin-bottom: 5mm;">
              ${streetSegments.slice(0, 40).map((seg, i) => `
                <div style="display: flex; align-items: baseline; gap: 3mm; margin-bottom: 1.5mm;">
                  <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; width: 6mm;">${String(i + 1).padStart(2, '0')}</div>
                  <div style="flex: 1; font-size: 9pt; color: #171717;">${seg.name}</div>
                  <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262;">${seg.distance >= 1000 ? `${(seg.distance / 1000).toFixed(1)} км` : `${Math.round(seg.distance)} м`}</div>
                </div>
              `).join('')}
              ${streetSegments.length > 40 ? `<div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; margin-top: 2mm;">+ ещё ${streetSegments.length - 40} участков</div>` : ''}
            </div>
            
            <!-- Финиш -->
            <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
            
            <div style="display: flex; align-items: center; gap: 2mm; margin-bottom: 5mm;">
              <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; font-weight: 700; color: #D92F2F; letter-spacing: 0.1em;">B · ФИНИШ</div>
              <div style="flex: 1;"></div>
              <div style="font-size: 10pt; color: #171717;">${finishName}</div>
            </div>
            
            <div style="border-top: 0.3mm solid #B8B5AD; padding-top: 3mm;"></div>
            
            <!-- Итог -->
            <div style="display: flex; gap: 10mm; margin-top: 3mm;">
              <div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">ИТОГО</div>
                <div style="font-size: 14pt; font-weight: 700; color: #171717; margin-top: 1mm;">${formatDistance(route.distanceMeters)}</div>
              </div>
              <div>
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">≈ ВРЕМЯ</div>
                <div style="font-size: 14pt; font-weight: 700; color: #171717; margin-top: 1mm;">${formatDuration(route.durationSeconds)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- СТРАНИЦА: ЛИСТ ПРОХОЖДЕНИЯ -->
        <div style="width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
          <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
          
          <div style="position: relative; z-index: 1;">
            <!-- Заголовок -->
            <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 5mm;">
              <span>ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ</span>
              <span>№${routeNum}</span>
            </div>
            
            <div style="text-align: center; font-size: 22pt; font-weight: 700; color: #171717; margin-bottom: 8mm;">МАРШРУТ ПРОЙДЕН</div>
            
            <!-- Символ -->
            <div style="display: flex; justify-content: center; margin-bottom: 15mm;">
              <div style="display: flex; align-items: center; gap: 2mm;">
                <div style="width: 3mm; height: 3mm; background: #171717;"></div>
                <div style="width: 40mm; height: 0.4mm; background: #171717;"></div>
                <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
              </div>
            </div>
            
            <!-- Поля для заполнения -->
            <div style="margin-bottom: 8mm;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ДАТА</div>
              <div style="border-bottom: 0.3mm solid #B8B5AD; height: 8mm;"></div>
            </div>
            
            <div style="display: flex; gap: 10mm; margin-bottom: 8mm;">
              <div style="flex: 1;">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ВРЕМЯ СТАРТА</div>
                <div style="border-bottom: 0.3mm solid #B8B5AD; height: 8mm;"></div>
              </div>
              <div style="flex: 1;">
                <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ВРЕМЯ ФИНИША</div>
                <div style="border-bottom: 0.3mm solid #B8B5AD; height: 8mm;"></div>
              </div>
            </div>
            
            <div style="margin-bottom: 10mm;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ФАКТИЧЕСКОЕ ВРЕМЯ</div>
              <div style="border-bottom: 0.3mm solid #B8B5AD; height: 8mm;"></div>
            </div>
            
            <div style="margin-bottom: 5mm;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 3mm;">ЗАМЕТКИ</div>
              ${Array(7).fill(0).map(() => `<div style="border-bottom: 0.2mm solid #B8B5AD; height: 8mm;"></div>`).join('')}
            </div>
            
            <!-- Слоган -->
            <div style="position: absolute; bottom: 15mm; left: 0; right: 0; text-align: center; font-style: italic; font-size: 9pt; color: #626262;">
              Не гулять. Пересечь город.
            </div>
          </div>
        </div>
      `;
      
      // Добавляем контейнер в DOM
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      // Генерируем PDF
      const opt = {
        margin: 0,
        filename: `proiti-spb-${routeNum}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          logging: false,
          backgroundColor: '#F1EFE8'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt).from(container).save();
      
      // Удаляем контейнер
      document.body.removeChild(container);
      
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

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} км`;
  }
  return `${Math.round(meters)} м`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}
