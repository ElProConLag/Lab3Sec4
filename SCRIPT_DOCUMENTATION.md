# 📊 Script Interactivo de Web Scraping - Documentación

## 🎯 Descripción General

El script `extract-js-interactive.js` es una herramienta automatizada que permite resolver CAPTCHAS manualmente en un navegador y luego analizar completamente el sitio web real para extraer todas las funciones JavaScript.

## 🚀 Características

- ✅ **Interfaz Visual**: Abre un navegador Chromium real (no headless)
- ✅ **Resolución Manual de CAPTCHA**: Espera a que resuelvas el CAPTCHA interactivamente
- ✅ **Análisis Completo**: Extrae funciones de scripts inline y externos
- ✅ **Reportes Detallados**: Genera JSON y TXT con toda la información
- ✅ **Información de Página**: Captura formularios, inputs, botones, enlaces
- ✅ **Almacenamiento Timestamped**: Guarda reportes con fecha/hora únicos

## 📦 Instalación

El script requiere tener Puppeteer instalado. Si no lo está:

```bash
cd /home/camilo/Descargas/lab3
npm install puppeteer
```

## 🎮 Uso

### Ejecución Básica

```bash
cd /home/camilo/Descargas/lab3
node extract-js-interactive.js
```

### Con Timeout (Máximo 3 minutos de espera)

```bash
timeout 180 node extract-js-interactive.js
```

## 📋 Flujo de Ejecución

1. **Iniciación**: Puppeteer inicia un navegador Chromium visible
2. **Navegación**: Se accede a la URL especificada (ej. https://www.linuxquestions.org/questions/login.php)
3. **Pausa Interactiva**: El script pausa y muestra:
   - "✅ El navegador está abierto. Por favor:"
   - "1. Resuelve el CAPTCHA en la ventana del navegador"
   - "2. Completa cualquier verificación que se requiera"
   - "3. Presiona ENTER en esta consola cuando termines"
4. **Espera Manual**: El usuario resuelve el CAPTCHA en el navegador
5. **Presionar ENTER**: Una vez resuelta la verificación, el usuario presiona ENTER en la terminal
6. **Análisis**: El script espera 3-8 segundos para que se cargue el contenido real
7. **Extracción**: Analiza todos los scripts (inline y externos)
8. **Reporte**: Genera y guarda dos archivos de reporte

## 📊 Resultado de Ejecución

### Para https://www.linuxquestions.org/questions/login.php

**Estadísticas Capturadas:**
- Total de funciones JavaScript: **5,178**
- Scripts externos: **14**
- Funciones en scripts inline: **2**
- Formularios en la página: **7**
- Inputs (campos de formulario): **33**
- Enlaces: **57**

**Funciones Inline Encontradas:**
1. `gtag` - Google Analytics tracking
2. `log_out` - Función de logout

**Scripts Externos Analizados:**
1. Google AdSense (621 funciones)
2. Google Analytics (múltiples funciones)
3. Otros scripts de terceros (total 5,176 funciones)

## 📁 Archivos Generados

El script genera dos archivos con timestamp en `/home/camilo/Descargas/lab3/`:

### 1. JSON Report: `linuxquestions-real-YYYY-MM-DDTHH-MM-SS.json`
Formato estructurado con:
- URL y título de la página
- Resumen de estadísticas
- Funciones inline (lista completa)
- Funciones por script externo (lista completa con tamaño)
- Información de elementos en la página

### 2. TXT Report: `linuxquestions-real-YYYY-MM-DDTHH-MM-SS.txt`
Formato legible con:
- Información de la página
- Resumen de estadísticas
- Listado de funciones organizadas por origen
- Tamaño de scripts en KB

## 🔍 Cómo Funciona la Extracción de Funciones

El script busca patrones regex para identificar funciones:

```javascript
// Patrones buscados:
1. function nombreFuncion() { ... }
2. const nombreFuncion = function() { ... }
3. const nombreFuncion = () => { ... }
4. let nombreFuncion = async () => { ... }
5. var nombreFuncion = function() { ... }
6. propiedad: function() { ... }
```

## 🛠️ Personalización

### Cambiar la URL

Edita la línea en el script:

```javascript
await page.goto('https://www.linuxquestions.org/questions/login.php', {
  waitUntil: 'networkidle2'
});
```

Reemplaza la URL con cualquier sitio web.

### Ajustar Tiempo de Espera

Busca esta línea y modifica el valor en milisegundos:

```javascript
await new Promise(resolve => setTimeout(resolve, 3000)); // 3000 ms = 3 segundos
```

### Limitar Número de Scripts Externos

Si solo quieres analizar los primeros N scripts, modifica:

```javascript
for (let i = 0; i < pageAnalysis.externalScripts.length && i < 5; i++) {
```

## 🔧 Opciones Avanzadas

### Desactivar Pantalla

Para ejecutar en headless (sin ventana visible):

```javascript
const browser = await puppeteer.launch({
  headless: true, // Cambiar a true
  args: [...]
});
```

### Esperar Más Tiempo

Para sitios lentos, aumenta el timeout en millisegundos:

```javascript
page.setDefaultNavigationTimeout(300000); // 5 minutos
page.setDefaultTimeout(300000);
```

## 📋 Ejemplo de Salida

```
================================================================================
EXTRACTOR DE FUNCIONES JAVASCRIPT - MODO INTERACTIVO
================================================================================

📱 Iniciando Puppeteer con interfaz visible...
🌐 Navegando a https://www.linuxquestions.org/questions/login.php...

================================================================================
⏳ CAPTCHA DETECTADO
================================================================================

✅ El navegador está abierto. Por favor:
   1. Resuelve el CAPTCHA en la ventana del navegador
   2. Completa cualquier verificación que se requiera
   3. Presiona ENTER en esta consola cuando termines

Presiona ENTER cuando hayas resuelto el CAPTCHA: [ESPERA ENTRADA DEL USUARIO]

⏳ Esperando a que se cargue la página real...
📊 Analizando la página...

📄 INFORMACIÓN DE LA PÁGINA:
────────────────────────────────────────────────────────────────────────────────
Título: LinuxQuestions.org
URL actual: https://www.linuxquestions.org/questions/login.php
Total de tags <script>: 16
Scripts externos: 14
Scripts inline: 2

Elementos en la página:
  - Formularios: 7
  - Inputs: 33
  - Botones: 0
  - Enlaces: 57

📥 Analizando scripts inline...
  ✓ 2 funciones encontradas

📥 Descargando y analizando scripts externos...

[1/14] https://pagead2.googlesyndication.com/...
  ✓ 621 funciones (184.10 KB)

[2/14] https://www.google-analytics.com/...
  ✓ 523 funciones (156.32 KB)

... [más scripts] ...

✓ Reporte JSON guardado en: /home/camilo/Descargas/lab3/linuxquestions-real-2025-10-17T00-20-58.json
✓ Reporte de texto guardado en: /home/camilo/Descargas/lab3/linuxquestions-real-2025-10-17T00-20-58.txt

================================================================================
RESUMEN FINAL
================================================================================
...
```

## ⚠️ Consideraciones Importantes

1. **Navegador Visible**: El script abre un navegador real, no headless. Asegúrate de que tu pantalla esté disponible.

2. **Tiempo Límite**: Si ejecutas con `timeout 180`, tienes 3 minutos para resolver el CAPTCHA.

3. **Conexión a Internet**: Requiere conexión activa para descargar scripts externos.

4. **Protección Anti-Bot**: Algunos sitios pueden bloquear scraping. Este script intenta evitarlo con flags específicos.

5. **Funciones Ofuscadas**: Los nombres de funciones pueden ser ofuscados (a, b, c, etc.) si el código está minificado.

## 🐛 Solución de Problemas

### "page.waitForTimeout is not a function"
Esta función se deprecó. El script ya usa `setTimeout` en su lugar.

### El navegador no se abre
Instala las dependencias de Chromium:
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgnome-keyring0 libgtk-3.0 libharfbuzz0b libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxinerama1 libxrandr2 libxrender1 libxss1 libxtst6 libappindicator1 libindicator7 lsb-release fonts-liberation xdg-utils
```

### El CAPTCHA no se resuelve
Algunos CAPTCHA requieren interacción adicional. Intenta:
1. Hacer clic en el checkbox del CAPTCHA
2. Completar cualquier puzzle o desafío adicional
3. Esperar a que aparezca un botón de envío

### Error de "Timed out after 120000ms"
Aumenta el timeout en el script o resuelve el CAPTCHA más rápidamente.

## 📚 Referencias

- Puppeteer: https://pptr.dev/
- Cloudflare Challenge: https://www.cloudflare.com/en-gb/products/bot-management/
- JavaScript Parsing: RegExp patterns para detección de funciones

---

**Última actualización**: 2025-10-17
**Versión**: 2.0 - Modo Interactivo
