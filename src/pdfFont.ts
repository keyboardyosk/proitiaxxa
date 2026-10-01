import jsPDF from 'jspdf';

// Загрузка шрифта с поддержкой кириллицы
export async function loadCyrillicFont(pdf: jsPDF): Promise<void> {
  try {
    // Загружаем шрифт Roboto в формате TTF с поддержкой кириллицы
    const fontUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/cyrillic-400-normal.ttf';
    const response = await fetch(fontUrl);
    
    if (!response.ok) {
      throw new Error('Failed to load font');
    }
    
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Конвертируем в base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    // Добавляем шрифт в jsPDF
    pdf.addFileToVFS('Roboto-Regular.ttf', base64);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    
    // Загружаем жирный шрифт
    const fontBoldUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/cyrillic-700-normal.ttf';
    const responseBold = await fetch(fontBoldUrl);
    const bufferBold = await responseBold.arrayBuffer();
    const uint8ArrayBold = new Uint8Array(bufferBold);
    let binaryBold = '';
    for (let i = 0; i < uint8ArrayBold.length; i++) {
      binaryBold += String.fromCharCode(uint8ArrayBold[i]);
    }
    const base64Bold = btoa(binaryBold);
    
    pdf.addFileToVFS('Roboto-Bold.ttf', base64Bold);
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    
    // Устанавливаем шрифт по умолчанию
    pdf.setFont('Roboto', 'normal');
  } catch (error) {
    console.error('Error loading font:', error);
    // Fallback - используем стандартный шрифт (кириллица не будет работать)
    pdf.setFont('helvetica');
  }
}
