import React, { useState } from 'react';
import DisplayQRCodes from '../features/DisplayQRCodes';

const QRCodesPage = () => {
  const [category, setCategory] = useState('glassware');

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1>All Product QR Codes</h1>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Select Category: </label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 6, borderRadius: 4 }}>
          <option value="glassware">Glassware</option>
          <option value="equipment">Equipment</option>
          <option value="other">Other Products</option>
        </select>
      </div>
      <DisplayQRCodes category={category} />
    </div>
  );
};

export default QRCodesPage;
