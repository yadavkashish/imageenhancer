import React, { useState } from "react";
import {
  Button,
  FormField,
  Rows,
  Slider,
  Text,
  Columns,
} from "@canva/app-ui-kit";
import { useNavigate } from "react-router-dom"; 
import { AppError } from "../components"; 
import { queueEnhancement, checkJobStatus } from "../api/api";
import { useAppContext } from "../context/app_context"; 

export const GeneratePage = () => {
  const navigate = useNavigate();
  const { imagePreviewUrl, setResultImageUrl } = useAppContext(); 
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    clarity: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });

  const handleSettingChange = (key: keyof typeof settings) => (value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartOver = () => {
    navigate("/"); 
  };

  // FIXED: Converted to use Canvas to bypass CSP blob fetch restrictions
  const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleDone = async () => {
    if (!imagePreviewUrl) return;

    try {
      setIsProcessing(true);
      
      // Conversion happens locally via Canvas now
      const base64Image = await getBase64Image(imagePreviewUrl);
      const response = await queueEnhancement(base64Image, settings);
      
      if (response?.jobId) {
        const interval = setInterval(async () => {
          const result = await checkJobStatus(response.jobId);
          
          if (result?.status === "completed" && result.resultImageUrl) {
            clearInterval(interval);
            setIsProcessing(false);
            setResultImageUrl(result.resultImageUrl); 
            navigate("/results"); 
          }
        }, 1000);
      }
    } catch (error) {
      setIsProcessing(false);
      console.error("Processing failed", error);
    }
  };

  return (
    <Rows spacing="3u">
      <AppError />

      <div 
        style={{ 
          backgroundColor: "#f2f2f5", 
          padding: "16px", 
          borderRadius: "8px", 
          textAlign: "center", 
          maxHeight: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden"
        }}
      >
        {imagePreviewUrl ? (
          <img 
            src={imagePreviewUrl} 
            alt="Uploaded preview" 
            style={{ 
              maxWidth: "100%", 
              maxHeight: "100%", 
              objectFit: "contain", 
              borderRadius: "4px",
              filter: `
                brightness(${100 + settings.brightness}%) 
                contrast(${100 + settings.contrast}%) 
                saturate(${100 + settings.saturation}%)
                ${settings.clarity < 0 ? `blur(${Math.abs(settings.clarity) / 20}px)` : ''}
              `
            }} 
          />
        ) : (
          <Text>No image uploaded</Text>
        )}
      </div>

      <Rows spacing="2u">
        <FormField label="Clarity" control={(props) => (
            <Slider {...props} min={-100} max={100} value={settings.clarity} onChange={handleSettingChange("clarity")} />
        )} />
        <FormField label="Brightness" control={(props) => (
            <Slider {...props} min={-100} max={100} value={settings.brightness} onChange={handleSettingChange("brightness")} />
        )} />
        <FormField label="Contrast" control={(props) => (
            <Slider {...props} min={-100} max={100} value={settings.contrast} onChange={handleSettingChange("contrast")} />
        )} />
        <FormField label="Saturation" control={(props) => (
            <Slider {...props} min={-100} max={100} value={settings.saturation} onChange={handleSettingChange("saturation")} />
        )} />
      </Rows>

      <Columns spacing="2u">
        <Button variant="secondary" stretch onClick={handleStartOver} disabled={isProcessing}>
          Start over
        </Button>
        <Button variant="primary" stretch onClick={handleDone} loading={isProcessing}>
          Done
        </Button>
      </Columns>
    </Rows>
  );
};

export default GeneratePage;