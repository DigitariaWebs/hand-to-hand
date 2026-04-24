export function generateInvoiceNumber(orderId: string): string {
  const year = new Date().getFullYear();
  const cleaned = orderId.replace(/[^A-Za-z0-9]/g, '');
  const seq = cleaned.slice(-5).toUpperCase().padStart(5, '0');
  return `HTH-${year}-${seq}`;
}
