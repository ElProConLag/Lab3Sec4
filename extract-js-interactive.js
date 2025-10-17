const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

(async () => {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('EXTRACTOR DE FUNCIONES JAVASCRIPT - MODO INTERACTIVO');
    console.log('='.repeat(80) + '\n');

    console.log('📱 Iniciando Puppeteer con interfaz visible...');
    const browser = await puppeteer.launch({
      headless: false, // Mostrar el navegador
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

    console.log('🌐 Navegando a https://www.linuxquestions.org/questions/login.php...\n');
    await page.goto('https://www.linuxquestions.org/questions/login.php', {
      waitUntil: 'networkidle2'
    });

    console.log('\n' + '='.repeat(80));
    console.log('⏳ CAPTCHA DETECTADO');
    console.log('='.repeat(80));
    console.log('\n✅ El navegador está abierto. Por favor:');
    console.log('   1. Resuelve el CAPTCHA en la ventana del navegador');
    console.log('   2. Completa cualquier verificación que se requiera');
    console.log('   3. Presiona ENTER en esta consola cuando termines\n');

    // Esperar a que el usuario resuelva el CAPTCHA
    await question('Presiona ENTER cuando hayas resuelto el CAPTCHA: ');

    console.log('\n⏳ Esperando a que se cargue la página real...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Intentar detectar si estamos en la página real
    const isLoginPage = await page.evaluate(() => {
      const pageContent = document.body.innerText.toLowerCase();
      return pageContent.includes('login') || 
             pageContent.includes('user name') || 
             pageContent.includes('password');
    });

    if (!isLoginPage) {
      console.log('⚠️  Es posible que el CAPTCHA aún no se haya resuelto completamente.');
      console.log('⏳ Esperando 5 segundos más...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('📊 Analizando la página...\n');

    // Extraer información completa de la página
    const pageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        externalScripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
        inlineScriptsCount: document.querySelectorAll('script:not([src])').length,
        totalScriptTags: document.querySelectorAll('script').length,
        pageContent: {
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length
        }
      };
    });

    console.log('📄 INFORMACIÓN DE LA PÁGINA:');
    console.log('-'.repeat(80));
    console.log(`Título: ${pageAnalysis.title}`);
    console.log(`URL actual: ${pageAnalysis.url}`);
    console.log(`Total de tags <script>: ${pageAnalysis.totalScriptTags}`);
    console.log(`Scripts externos: ${pageAnalysis.externalScripts.length}`);
    console.log(`Scripts inline: ${pageAnalysis.inlineScriptsCount}`);
    console.log(`\nElementos en la página:`);
    console.log(`  - Formularios: ${pageAnalysis.pageContent.forms}`);
    console.log(`  - Inputs: ${pageAnalysis.pageContent.inputs}`);
    console.log(`  - Botones: ${pageAnalysis.pageContent.buttons}`);
    console.log(`  - Enlaces: ${pageAnalysis.pageContent.links}\n`);

    // Recolectar todas las funciones
    const allFunctions = {
      inlineScripts: [],
      externalScripts: {}
    };

    // Procesar scripts inline
    if (pageAnalysis.inlineScriptsCount > 0) {
      console.log('📥 Analizando scripts inline...');
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
      console.log(`  ✓ ${functions.size} funciones encontradas\n`);
    }

    // Procesar scripts externos
    console.log('📥 Descargando y analizando scripts externos...\n');
    
    for (let i = 0; i < pageAnalysis.externalScripts.length; i++) {
      const scriptSrc = pageAnalysis.externalScripts[i];
      const displayUrl = scriptSrc.length > 70 ? scriptSrc.substring(0, 70) + '...' : scriptSrc;
      console.log(`[${i + 1}/${pageAnalysis.externalScripts.length}] ${displayUrl}`);
      
      try {
        const response = await fetch(scriptSrc);
        const scriptContent = await response.text();

        const patterns = [
          /function\s+(\w+)\s*\(/g,
          /const\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
          /let\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
          /var\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>)/g,
          /(\w+):\s*(?:function|\([^)]*\)\s*=>)/g
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
          functions: Array.from(functions).sort(),
          size: scriptContent.length
        };

        console.log(`  ✓ ${functions.size} funciones (${(scriptContent.length / 1024).toFixed(2)} KB)\n`);

      } catch (error) {
        console.log(`  ✗ Error: ${error.message}\n`);
        allFunctions.externalScripts[scriptSrc] = {
          count: 0,
          functions: [],
          error: error.message
        };
      }
    }

    // Calcular estadísticas
    const totalFunctions = allFunctions.inlineScripts.length + 
      Object.values(allFunctions.externalScripts).reduce((sum, s) => sum + s.count, 0);

    // Generar reporte
    const report = {
      url: pageAnalysis.url,
      title: pageAnalysis.title,
      timestamp: new Date().toISOString(),
      pageInfo: pageAnalysis.pageContent,
      summary: {
        totalExternalScripts: Object.keys(allFunctions.externalScripts).length,
        totalInlineFunctions: allFunctions.inlineScripts.length,
        totalFunctionsInExternal: Object.values(allFunctions.externalScripts)
          .reduce((sum, s) => sum + s.count, 0),
        totalFunctions: totalFunctions
      },
      details: allFunctions
    };

    // Guardar reporte JSON
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const jsonFile = `/home/camilo/Descargas/lab3/linuxquestions-real-${timestamp}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
    console.log(`✓ Reporte JSON guardado en: ${jsonFile}`);

    // Generar reporte de texto
    let textReport = '='.repeat(80) + '\n';
    textReport += 'ANÁLISIS DE FUNCIONES JAVASCRIPT - SITIO REAL\n';
    textReport += `URL: ${pageAnalysis.url}\n`;
    textReport += `Título: ${pageAnalysis.title}\n`;
    textReport += 'Fecha: ' + new Date().toISOString() + '\n';
    textReport += '='.repeat(80) + '\n\n';

    textReport += `RESUMEN:\n`;
    textReport += `- Scripts externos: ${report.summary.totalExternalScripts}\n`;
    textReport += `- Funciones en scripts inline: ${report.summary.totalInlineFunctions}\n`;
    textReport += `- Total de funciones en scripts externos: ${report.summary.totalFunctionsInExternal}\n`;
    textReport += `- TOTAL DE FUNCIONES: ${totalFunctions}\n\n`;

    textReport += `ELEMENTOS EN LA PÁGINA:\n`;
    textReport += `- Formularios: ${pageAnalysis.pageContent.forms}\n`;
    textReport += `- Inputs: ${pageAnalysis.pageContent.inputs}\n`;
    textReport += `- Botones: ${pageAnalysis.pageContent.buttons}\n`;
    textReport += `- Enlaces: ${pageAnalysis.pageContent.links}\n\n`;

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
    
    Object.entries(allFunctions.externalScripts).forEach(([script, data], index) => {
      textReport += `\n[${index + 1}] Script: ${script.substring(0, 100)}${script.length > 100 ? '...' : ''}\n`;
      textReport += `Funciones: ${data.count}`;
      if (data.size) {
        textReport += ` | Tamaño: ${(data.size / 1024).toFixed(2)} KB`;
      }
      textReport += '\n';
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

    const textFile = `/home/camilo/Descargas/lab3/linuxquestions-real-${timestamp}.txt`;
    fs.writeFileSync(textFile, textReport);
    console.log(`✓ Reporte de texto guardado en: ${textFile}\n`);

    // Mostrar resumen en consola
    console.log('\n' + '='.repeat(80));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(80));
    console.log(textReport);

    await browser.close();
    rl.close();
    console.log('✓ Análisis completado exitosamente.');

  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
})();
