import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { InvoiceData } from '@/types/invoice';

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEur(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

function formatDateHuman(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function buildInvoiceHTML(data: InvoiceData): string {
  const subtotal = data.product.quantity * data.product.unitPrice;
  return /* html */ `
  <!doctype html>
  <html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Facture ${esc(data.invoiceNumber)}</title>
    <style>
      @page { size: A4 portrait; margin: 18mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        color: #1A1A1E;
        margin: 0;
        padding: 0;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 16px;
        border-bottom: 2px solid #14248A;
      }
      .brand {
        color: #14248A;
        font-weight: 700;
        font-size: 16px;
        letter-spacing: 0.4px;
      }
      .brand-sub {
        color: #6B7280;
        font-size: 11px;
        margin-top: 4px;
      }
      .title {
        font-size: 26px;
        font-weight: 800;
        color: #14248A;
        margin: 0;
        letter-spacing: 0.6px;
      }
      .meta {
        text-align: right;
        font-size: 12px;
        color: #374151;
        margin-top: 6px;
      }
      .parties {
        display: flex;
        gap: 16px;
        margin-top: 22px;
      }
      .party {
        flex: 1;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 12px 14px;
      }
      .party h4 {
        margin: 0 0 6px 0;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #6B7280;
      }
      .party .name { font-weight: 700; font-size: 14px; }
      .party .sub { font-size: 12px; color: #6B7280; margin-top: 2px; }

      table.items {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      table.items th {
        background: #F3F4F6;
        color: #14248A;
        text-align: left;
        padding: 10px 12px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      table.items td {
        padding: 12px;
        border-bottom: 1px solid #E5E7EB;
        font-size: 13px;
      }
      td.num { text-align: right; white-space: nowrap; }

      .totals {
        margin-top: 18px;
        margin-left: auto;
        width: 45%;
      }
      .totals .row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
      }
      .totals .row.delivery {
        color: #7C3AED;
        font-weight: 600;
      }
      .totals .row.grand {
        border-top: 2px solid #14248A;
        padding-top: 10px;
        margin-top: 6px;
        font-weight: 800;
        color: #14248A;
        font-size: 16px;
      }
      .footer {
        margin-top: 36px;
        padding-top: 14px;
        border-top: 1px solid #E5E7EB;
        font-size: 10px;
        color: #9CA3AF;
        line-height: 1.6;
      }
      .disclaimer {
        margin-top: 6px;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div class="top">
      <div>
        <div class="brand">Hand to Hand</div>
        <div class="brand-sub">Marketplace entre particuliers</div>
      </div>
      <div>
        <h1 class="title">FACTURE</h1>
        <div class="meta">
          N° <strong>${esc(data.invoiceNumber)}</strong><br/>
          ${esc(formatDateHuman(data.date))}<br/>
          Réf. commande : ${esc(data.orderReference)}
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h4>Vendeur</h4>
        <div class="name">${esc(data.seller.name)}</div>
        ${data.seller.city ? `<div class="sub">${esc(data.seller.city)}</div>` : ''}
        <div class="sub">Via Hand to Hand Marketplace</div>
      </div>
      <div class="party">
        <h4>Acheteur</h4>
        <div class="name">${esc(data.buyer.name)}</div>
        ${data.buyer.city ? `<div class="sub">${esc(data.buyer.city)}</div>` : ''}
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qté</th>
          <th class="num">Prix unitaire</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${esc(data.product.title)}</strong>
            ${data.product.description ? `<div style="color:#6B7280; font-size:11px; margin-top:2px;">${esc(data.product.description)}</div>` : ''}
          </td>
          <td class="num">${data.product.quantity}</td>
          <td class="num">${formatEur(data.product.unitPrice)}</td>
          <td class="num">${formatEur(subtotal)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Sous-total</span><span>${formatEur(subtotal)}</span></div>
      <div class="row delivery"><span>Frais de livraison Hand to Hand</span><span>${formatEur(data.deliveryFee)}</span></div>
      <div class="row"><span>Frais de service</span><span>${formatEur(data.serviceFee)}</span></div>
      <div class="row grand"><span>Total</span><span>${formatEur(data.total)}</span></div>
    </div>

    <div class="footer">
      Hand to Hand — Marketplace entre particuliers
      <div class="disclaimer">
        Ce document est un récapitulatif de transaction, il ne constitue pas une facture au sens fiscal.
      </div>
    </div>
  </body>
  </html>`;
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  const html = buildInvoiceHTML(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function shareInvoice(data: InvoiceData): Promise<void> {
  const uri = await generateInvoice(data);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Facture Hand to Hand',
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function printInvoice(data: InvoiceData): Promise<void> {
  const html = buildInvoiceHTML(data);
  await Print.printAsync({ html });
}
