import html2pdf from 'html2pdf.js';
import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';

export function generatePDF(route: Route, mapImage?: string): void {
  const routeNum = String(route.routeNumber).padStart(5, '0');
  const startName = route.start.name 
    ? route.start.name.split(',').slice(0, 2).join(',')
    : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`;
  const finishName = route.finish.name 
    ? route.finish.name.split(',').slice(0, 2).join(',')
    : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`;
  
  // Получаем все шаги маршрута (без группировки) с координатами
  const allSteps = route.steps.filter(s => s.distance > 10).slice(0, 60).map((step, i) => {
    const progress = i / allSteps.length;
    const coordIndex = Math.floor(progress * route.geometry.length);
    const coords = route.geometry[coordIndex] || route.geometry[0];
    return {
      ...step,
      lat: coords[0],
      lon: coords[1],
    };
  });
  
  // Создаём контейнер для PDF
  const container = document.createElement('div');
  container.style.width = '210mm';
  container.style.minHeight = '297mm';
  container.style.fontFamily = 'Inter, sans-serif';
  container.style.color = '#171717';
  container.style.backgroundColor = '#F1EFE8';
  container.style.padding = '18mm';
  container.style.boxSizing = 'border-box';
  
  container.innerHTML = `
    <!-- СТРАНИЦА 1: ОБЛОЖКА -->
    <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
      <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
      
      <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.1em;">
          <span>59.9°N · 30.3°E · САНКТ-ПЕТЕРБУРГ</span>
          <span>EST. 2026</span>
        </div>
        
        <div style="margin-top: 15mm; display: flex; align-items: center; gap: 2mm;">
          <div style="width: 4mm; height: 4mm; background: #171717;"></div>
          <div style="flex: 1; height: 0.5mm; background: #171717;"></div>
          <div style="width: 4mm; height: 4mm; border-radius: 50%; background: #D92F2F;"></div>
        </div>
        
        <div style="margin-top: 25mm; text-align: center;">
          <div style="font-size: 54pt; font-weight: 800; letter-spacing: -0.02em; line-height: 0.95; color: #171717;">ПРОЙТИ</div>
          <div style="font-size: 28pt; font-weight: 800; letter-spacing: -0.02em; line-height: 0.95; color: #171717; margin-top: 5mm;">САНКТ-ПЕТЕРБУРГЪ</div>
        </div>
        
        <div style="margin-top: 10mm; display: flex; justify-content: center;">
          <div style="width: 60mm; height: 0.3mm; background: #B8B5AD;"></div>
        </div>
        
        <div style="margin-top: 10mm; text-align: center;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10pt; color: #626262; letter-spacing: 0.2em;">МАРШРУТ</div>
          <div style="font-size: 48pt; font-weight: 700; color: #171717; margin-top: 3mm;">№${routeNum}</div>
        </div>
        
        <div style="margin-top: 10mm; text-align: center;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11pt; color: #626262; letter-spacing: 0.15em;">НАПРАВЛЕНИЕ</div>
          <div style="font-size: 16pt; font-weight: 700; color: #171717; margin-top: 2mm;">${route.direction}</div>
        </div>
        
        <div style="margin-top: 12mm; text-align: center;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10pt; color: #626262; letter-spacing: 0.15em;">РАССТОЯНИЕ</div>
          <div style="margin-top: 3mm;">
            <span style="font-size: 42pt; font-weight: 700; color: #D92F2F;">${(route.distanceMeters / 1000).toFixed(1)}</span>
            <span style="font-size: 20pt; font-weight: 700; color: #D92F2F; margin-left: 2mm;">КМ</span>
          </div>
        </div>
        
        <div style="margin-top: 15mm;">
          <div style="margin-bottom: 4mm;">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">СТАРТ</div>
            <div style="display: flex; align-items: center; gap: 2mm; margin-top: 1mm;">
              <div style="width: 3mm; height: 3mm; background: #171717;"></div>
              <div style="font-size: 11pt; font-weight: 700; color: #171717;">${startName}</div>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; margin-top: 1mm; margin-left: 5mm;">
              ${route.start.lat.toFixed(5)}, ${route.start.lon.toFixed(5)}
            </div>
          </div>
          <div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">ФИНИШ</div>
            <div style="display: flex; align-items: center; gap: 2mm; margin-top: 1mm;">
              <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
              <div style="font-size: 11pt; font-weight: 700; color: #171717;">${finishName}</div>
            </div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; margin-top: 1mm; margin-left: 5mm;">
              ${route.finish.lat.toFixed(5)}, ${route.finish.lon.toFixed(5)}
            </div>
          </div>
        </div>
        
        <div style="margin-top: auto; display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262;">
          <span>≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}</span>
          <span>${route.createdAt.toLocaleDateString('ru-RU')}</span>
        </div>
        
        <div style="margin-top: 5mm; text-align: center; font-style: italic; font-size: 10pt; color: #626262;">
          Не гулять. Пересечь город.
        </div>
      </div>
    </div>
    
    ${mapImage ? `
    <!-- СТРАНИЦА 2: КАРТА -->
    <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
      <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
      
      <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5mm;">
          <div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em;">ПЕЧАТНАЯ КАРТА</div>
            <div style="font-size: 16pt; font-weight: 700; color: #171717; margin-top: 2mm;">Маршрут №${routeNum}</div>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; text-align: right;">
            <div>${route.direction}</div>
            <div style="margin-top: 1mm;">${formatDistance(route.distanceMeters)}</div>
          </div>
        </div>
        
        <div style="flex: 1; position: relative; border: 0.3mm solid #B8B5AD; overflow: hidden; background: #E8E5DB;">
          <img src="${mapImage}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        
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
    ` : ''}
    
    <!-- СТРАНИЦА: МАРШРУТНЫЙ ЛИСТ -->
    <div style="page-break-after: always; width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; background: #F1EFE8;">
      <div style="position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 0.3mm solid #B8B5AD;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 5mm;">
          <span>МАРШРУТНЫЙ ЛИСТ</span>
          <span>№${routeNum}</span>
        </div>
        
        <div style="font-size: 18pt; font-weight: 700; color: #171717; margin-bottom: 5mm;">${route.direction}</div>
        
        <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
        
        <div style="display: flex; align-items: center; gap: 2mm; margin-bottom: 3mm;">
          <div style="width: 2.5mm; height: 2.5mm; background: #171717;"></div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; font-weight: 700; color: #171717; letter-spacing: 0.1em;">A · СТАРТ</div>
          <div style="flex: 1;"></div>
          <div style="font-size: 10pt; color: #171717;">${startName}</div>
        </div>
        
        <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
        
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 2mm;">ПУТЬ</div>
        
        <div style="margin-bottom: 5mm;">
          ${allSteps.map((step, i) => `
            <div style="display: flex; align-items: baseline; gap: 3mm; margin-bottom: 2mm;">
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #626262; width: 6mm; flex-shrink: 0;">${String(i + 1).padStart(2, '0')}</div>
              <div style="flex: 1;">
                <div style="font-size: 9pt; color: #171717;">${step.name || 'Продолжайте движение'}</div>
                <div style="display: flex; gap: 3mm; margin-top: 0.5mm;">
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #D92F2F;">${step.lat.toFixed(5)}, ${step.lon.toFixed(5)}</span>
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #626262;">${step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} км` : `${Math.round(step.distance)} м`}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 0.3mm solid #171717; padding-top: 2mm; margin-bottom: 3mm;"></div>
        
        <div style="display: flex; align-items: center; gap: 2mm; margin-bottom: 5mm;">
          <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 9pt; font-weight: 700; color: #D92F2F; letter-spacing: 0.1em;">B · ФИНИШ</div>
          <div style="flex: 1;"></div>
          <div style="font-size: 10pt; color: #171717;">${finishName}</div>
        </div>
        
        <div style="border-top: 0.3mm solid #B8B5AD; padding-top: 3mm;"></div>
        
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
        <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 9pt; color: #626262; letter-spacing: 0.15em; margin-bottom: 5mm;">
          <span>ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ</span>
          <span>№${routeNum}</span>
        </div>
        
        <div style="text-align: center; font-size: 22pt; font-weight: 700; color: #171717; margin-bottom: 8mm;">МАРШРУТ ПРОЙДЕН</div>
        
        <div style="display: flex; justify-content: center; margin-bottom: 15mm;">
          <div style="display: flex; align-items: center; gap: 2mm;">
            <div style="width: 3mm; height: 3mm; background: #171717;"></div>
            <div style="width: 40mm; height: 0.4mm; background: #171717;"></div>
            <div style="width: 3mm; height: 3mm; border-radius: 50%; background: #D92F2F;"></div>
          </div>
        </div>
        
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
  
  // Ждём загрузки изображений
  const images = container.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    return new Promise<void>((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  });
  
  Promise.all(imagePromises).then(() => {
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
      pagebreak: { mode: ['css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
    }).catch(err => {
      console.error('Error generating PDF:', err);
      document.body.removeChild(container);
      alert('Ошибка при генерации PDF. Попробуйте ещё раз.');
    });
  });
}
