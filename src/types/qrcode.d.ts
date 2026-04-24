declare module 'qrcode' {
  type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

  interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: QRErrorCorrectionLevel;
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  export function toString(text: string, options?: Record<string, unknown>): Promise<string>;

  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
  };
  export default QRCode;
}
