import type { JSX } from "react";
import { createContext, useContext, useState } from "react";

export interface AppContextType {
  appError: string;
  setAppError: (value: string) => void;
  imagePreviewUrl: string | null;
  setImagePreviewUrl: (url: string | null) => void;
  resultImageUrl: string | null;
  setResultImageUrl: (url: string | null) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provides application-wide state for the Image Enhancer app.
 */
export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  const [appError, setAppError] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  const value: AppContextType = {
    appError,
    setAppError,
    imagePreviewUrl,
    setImagePreviewUrl,
    resultImageUrl,
    setResultImageUrl,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to easily grab these values in any file
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a ContextProvider");
  }
  return context;
};