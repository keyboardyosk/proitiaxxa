import jsPDF from 'jspdf';
import { Route } from './types';
import { formatDistance, formatDuration } from './routeGenerator';

export async function generatePDF(route: Route, mapImage?: string): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  
  const routeNum = String(route.routeNumber).padStart(5, '0');
  const startName = route.start.name 
    ? route.start.name.split(',').slice(0, 2).join(',')
    : `${route.start.lat.toFixed(4)}°, ${route.start.lon.toFixed(4)}°`;
  const finishName = route.finish.name 
    ? route.finish.name.split(',').slice(0, 2).join(',')
    : `${route.finish.lat.toFixed(4)}°, ${route.finish.lon.toFixed(4)}°`;
  
  // Цвета
  const INK = [23, 23, 23] as const;
  const MUTED = [98, 98, 98] as const;
  const ROUTE = [217, 47, 47] as const;
  const PAPER = [241, 239, 232] as const;
  
  // ========== СТРАНИЦА 1: ОБЛОЖКА ==========
  doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Логотип-символ
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(margin, 40, 4, 4, 'F');
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + 4, 42, pageWidth - margin - 4, 42);
  doc.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.circle(pageWidth - margin - 2, 42, 2, 'F');
  
  // Заголовок
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(54);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('ПРОЙТИ', pageWidth / 2, 80, { align: 'center' });
  
  doc.setFontSize(28);
  doc.text('САНКТ-ПЕТЕРБУРГЪ', pageWidth / 2, 95, { align: 'center' });
  
  // Разделитель
  doc.setDrawColor(184, 181, 173);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 30, 105, pageWidth / 2 + 30, 105);
  
  // Номер маршрута
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('МАРШРУТ', pageWidth / 2, 120, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(`№${routeNum}`, pageWidth / 2, 140, { align: 'center' });
  
  // Направление
  doc.setFont('courier', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('НАПРАВЛЕНИЕ', pageWidth / 2, 155, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(route.direction, pageWidth / 2, 165, { align: 'center' });
  
  // Расстояние
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('РАССТОЯНИЕ', pageWidth / 2, 180, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.text(`${(route.distanceMeters / 1000).toFixed(1)}`, pageWidth / 2 - 10, 200, { align: 'right' });
  doc.setFontSize(20);
  doc.text('КМ', pageWidth / 2 - 5, 200, { align: 'left' });
  
  // Старт / Финиш
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  
  doc.text('СТАРТ', margin, 220);
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(margin, 223, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(startName, margin + 6, 226);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ФИНИШ', margin, 235);
  doc.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.circle(margin + 1.5, 239, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(finishName, margin + 6, 240);
  
  // Время и дата
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`≈ ВРЕМЯ В ПУТИ · ${formatDuration(route.durationSeconds)}`, margin, 260);
  doc.text(route.createdAt.toLocaleDateString('ru-RU'), pageWidth - margin, 260, { align: 'right' });
  
  // Слоган
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('Не гулять. Пересечь город.', pageWidth / 2, 275, { align: 'center' });
  
  // ========== СТРАНИЦА 2: КАРТА ==========
  doc.addPage();
  doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ПЕЧАТНАЯ КАРТА', margin, 20);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(`Маршрут №${routeNum}`, margin, 28);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(route.direction, pageWidth - margin, 20, { align: 'right' });
  doc.text(formatDistance(route.distanceMeters), pageWidth - margin, 28, { align: 'right' });
  
  // Карта
  const mapY = 35;
  const mapHeight = 180;
  
  doc.setDrawColor(184, 181, 173);
  doc.setLineWidth(0.3);
  doc.rect(margin, mapY, pageWidth - margin * 2, mapHeight);
  
  if (mapImage) {
    try {
      doc.addImage(mapImage, 'JPEG', margin, mapY, pageWidth - margin * 2, mapHeight);
    } catch (e) {
      console.error('Error adding map image:', e);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text('Карта недоступна', pageWidth / 2, mapY + mapHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Карта недоступна', pageWidth / 2, mapY + mapHeight / 2, { align: 'center' });
  }
  
  // Легенда
  const legendY = mapY + mapHeight + 8;
  
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(margin, legendY, 3, 3, 'F');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('A · СТАРТ', margin + 5, legendY + 2);
  
  doc.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.circle(margin + 30, legendY + 1.5, 1.5, 'F');
  doc.text('B · ФИНИШ', margin + 34, legendY + 2);
  
  doc.setDrawColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.setLineWidth(0.8);
  doc.line(margin + 60, legendY + 1.5, margin + 68, legendY + 1.5);
  doc.text('МАРШРУТ', margin + 70, legendY + 2);
  
  doc.text('© OpenStreetMap', pageWidth - margin, legendY + 2, { align: 'right' });
  
  // Координаты
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`A: ${route.start.lat.toFixed(4)}°N, ${route.start.lon.toFixed(4)}°E`, margin, legendY + 10);
  doc.text(`B: ${route.finish.lat.toFixed(4)}°N, ${route.finish.lon.toFixed(4)}°E`, pageWidth - margin, legendY + 10, { align: 'right' });
  
  // ========== СТРАНИЦА 3: МАРШРУТНЫЙ ЛИСТ ==========
  doc.addPage();
  doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('МАРШРУТНЫЙ ЛИСТ', margin, 20);
  doc.text(`№${routeNum}`, pageWidth - margin, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(route.direction, margin, 30);
  
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, 33, pageWidth - margin, 33);
  
  // Старт
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(margin, 37, 2.5, 2.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('A · СТАРТ', margin + 5, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(startName, pageWidth - margin, 39, { align: 'right' });
  
  doc.line(margin, 43, pageWidth - margin, 43);
  
  // Путь
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ПУТЬ', margin, 48);
  
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
  
  let y = 53;
  for (let i = 0; i < streetSegments.length && i < 40; i++) {
    const seg = streetSegments[i];
    const num = String(i + 1).padStart(2, '0');
    const dist = seg.distance >= 1000 ? `${(seg.distance / 1000).toFixed(1)} км` : `${Math.round(seg.distance)} м`;
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(num, margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const streetText = seg.name.length > 55 ? seg.name.substring(0, 55) + '…' : seg.name;
    doc.text(streetText, margin + 8, y);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(dist, pageWidth - margin, y, { align: 'right' });
    
    y += 4.5;
    
    if (y > 250) {
      doc.addPage();
      doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      y = 20;
    }
  }
  
  if (streetSegments.length > 40) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`+ ещё ${streetSegments.length - 40} участков`, margin, y);
    y += 5;
  }
  
  // Финиш
  if (y > 250) {
    doc.addPage();
    doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    y = 20;
  }
  
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  
  doc.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.circle(margin + 1.5, y + 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.text('B · ФИНИШ', margin + 5, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(finishName, pageWidth - margin, y + 2, { align: 'right' });
  
  // Итог
  y += 8;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ИТОГО', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(formatDistance(route.distanceMeters), margin + 20, y);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('≈ ВРЕМЯ', pageWidth / 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text(formatDuration(route.durationSeconds), pageWidth / 2 + 22, y);
  
  // ========== СТРАНИЦА 4: ЛИСТ ПРОХОЖДЕНИЯ ==========
  doc.addPage();
  doc.setFillColor(PAPER[0], PAPER[1], PAPER[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Заголовок
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ФИЗИЧЕСКИЙ МАРШРУТНЫЙ ЛИСТ', margin, 20);
  doc.text(`№${routeNum}`, pageWidth - margin, 20, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('МАРШРУТ ПРОЙДЕН', pageWidth / 2, 35, { align: 'center' });
  
  // Символ
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(pageWidth / 2 - 20, 45, 3, 3, 'F');
  doc.setDrawColor(INK[0], INK[1], INK[2]);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - 17, 46.5, pageWidth / 2 + 17, 46.5);
  doc.setFillColor(ROUTE[0], ROUTE[1], ROUTE[2]);
  doc.circle(pageWidth / 2 + 18.5, 46.5, 1.5, 'F');
  
  // Поля для заполнения
  let passY = 65;
  
  const fields = [
    { label: 'ДАТА', width: pageWidth - margin * 2 },
    { label: 'ВРЕМЯ СТАРТА', width: (pageWidth - margin * 2) / 2 - 2 },
    { label: 'ВРЕМЯ ФИНИША', width: (pageWidth - margin * 2) / 2 - 2 },
    { label: 'ФАКТИЧЕСКОЕ ВРЕМЯ', width: pageWidth - margin * 2 },
  ];
  
  for (const field of fields) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(field.label, margin, passY);
    passY += 3;
    doc.setDrawColor(184, 181, 173);
    doc.setLineWidth(0.3);
    doc.line(margin, passY + 5, margin + field.width, passY + 5);
    passY += 14;
  }
  
  // Заметки
  passY += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('ЗАМЕТКИ', margin, passY);
  passY += 5;
  
  for (let i = 0; i < 7; i++) {
    doc.setDrawColor(184, 181, 173);
    doc.setLineWidth(0.2);
    doc.line(margin, passY, pageWidth - margin, passY);
    passY += 8;
  }
  
  // Слоган
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text('Не гулять. Пересечь город.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Сохраняем PDF
  doc.save(`proiti-spb-${routeNum}.pdf`);
}
