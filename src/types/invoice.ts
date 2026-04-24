export type InvoiceParty = {
  name: string;
  city?: string;
};

export type InvoiceProduct = {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  date: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  product: InvoiceProduct;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  orderReference: string;
};
