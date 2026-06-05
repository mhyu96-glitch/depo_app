import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, Loader } from 'lucide-react';
import { attendanceApi } from '../api';
import { useAuth } from '../context/AuthContext';

const FaceAttendance = ({ onSuccess, onCancel, courierId = null, type = 'check_in' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    setError('');
    setMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser tidak mendukung akses camera. Gunakan Chrome/Brave terbaru.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      let msg = 'Tidak dapat mengakses camera. Pastikan permission camera diizinkan.';
      if (err.name === 'NotAllowedError') {
        msg = 'Izin camera ditolak. Klik icon camera di address bar lalu pilih Allow.';
      } else if (err.name === 'NotFoundError') {
        msg = 'Camera tidak ditemukan di perangkat ini.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera sedang dipakai aplikasi lain. Tutup aplikasi kamera/meeting lalu coba lagi.';
      }
      setError(msg);
      console.error('Camera error:', err);
    }
  };

  useEffect(() => {
    if (cameraActive && streamRef.current) {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((err) => {
          console.error('Video play error:', err);
          setError('Camera aktif, tetapi preview gagal diputar. Coba tutup dan buka ulang modal.');
        });
      }
    }
  }, [cameraActive]);

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Get GPS location
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Tidak dapat mendapatkan lokasi GPS'));
        }
      );
    });
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();

    // Get location
    try {
      const loc = await getLocation();
      setLocation(loc);
      setMessage('Foto berhasil diambil. Lokasi terdeteksi.');
    } catch (err) {
      setError('Lokasi GPS tidak terdeteksi. Lanjutkan tanpa lokasi?');
    }
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!capturedImage) {
      setError('Ambil foto terlebih dahulu');
      return;
    }

    // Determine courier_id: use prop if provided, otherwise use user.courier_id or user.id
    let effectiveCourierId = courierId;
    
    if (!effectiveCourierId) {
      // Try to get courier_id from user object
      if (user?.courier_id) {
        effectiveCourierId = user.courier_id;
      } else if (user?.id) {
        // Fallback to user.id if no courier_id (for admin doing attendance)
        effectiveCourierId = user.id;
      }
    }
    
    if (!effectiveCourierId) {
      setError('Courier ID tidak ditemukan. Hubungi administrator.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        courier_id: effectiveCourierId,
        face_data: capturedImage,
        location_lat: location?.lat || null,
        location_lng: location?.lng || null,
        device_info: navigator.userAgent
      };

      console.log('Submitting attendance with payload:', { 
        ...payload, 
        face_data: '[IMAGE_DATA]' // Don't log actual image data
      });

      const response = await attendanceApi.faceAttendance(payload);
      
      setMessage(response.data.message || 'Absensi berhasil!');
      setTimeout(() => {
        if (onSuccess) onSuccess(response.data);
      }, 1500);
      
    } catch (err) {
      console.error('Face attendance error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Gagal submit absensi. Periksa koneksi internet.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Absensi dengan Wajah - {type === 'check_in' ? 'Check In' : 'Check Out'}
          </h2>
        </div>

        <div className="p-6">
          {/* Error/Success Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {message}
            </div>
          )}

          {/* Camera/Image Preview */}
          <div className="mb-6">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {!cameraActive && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={startCamera}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Buka Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={capturePhoto}
                      className="bg-white text-gray-800 px-6 py-3 rounded-full shadow-lg hover:bg-gray-100 font-semibold"
                    >
                      📸 Ambil Foto
                    </button>
                  </div>
                </>
              )}

              {capturedImage && (
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Location Info */}
          {location && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">
                Lokasi: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          )}

          {/* Instructions */}
          {!capturedImage && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">📋 Instruksi:</h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Pastikan wajah Anda terlihat jelas</li>
                <li>Gunakan pencahayaan yang cukup</li>
                <li>Posisikan wajah di tengah frame</li>
                <li>Lepas masker/kacamata hitam jika memungkinkan</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {capturedImage && !loading && (
              <>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setLocation(null);
                    setMessage('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  🔄 Ambil Ulang
                </button>
                <button
                  onClick={submitAttendance}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  ✓ Submit Absensi
                </button>
              </>
            )}

            {loading && (
              <div className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </div>
            )}

            {!loading && (
              <button
                onClick={() => {
                  stopCamera();
                  if (onCancel) onCancel();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceAttendance;
