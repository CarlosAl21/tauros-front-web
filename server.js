const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const buildPath = path.join(__dirname, 'build');

const runDevServer = process.argv.includes('dev');

function startDevServer() {
  const isWindows = process.platform === 'win32';
  const devCommand = 'npm run start:dev';
  const child = spawn(isWindows ? 'cmd.exe' : 'sh', isWindows ? ['/c', devCommand] : ['-c', devCommand], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('No se pudo iniciar el modo desarrollo:', error.message);
    process.exit(1);
  });
}

function startProductionServer() {
  // Verificar que la carpeta build existe
  if (!fs.existsSync(buildPath)) {
    console.error('ERROR: La carpeta "build" no existe. Ejecuta "npm run build" primero.');
    process.exit(1);
  }

  // Middleware de headers de seguridad
  app.use((req, res, next) => {
    // Content Security Policy (CSP)
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' https://fonts.googleapis.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https: wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );

    // Anti-Clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    // HSTS (HTTP Strict Transport Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubdomains; preload');

    next();
  });

  // Servir archivos estáticos desde la carpeta build.
  // index.html se sirve con no-cache (su contenido referencia los bundles con
  // hash; cachearlo 1 año dejaría a los usuarios recurrentes apuntando a
  // archivos que ya no existen después de cada deploy). Los archivos con hash
  // en el nombre (JS/CSS) sí se cachean de forma agresiva e inmutable.
  app.use(express.static(buildPath, {
    maxAge: '1y',
    etag: false,
    setHeaders: (res, filePath) => {
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\.\w+\.(js|css)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));

  // SPA fallback: para cualquier ruta que no sea un archivo estático, servir index.html
  // Esto permite que React Router maneje el enrutamiento en el cliente
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');

    // Verificar que index.html existe antes de intentar servirlo
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send('Error: index.html no encontrado');
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexPath);
  });

  // Manejo de errores
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Error interno del servidor');
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Servidor ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`✓ SPA routing habilitado - React Router manejará todas las rutas`);
  });
}

if (runDevServer) {
  startDevServer();
} else {
  startProductionServer();
}
