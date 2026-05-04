/**
 * Script para agregar Subresource Integrity (SRI) a archivos HTML generados
 * Calcula hash SHA-384 de cada script y stylesheet
 * Se ejecuta después de `npm run build`
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateSRI(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const hash = crypto
    .createHash('sha384')
    .update(content, 'utf-8')
    .digest('base64');
  return `sha384-${hash}`;
}

function processHTMLFiles() {
  const buildDir = path.join(__dirname, 'build');
  const indexPath = path.join(buildDir, 'index.html');

  if (!fs.existsSync(buildDir)) {
    console.error('❌ La carpeta "build" no existe. Ejecuta "npm run build" primero.');
    return;
  }

  if (!fs.existsSync(indexPath)) {
    console.error('❌ El archivo index.html no se encontró en la carpeta build.');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  let modified = false;

  // Procesar scripts
  const scriptRegex = /<script[^>]*src="([^"]*)"[^>]*><\/script>/g;
  html = html.replace(scriptRegex, (match, src) => {
    // Solo agregar SRI a archivos locales con hash (versionados)
    if (src.includes('/static/js/') && /\.[a-f0-9]+\.js$/.test(src)) {
      const filePath = path.join(buildDir, src.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const sri = calculateSRI(filePath);
        console.log(`✓ SRI agregado a script: ${src}`);
        console.log(`  Integrity: ${sri}`);
        modified = true;
        return match.replace(/\/>/, ` integrity="${sri}" />`).replace(/><\/script>/, ` integrity="${sri}"><\/script>`);
      }
    }
    return match;
  });

  // Procesar stylesheets
  const linkRegex = /<link[^>]*href="([^"]*)"[^>]*rel="stylesheet"[^>]*>/g;
  html = html.replace(linkRegex, (match, href) => {
    // Solo agregar SRI a archivos locales con hash (versionados)
    if (href.includes('/static/css/') && /\.[a-f0-9]+\.css$/.test(href)) {
      const filePath = path.join(buildDir, href.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const sri = calculateSRI(filePath);
        console.log(`✓ SRI agregado a stylesheet: ${href}`);
        console.log(`  Integrity: ${sri}`);
        modified = true;
        return match.replace(/\/>/, ` integrity="${sri}" />`).replace(/>/, ` integrity="${sri}">`);
      }
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(indexPath, html, 'utf-8');
    console.log('\n✅ Archivo index.html actualizado con atributos SRI');
  } else {
    console.log('⚠️ No se encontraron archivos versionados para agregar SRI');
  }
}

// Ejecutar el script
processHTMLFiles();
