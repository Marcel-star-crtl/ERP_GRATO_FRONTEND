// services/tenderAPI.js
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const tenderAPI = {
  getTenders: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const r  = await fetch(`${BASE}/tenders?${qs}`, { headers: headers() });
    return r.json();
  },

  getTenderById: async (id) => {
    const r = await fetch(`${BASE}/tenders/${id}`, { headers: headers() });
    return r.json();
  },

  getAvailableRFQsForTender: async () => {
    const r = await fetch(`${BASE}/tenders/rfqs-available`, { headers: headers() });
    return r.json();
  },

  getTendersPendingMyApproval: async () => {
    const r = await fetch(`${BASE}/tenders/pending-my-approval`, { headers: headers() });
    return r.json();
  },

  createFromRFQ: async (rfqId, data) => {
    const r = await fetch(`${BASE}/tenders/from-rfq/${rfqId}`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data)
    });
    return r.json();
  },

  createManually: async (data) => {
    const r = await fetch(`${BASE}/tenders/manual`, {
      method: 'POST', headers: headers(), body: JSON.stringify(data)
    });
    return r.json();
  },

  updateTender: async (id, data) => {
    const r = await fetch(`${BASE}/tenders/${id}`, {
      method: 'PUT', headers: headers(), body: JSON.stringify(data)
    });
    return r.json();
  },

  updateStatus: async (id, status, department) => {
    const r = await fetch(`${BASE}/tenders/${id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status, department })
    });
    return r.json();
  },

  // Individual approver action (approve / reject)
  processApproval: async (id, decision, comments = '') => {
    const r = await fetch(`${BASE}/tenders/${id}/approve`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ decision, comments })
    });
    return r.json();
  },

  deleteTender: async (id) => {
    const r = await fetch(`${BASE}/tenders/${id}`, { method: 'DELETE', headers: headers() });
    return r.json();
  },

  // ── PDF ─────────────────────────────────────────────────────────────────────
  /**
   * Download the Tender Approval Form PDF (server-generated, includes signatures).
   * Opens a save-as dialog in the browser.
   */
  downloadPDF: async (tender) => {
    const r = await fetch(`${BASE}/tenders/${tender._id}/pdf`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to download PDF');
    }

    const blob = await r.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Tender_${tender.tenderNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Print the Tender Approval Form in browser using client-side HTML generation.
   * Good for draft tenders before backend PDF is available.
   */
  printClientSide: (tender) => {
    const html = generateTenderHTML(tender);
    const win  = window.open('', '_blank');
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
    return true;
  }
};

export default tenderAPI;

// ─────────────────────────────────────────────────────────────────────────────
// Client-side HTML generator
// Matches the physical Tender Approval Form image.
// Used for quick print/preview from the frontend without a server round-trip.
// For the production PDF (with real signatures), use tenderAPI.downloadPDF().
// ─────────────────────────────────────────────────────────────────────────────
export const generateTenderHTML = (tender) => {
  const fmt     = (n) => (Number(n) || 0).toLocaleString();
  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const day = String(dt.getDate()).padStart(2, '0');
    const mon = dt.toLocaleString('en-GB', { month: 'short' });
    return `${day}-${mon}-${String(dt.getFullYear()).slice(2)}`;
  };

  const suppliers = tender.supplierQuotes || [];

  // Unique item descriptions
  const allDesc = [];
  suppliers.forEach(sq =>
    (sq.items || []).forEach(item => {
      if (item.description && !allDesc.includes(item.description)) allDesc.push(item.description);
    })
  );

  const getQty = (desc) => {
    for (const sq of suppliers) {
      const f = (sq.items || []).find(i => i.description === desc);
      if (f) return f.quantity;
    }
    return '';
  };

  // ── Supplier header columns ──────────────────────────────────────────────
  const supplierHeaderCols = suppliers.map(sq =>
    `<th colspan="3" style="background:${sq.supplierName === tender.awardedSupplierName ? '#fff0b3' : '#eaeaea'};
      border:1px solid #999;padding:5px 8px;text-align:center;font-weight:bold;">
      ${sq.supplierName}
      ${sq.supplierName === tender.awardedSupplierName ? ' 🏆' : ''}
    </th>`
  ).join('');

  const subHeaderCols = suppliers.map(() =>
    ['UNIT PRICE','TOTAL AMOUNT','NEGOTIATED TOTAL'].map(h =>
      `<th style="border:1px solid #bbb;padding:3px 6px;font-size:10px;background:#f5f5f5;text-align:center;">${h}</th>`
    ).join('')
  ).join('');

  const itemRows = allDesc.map(desc => {
    const cells = suppliers.map(sq => {
      const item = (sq.items || []).find(i => i.description === desc) || {};
      return `
        <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;">${fmt(item.unitPrice)}</td>
        <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;">${fmt(item.totalAmount)}</td>
        <td style="border:1px solid #ddd;padding:4px 6px;text-align:right;font-weight:bold;">${fmt(item.negotiatedTotal)}</td>`;
    }).join('');
    return `<tr>
      <td style="border:1px solid #ddd;padding:4px 6px;">${desc}</td>
      <td style="border:1px solid #ddd;padding:4px 6px;text-align:center;">${getQty(desc)}</td>
      ${cells}
    </tr>`;
  }).join('');

  const totalRow = suppliers.map(sq =>
    `<td style="border:1px solid #bbb;"></td>
     <td style="border:1px solid #bbb;padding:4px 6px;text-align:right;font-weight:bold;">${fmt(sq.grandTotal)}</td>
     <td style="border:1px solid #bbb;padding:4px 6px;text-align:right;font-weight:bold;color:#cc0000;">${fmt(sq.negotiatedGrandTotal)}</td>`
  ).join('');

  const suppEngaged = suppliers.map(sq =>
    `<div style="padding:2px 0;">${sq.supplierName}</div>`
  ).join('');

  // ── Approval rows ─────────────────────────────────────────────────────────
  const chain = Array.isArray(tender.approvalChain) ? tender.approvalChain : [];
  const fallback = [
    { approver: { name: '', role: 'Supply Chain',     department: 'Supply Chain' }     },
    { approver: { name: '', role: 'Head of Business', department: 'Business Dev'  }     },
    { approver: { name: '', role: 'Finance',          department: 'Finance'       }     }
  ];
  const rows = chain.length > 0 ? chain : fallback;

  const approvalRows = rows.map(step => {
    const isApproved = step.status === 'approved';
    const name       = step.approver?.name || '';
    const dept       = step.approver?.department || step.approver?.role || '';
    const remark     = step.comments || '';
    const signedDate = isApproved && step.actionDate ? fmtDate(step.actionDate) : '';
    const bg         = isApproved ? '#f6ffed' : '#ffffff';
    const sigContent = isApproved
      ? `<div style="font-size:10px;color:#52c41a;font-weight:bold;">✓ Approved</div>
         <div style="font-size:10px;color:#555;">${signedDate}</div>`
      : `<div style="color:#ccc;font-size:10px;">Pending</div>`;
    return `<tr style="background:${bg};">
      <td style="border:1px solid #ccc;padding:8px;">${dept}</td>
      <td style="border:1px solid #ccc;padding:8px;">${name}</td>
      <td style="border:1px solid #ccc;padding:8px;min-width:150px;">${sigContent}</td>
      <td style="border:1px solid #ccc;padding:8px;">${remark}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Tender Approval Form — ${tender.tenderNumber}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:"Arial Narrow",Arial,sans-serif; font-size:11px; color:#111; background:#fff; padding:18px 22px; }
    h1  { text-align:center; font-size:14px; letter-spacing:3px; text-transform:uppercase;
          margin:10px 0 14px; padding-bottom:6px; border-bottom:2px solid #333; }
    table { width:100%; border-collapse:collapse; margin-bottom:10px; }
    th,td { border:1px solid #ccc; padding:5px 7px; }
    .lbl   { background:#e4e4e4; font-weight:bold; white-space:nowrap; }
    .sec   { background:#d2d2d2; font-weight:bold; text-align:center; letter-spacing:1px; padding:6px; }
    .italic{ font-style:italic; }
    .right { text-align:right; }
    .center{ text-align:center; }
    .bold  { font-weight:bold; }
    .red   { color:#cc0000; }
    .award { background:#fff0b3 !important; }
    @media print { body { padding:0; } @page { margin:12mm 14mm; } }
  </style>
</head>
<body>
  <!-- Header -->
  <table style="border:none;margin-bottom:6px;">
    <tr>
      <td style="border:none;vertical-align:top;width:90px;">
        <div style="font-size:20px;font-weight:900;color:#cc0000;line-height:1.1;">Grato<br/>Engineering</div>
        <div style="font-size:10px;color:#555;">GLobal. ltd</div>
      </td>
      <td style="border:none;vertical-align:top;padding-left:8px;">
        <div style="font-size:11px;font-weight:bold;">GRATO ENGINEERING GLOBAL LTD</div>
        <div style="font-size:9px;color:#555;">Bonaberi, Douala — Cameroon | 682952153</div>
      </td>
    </tr>
  </table>

  <h1>Tender Approval Form</h1>

  <!-- Number / Date / Title -->
  <table style="margin-bottom:6px;">
    <tr>
      <td class="lbl" style="width:90px;">NUMBER:</td>
      <td style="width:140px;font-weight:bold;">${tender.tenderNumber}</td>
      <td style="width:60px;"></td>
      <td class="lbl" style="width:50px;">DATE</td>
      <td>${fmtDate(tender.date)}</td>
    </tr>
    <tr>
      <td class="lbl">TITLE</td>
      <td colspan="4" class="center bold" style="text-transform:uppercase;">${tender.title || ''}</td>
    </tr>
  </table>

  <!-- Requester + Suppliers -->
  <table style="margin-bottom:6px;">
    <tr>
      <td colspan="2" class="sec" style="width:50%;">REQUESTER DETAILS</td>
      <td colspan="2" class="sec" style="width:50%;">SUPPLIER(S) ENGAGED</td>
    </tr>
    <tr><td class="lbl" style="width:130px;">REQUESTER NAME</td><td>${tender.requesterName||''}</td><td rowspan="5" colspan="2" style="vertical-align:top;padding:8px 10px;">${suppEngaged}</td></tr>
    <tr><td class="lbl">DEPARTMENT</td>   <td>${tender.requesterDepartment||''}</td></tr>
    <tr><td class="lbl">ITEM CATEGORY</td><td>${tender.itemCategory||''}</td></tr>
    <tr><td class="lbl">REQUIRED DATE:</td><td>${fmtDate(tender.requiredDate)}</td></tr>
    <tr><td class="lbl">COMMERCIAL TERMS</td><td class="italic" style="font-size:10px;">${tender.commercialTerms||''}</td></tr>
  </table>

  <!-- Comparison table -->
  <table style="margin-bottom:6px;">
    <thead>
      <tr>
        <th rowspan="2" style="background:#ddd;width:170px;">DESCRIPTION</th>
        <th rowspan="2" style="background:#ddd;width:45px;" class="center">QTY</th>
        ${supplierHeaderCols}
      </tr>
      <tr>${subHeaderCols}</tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr style="background:#fffce0;">
        <td colspan="2" class="right italic bold">TOTAL</td>
        ${totalRow}
      </tr>
    </tfoot>
  </table>

  <!-- Summary -->
  <table style="margin-bottom:6px;">
    <tr><td class="lbl" style="width:140px;">DELIVERY TERMS</td><td>${tender.deliveryTerms||''}</td></tr>
    <tr><td class="lbl">PAYMENT TERMS</td> <td>${tender.paymentTerms ||''}</td></tr>
    <tr><td class="lbl">WARRANTY</td>       <td>${tender.warranty     ||''}</td></tr>
    <tr class="award"><td class="lbl" style="background:#ffe58f;">AWARD</td><td class="bold">${tender.awardedSupplierName||''}</td></tr>
    <tr><td class="lbl">BUDGET</td>         <td class="bold">${fmt(tender.budget)} XAF</td></tr>
    <tr><td class="lbl">COST SAVINGS</td>   <td>${fmt(tender.costSavings)} XAF</td></tr>
    <tr><td class="lbl">COST AVOIDANCE</td> <td>${fmt(tender.costAvoidance)} XAF</td></tr>
  </table>

  <!-- Technical Recommendation -->
  <table style="margin-bottom:6px;">
    <tr><td class="sec">TECHNICAL RECOMMENDATION</td></tr>
    <tr><td style="min-height:70px;height:70px;vertical-align:top;padding:8px;">${tender.technicalRecommendation||''}</td></tr>
  </table>

  <!-- Procurement Recommendation -->
  <table style="margin-bottom:14px;">
    <tr><td class="sec">PROCUREMENT RECOMMENDATION</td></tr>
    <tr><td style="min-height:70px;height:70px;vertical-align:top;padding:8px;">${tender.procurementRecommendation||''}</td></tr>
  </table>

  <!-- Approval signature table -->
  <table>
    <tr>
      <th style="background:#ddd;width:18%;">DEPARTMENT</th>
      <th style="background:#ddd;width:22%;">NAME</th>
      <th style="background:#ddd;width:36%;">SIGNATURE &amp; DATE</th>
      <th style="background:#ddd;width:24%;">REMARK</th>
    </tr>
    ${approvalRows}
  </table>
</body>
</html>`;
};