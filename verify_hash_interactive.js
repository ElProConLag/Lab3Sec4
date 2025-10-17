#!/usr/bin/env node
// Script interactivo para abrir el login de LinuxQuestions.org,
// permitir que el usuario resuelva el desafío de Cloudflare
// y luego verificar el hash MD5 que genera el sitio con md5hash() y hex_md5().

const puppeteer = require('puppeteer');
const readline = require('readline');

const LOGIN_URL = 'https://www.linuxquestions.org/questions/login.php';
const TEST_PASSWORD = 'dwQzwk9*yW2QnLYPYhB$KS$#ADQ';

function logInfo(...args) {
  console.log(...args);
}

function logWarn(...args) {
  console.warn(...args);
}

function logError(...args) {
  console.error(...args);
}

function waitForEnter(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

(async () => {
  logInfo('Iniciando Puppeteer en modo interactivo...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    logInfo('Creando nueva pestaña y configurando agente de usuario...');
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
    );

    logInfo('➡️  Navegando a', LOGIN_URL);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    logInfo('\n🛑 Resuelve manualmente cualquier CAPTCHA o verificación en la ventana del navegador.');
    logInfo('   Cuando veas el formulario real de login, vuelve a esta terminal.');
    await waitForEnter('\nPresiona ENTER aquí cuando la página esté lista: ');

    logInfo('\n⏳ Esperando a que las funciones MD5 del sitio estén disponibles...');
    await page.waitForFunction('typeof window.hex_md5 === "function" && typeof window.md5hash === "function"', {
      timeout: 120000
    });

    logInfo('✅ Funciones detectadas. Ejecutando verificaciones...');

    const { hexMd5Hash, md5HashField, md5UtfField, functionDetails, globalVars } = await page.evaluate(password => {
      function extractVariables(fn) {
        const src = fn.toString();
        const paramsMatch = src.match(/^[^(]*\(([^)]*)\)/);
        const params = paramsMatch && paramsMatch[1].trim().length
          ? paramsMatch[1].split(',').map(p => p.trim()).filter(Boolean)
          : [];
        const declRegex = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g;
        const declared = new Set();
        let match;
        while ((match = declRegex.exec(src)) !== null) {
          declared.add(match[1]);
        }
        return {
          params,
          declared: Array.from(declared).sort(),
          all: Array.from(new Set([...params, ...declared])).sort()
        };
      }

      const targetNames = Object.getOwnPropertyNames(window).filter(name => typeof window[name] === 'function' && /md5/i.test(name));
      const functionDetails = targetNames.map(name => {
        const variables = extractVariables(window[name]);
        return {
          name,
          params: variables.params,
          declared: variables.declared,
          allVariables: variables.all,
          sourceLength: window[name].toString().length
        };
      });

      const globalVars = Object.getOwnPropertyNames(window).filter(name => typeof window[name] !== 'function' && /md5/i.test(name));
      const hexMd5Hash = window.hex_md5(password);

      const passwordInput = document.createElement('input');
      passwordInput.type = 'password';
      passwordInput.value = password;

      const md5Field = document.createElement('input');
      const md5UtfField = document.createElement('input');

      document.body.append(passwordInput, md5Field, md5UtfField);

      window.md5hash(passwordInput, md5Field, md5UtfField, true);

      const result = {
        hexMd5Hash,
        md5HashField: md5Field.value,
        md5UtfField: md5UtfField.value || null,
        functionDetails,
        globalVars
      };

      passwordInput.remove();
      md5Field.remove();
      md5UtfField.remove();

      return result;
    }, TEST_PASSWORD);

    logInfo('\n🔐 Resultados para la contraseña de prueba:\n');
    logInfo('  hex_md5 =>', hexMd5Hash);
    logInfo('  md5hash (campo vb_login_md5password) =>', md5HashField);
    logInfo('  md5hash (campo vb_login_md5password_utf) =>', md5UtfField);

    logInfo('\n📋 Variables detectadas en funciones relacionadas con MD5:');
    functionDetails.forEach(detail => {
      logInfo(`  • ${detail.name}`);
      logInfo(`    Parámetros: ${detail.params.length ? detail.params.join(', ') : '(ninguno)'}`);
      logInfo(`    Declaradas: ${detail.declared.length ? detail.declared.join(', ') : '(ninguna)'}`);
      logInfo(`    Todas las variables (parámetros + declaradas): ${detail.allVariables.length ? detail.allVariables.join(', ') : '(ninguna)'}`);
    });

    if (globalVars.length) {
      logInfo('\n🌐 Variables globales relacionadas con MD5 detectadas en window:');
      logInfo(`  ${globalVars.join(', ')}`);
    } else {
      logInfo('\n🌐 No se detectaron variables globales adicionales relacionadas con MD5.');
    }

    if (hexMd5Hash === md5HashField) {
      logInfo('\n✅ El digest coincide en ambas funciones.');
    } else {
      logWarn('\n⚠️  Los valores no coinciden, revisa el flujo manualmente.');
    }
  } catch (error) {
    logError('\n❌ Ocurrió un error durante la verificación:', error);
  } finally {
    logInfo('\nCerrando el navegador...');
    await browser.close();
  }
})();
