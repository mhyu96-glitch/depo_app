import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [brandColor, setBrandColor] = useState(() => localStorage.getItem('brandColor') || '#3b82f6'); // Default primary blue
  const [brandName, setBrandName] = useState(() => localStorage.getItem('brandName') || 'Depo Pro');

  useEffect(() => {
    const root = document.documentElement;
    // Dark Mode
    if (dark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else       { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    
    // Brand Color (Dynamic Primary)
    root.style.setProperty('--color-primary', brandColor);
    root.style.setProperty('--color-primary-dark', shadeColor(brandColor, -20));
    root.style.setProperty('--color-primary-light', shadeColor(brandColor, 20));
    localStorage.setItem('brandColor', brandColor);
  }, [dark, brandColor]);

  useEffect(() => {
    localStorage.setItem('brandName', brandName);
  }, [brandName]);

  const toggle = () => setDark(d => !d);

  // Helper to shade colors for hover/active states
  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));
    return "#"+RR+GG+BB;
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle, brandColor, setBrandColor, brandName, setBrandName }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
