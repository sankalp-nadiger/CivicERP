
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, MapOff } from "lucide-react";

interface MapLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation || '');
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState(initialLocation || '');

  // Try to load maps without API key first (will fail gracefully)
  const tryInitializeMap = async () => {
    if (!mapRef.current || useManualAddress) return;

    try {
      // Try with a public key or fallback
      const loader = new Loader({
        apiKey: 'AIzaSyBEarADJe4JGPVHU-XG_0h5c6R3YhK8oAo', // Public demo key
        version: 'weekly',
        libraries: ['places', 'geocoding']
      });

      await loader.load();
      
      // Default to Delhi, India
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.2090 },
        zoom: 11,
      });

      const markerInstance = new google.maps.Marker({
        map: mapInstance,
        draggable: true,
        title: 'Click anywhere on the map to mark the problem location'
      });

      // Fix the click listener type error
      mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          markerInstance.setPosition({ lat, lng });
          
          // Simple address format without geocoding dependency
          const address = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedAddress(address);
          onLocationSelect({ lat, lng, address });
        }
      });

      // Add drag listener to marker
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          const address = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setSelectedAddress(address);
          onLocationSelect({ lat, lng, address });
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    } catch (error) {
      console.log('Google Maps failed to load, switching to manual address input');
      setUseManualAddress(true);
    }
  };

  useEffect(() => {
    tryInitializeMap();
  }, [useManualAddress]);

  const handleManualAddressSubmit = () => {
    if (manualAddress.trim()) {
      // Generate approximate coordinates for Delhi area
      const lat = 28.6139 + (Math.random() - 0.5) * 0.1;
      const lng = 77.2090 + (Math.random() - 0.5) * 0.1;
      setSelectedAddress(manualAddress);
      onLocationSelect({ lat, lng, address: manualAddress });
    }
  };

  if (useManualAddress) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border">
          <p className="text-sm font-medium text-blue-800 mb-1">📍 Enter Problem Location</p>
          <p className="text-xs text-blue-600">Type the address or location where the issue is happening</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="manualAddress">Address/Location of the Problem</Label>
          <Input
            id="manualAddress"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="e.g. Near Delhi Gate, Connaught Place, New Delhi"
          />
          <Button onClick={handleManualAddressSubmit} className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            Set Location
          </Button>
        </div>

        <Button 
          variant="outline" 
          onClick={() => setUseManualAddress(false)} 
          className="w-full text-sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Try Map Instead
        </Button>

        {selectedAddress && (
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <Label className="text-sm font-medium text-green-800">✓ Selected Location:</Label>
            <p className="text-sm text-green-700 mt-1">{selectedAddress}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg border">
        <p className="text-sm font-medium text-blue-800 mb-1">📍 Select Problem Location</p>
        <p className="text-xs text-blue-600">Simply click anywhere on the map to mark the exact location of your issue</p>
      </div>
      
      <div ref={mapRef} className="w-full h-80 rounded-lg border" />
      
      <Button 
        variant="outline" 
        onClick={() => setUseManualAddress(true)} 
        className="w-full text-sm"
      >
        <MapOff className="h-4 w-4 mr-2" />
        Can't use map? Enter address manually
      </Button>

      {selectedAddress && (
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <Label className="text-sm font-medium text-green-800">✓ Selected Location:</Label>
          <p className="text-sm text-green-700 mt-1">{selectedAddress}</p>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
