import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ location, dayId, exerciseName, title }) => {
  const [videoExists, setVideoExists] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

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

  // Функции для работы с полноэкранным режимом
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Вход в полноэкранный режим
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    } else {
      // Выход из полноэкранного режима
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Отслеживание изменений полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

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
      alignItems: 'center',
      position: 'relative'
    }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video 
          ref={videoRef}
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
        
        {/* Кнопка полноэкранного режима */}
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background-color 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'}
        >
          {isFullscreen ? '⤵' : '⤢'} {isFullscreen ? 'Свернуть' : 'На весь экран'}
        </button>
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
};

export default VideoPlayer;
