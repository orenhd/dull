// מקביל ל-swapImage() בדמו (script.js): כשה-src מבוקש משתנה, לא מחליפים
// את התמונה המוצגת עד שהבאה נטענה במלואה (preload עם Image() חדש) - כדי
// שההחלפה תיראה כמעבר עמעום אחד, לא הבזק של placeholder ריק. ב-React אי
// אפשר פשוט להשתמש ב-key={src} (זה היה עושה remount ומאבד את הטרנזישן),
// לכן ה-state שמוצג בפועל (`displaySrc`) מפגר בכוונה אחרי ה-prop עד שהתמונה
// החדשה מוכנה.
import { useEffect, useRef, useState } from "react";

export function useCrossfadeImage(src: string) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [isSwapping, setIsSwapping] = useState(false);
  const requestedSrc = useRef(src);

  useEffect(() => {
    requestedSrc.current = src;
    if (src === displaySrc) return;

    setIsSwapping(true);
    const img = new Image();
    img.onload = () => {
      // אם בינתיים התבקש src נוסף (למשל המשתמש לחץ שוב מהר), רק התמונה
      // האחרונה שהתבקשה תנצח - מונע "race" שבו תמונה ישנה יותר מנצחת.
      if (requestedSrc.current !== src) return;
      setDisplaySrc(src);
      setIsSwapping(false);
    };
    img.onerror = () => setIsSwapping(false);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return { displaySrc, isSwapping };
}
