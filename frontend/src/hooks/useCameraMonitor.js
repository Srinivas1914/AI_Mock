import { useEffect, useRef, useState, useCallback } from 'react'
import { API } from '../context/AuthContext'

const ALERT_TYPES = {
  FACE_MISSING: 'face_missing',
  MULTIPLE_FACES: 'multiple_faces',
  LOOKING_AWAY: 'looking_away',
}

const ALERT_MESSAGES = {
  face_missing: '⚠️ Face not detected — please stay in frame',
  multiple_faces: '🚨 Multiple faces detected',
  looking_away: '👀 Please look at the screen',
}

export function useCameraMonitor({ enabled = false, sessionId = null } = {}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const faceApiRef = useRef(null)
  const modelsLoaded = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [currentAlert, setCurrentAlert] = useState(null)
  const [faceStatus, setFaceStatus] = useState('idle') // idle | ok | warning | danger
  const [faceCount, setFaceCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load face-api.js models from CDN
  const loadModels = useCallback(async () => {
    try {
      if (modelsLoaded.current) return true
      const faceapi = await import('face-api.js')
      faceApiRef.current = faceapi
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ])
      modelsLoaded.current = true
      return true
    } catch (e) {
      console.warn('Face-api models failed, using fallback detection:', e.message)
      return false
    }
  }, [])

  const logAlert = useCallback(async (alertType) => {
    const alert = {
      id: Date.now(),
      type: alertType,
      message: ALERT_MESSAGES[alertType],
      timestamp: new Date().toISOString(),
    }
    setAlerts(prev => [alert, ...prev.slice(0, 49)])
    setCurrentAlert(alert)
    setTimeout(() => setCurrentAlert(null), 4000)

    try {
      await API.post('/alerts', {
        alert_type: alertType,
        timestamp: alert.timestamp,
        session_id: sessionId,
      })
    } catch (_) {}
  }, [sessionId])

  // Fallback: simple brightness-based face check
  const fallbackDetect = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    canvas.width = 160
    canvas.height = 120
    ctx.drawImage(video, 0, 0, 160, 120)

    const data = ctx.getImageData(60, 20, 40, 80).data
    let brightness = 0
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    brightness /= (data.length / 4)

    const detected = brightness > 30 && brightness < 240
    setFaceCount(detected ? 1 : 0)
    setFaceStatus(detected ? 'ok' : 'warning')
    if (!detected) logAlert(ALERT_TYPES.FACE_MISSING)
  }, [logAlert])

  // Main face-api detection
  const detectFaces = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    const faceapi = faceApiRef.current
    if (!faceapi || !modelsLoaded.current) {
      fallbackDetect()
      return
    }

    try {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      ).withFaceLandmarks(true)

      const count = detections.length
      setFaceCount(count)

      if (count === 0) {
        setFaceStatus('danger')
        logAlert(ALERT_TYPES.FACE_MISSING)
      } else if (count > 1) {
        setFaceStatus('danger')
        logAlert(ALERT_TYPES.MULTIPLE_FACES)
      } else {
        // Check if looking at screen using nose/eye landmarks
        const landmarks = detections[0].landmarks
        const nose = landmarks.getNose()[3]
        const leftEye = landmarks.getLeftEye()[0]
        const rightEye = landmarks.getRightEye()[3]
        const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
        const deviation = Math.abs(nose.x - eyeCenter.x)

        if (deviation > 30) {
          setFaceStatus('warning')
          logAlert(ALERT_TYPES.LOOKING_AWAY)
        } else {
          setFaceStatus('ok')
        }
      }
    } catch (e) {
      fallbackDetect()
    }
  }, [logAlert, fallbackDetect])

  const startCamera = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      await loadModels()
      intervalRef.current = setInterval(detectFaces, 2500)
    } catch (e) {
      setError(e.message.includes('Permission') ? 'Camera permission denied' : 'Camera unavailable')
    } finally {
      setLoading(false)
    }
  }, [loadModels, detectFaces])

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
    setFaceStatus('idle')
    setFaceCount(0)
  }, [])

  useEffect(() => {
    if (enabled) startCamera()
    return () => stopCamera()
  }, [enabled])

  return {
    videoRef, canvasRef,
    cameraActive, faceStatus, faceCount,
    alerts, currentAlert,
    loading, error,
    startCamera, stopCamera,
  }
}
