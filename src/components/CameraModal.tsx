import React, { useEffect, useRef, useState } from 'react';
import { SAMPLE_SCENES, SamplePresetScene } from '../constants/presets';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string, preset?: SamplePresetScene) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [activeTab, setActiveTab] = useState<'camera' | 'samples'>('camera');

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    if (activeTab === 'camera') {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, activeTab]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device/browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setCameraError(
        'Unable to access camera. You can choose a high-clarity sample scene or upload an image.'
      );
      setActiveTab('samples');
    }
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        if (window.navigator?.vibrate) {
          window.navigator.vibrate([40, 30, 40]);
        }

        onCapture(dataUrl);
        onClose();
      }
    } catch (err) {
      console.error('Error snapshotting video frame:', err);
    }
  };

  const handleSelectSample = (scene: SamplePresetScene) => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(30);
    }
    onCapture(scene.imageUrl, scene);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera Viewfinder"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
    >
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border-2 border-primary/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-container-high bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              photo_camera
            </span>
            <h2 className="font-bold text-lg text-primary">Capture Surroundings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera dialog"
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Tab Switcher: Live Viewfinder vs Preset Samples */}
        <div className="flex border-b border-surface-container-high bg-surface-container">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'samples'
                ? 'bg-surface-container-lowest text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
            Sample Scenes
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {activeTab === 'camera' ? (
            <div className="flex flex-col space-y-3">
              {cameraError ? (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl flex flex-col items-center text-center space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-error">
                    videocam_off
                  </span>
                  <p className="text-sm font-medium">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('samples')}
                    className="mt-2 px-4 py-2 bg-on-error-container text-surface-container-lowest rounded-lg text-sm font-bold"
                  >
                    Browse High-Clarity Samples
                  </button>
                </div>
              ) : (
                <div className="relative aspect-[4/3] w-full bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />

                  {/* Centered Reticle Guide */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-28 h-28 rounded-full border-2 border-dashed border-secondary-container/80 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/80 text-[36px]">
                        center_focus_strong
                      </span>
                    </div>
                  </div>

                  {/* Camera flip control */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    aria-label="Switch camera direction"
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      flip_camera_ios
                    </span>
                  </button>
                </div>
              )}

              {/* Shutter Action */}
              {!cameraError && (
                <div className="flex items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="h-16 px-8 bg-primary text-on-primary rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 shadow-lg active:scale-95 transition-all w-full"
                  >
                    <span className="material-symbols-outlined text-[28px] text-secondary-container">
                      camera
                    </span>
                    Take Snapshot Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant font-medium">
                Choose a pre-framed real scenario to test spatial tactile navigation:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleSelectSample(scene)}
                    className="text-left bg-surface-container-low hover:bg-surface-container rounded-xl overflow-hidden border border-outline-variant/50 transition-all hover:shadow-md flex flex-col group p-2.5 space-y-2"
                  >
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-surface-container-high">
                      <img
                        src={scene.imageUrl}
                        alt={scene.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-primary/90 text-on-primary text-[11px] px-2 py-0.5 rounded-full font-bold">
                        {scene.fileSizeText}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-primary">{scene.name}</div>
                      <p className="text-[12px] text-on-surface-variant line-clamp-2">
                        {scene.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
