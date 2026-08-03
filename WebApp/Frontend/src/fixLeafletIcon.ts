import L from "leaflet";
import "leaflet.markercluster";
import { useMapEvents } from "react-leaflet";

// Thiết lập icon mặc định
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Icon tuỳ chỉnh cho device
export const customIcon = new L.Icon({
  iconUrl: "/image/device.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationSelectorProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
}

const LocationSelector = ({ onSelect }: LocationSelectorProps) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSelect({ lat, lng });
    },
  });

  return null; // Không render gì cả
};

export default LocationSelector;
