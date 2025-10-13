import { useState } from 'react';
import { Box, Stack, Button } from '@mui/material';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

interface ScannerProps {
  onResult: (isbnOrUpc: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (err: string) => void;
}

export default function Scanner({ onResult, loading, setLoading, setError }: ScannerProps) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    setError("");
    setLoading(true);
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.EAN_8,
        BarcodeFormat.EAN_13,
      ]);
      const codeReader = new BrowserMultiFormatReader(hints);
      window.codeReader = codeReader;
      const constraints = { video: { facingMode: "environment" } as MediaTrackConstraints };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.getElementById("video") as HTMLVideoElement;
      videoElement.srcObject = stream;
      await videoElement.play();
      setScanning(true);
      codeReader.decodeFromVideoDevice(null, "video", async (result) => {
        if (result) {
          const isbnOrUpc = result.getText();
          codeReader.reset();
          (stream.getTracks() || []).forEach((t) => t.stop());
          videoElement.srcObject = null;
          setScanning(false);
          setLoading(false);
          onResult(isbnOrUpc);
        }
      });
    } catch (err: any) {
      setError(err.message || "Scanner error");
      setLoading(false);
      setScanning(false);
    }
  };

  return (
    <Box p={2}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {!scanning && (
          <Button variant="contained" onClick={handleScan} disabled={loading}>
            Start Scanner
          </Button>
        )}
        {scanning && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              const videoElement = document.getElementById("video") as HTMLVideoElement;
              if (videoElement && videoElement.srcObject) {
                (videoElement.srcObject as MediaStream)
                  .getTracks()
                  .forEach((track) => track.stop());
                videoElement.srcObject = null;
              }
              if (window.codeReader && typeof window.codeReader.reset === 'function') {
                window.codeReader.reset();
              }
              setScanning(false);
            }}
          >
            Stop Scanner
          </Button>
        )}
      </Stack>
      <video id="video" width="300" height="200" style={{ border: "1px solid black" }} />
    </Box>
  );
}
