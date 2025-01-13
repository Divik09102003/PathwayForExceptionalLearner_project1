declare module 'pdf-parse' {
    interface PDFParseOptions {
      password?: string;
      max?: number;
      version?: string;
      // You can add more options as needed
    }
  
    interface PDFParseResult {
      numpages: number;
      numrender: number;
      info?: Record<string, any>;
      metadata?: Record<string, any>;
      text: string;
      version: string;
    }
  
    function pdfParse(
      dataBuffer: Buffer,
      options?: PDFParseOptions
    ): Promise<PDFParseResult>;
  
    export = pdfParse;
  }
  