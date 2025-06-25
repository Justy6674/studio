declare module 'pdfkit' {
  interface PDFDocument {
    new(options?: any): PDFDocument;
    font(font: string): PDFDocument;
    fontSize(size: number): PDFDocument;
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    addPage(options?: any): PDFDocument;
    end(): void;
    pipe(stream: any): PDFDocument;
  }
  
  const PDFDocument: {
    new(options?: any): PDFDocument;
  };
  
  export = PDFDocument;
}
