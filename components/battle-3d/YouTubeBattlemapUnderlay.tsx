'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { 
  extractYouTubeVideoId, 
  isYouTubeUrl, 
  isVideoFileUrl, 
  getYouTubeEmbedUrl 
} from '@/lib/living-battlemaps-catalog';
import { VideoGridAlignmentConfig } from '@/lib/types';

interface YouTubeBattlemapUnderlayProps {
  url?: string;
  config?: VideoGridAlignmentConfig;
  className?: string;
}

export const YouTubeBattlemapUnderlay: React.FC<YouTubeBattlemapUnderlayProps> = ({
  url,
  config,
  className = ''
}) => {
  const { videoMapVolume, isVideoMapMuted } = useAudio();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isYouTube = isYouTubeUrl(url);
  const isDirectVideo = isVideoFileUrl(url);

  // Calibration and grid overlap values
  const scale = config?.scale ?? 1.0;
  const offsetX = config?.offsetX ?? 0;
  const offsetY = config?.offsetY ?? 0;
  const aspectRatio = config?.aspectRatio ?? '16:9';

  const videoId = extractYouTubeVideoId(url);
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId, {
    autoplay: true,
    mute: isVideoMapMuted,
    loop: true,
    controls: false,
    enablejsapi: true
  }) : null;

  // Sync YouTube Volume and Mute in real time via postMessage
  useEffect(() => {
    if (!iframeRef.current || !isYouTube || !iframeRef.current.contentWindow) return;

    try {
      if (isVideoMapMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'mute' }),
          '*'
        );
      } else {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute' }),
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(videoMapVolume * 100)] }),
          '*'
        );
      }
    } catch {
      // Ignora falhas pontuais de postMessage antes do IFrame carregar
    }
  }, [videoMapVolume, isVideoMapMuted, isYouTube]);

  // Sync Direct HTML5 Video element Volume and Mute
  useEffect(() => {
    if (!videoRef.current || !isDirectVideo) return;
    videoRef.current.volume = Math.max(0, Math.min(1, videoMapVolume));
    videoRef.current.muted = isVideoMapMuted;
  }, [videoMapVolume, isVideoMapMuted, isDirectVideo]);

  if (!url || (!isYouTube && !isDirectVideo)) {
    return null;
  }

  // Dimension sizing based on aspect ratio
  const getContainerDimensions = () => {
    if (aspectRatio === '4:3') {
      return 'w-[133.33vh] h-[100vh] min-w-full';
    }
    if (aspectRatio === '21:9') {
      return 'w-[233.33vh] h-[100vh] min-w-full';
    }
    // Default 16:9 or custom fill
    return 'w-[177.77vh] h-[100vh] min-w-full min-h-full';
  };

  return (
    <div 
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center z-0 ${className}`}
      aria-hidden="true"
    >
      <div 
        className="relative transition-transform duration-75 ease-out flex items-center justify-center w-full h-full min-w-full min-h-full"
        style={{
          transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform'
        }}
      >
        {isYouTube && embedUrl && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="Living Battle Map Ground Texture"
            className="w-full h-full border-0 pointer-events-none scale-[1.08] min-w-full min-h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="eager"
            tabIndex={-1}
          />
        )}

        {isDirectVideo && (
          <video
            ref={videoRef}
            src={url}
            autoPlay
            loop
            playsInline
            muted={isVideoMapMuted}
            className="w-full h-full object-cover pointer-events-none min-w-full min-h-full"
          />
        )}
      </div>
    </div>
  );
};
