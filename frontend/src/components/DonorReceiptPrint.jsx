import React from 'react';

const numberToWords = (num) => {
  if (num === 0) return 'Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const format = (n) => {
    if (n < 20) return a[n];
    let digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + format(n % 100));
    if (n < 1000000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 === 0 ? '' : format(n % 1000));
    if (n < 1000000000) return format(Math.floor(n / 1000000)) + 'Million ' + (n % 1000000 === 0 ? '' : format(n % 1000000));
    return '';
  };
  return format(num).trim() + ' Only';
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatSettledMonth = (monthStr) => {
  if (!monthStr) return '';
  const parts = monthStr.split('-');
  if (parts.length !== 2) return monthStr;
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[0]);
  if (monthIndex === -1) return monthStr;
  const year = 2000 + Number(parts[1]);
  return `${monthNames[monthIndex]} ${year}`;
};

export default function DonorReceiptPrint({ receipt, companies, duplicate }) {
  const company = companies && companies.length > 0 ? companies[0] : null;
  const amountNum = Number((receipt?.totalAmount || '0').replace(/,/g, '')) || 0;

  return (
    <div className="receipt-print-area" style={{ display: 'none' }}>
      <div style={{ padding: '30px 40px', boxSizing: 'border-box', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#000' }}>
        {duplicate && (
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', border: '2px solid #e00', color: '#e00', fontSize: '18px', fontWeight: 'bold', padding: '2px 24px', letterSpacing: '6px' }}>DUPLICATE</span>
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', textTransform: 'uppercase', letterSpacing: '1px' }}>{company?.name || 'DEENIYA DONATION APP'}</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{company?.address || ''}{company?.regNo ? ` | Reg: ${company.regNo}` : ''}</p>
          {company?.phone || company?.email ? (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>
              {company?.phone ? `Tel: ${company.phone}` : ''}{company?.phone && company?.email ? ' | ' : ''}{company?.email || ''}
            </p>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>Donor Details</h3>
            <table style={{ fontSize: '13px', lineHeight: '2', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Name:</td>
                  <td style={{ borderBottom: '1px dashed #999', minWidth: '200px' }}>{receipt?.donorName || ''}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Donor ID:</td>
                  <td style={{ borderBottom: '1px dashed #999' }}>{receipt?.donorId || ''}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Address:</td>
                  <td style={{ borderBottom: '1px dashed #999' }}>{receipt?.address || ''}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Route:</td>
                  <td style={{ borderBottom: '1px dashed #999' }}>{receipt?.route || '-'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>Category:</td>
                  <td style={{ borderBottom: '1px dashed #999' }}>{receipt?.category || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', minWidth: '200px', paddingLeft: '20px' }}>
            <table style={{ fontSize: '13px', lineHeight: '2', borderCollapse: 'collapse', marginLeft: 'auto' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '8px', textAlign: 'left' }}>Date:</td>
                  <td style={{ borderBottom: '1px dashed #999', minWidth: '120px', textAlign: 'right' }}>{receipt?.receiptDate || (receipt?.createdAt ? new Date(receipt.createdAt).toLocaleDateString() : '')}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '8px', textAlign: 'left' }}>Receipt No:</td>
                  <td style={{ borderBottom: '1px dashed #999', textAlign: 'right' }}>{receipt?.receiptNumber || ''}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold', paddingRight: '8px', textAlign: 'left' }}>User ID:</td>
                  <td style={{ borderBottom: '1px dashed #999', textAlign: 'right' }}>Admin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '14px', lineHeight: '1.8' }}>
            <span style={{ fontWeight: 'bold' }}>Received Amount </span>
            <span style={{ borderBottom: '1px solid #000', padding: '0 8px', fontStyle: 'italic', fontWeight: 'bold' }}>
              {numberToWords(amountNum)}
            </span>
          </p>
          <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.8' }}>
            <span style={{ fontWeight: 'bold' }}>from month of </span>
            <span style={{ borderBottom: '1px solid #000', padding: '0 8px' }}>
              {formatSettledMonth(receipt?.settledMonth)}
            </span>
            {receipt?.paymentMode === 'Cheque' ? (
              <span style={{ marginLeft: '16px', fontSize: '12px', color: '#555' }}>
                (Cheque No: {receipt?.chequeNumber || '-'} | {receipt?.chequeDate || ''})
              </span>
            ) : null}
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div style={{ padding: '8px 16px', border: '2px solid #000', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>LKR {amountNum.toLocaleString()}/-</p>
          </div>
          <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '12px', color: '#555' }}>
            Jazakallahu kairah
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 40px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Authorized Signatory</p>
            <div style={{ width: '160px', borderTop: '1px solid #000' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
