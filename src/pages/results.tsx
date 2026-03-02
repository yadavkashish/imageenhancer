import React, { useState } from "react";
import { Button, Rows, Columns, Text } from "@canva/app-ui-kit";
import { useNavigate } from "react-router-dom";
import { addNativeElement } from "@canva/design";
import { useAppContext } from "../context/app_context"; 
import { AppError } from "../components";

export const ResultsPage = () => {
  const navigate = useNavigate();
  const { imagePreviewUrl, resultImageUrl } = useAppContext(); 
  const [sliderPos, setSliderPos] = useState(50);
  const [isAdding, setIsAdding] = useState(false);

  // ✅ Helper function to guarantee we feed Canva a valid Base64 string
  const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If it's already a Data URL, we're good to go!
      if (url.startsWith("data:")) {
        return resolve(url); 
      }
      
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Prevents tainted canvas errors
      
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

const handleAddToDesign = async () => {
    if (!resultImageUrl) return;
    try {
      setIsAdding(true);
      
      // Ensure the URL is properly formatted for Canva
      const safeDataUrl = await getBase64Image(resultImageUrl);

      // ✅ Lowercase "image" and explicitly undefined altText!
      await addNativeElement({
        type: "image", 
        dataUrl: safeDataUrl,
        altText: undefined, // This satisfies TypeScript and prevents the length crash
      });
      
    } catch (e) {
      console.error("Failed to add to design:", e);
    } finally {
      setIsAdding(false);
    }
  };

  if (!resultImageUrl || !imagePreviewUrl) {
    return (
      <Rows spacing="2u">
        <Text>No image found. Please upload an image first.</Text>
        <Button variant="primary" onClick={() => navigate("/")} stretch>Start over</Button>
      </Rows>
    );
  }

  return (
    <Rows spacing="3u">
      <AppError />
      <div style={{ fontWeight: "bold", fontSize: "16px", color: "#0d1216" }}>
        Enhancement Complete
      </div>

      <div style={{ position: "relative", width: "100%", height: "250px", backgroundColor: "#f2f2f5", borderRadius: "8px", overflow: "hidden" }}>
         <img src={imagePreviewUrl} alt="Before" style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", top: 0, left: 0 }} />
         <img src={resultImageUrl} alt="After" style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", top: 0, left: 0, clipPath: `inset(0 0 0 ${sliderPos}%)` }} />
         
         <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: "2px", backgroundColor: "white", boxShadow: "0 0 4px rgba(0,0,0,0.5)", transform: "translateX(-50%)", pointerEvents: "none" }} />

         <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} 
           style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", margin: 0 }} 
         />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}>
         <div style={{ color: "#5e6e82", fontSize: "12px", fontWeight: "bold" }}>Before</div>
         <div style={{ color: "#5e6e82", fontSize: "12px", fontWeight: "bold" }}>After</div>
      </div>

      <Columns spacing="2u">
        <Button variant="secondary" stretch onClick={() => navigate("/")}>Start over</Button>
        <Button variant="primary" stretch onClick={handleAddToDesign} loading={isAdding}>Add to design</Button>
      </Columns>
    </Rows>
  );
};