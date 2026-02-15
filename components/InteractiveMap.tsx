
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Spot } from '../types';

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const InteractiveMap: React.FC<{ spots: Spot[] }> = ({ spots }) => {
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const center: [number, number] = spots.length > 0 && spots[spots.length - 1].coords 
    ? spots[spots.length - 1].coords! 
    : [-7.7956, 110.3695];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot) => (
          spot.coords && (
            <Marker key={spot.id} position={spot.coords}>
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-gray-900 leading-tight">{spot.name}</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tight line-clamp-2">{spot.address}</p>
                  <p className="text-[10px] text-gray-400 mt-2 italic">"{spot.description.slice(0, 60)}..."</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
        {spots.length > 0 && <RecenterMap coords={center} />}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
