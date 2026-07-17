// Import estatico (en vez de import() dinamico) para que este codigo quede
// empaquetado en el bundle principal, cubierto por el SRI que genera
// add-sri.js. Un chunk separado por code-splitting quedaria sin integrity.
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    try {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    } catch (_err) {
      // Uso opcional/best-effort: nunca debe romper el arranque de la app.
    }
  }
};

export default reportWebVitals;
