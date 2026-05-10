import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';

export function useFaceScroll(
  webcamRef: React.RefObject<Webcam | null>, 
  sensitivity: number,
  isSmartMode: boolean = true 
) {
  const [isAiLoaded, setIsAiLoaded] = useState(false);
  const [neutralY, setNeutralY] = useState<number | null>(null);
  
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(-1);

  const targetSpeedRef = useRef<number>(0);  
  const currentSpeedRef = useRef<number>(0); 

  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU" 
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        if (isMounted) {
          landmarkerRef.current = faceLandmarker;
          setIsAiLoaded(true);
        }
      } catch (error) {
        console.error("Gagal memuat AI:", error);
      }
    };
    loadModel();
    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const detectFaceSafe = (video: HTMLVideoElement) => {
    if (!landmarkerRef.current) return null;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const now = performance.now();
    if (now <= lastTimestampRef.current) return null;
    lastTimestampRef.current = now;

    return landmarkerRef.current.detectForVideo(video, now);
  };

  const calibrateNeutralPosition = useCallback(() => {
    if (!webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    if (video.readyState !== 4) return;

    try {
      const results = detectFaceSafe(video);
      if (results && results.faceLandmarks?.length > 0) {
        const nose = results.faceLandmarks[0][1];
        setNeutralY(nose.y);
        
        localStorage.setItem('scrollface_neutral_y', nose.y.toString());
        console.log("Kalibrasi sukses! Posisi hidung:", nose.y);
      }
    } catch (err) {
      console.error("Error kalibrasi:", err);
    }
  }, [webcamRef]);

  const detectAndScroll = useCallback(() => {
    // 🟢 2. LOGIKA HEMAT CPU: Jika pengguna memilih Mode Santai, matikan deteksi AI!
    if (!isSmartMode) {
      targetSpeedRef.current = 0;
      currentSpeedRef.current = 0; // Hentikan sisa momentum scroll AI
      requestRef.current = requestAnimationFrame(detectAndScroll); // Tetap loop, menunggu Mode AI dihidupkan lagi
      return;
    }

    if (!webcamRef.current?.video || neutralY === null) {
      requestRef.current = requestAnimationFrame(detectAndScroll);
      return;
    }

    const video = webcamRef.current.video;
    
    if (video.readyState === 4 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      try {
        const results = detectFaceSafe(video);
        
        if (results && results.faceLandmarks?.length > 0) {
          const nose = results.faceLandmarks[0][1];
          const differenceY = nose.y - neutralY;
          
          const threshold = 0.04 - (sensitivity / 3000); 

          if (Math.abs(differenceY) > threshold) {
            const excess = Math.abs(differenceY) - threshold;
            const rawSpeed = excess * 1000 * (sensitivity / 50);
            
            targetSpeedRef.current = differenceY > 0 ? rawSpeed : -rawSpeed;
          } else {
            targetSpeedRef.current = 0; 
          }
        } else {
          targetSpeedRef.current = 0; 
        }
      } catch (err) {
      }
    }

    currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.08;

    //  3. EKSEKUSI SCROLLING: Menangani 2 halaman (Play Mode 1 dan Play Mode 2)
    if (Math.abs(currentSpeedRef.current) > 0.1) {
      // Mencari container lirik baik dari halaman rekomendasi maupun halaman paste chord
      const lyricsContainer = document.getElementById('lyrics-container') || document.getElementById('lyrics-container-pasted');
      
      if (lyricsContainer) {
        lyricsContainer.scrollBy({ top: currentSpeedRef.current, behavior: 'auto' });
      } else {
        window.scrollBy({ top: currentSpeedRef.current, left: 0, behavior: 'auto' });
      }
    }

    requestRef.current = requestAnimationFrame(detectAndScroll);
  }, [webcamRef, neutralY, sensitivity, isSmartMode]); // <-- Menambahkan isSmartMode sebagai dependency

  useEffect(() => {
    if (neutralY !== null) {
      requestRef.current = requestAnimationFrame(detectAndScroll);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [detectAndScroll, neutralY]);

  return { isAiLoaded, calibrateNeutralPosition, isCalibrated: neutralY !== null };
}