import React, { createContext, useContext, useState } from 'react';

// Кэш для видео: ключ — videoPath, значение — Blob-URL
const VideoCacheContext = createContext({});

export function VideoCacheProvider({ children }) {
  const [cache, setCache] = useState({});

  // Добавить видео в кэш
  const addVideoToCache = (videoPath, blobUrl) => {
    setCache(prev => ({ ...prev, [videoPath]: blobUrl }));
  };

  // Получить видео из кэша
  const getVideoFromCache = (videoPath) => cache[videoPath] || null;

  return (
    <VideoCacheContext.Provider value={{ cache, addVideoToCache, getVideoFromCache }}>
      {children}
    </VideoCacheContext.Provider>
  );
}

export function useVideoCache() {
  return useContext(VideoCacheContext);
}
