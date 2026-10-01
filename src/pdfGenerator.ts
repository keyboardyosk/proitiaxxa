import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';

export async function generatePDF(route: Route, mapImage?: string): Promise<void> {
  const routeNum = String(route.routeNumber).padStart(5, '0');
  const startName = route.start.name || `${route.start.lat.toFixed(4)}, ${route.start.lon.toFixed(4)}`;
  const finishName = route.finish.name || `${route.finish.lat.toFixed(4)}, ${route.finish.lon.toFixed(4)}`;
  
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
  
  // Создаём iframe для печати
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    alert('Не удалось создать документ для печати');
    document.body.removeChild(iframe);
    return;
  }
  
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Пройти Санкт-Петербургъ · Маршрут №${routeNum}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          color: #171717;
          background: #F1EFE8;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm;
          page-break-after: always;
          position: relative;
          background: #F1EFE8;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .border {
          border: 0.3mm solid #B8B5AD;
          width: 100%;
          height: 100%;
          padding: 10mm;
        }
        
        .mono {
          font-family: 'JetBrains Mono', monospace;
        }
        
        .muted {
          color: #626262;
        }
        
        .route-color {
          color: #D92F2F;
        }
        
        h1 {
          font-size: 54pt;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 0.95;
        }
        
        h2 {
          font-size: 28pt;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        
        .logo-line {
          display: flex;
          align-items: center;
          gap: 2mm;
          margin-top: 15mm;
        }
        
        .logo-square {
          width: 4mm;
          height: 4mm;
          background: #171717;
        }
        
        .logo-line-bar {
          flex: 1;
          height: 0.5mm;
          background: #171717;
        }
        
        .logo-circle {
          width: 4mm;
          height: 4mm;
          border-radius: 50%;
          background: #D92F2F;
        }
        
        .center {
          text-align: center;
        }
        
        .divider {
          width: 60mm;
          height: 0.3mm;
          background: #B8B5AD;
          margin: 10mm auto;
        }
        
        .big-number {
          font-size: 48pt;
          font-weight: 700;
          margin-top: 3mm;
        }
        
        .big-distance {
          font-size: 42pt;
          font-weight: 700;
          color: #D92F2F;
        }
        
        .big-distance-unit {
          font-size: 20pt;
          font-weight: 700;
          color: #D92F2F;
          margin-left: 2mm;
        }
        
        .start-marker {
          width: 3mm;
          height: 3mm;
          background: #171717;
        }
        
        .finish-marker {
          width: 3mm;
          height: 3mm;
          border-radius: 50%;
          background: #D92F2F;
        }
        
        .flex {
          display: flex;
        }
        
        .flex-col {
          flex-direction: column;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .gap-2 {
          gap: 2mm;
        }
        
        .gap-3 {
          gap: 3mm;
        }
        
        .gap-5 {
          gap: 5mm;
        }
        
        .gap-10 {
          gap: 10mm;
        }
        
        .mt-1 { margin-top: 1mm; }
        .mt-2 { margin-top: 2mm; }
        .mt-3 { margin-top: 3mm; }
        .mt-4 { margin-top: 4mm; }
        .mt-5 { margin-top: 5mm; }
        .mt-10 { margin-top: 10mm; }
        .mt-12 { margin-top: 12mm; }
        .mt-15 { margin-top: 15mm; }
        .mt-25 { margin-top: 25mm; }
        
        .mb-2 { margin-bottom: 2mm; }
        .mb-3 { margin-bottom: 3mm; }
        .mb-4 { margin-bottom: 4mm; }
        .mb-5 { margin-bottom: 5mm; }
        .mb-8 { margin-bottom: 8mm; }
        .mb-15 { margin-bottom: 15mm; }
        
        .ml-5 { margin-left: 5mm; }
        
        .text-8pt { font-size: 8pt; }
        .text-9pt { font-size: 9pt; }
        .text-10pt { font-size: 10pt; }
        .text-11pt { font-size: 11pt; }
        .text-16pt { font-size: 16pt; }
        .text-18pt { font-size: 18pt; }
        .text-22pt { font-size: 22pt; }
        
        .font-bold { font-weight: 700; }
        .font-800 { font-weight: 800; }
        
        .italic { font-style: italic; }
        
        .tracking-wide { letter-spacing: 0.15em; }
        .tracking-wider { letter-spacing: 0.2em; }
        
        .uppercase { text-transform: uppercase; }
        
        .border-top {
          border-top: 0.3mm solid #171717;
          padding-top: 2mm;
        }
        
        .border-top-light {
          border-top: 0.3mm solid #B8B5AD;
          padding-top: 3mm;
        }
        
        .step-row {
          display: flex;
          align-items: baseline;
          gap: 3mm;
          margin-bottom: 2mm;
        }
        
        .step-num {
          width: 6mm;
          flex-shrink: 0;
        }
        
        .step-coords {
          font-size: 7pt;
          margin-top: 0.5mm;
        }
        
        .field-line {
          border-bottom: 0.3mm solid #B8B5AD;
          height: 8mm;
        }
        
        .note-line {
          border-bottom: 0.2mm solid #B8B5AD;
          height: 8mm;
        }
        
        .map-container {
          border: 0.3mm solid #B8B5AD;
          overflow: hidden;
          background: #E8E5DB;
          height: 180mm;
        }
        
        .map-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 1.5mm;
        }
        
        .legend-line {
          width: 8mm;
          height: 0.8mm;
          background: #D92F2F;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <!-- СТРАНИЦА 1: ОБЛОЖКА -->
      <div class="page">
        <div class="border flex flex-col">
          <div class="flex justify-between mono text-8pt muted tracking-wide">
            <span>59.9°N · 30.3°E · САНКТ-ПЕТЕРБУРГ</span>
            <span>EST. 2026</span>
          </div>
          
          <div class="logo-line">
            <div class="logo-square"></div>
            <div class="logo-line-bar"></div>
            <div class="logo-circle"></div>
          </div>
          
          <div class="center mt-25">
            <h1>ПРОЙТИ</h1>
            <h2 class="mt-5">САНКТ-ПЕТЕРБУРГЪ</h2>
          </div>
          
          <div class="divider"></div>
          
          <div class="center mt-10">
            <div class="mono text-10pt muted tracking-wider">МАРШРУТ</div>
            <div class="big-number">№${routeNum}</div>
          </div>
          
          <div class="center mt-10">
            <div class="mono text-11pt muted tracking-wide">НАПРАВЛЕНИЕ</div>
            <div class="text-16pt font-bold mt-2">${route.direction}</div>
          </div>
          
          <div class="center mt-12">
            <div class="mono text-10pt muted tracking-wide">РАССТОЯНИЕ</div>
            <div class="mt-3">
              <span class="big-distance">${(route.distanceMeters / 1000).toFixed(1)}</span>
              <span class="big-distance-unit">КМ</span>
            </div>
          </div>
          
          <div class="mt-15">
            <div class="mb-4">
              <div class="mono text-9pt muted tracking-wide">СТАРТ</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="start-marker"></div>
                <div class="text-11pt font-bold">${startName}</div>
              </div>
              <div class="mono text-8pt route-color mt-1 ml-5">
                ${route.start.lat.toFixed(5)}, ${route.start.lon.toFixed(5)}
              </div>
            </div>
            <div>
              <div class="mono text-9pt muted tracking-wide">ФИНИШ</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="finish-marker"></div>
                <div class="text-11pt font-bold">${finishName}</div>
              </div>
              <div class="mono text-8pt route-color mt-1 ml-5">
                ${route.finish.lat.toFixed(5)}, ${route.finish.lon.toFixed(5)}
              </div>
            </div>
          </div>
          
          <div class="flex justify-between mono text-9pt muted mt-auto">
            <span>≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}</span>
            <span>${route.createdAt.toLocaleDateString('ru-RU')}</span>
          </div>
          
          <div class="center italic text-10pt muted mt-5">
            Не гулять. Пересечь город.
          </div>
        </div>
      </div>
      
      ${mapImage ? `
      <!-- СТРАНИЦА 2: КАРТА -->
      <div class="page">
        <div class="border flex flex-col">
          <div class="flex justify-between items-center mb-5">
            <div>
              <div class="mono text-9pt muted tracking-wide">ПЕЧАТНАЯ КАРТА</div>
              <div class="text-16pt font-bold mt-2">Маршрут №${routeNum}</div>
            </div>
            <div class="mono text-9pt muted" style="text-align: right;">
              <div>${route.direction}</div>
              <div class="mt-1">${formatDistance(route.distanceMeters)}</div>
            </div>
          </div>
          
          <div class="map-container">
            <img src="${mapImage}" alt="Карта маршрута" />
          </div>
          
          <div class="flex justify-between items-center mt-4">
            <div class="flex gap-5 items-center">
              <div class="legend-item">
                <div class="start-marker"></div>
                <span class="mono text-8pt muted tracking-wide">A · СТАРТ</span>
              </div>
              <div class="legend-item">
                <div class="finish-marker"></div>
                <span class="mono text-8pt muted tracking-wide">B · ФИНИШ</span>
              </div>
              <div class="legend-item">
                <div class="legend-line"></div>
                <span class="mono text-8pt muted tracking-wide">МАРШРУТ</span>
              </div>
            </div>
            <div class="mono text-8pt muted">
              © OpenStreetMap
            </div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <!-- СТРАНИЦА 3: МАРШРУТНЫЙ ЛИСТ -->
      <div class="page">
        <div class="border">
          <div class="flex justify-between mono text-9pt muted tracking-wide mb-5">
            <span>МАРШРУТНЫЙ ЛИСТ</span>
            <span>№${routeNum}</span>
          </div>
          
          <div class="text-18pt font-bold mb-5">${route.direction}</div>
          
          <div class="border-top mb-3"></div>
          
          <div class="flex items-center gap-2 mb-3">
            <div class="start-marker"></div>
            <div class="mono text-9pt font-bold tracking-wide">A · СТАРТ</div>
            <div style="flex: 1;"></div>
            <div class="text-10pt">${startName}</div>
          </div>
          
          <div class="border-top mb-3"></div>
          
          <div class="mono text-8pt muted tracking-wide mb-2">ПУТЬ</div>
          
          <div class="mb-5">
            ${allSteps.map((step, i) => `
              <div class="step-row">
                <div class="step-num mono text-8pt muted">${String(i + 1).padStart(2, '0')}</div>
                <div style="flex: 1;">
                  <div class="text-9pt">${step.name || 'Продолжайте движение'}</div>
                  <div class="flex gap-3 step-coords">
                    <span class="mono route-color">${step.lat.toFixed(5)}, ${step.lon.toFixed(5)}</span>
                    <span class="mono muted">${step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} км` : `${Math.round(step.distance)} м`}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="border-top mb-3"></div>
          
          <div class="flex items-center gap-2 mb-5">
            <div class="finish-marker"></div>
            <div class="mono text-9pt font-bold route-color tracking-wide">B · ФИНИШ</div>
            <div style="flex: 1;"></div>
            <div class="text-10pt">${finishName}</div>
          </div>
          
          <div class="border-top-light"></div>
          
          <div class="flex gap-10 mt-3">
            <div>
              <div class="mono text-9pt muted tracking-wide">ИТОГО</div>
              <div class="text-14pt font-bold mt-1">${formatDistance(route.distanceMeters)}</div>
            </div>
            <div>
              <div class="mono text-9pt muted tracking-wide">≈ ВРЕМЯ</div>
              <div class="text-14pt font-bold mt-1">${formatDuration(route.durationSeconds)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- СТРАНИЦА 4: ЛИСТ ПРОХОЖДЕНИЯ -->
      <div class="page">
        <div class="border">
          <div class="flex justify-between mono text-9pt muted tracking-wide mb-5">
            <span>ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ</span>
            <span>№${routeNum}</span>
          </div>
          
          <div class="center text-22pt font-bold mb-8">МАРШРУТ ПРОЙДЕН</div>
          
          <div class="center mb-15">
            <div class="flex items-center gap-2" style="justify-content: center;">
              <div class="logo-square"></div>
              <div style="width: 40mm; height: 0.4mm; background: #171717;"></div>
              <div class="logo-circle"></div>
            </div>
          </div>
          
          <div class="mb-8">
            <div class="mono text-9pt muted tracking-wide mb-2">ДАТА</div>
            <div class="field-line"></div>
          </div>
          
          <div class="flex gap-10 mb-8">
            <div style="flex: 1;">
              <div class="mono text-9pt muted tracking-wide mb-2">ВРЕМЯ СТАРТА</div>
              <div class="field-line"></div>
            </div>
            <div style="flex: 1;">
              <div class="mono text-9pt muted tracking-wide mb-2">ВРЕМЯ ФИНИША</div>
              <div class="field-line"></div>
            </div>
          </div>
          
          <div class="mb-10">
            <div class="mono text-9pt muted tracking-wide mb-2">ФАКТИЧЕСКОЕ ВРЕМЯ</div>
            <div class="field-line"></div>
          </div>
          
          <div class="mb-5">
            <div class="mono text-9pt muted tracking-wide mb-3">ЗАМЕТКИ</div>
            ${Array(7).fill(0).map(() => `<div class="note-line"></div>`).join('')}
          </div>
          
          <div class="center italic text-9pt muted mt-10">
            Не гулять. Пересечь город.
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  doc.close();
  
  // Ждём загрузки шрифтов и изображений
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Печатаем
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  
  // Удаляем iframe через некоторое время
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 60000);
}
