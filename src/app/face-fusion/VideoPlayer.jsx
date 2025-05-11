import { useRef, useEffect } from 'react';

export default function VideoPlayer({ videoUrl, thumbnailUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        controls
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        controlsList="nodownload"
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
} 