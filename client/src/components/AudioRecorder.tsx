import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

export function AudioRecorder({ onRecordingComplete, isProcessing = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up stream/timer on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately, we just need permission
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError("Microphone permission denied. Please enable it in your browser settings.");
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      // Use webm with opus codec for better browser compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setHasPermission(false);
      setError("Failed to start recording. Please check your microphone.");
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const handleAnalyze = () => {
    if (audioBlob) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.webm`;
      onRecordingComplete(audioBlob, filename);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="text-center py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-md mx-auto">
          <Mic className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={checkMicrophonePermission} variant="outline">
            Retry Permission
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyzing Recording...</h3>
            <p className="text-muted-foreground">This may take a moment</p>
          </motion.div>
        ) : audioBlob ? (
          <motion.div
            key="recorded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center w-full"
          >
            <div className="bg-muted rounded-full p-6 mb-6">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Recording Complete</h3>
            <p className="text-muted-foreground mb-4">Duration: {formatTime(recordingTime)}</p>
            
            {audioUrl && (
              <audio 
                controls 
                src={audioUrl} 
                className="mb-6 w-full max-w-md"
              />
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={discardRecording} 
                variant="outline"
                className="rounded-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Discard
              </Button>
              <Button 
                onClick={handleAnalyze}
                size="lg"
                className="rounded-full px-8 shadow-lg shadow-primary/20"
              >
                Analyze Recording
              </Button>
            </div>
          </motion.div>
        ) : isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6">
              <motion.div 
                className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
              <div className="relative bg-red-500 rounded-full p-6">
                <Mic className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-red-500">Recording...</h3>
            <p className="text-3xl font-mono font-bold mb-6">{formatTime(recordingTime)}</p>
            <Button 
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="rounded-full px-8"
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              Stop Recording
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            <div className="bg-muted rounded-full p-6 mb-6 hover:bg-primary/10 transition-all duration-300">
              <Mic className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Record</h3>
            <p className="text-muted-foreground mb-8 max-w-xs text-center">
              Click the button below to start recording your conversation
            </p>
            <Button 
              onClick={startRecording}
              size="lg"
              className="rounded-full px-8 shadow-lg shadow-primary/20"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !audioBlob && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive max-w-md"
        >
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
