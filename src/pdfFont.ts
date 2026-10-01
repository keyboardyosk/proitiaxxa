import jsPDF from 'jspdf';

// Загрузка шрифта с поддержкой полной кириллицы
export async function loadCyrillicFont(pdf: jsPDF): Promise<void> {
  try {
    // Используем PT Sans - шрифт с полной поддержкой кириллицы
    const fontRegularUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/pt-sans@latest/cyrillic-400-normal.ttf';
    const fontBoldUrl = 'https://cdn.jsdelivr.net/fontsource/fonts/pt-sans@latest/cyrillic-700-normal.ttf';
    
    // Загружаем обычный шрифт
    const responseRegular = await fetch(fontRegularUrl);
    const bufferRegular = await responseRegular.arrayBuffer();
    const uint8ArrayRegular = new Uint8Array(bufferRegular);
    let binaryRegular = '';
    for (let i = 0; i < uint8ArrayRegular.length; i++) {
      binaryRegular += String.fromCharCode(uint8ArrayRegular[i]);
    }
    const base64Regular = btoa(binaryRegular);
    
    pdf.addFileToVFS('PTSans-Regular.ttf', base64Regular);
    pdf.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    
    // Загружаем жирный шрифт
    const responseBold = await fetch(fontBoldUrl);
    const bufferBold = await responseBold.arrayBuffer();
    const uint8ArrayBold = new Uint8Array(bufferBold);
    let binaryBold = '';
    for (let i = 0; i < uint8ArrayBold.length; i++) {
      binaryBold += String.fromCharCode(uint8ArrayBold[i]);
    }
    const base64Bold = btoa(binaryBold);
    
    pdf.addFileToVFS('PTSans-Bold.ttf', base64Bold);
    pdf.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
    
    // Устанавливаем шрифт по умолчанию
    pdf.setFont('PTSans', 'normal');
  } catch (error) {
    console.error('Error loading font:', error);
    // Fallback
    pdf.setFont('helvetica');
  }
}
