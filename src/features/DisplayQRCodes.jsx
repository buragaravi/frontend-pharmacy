import React, { useEffect, useState } from 'react';
import axios from 'axios';

const categoryEndpoints = {
  glassware: 'https://backend-pharmacy-5541.onrender.com/api/glassware/central/available',
  equipment: 'https://backend-pharmacy-5541.onrender.com/api/equipment/central/available',
  other: 'https://backend-pharmacy-5541.onrender.com/api/others/central/available',
};

function getQrField(item) {
  // Always use qrCodeImage for central live
  return item.qrCodeImage || null;
}

const DisplayQRCodes = ({ category }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryEndpoints[category]) return;
    setLoading(true);
    setError(null);
    axios
      .get(categoryEndpoints[category])
      .then((res) => {
        // Defensive: ensure items is always an array
        console.log('Fetched items:', res);
        const data = Array.isArray(res.data) ? res.data : [];
        setItems(data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch stock'))
      .finally(() => setLoading(false));
  }, [category]);

  const handleDownload = (img, name) => {
    const a = document.createElement('a');
    a.href = img;
    a.download = `${name || 'qr-code'}.png`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Live Stock QR Codes ({category.charAt(0).toUpperCase() + category.slice(1)})</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {items.filter(i => getQrField(i)).map((item) => (
          <div key={item._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, margin: 8, background: '#fafafa', minWidth: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <img src={getQrField(item)} alt="QR Code" style={{ width: 120, height: 120, marginBottom: 8 }} />
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <b>Name:</b> {item.name || item.variant || item.productId}
              <br />
              <b>Batch:</b> {item.batchId || '-'}
              <br />
              <b>Quantity:</b> {item.quantity}
            </div>
            <button onClick={() => handleDownload(getQrField(item), `${item.name || item.variant || item.productId}-${item.batchId}`)} style={{ padding: '6px 12px', borderRadius: 4, background: '#6D123F', color: '#fff', border: 'none', cursor: 'pointer' }}>
              Download QR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayQRCodes;
