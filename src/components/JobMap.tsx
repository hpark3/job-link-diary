import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HOME_LAT, HOME_LNG, getDistanceBand } from "@/lib/geo";

// Fix default marker icon
const homeIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface JobPoint {
  id: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  job_title: string | null;
  company_name: string | null;
  location_detail: string | null;
}

interface Props {
  jobs: JobPoint[];
}

export function JobMap({ jobs }: Props) {
  const points = useMemo(
    () => jobs.filter((j) => j.latitude != null && j.longitude != null),
    [jobs]
  );

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-xs text-muted-foreground">
        No geocoded UK job locations to display.
      </div>
    );
  }

  return (
    <MapContainer
      center={[HOME_LAT, HOME_LNG]}
      zoom={11}
      className="h-[350px] w-full rounded-lg z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Home marker */}
      <Marker position={[HOME_LAT, HOME_LNG]} icon={homeIcon}>
        <Popup>
          <strong>Home</strong>
          <br />
          Crystal Palace, London
        </Popup>
      </Marker>

      {/* Job locations */}
      {points.map((j) => {
        const band = getDistanceBand(j.distance_km ?? 0);
        return (
          <CircleMarker
            key={j.id}
            center={[j.latitude!, j.longitude!]}
            radius={6}
            pathOptions={{
              color: band.color,
              fillColor: band.color,
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                {j.job_title && <strong>{j.job_title}</strong>}
                {j.company_name && <p>{j.company_name}</p>}
                {j.location_detail && <p>{j.location_detail}</p>}
                {j.distance_km != null && (
                  <p className="font-medium">{j.distance_km} km from home</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
