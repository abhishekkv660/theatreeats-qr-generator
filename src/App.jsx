import React, { useState, useEffect, useRef } from 'react';
import { getScreens, getSeatsByScreen } from './lib/db';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Download, Loader2 } from 'lucide-react';
import './App.css';

function App() {
  const [screens, setScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedRow, setSelectedRow] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  const stickerRef = useRef(null);

  useEffect(() => {
    getScreens().then(data => {
      setScreens(data);
      if (data.length > 0) {
        setSelectedScreenId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedScreenId) {
      getSeatsByScreen(selectedScreenId).then(data => {
        setAvailableSeats(data);
        setSelectedRow('');
        setSelectedSeat('');
      });
    }
  }, [selectedScreenId]);

  const rows = [...new Set(availableSeats.map(s => s.row))].sort();
  const seatsInRow = availableSeats
    .filter(s => s.row === selectedRow)
    .map(s => Number(s.seatNumber))
    .sort((a, b) => a - b);

  const qrUrl = (selectedScreenId && selectedRow && selectedSeat) 
    ? `https://theatreeats.netlify.app/users/scan?screenId=${selectedScreenId}&row=${selectedRow}&seat=${selectedSeat}`
    : 'https://theatreeats.netlify.app';

  const handleDownload = async () => {
    if (!stickerRef.current) return;
    setDownloading(true);
    
    try {
      const el = stickerRef.current;
      const originalShadow = el.style.boxShadow;
      el.style.boxShadow = 'none'; // Clean edges
      
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: null,
        useCORS: true
      });
      
      el.style.boxShadow = originalShadow;
      
      const screenName = screens.find(s => s.id === selectedScreenId)?.name || selectedScreenId;
      const filename = `sticker_${screenName}_${selectedRow}${selectedSeat}.png`.replace(/\s+/g, '_').toLowerCase();
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Download failed", e);
      alert("Failed to download sticker. Ensure icon.png is accessible.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading database...</div>;

  return (
    <div className="app-container">
      
      <div className="controls-panel">
        <h1>Sticker Generator</h1>
        
        <div className="form-group">
          <label>Screen</label>
          <select value={selectedScreenId} onChange={(e) => setSelectedScreenId(e.target.value)}>
            {screens.map(s => (
              <option key={s.id} value={s.id}>{s.name || s.screenName || `Screen ${s.id.slice(-4)}`}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Row</label>
          <select value={selectedRow} onChange={(e) => setSelectedRow(e.target.value)}>
            <option value="" disabled>Select Row</option>
            {rows.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Seat Number</label>
          <select value={selectedSeat} onChange={(e) => setSelectedSeat(e.target.value)} disabled={!selectedRow}>
            <option value="" disabled>Select Seat</option>
            {seatsInRow.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn" 
          onClick={handleDownload} 
          disabled={!selectedScreenId || !selectedRow || !selectedSeat || downloading}
        >
          {downloading ? <Loader2 className="animate-spin" /> : <Download />} 
          Download PNG
        </button>
      </div>

      <div className="preview-panel">
        <div className="sticker" ref={stickerRef}>
          <div className="sticker-header">
              <img src="/icon.png" alt="TheatreEats Logo" className="sticker-logo" />
              <div className="brand-name">Theatre<span>Eats</span></div>
          </div>

          <h2 className="tagline">Craving snacks?<br/>Scan to <span>order.</span></h2>

          <div className="qr-container">
              <QRCodeSVG 
                value={qrUrl} 
                size={160} 
                level="H" 
                includeMargin={false}
              />
          </div>

          <div className="instructions">
              {selectedRow && selectedSeat ? (
                <>Seat <strong>{selectedRow}-{selectedSeat}</strong><br/></>
              ) : null}
              Scan to order snacks instantly. <br/><strong>Delivered right to your seat</strong>.
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
