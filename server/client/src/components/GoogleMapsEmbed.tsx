import React from 'react';
import { useTranslation } from 'react-i18next';

const extractLatLng = (raw: string): { lat: number; lng: number } | null => {
  const text = String(raw || '').trim();
  if (!text) return null;

  // Matches patterns like:
  // "Location: 12.971599, 77.594566"
  // "12.971599,77.594566"
  const match = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
};

export const GoogleMapsEmbed: React.FC<{ location: string; heightClassName?: string }> = ({
  location,
  heightClassName = 'h-64',
}) => {
  const { t } = useTranslation();
  const coords = extractLatLng(location);
  const query = coords ? `${coords.lat},${coords.lng}` : location;
  const encodedQuery = encodeURIComponent(query);

  const embedUrl = `https://www.google.com/maps?q=${encodedQuery}&z=16&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div className="mt-3 space-y-2">
      <div className={`w-full overflow-hidden rounded border bg-white ${heightClassName}`}>
        <iframe
          title="Complaint location"
          src={embedUrl}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline"
      >
        {t('map.openInGoogleMaps', 'Open in Google Maps')}
      </a>
    </div>
  );
};
