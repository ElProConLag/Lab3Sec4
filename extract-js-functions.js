const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    console.log('Iniciando Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar timeout
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    console.log('Navegando a https://www.linuxquestions.org/questions/login.php...');
    await page.goto('https://www.linuxquestions.org/questions/login.php', {
      waitUntil: 'networkidle2'
    });

    console.log('Página cargada. Esperando scripts...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar a que se carguen los scripts

    // Extraer todas las funciones JavaScript definidas en la página
    const jsCode = await page.evaluate(() => {
      const allScripts = Array.from(document.querySelectorAll('script'))
        .filter(script => script.textContent && !script.src) // Scripts inline
        .map(script => script.textContent)
        .join('\n\n');

      const externalScripts = Array.from(document.querySelectorAll('script[src]'))
        .map(script => ({
          src: script.src,
          type: script.type || 'text/javascript'
        }));

      return {
        inlineScripts: allScripts,
        externalScripts: externalScripts,
        allScriptTags: document.querySelectorAll('script').length
      };
    });

    console.log(`\n=== RESUMEN ===`);
    console.log(`Total de tags <script>: ${jsCode.allScriptTags}`);
    console.log(`Scripts externos: ${jsCode.externalScripts.length}`);
    console.log(`\n=== SCRIPTS EXTERNOS ===`);
    jsCode.externalScripts.forEach((script, i) => {
      console.log(`${i + 1}. ${script.src}`);
    });

    // Extraer funciones usando regex
    const functionPattern = /(?:function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)|let\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)|var\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>))/g;

    let match;
    const functions = new Set();

    while ((match = functionPattern.exec(jsCode.inlineScripts)) !== null) {
      const funcName = match[1] || match[2] || match[3] || match[4];
      if (funcName) {
        functions.add(funcName);
      }
    }

    console.log(`\n=== FUNCIONES ENCONTRADAS EN SCRIPTS INLINE ===`);
    console.log(`Total: ${functions.size}`);
    
    if (functions.size > 0) {
      Array.from(functions).sort().forEach((func, i) => {
        console.log(`${i + 1}. ${func}`);
      });
    } else {
      console.log('No se encontraron funciones nombradas en scripts inline.');
    }

    // Intentar extraer funciones de scripts externos
    console.log(`\n=== ANALIZANDO SCRIPTS EXTERNOS ===`);
    for (let i = 0; i < jsCode.externalScripts.length && i < 5; i++) { // Limitar a 5 scripts externos
      const script = jsCode.externalScripts[i];
      console.log(`\nDescargando: ${script.src}`);
      
      try {
        const response = await page.goto(script.src, { waitUntil: 'networkidle0' });
        const scriptContent = await page.content();
        
        // Buscar funciones en el script externo
        let externalMatch;
        const externalFunctions = new Set();
        
        while ((externalMatch = functionPattern.exec(scriptContent)) !== null) {
          const funcName = externalMatch[1] || externalMatch[2] || externalMatch[3] || externalMatch[4];
          if (funcName) {
            externalFunctions.add(funcName);
          }
        }

        if (externalFunctions.size > 0) {
          console.log(`  Funciones encontradas: ${externalFunctions.size}`);
          Array.from(externalFunctions).sort().slice(0, 10).forEach(func => {
            console.log(`    - ${func}`);
          });
          if (externalFunctions.size > 10) {
            console.log(`    ... y ${externalFunctions.size - 10} más`);
          }
        }
      } catch (error) {
        console.log(`  Error al procesar: ${error.message}`);
      }
    }

    // Guardar reporte en archivo
    const report = {
      url: 'https://www.linuxquestions.org/questions/login.php',
      timestamp: new Date().toISOString(),
      totalScriptTags: jsCode.allScriptTags,
      externalScripts: jsCode.externalScripts,
      inlineFunctions: Array.from(functions).sort(),
      inlineFunctionsCount: functions.size
    };

    fs.writeFileSync(
      '/home/camilo/Descargas/lab3/js-functions-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log(`\n✓ Reporte guardado en: /home/camilo/Descargas/lab3/js-functions-report.json`);

    // Guardar también el contenido de scripts inline
    fs.writeFileSync(
      '/home/camilo/Descargas/lab3/inline-scripts.js',
      jsCode.inlineScripts
    );

    console.log(`✓ Scripts inline guardados en: /home/camilo/Descargas/lab3/inline-scripts.js`);

    await browser.close();
    console.log('\n✓ Script completado exitosamente.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
