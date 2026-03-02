import React, { useRef } from "react";
import { Button, Rows } from "@canva/app-ui-kit";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context"; 

export const UploadPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setImagePreviewUrl } = useAppContext();
  const navigate = useNavigate();

  const handleUploadClick = () => {
    // This virtually "clicks" the hidden HTML file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 1. Create a local temporary URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      
      // 2. Save it to our global AppContext
      setImagePreviewUrl(imageUrl);
      
      // 3. Send the user to the sliders page!
      navigate("/generate"); 
    }
  };

  return (
    <Rows spacing="3u">
      {/* Title */}
      <div style={{ fontWeight: "bold", fontSize: "14px", color: "#0d1216" }}>
        Original Image
      </div>

      {/* Upload Box Area */}
      <div 
        style={{ 
          border: "1px dashed #ccc", 
          padding: "24px 16px", 
          borderRadius: "8px", 
          textAlign: "center",
          backgroundColor: "#fafafa"
        }}
      >
        {/* Hidden input to handle the actual file selection from the device gallery */}
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        
        {/* Canva UI Button that triggers the hidden input */}
        <Button variant="secondary" onClick={handleUploadClick}>
          Choose file
        </Button>
      </div>

      {/* Helper text below the box */}
      <div style={{ color: "#5e6e82", fontSize: "12px", lineHeight: "1.4" }}>
        Upload an image or select one in your design to enlarge
      </div>
    </Rows>
  );
};