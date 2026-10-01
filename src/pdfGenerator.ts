import jsPDF from 'jspdf';
import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';

export function generatePDF(route: Route): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const H = 297;
  const M = 18; // margin
  const CW = W - M * 2;
  
  const INK = [23, 23, 23] as const;
  const MUTED = [98, 98, 98] as const;
  const LINE = [184, 181, 173] as const;
  const ROUTE = [217, 47, 47] as const;
  const PAPER = [241, 239, 232] as const;
  
  // ============ СТРАНИЦА 1: ОБЛОЖКА ============
  // Фон бумаги
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, 'F');
  
  // Тонкая рамка
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, W - 20, H - 20);
  
  // Верхний технический блок
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('59.9°N · 30.3°E · САНКТ-ПЕТЕРБУРГ', M, 20);
  doc.text('EST. 2026', W - M, 20, { align: 'right' });
  
  // Логотип-символ: квадрат — линия — круг
  const logoY = 35;
  doc.setFillColor(...INK);
  doc.rect(M, logoY, 4, 4, 'F');
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(M + 4, logoY + 2, W - M - 6, logoY + 2);
  doc.setFillColor(...ROUTE);
  doc.circle(W - M - 4, logoY + 2, 2, 'F');
  
  // Главный заголовок
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(54);
  doc.setTextColor(...INK);
  doc.text('ПРОЙТИ', W / 2, 85, { align: 'center' });
  
  doc.setFontSize(28);
  doc.text('САНКТ-ПЕТЕРБУРГЪ', W / 2, 100, { align: 'center' });
  
  // Разделитель
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 30, 112, W / 2 + 30, 112);
  
  // Номер маршрута
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('МАРШРУТ', W / 2, 125, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(...INK);
  doc.text(`№${String(route.routeNumber).padStart(5, '0')}`, W / 2, 148, { align: 'center' });
  
  // Направление
  doc.setFont('courier', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text('НАПРАВЛЕНИЕ', W / 2, 162, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(route.direction, W / 2, 172, { align: 'center' });
  
  // Расстояние — крупно
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('РАССТОЯНИЕ', W / 2, 190, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(...ROUTE);
  doc.text((route.distanceMeters / 1000).toFixed(1), W / 2 - 10, 210, { align: 'right' });
  doc.setFontSize(20);
  doc.text('КМ', W / 2 - 6, 210, { align: 'left' });
  
  // Старт / Финиш
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  
  doc.text('СТАРТ', M, 232);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.rect(M, 235, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const startLabel = route.start.name 
    ? route.start.name.split(',').slice(0, 2).join(',')
    : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`;
  doc.text(startLabel, M + 6, 238);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ФИНИШ', M, 248);
  doc.setFillColor(...ROUTE);
  doc.circle(M + 1.5, 252, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const finishLabel = route.finish.name 
    ? route.finish.name.split(',').slice(0, 2).join(',')
    : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`;
  doc.text(finishLabel, M + 6, 253);
  
  // Время
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}`, M, 265);
  
  // Дата
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`СОЗДАНО: ${route.createdAt.toLocaleDateString('ru-RU')} · ${route.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`, W - M, 265, { align: 'right' });
  
  // Слоган внизу
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('Не гулять. Пересечь город.', W / 2, 278, { align: 'center' });
  
  // ============ СТРАНИЦА 2: КАРТА ============
  doc.addPage();
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, W - 20, H - 20);
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ПЕЧАТНАЯ КАРТА', M, 20);
  doc.text(`№${String(route.routeNumber).padStart(5, '0')}`, W - M, 20, { align: 'right' });
  
  // Область карты
  const mapY = 28;
  const mapH = 200;
  const mapX = M;
  const mapW = CW;
  
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(mapX, mapY, mapW, mapH);
  
  // Рисуем схему маршрута
  if (route.geometry.length > 0) {
    const lats = route.geometry.map(g => g[0]);
    const lons = route.geometry.map(g => g[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latRange = maxLat - minLat || 0.01;
    const lonRange = maxLon - minLon || 0.01;
    
    // Тонкая подложка-тень
    doc.setDrawColor(23, 23, 23);
    doc.setLineWidth(1.5);
    const shadowPoints: [number, number][] = route.geometry.map(([lat, lon]) => {
      const x = mapX + ((lon - minLon) / lonRange) * mapW;
      const y = mapY + mapH - ((lat - minLat) / latRange) * mapH;
      return [x, y];
    });
    const step = Math.max(1, Math.floor(shadowPoints.length / 250));
    for (let i = 0; i < shadowPoints.length - step; i += step) {
      doc.setDrawColor(23, 23, 23);
      doc.setLineWidth(1.5);
      doc.line(shadowPoints[i][0], shadowPoints[i][1], shadowPoints[i + step][0], shadowPoints[i + step][1]);
    }
    
    // Красная маршрутная линия
    for (let i = 0; i < shadowPoints.length - step; i += step) {
      doc.setDrawColor(...ROUTE);
      doc.setLineWidth(0.9);
      doc.line(shadowPoints[i][0], shadowPoints[i][1], shadowPoints[i + step][0], shadowPoints[i + step][1]);
    }
    
    // Старт — квадрат
    const startPt = shadowPoints[0];
    doc.setFillColor(...INK);
    doc.rect(startPt[0] - 2.5, startPt[1] - 2.5, 5, 5, 'F');
    
    // Финиш — круг
    const finishPt = shadowPoints[shadowPoints.length - 1];
    doc.setFillColor(...ROUTE);
    doc.circle(finishPt[0], finishPt[1], 3, 'F');
    
    // Подписи
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text('A · СТАРТ', startPt[0] + 5, startPt[1] + 1);
    doc.setTextColor(...ROUTE);
    doc.text('B · ФИНИШ', finishPt[0] + 5, finishPt[1] + 1);
  }
  
  // Масштабная линейка
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  const scaleY = mapY + mapH + 10;
  doc.line(M, scaleY, M + 30, scaleY);
  doc.line(M, scaleY - 1.5, M, scaleY + 1.5);
  doc.line(M + 30, scaleY - 1.5, M + 30, scaleY + 1.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('~ 5 км', M + 15, scaleY + 4, { align: 'center' });
  
  // Стрелка севера
  const northX = W - M - 10;
  const northY = mapY + mapH + 10;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.line(northX, northY + 8, northX, northY - 4);
  doc.line(northX, northY - 4, northX - 1.5, northY - 1);
  doc.line(northX, northY - 4, northX + 1.5, northY - 1);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text('N', northX, northY - 6, { align: 'center' });
  
  // Информация под картой
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const infoY = mapY + mapH + 25;
  doc.text(`МАРШРУТ №${String(route.routeNumber).padStart(5, '0')} · ${route.direction} · ${formatDistance(route.distanceMeters)} · ПЕШКОМ`, W / 2, infoY, { align: 'center' });
  
  // Координаты
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`A: ${route.start.lat.toFixed(4)}°N, ${route.start.lon.toFixed(4)}°E`, M, infoY + 10);
  doc.text(`B: ${route.finish.lat.toFixed(4)}°N, ${route.finish.lon.toFixed(4)}°E`, W - M, infoY + 10, { align: 'right' });
  
  // ============ СТРАНИЦЫ 3+: МАРШРУТНЫЙ ЛИСТ ============
  doc.addPage();
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, W - 20, H - 20);
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('МАРШРУТНЫЙ ЛИСТ', M, 20);
  doc.text(`№${String(route.routeNumber).padStart(5, '0')}`, W - M, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(route.direction, M, 32);
  
  // Группируем шаги
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
  
  // Старт
  let y = 45;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 5;
  
  doc.setFillColor(...INK);
  doc.rect(M, y, 2.5, 2.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text('A · СТАРТ', M + 5, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const startName = route.start.name 
    ? route.start.name.split(',').slice(0, 2).join(',')
    : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`;
  doc.text(startName, W - M, y + 2, { align: 'right' });
  y += 8;
  
  // Путь
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('ПУТЬ', M, y);
  y += 5;
  
  for (let i = 0; i < streetSegments.length; i++) {
    if (y > H - M - 30) {
      doc.addPage();
      doc.setFillColor(...PAPER);
      doc.rect(0, 0, W, H, 'F');
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.rect(10, 10, W - 20, H - 20);
      y = 20;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`МАРШРУТ №${String(route.routeNumber).padStart(5, '0')} · ПРОДОЛЖЕНИЕ`, M, y);
      y += 8;
    }
    
    const seg = streetSegments[i];
    const num = String(i + 1).padStart(2, '0');
    const dist = seg.distance >= 1000 ? `${(seg.distance / 1000).toFixed(1)} км` : `${Math.round(seg.distance)} м`;
    
    // Номер
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(num, M, y);
    
    // Название улицы
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const streetText = seg.name.length > 55 ? seg.name.substring(0, 55) + '…' : seg.name;
    doc.text(streetText, M + 8, y);
    
    // Расстояние
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(dist, W - M, y, { align: 'right' });
    
    y += 4.5;
  }
  
  // Финиш
  if (y > H - M - 25) {
    doc.addPage();
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, W - 20, H - 20);
    y = 20;
  }
  
  y += 3;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 5;
  
  doc.setFillColor(...ROUTE);
  doc.circle(M + 1.25, y + 1.25, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ROUTE);
  doc.text('B · ФИНИШ', M + 5, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const finishName = route.finish.name 
    ? route.finish.name.split(',').slice(0, 2).join(',')
    : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`;
  doc.text(finishName, W - M, y + 2, { align: 'right' });
  
  // Итог
  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(M, y, W - M, y);
  y += 6;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ИТОГО', M, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(formatDistance(route.distanceMeters), M + 20, y);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('≈ ВРЕМЯ', W / 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  doc.text(formatDuration(route.durationSeconds), W / 2 + 22, y);
  
  // ============ ПОСЛЕДНЯЯ СТРАНИЦА: ЛИСТ ПРОХОЖДЕНИЯ ============
  doc.addPage();
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, W - 20, H - 20);
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ', M, 20);
  doc.text(`№${String(route.routeNumber).padStart(5, '0')}`, W - M, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text('МАРШРУТ ПРОЙДЕН', W / 2, 38, { align: 'center' });
  
  // Символ
  const logoY2 = 48;
  doc.setFillColor(...INK);
  doc.rect(W / 2 - 20, logoY2, 3, 3, 'F');
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 17, logoY2 + 1.5, W / 2 + 17, logoY2 + 1.5);
  doc.setFillColor(...ROUTE);
  doc.circle(W / 2 + 18.5, logoY2 + 1.5, 1.5, 'F');
  
  // Поля для заполнения
  let passY = 70;
  
  const fields = [
    { label: 'ДАТА', width: CW },
    { label: 'ВРЕМЯ СТАРТА', width: CW / 2 - 2 },
    { label: 'ВРЕМЯ ФИНИША', width: CW / 2 - 2 },
    { label: 'ФАКТИЧЕСКОЕ ВРЕМЯ', width: CW },
  ];
  
  for (const field of fields) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(field.label, M, passY);
    passY += 3;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    if (field.width === CW) {
      doc.line(M, passY + 5, W - M, passY + 5);
    } else {
      doc.line(M, passY + 5, M + field.width, passY + 5);
    }
    passY += 14;
  }
  
  // Заметки
  passY += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ЗАМЕТКИ', M, passY);
  passY += 5;
  
  for (let i = 0; i < 7; i++) {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(M, passY, W - M, passY);
    passY += 8;
  }
  
  // Слоган внизу
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Не гулять. Пересечь город.', W / 2, H - 18, { align: 'center' });
  
  doc.save(`proiti-spb-${String(route.routeNumber).padStart(5, '0')}.pdf`);
}
