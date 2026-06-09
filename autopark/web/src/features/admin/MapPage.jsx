import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../../api';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapPage() {
  const [parkings, setParkings] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/parkings').then(({ data }) => setParkings(data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Carte des parkings</h1>
        <p>Vue interactive de tous les parkings à Laâyoune</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 350px' : '1fr', gap: '20px' }}>
        <div className="map-container">
          <MapContainer
            center={[27.1536, -13.2033]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {parkings.map((p) => (
              <Marker
                key={p._id}
                position={[p.location.coordinates[1], p.location.coordinates[0]]}
                icon={p.type === 'open_street' ? goldIcon : blueIcon}
                eventHandlers={{ click: () => setSelected(p) }}
              >
                <Popup>
                  <strong>{p.name}</strong><br />
                  {p.availableSpots} / {p.totalSpots} places disponibles
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {selected && (
          <div className="card animate-in">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{selected.name}</h3>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}
                >✕</button>
              </div>

              <span className={`badge ${selected.type === 'normal' ? 'badge-primary' : 'badge-warning'}`}>
                {selected.type === 'normal' ? 'Normal' : 'Voie publique'}
              </span>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Adresse</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selected.address || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Places disponibles</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>{selected.availableSpots} / {selected.totalSpots}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Prix/heure</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selected.pricePerHour} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Prix/jour</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selected.pricePerDay} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Commission</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selected.commissionPercent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Propriétaire</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selected.ownerId?.fullName || 'N/A'}</span>
                </div>
              </div>

              {/* Spot occupancy bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Occupation</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>
                    {Math.round((selected.occupiedSpots / selected.totalSpots) * 100)}%
                  </span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(selected.occupiedSpots / selected.totalSpots) * 100}%`,
                    background: selected.occupiedSpots / selected.totalSpots > 0.8 ? 'var(--danger)' : 'var(--primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
