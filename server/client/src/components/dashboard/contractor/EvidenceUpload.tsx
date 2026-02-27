import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  MapPin,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Coordinates, EvidenceSubmission } from './types';

interface EvidenceUploadProps {
  taskId: string;
  onEvidenceSubmit: (
    taskId: string,
    evidence: EvidenceSubmission
  ) => void;
  isOffline?: boolean;
  coordinates?: Coordinates;
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  taskId,
  onEvidenceSubmit,
  isOffline = false,
  coordinates = { lat: 0, lng: 0 },
}) => {
  const { t } = useTranslation();
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates>(
    coordinates
  );
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoMode, setPhotoMode] = useState<'before' | 'after' | null>(null);

  // Get current GPS coordinates
  const captureGPS = () => {
    setGeoStatus('loading');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGeoStatus('success');
        },
        () => {
          setGeoStatus('error');
        }
      );
    } else {
      setGeoStatus('error');
    }
  };

  // Initialize camera
  const initializeCamera = async (mode: 'before' | 'after') => {
    try {
      setPhotoMode(mode);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setGeoStatus('error');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File(
              [blob],
              `${photoMode}-photo-${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );
            if (photoMode === 'before') {
              setBeforePhoto(file);
            } else {
              setAfterPhoto(file);
            }
            closeCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  // Close camera
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setPhotoMode(null);
  };

  // Handle file selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'before') {
        setBeforePhoto(file);
      } else {
        setAfterPhoto(file);
      }
    }
  };

  // Submit evidence
  const handleSubmitEvidence = async () => {
    if (!beforePhoto || !afterPhoto) {
      alert(
        t(
          'contractor.bothPhotosRequired',
          'Both before and after photos are required'
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const evidence: EvidenceSubmission = {
        beforePhoto,
        afterPhoto,
        coordinates: currentCoordinates,
        notes,
        submittedAt: new Date(),
      };

      onEvidenceSubmit(taskId, evidence);

      // Reset form
      setBeforePhoto(null);
      setAfterPhoto(null);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove photo
  const removePhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhoto(null);
    } else {
      setAfterPhoto(null);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-yellow-400">
          {t('contractor.evidenceSubmission', 'Evidence Submission')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Before & After Photos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before Photo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-300">
              {t('contractor.beforePhoto', 'Before Photo')}
            </label>
            {beforePhoto ? (
              <div className="relative group">
                <img
                  src={URL.createObjectURL(beforePhoto)}
                  alt="Before"
                  className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePhoto('before')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                  ✓ Captured
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => initializeCamera('before')}
                  disabled={cameraActive || isOffline}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {t('contractor.capturePhoto', 'Capture')}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOffline}
                  variant="outline"
                  className="flex-1 py-6"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {t('contractor.upload', 'Upload')}
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'before')}
            />
          </div>

          {/* After Photo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-300">
              {t('contractor.afterPhoto', 'After Photo')}
            </label>
            {afterPhoto ? (
              <div className="relative group">
                <img
                  src={URL.createObjectURL(afterPhoto)}
                  alt="After"
                  className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePhoto('after')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                  ✓ Captured
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => initializeCamera('after')}
                  disabled={cameraActive || isOffline}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  {t('contractor.capturePhoto', 'Capture')}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOffline}
                  variant="outline"
                  className="flex-1 py-6"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {t('contractor.upload', 'Upload')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Camera View Modal */}
        {cameraActive && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="hidden"
              width={1280}
              height={720}
            />

            {/* Camera Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <Button
                onClick={closeCamera}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16"
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white rounded-full w-20 h-20"
              >
                <Camera className="h-8 w-8" />
              </Button>
              <div className="w-16 h-16" />
            </div>

            {/* Photo Mode Label */}
            <div className="absolute top-8 left-0 right-0 text-center">
              <span className="text-white text-lg font-bold bg-black/50 px-4 py-2 rounded-lg">
                {photoMode === 'before'
                  ? t('contractor.captureBeforePhoto', 'Capture BEFORE Photo')
                  : t('contractor.captureAfterPhoto', 'Capture AFTER Photo')}
              </span>
            </div>
          </div>
        )}

        {/* GPS Coordinates */}
        <div className="space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <MapPin className="h-5 w-5 text-green-400" />
              {t('contractor.geoLocation', 'Geo-Location')}
            </label>
            <Button
              onClick={captureGPS}
              disabled={isOffline}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              {geoStatus === 'loading'
                ? t('contractor.capturingGPS', 'Capturing...')
                : geoStatus === 'success'
                ? t('contractor.recapture', 'Recapture')
                : t('contractor.captureGPS', 'Capture GPS')}
            </Button>
          </div>

          {geoStatus === 'success' && (
            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <span className="text-gray-400">Latitude:</span>{' '}
                <span className="font-mono text-yellow-400">
                  {currentCoordinates.lat.toFixed(6)}°
                </span>
              </p>
              <p>
                <span className="text-gray-400">Longitude:</span>{' '}
                <span className="font-mono text-yellow-400">
                  {currentCoordinates.lng.toFixed(6)}°
                </span>
              </p>
              <div className="flex items-center gap-2 pt-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                {t('contractor.gpsLocked', 'GPS coordinates locked')}
              </div>
            </div>
          )}

          {geoStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {t(
                'contractor.gpsError',
                'Unable to capture GPS. Enable location services.'
              )}
            </div>
          )}

          {isOffline && (
            <div className="text-xs text-amber-400 mt-2">
              {t(
                'contractor.gpsOfflineNote',
                'Current location will be used: {lat}, {lng}',
                { lat: currentCoordinates.lat.toFixed(2), lng: currentCoordinates.lng.toFixed(2) }
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-300">
            {t('contractor.workNotes', 'Work Notes')}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(
              'contractor.notesPlaceholder',
              'Describe the work completed, issues encountered, etc.'
            )}
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            rows={4}
          />
          <p className="text-xs text-gray-500">
            {t(
              'contractor.notesHint',
              'Large, touch-friendly text input for glove-friendly operation'
            )}
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitEvidence}
          disabled={!beforePhoto || !afterPhoto || isSubmitting || isOffline}
          className={`w-full py-6 text-lg font-bold rounded-lg ${
            beforePhoto && afterPhoto && !isSubmitting && !isOffline
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Upload className="h-5 w-5 mr-2" />
          {isSubmitting
            ? t('contractor.submittingEvidence', 'Submitting...')
            : t('contractor.submitEvidence', 'Submit Evidence')}
        </Button>

        {isOffline && (
          <div className="p-3 bg-amber-900 border-l-4 border-amber-400 rounded text-sm text-amber-200">
            {t(
              'contractor.evidenceOfflineQueue',
              'Evidence will be uploaded when online'
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvidenceUpload;
