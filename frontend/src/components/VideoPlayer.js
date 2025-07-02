import React, { useState, useEffect } from 'react';

const VideoPlayer = ({ location, dayId, exerciseName, title }) => {
  const [videoExists, setVideoExists] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  const videoPath = `/videos/${location}/${dayId}/${exerciseName}.mp4`;

  console.log('🎥 VideoPlayer props:', { location, dayId, exerciseName, title });
  console.log('🎯 Generated video path:', videoPath);

  useEffect(() => {
    // Проверяем существование видео
    const checkVideo = async () => {
      try {
        console.log('🔍 Checking video existence at:', videoPath);
        const response = await fetch(videoPath, { method: 'HEAD' });
        console.log('📡 Video check response:', response.status, response.ok);
        setVideoExists(response.ok);
      } catch (error) {
        console.error('❌ Video check error:', error);
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '200px',
          height: '300px',
          background: '#f0f0f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '12px'
        }}>
          <span style={{ color: '#666', fontSize: '14px' }}>Загрузка видео...</span>
        </div>
      </div>
    );
  }

  if (!videoExists) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '200px',
          height: '300px',
          background: '#e8f4f8', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '12px',
          border: '2px dashed #2196f3'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎥</div>
          <span style={{ 
            color: '#666', 
            textAlign: 'center', 
            padding: '0 16px',
            fontSize: '14px',
            lineHeight: 1.4
          }}>
            Видео будет добавлено позже
          </span>
        </div>
        <p style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginTop: '8px', 
          textAlign: 'center',
          fontWeight: 500
        }}>
          {title}
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      marginBottom: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <video 
        controls 
        style={{ 
          maxWidth: '100%',
          maxHeight: '400px',
          height: 'auto',
          width: 'auto',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        poster={`/videos/${location}/${dayId}/${exerciseName}_poster.jpg`} // опциональный постер
      >
        <source src={videoPath} type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
      <p style={{ 
        fontSize: '14px', 
        color: '#666', 
        marginTop: '8px', 
        textAlign: 'center',
        fontWeight: 500
      }}>
        {title}
      </p>
    </div>
  );
};

export default VideoPlayer;
