import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ location, dayId, exerciseName, title }) => {
  const [videoExists, setVideoExists] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  const videoPath = `/videos/${location}/${dayId}/${exerciseName}.mp4`;

  useEffect(() => {
    // Проверяем существование видео
    const checkVideo = async () => {
      try {
        const response = await fetch(videoPath, { method: 'HEAD' });
        setVideoExists(response.ok);
      } catch (error) {
        setVideoExists(false);
      } finally {
        setVideoLoading(false);
      }
    };
    
    checkVideo();
  }, [videoPath]);

  if (videoLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '200px', 
        background: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <span>Загрузка видео...</span>
      </div>
    );
  }

  if (!videoExists) {
    return (
      <div style={{ 
        width: '100%', 
        height: '200px', 
        background: '#e8f4f8', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '8px',
        marginBottom: '12px',
        border: '2px dashed #2196f3'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎥</div>
        <span style={{ color: '#666', textAlign: 'center', padding: '0 16px' }}>
          Видео для упражнения "{title}" будет добавлено позже
        </span>
        <small style={{ color: '#888', marginTop: '8px' }}>
          Путь: {videoPath}
        </small>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      <video 
        controls 
        width="100%" 
        height="200"
        style={{ borderRadius: '8px' }}
        poster={`/videos/${location}/${dayId}/${exerciseName}_poster.jpg`} // опциональный постер
      >
        <source src={videoPath} type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', textAlign: 'center' }}>
        {title}
      </p>
    </div>
  );
};

export default VideoPlayer;
