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
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    console.log('Navegando a https://www.linuxquestions.org/questions/login.php...');
    await page.goto('https://www.linuxquestions.org/questions/login.php', {
      waitUntil: 'networkidle2'
    });

    console.log('Página cargada. Analizando scripts...\n');

    // Extraer información de scripts
    const scriptInfo = await page.evaluate(() => {
      return {
        externalScripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        inlineScripts: Array.from(document.querySelectorAll('script:not([src])')).length
      };
    });

    const allFunctions = {
      inlineScripts: [],
      externalScripts: {}
    };

    // Procesar scripts externos
    for (const scriptSrc of scriptInfo.externalScripts) {
      console.log(`📥 Descargando: ${scriptSrc.substring(0, 80)}...`);
      
      try {
        const response = await fetch(scriptSrc);
        const scriptContent = await response.text();

        // Extraer funciones con diferentes patrones
        const patterns = [
          /function\s+(\w+)\s*\(/g,                                           // function nombre()
          /const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g, // const nombre = function/arrow
          /let\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,   // let nombre = function/arrow
          /var\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,   // var nombre = function/arrow
          /(\w+):\s*(?:function|\([^)]*\)\s*=>)/g                             // propiedad: function
        ];

        const functions = new Set();
        
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(scriptContent)) !== null) {
            const funcName = match[1];
            if (funcName && funcName.length > 0) {
              functions.add(funcName);
            }
          }
        }

        allFunctions.externalScripts[scriptSrc] = {
          count: functions.size,
          functions: Array.from(functions).sort()
        };

        console.log(`  ✓ ${functions.size} funciones encontradas\n`);

      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
        allFunctions.externalScripts[scriptSrc] = {
          count: 0,
          functions: [],
          error: error.message
        };
      }
    }

    // Procesar scripts inline
    if (scriptInfo.inlineScripts > 0) {
      const inlineContent = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script:not([src]'))
          .map(s => s.textContent)
          .join('\n');
      });

      const patterns = [
        /function\s+(\w+)\s*\(/g,
        /const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
        /let\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
        /var\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
      ];

      const functions = new Set();
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(inlineContent)) !== null) {
          const funcName = match[1];
          if (funcName && funcName.length > 0) {
            functions.add(funcName);
          }
        }
      }

      allFunctions.inlineScripts = Array.from(functions).sort();
    }

    // Generar reporte
    const report = {
      url: 'https://www.linuxquestions.org/questions/login.php',
      timestamp: new Date().toISOString(),
      summary: {
        totalExternalScripts: Object.keys(allFunctions.externalScripts).length,
        totalInlineFunctions: allFunctions.inlineScripts.length,
        totalFunctionsInExternal: Object.values(allFunctions.externalScripts)
          .reduce((sum, s) => sum + s.count, 0)
      },
      details: allFunctions
    };

    // Guardar reporte JSON
    fs.writeFileSync(
      '/home/camilo/Descargas/lab3/linuxquestions-js-functions.json',
      JSON.stringify(report, null, 2)
    );
    console.log('✓ Reporte guardado en: linuxquestions-js-functions.json\n');

    // Generar reporte de texto
    let textReport = '='.repeat(80) + '\n';
    textReport += 'ANÁLISIS DE FUNCIONES JAVASCRIPT\n';
    textReport += 'URL: https://www.linuxquestions.org/questions/login.php\n';
    textReport += 'Fecha: ' + new Date().toISOString() + '\n';
    textReport += '='.repeat(80) + '\n\n';

    textReport += `RESUMEN:\n`;
    textReport += `- Scripts externos: ${report.summary.totalExternalScripts}\n`;
    textReport += `- Funciones en scripts inline: ${report.summary.totalInlineFunctions}\n`;
    textReport += `- Total de funciones en scripts externos: ${report.summary.totalFunctionsInExternal}\n\n`;

    if (allFunctions.inlineScripts.length > 0) {
      textReport += `FUNCIONES EN SCRIPTS INLINE (${allFunctions.inlineScripts.length}):\n`;
      textReport += '-'.repeat(40) + '\n';
      allFunctions.inlineScripts.forEach((func, i) => {
        textReport += `${i + 1}. ${func}\n`;
      });
      textReport += '\n';
    }

    textReport += `FUNCIONES EN SCRIPTS EXTERNOS:\n`;
    textReport += '='.repeat(80) + '\n';
    
    Object.entries(allFunctions.externalScripts).forEach(([script, data]) => {
      textReport += `\nScript: ${script.substring(0, 100)}${script.length > 100 ? '...' : ''}\n`;
      textReport += `Funciones: ${data.count}\n`;
      textReport += '-'.repeat(40) + '\n';
      
      if (data.functions && data.functions.length > 0) {
        data.functions.forEach((func, i) => {
          textReport += `${i + 1}. ${func}\n`;
        });
      } else if (data.error) {
        textReport += `Error: ${data.error}\n`;
      }
      textReport += '\n';
    });

    fs.writeFileSync(
      '/home/camilo/Descargas/lab3/linuxquestions-js-functions.txt',
      textReport
    );
    console.log('✓ Reporte de texto guardado en: linuxquestions-js-functions.txt\n');

    // Mostrar resumen en consola
    console.log(textReport);

    await browser.close();
    console.log('✓ Análisis completado exitosamente.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
