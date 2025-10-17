# 📊 Análisis de Funciones MD5 Password en LinuxQuestions.org

## 🎯 Resumen Ejecutivo

Se encontraron **14 funciones JavaScript relacionadas con MD5 y password** en la página de login de LinuxQuestions.org. Estas funciones están involucradas en:

1. **Cifrado MD5**: Hashing de contraseñas antes del envío
2. **Validación de formularios**: Verificación de credenciales
3. **Manejo de interfaz**: Interacción con elementos de login

---

## 🔍 Funciones Encontradas

### 1. **hex_md5(A)** ⭐ Principal
**Propósito**: Convertir texto a hash MD5 en formato hexadecimal
```javascript
function hex_md5(A){
  return binl2hex(core_md5(str2binl(A), A.length*chrsz))
}
```
**Parámetros**:
- `A` (string): Texto a cifrar (ej. contraseña)

**Retorna**: String con hash MD5 en hexadecimal

**Uso**: Se utiliza en el campo `vb_login_md5password`

---

### 2. **b64_md5(A)** 
**Propósito**: Convertir texto a hash MD5 en formato Base64
```javascript
function b64_md5(A){
  return binl2b64(core_md5(str2binl(A), A.length*chrsz))
}
```
**Parámetros**:
- `A` (string): Texto a cifrar

**Retorna**: String con hash MD5 en Base64

---

### 3. **str_md5(A)** 
**Propósito**: Convertir texto a hash MD5 en formato string binario
```javascript
function str_md5(A){
  return binl2str(core_md5(str2binl(A), A.length*chrsz))
}
```

---

### 4. **core_md5(K, F)** ⭐ Core Algorithm
**Propósito**: Algoritmo principal de cálculo MD5
```javascript
function core_md5(K, F){
  K[F>>5] |= 128 << ((F) % 32);
  K[(((F+64)>>>9)<<4)+14] = F;
  
  var J = 1732584193;      // Constante A
  var I = -271733879;       // Constante B
  var H = -1732584194;      // Constante C
  var G = 271733878;        // Constante D
  
  for(var C = 0; C < K.length; C += 16){
    // ... procesamiento de bloques
    J = md5_ff(J,I,H,G,K[C+0],7,-680876936);
    // ... más operaciones
  }
}
```

**Variables Internas**:
- Inicialización con constantes estándar MD5
- Procesamiento por bloques de 16 palabras
- Aplicación de funciones de ronda (ff, gg, hh, ii)

---

### 5. **md5_cmn(F, C, B, A, E, D)** 
**Propósito**: Función común para todas las rondas MD5
```javascript
function md5_cmn(F, C, B, A, E, D){
  return safe_add(bit_rol(safe_add(safe_add(C, F), safe_add(A, D)), E), B)
}
```

---

### 6. **md5_ff(C, B, G, F, A, E, D)** 
**Propósito**: Función de ronda 1 (FF - Auxiliary function)
```javascript
function md5_ff(C, B, G, F, A, E, D){
  return md5_cmn((B&G)|((~B)&F), C, B, A, E, D)
}
```

---

### 7. **md5_gg(C, B, G, F, A, E, D)** 
**Propósito**: Función de ronda 2 (GG - Auxiliary function)
```javascript
function md5_gg(C, B, G, F, A, E, D){
  return md5_cmn((B&F)|(G&(~F)), C, B, A, E, D)
}
```

---

### 8. **md5_hh(C, B, G, F, A, E, D)** 
**Propósito**: Función de ronda 3 (HH - Auxiliary function)
```javascript
function md5_hh(C, B, G, F, A, E, D){
  return md5_cmn(B^G^F, C, B, A, E, D)
}
```

---

### 9. **md5_ii(C, B, G, F, A, E, D)** 
**Propósito**: Función de ronda 4 (II - Auxiliary function)
```javascript
function md5_ii(C, B, G, F, A, E, D){
  return md5_cmn(G^(B|(~F)), C, B, A, E, D)
}
```

---

### 10. **core_hmac_md5(C, F)** 
**Propósito**: Calcular HMAC-MD5 (Hash-based Message Authentication Code)
```javascript
function core_hmac_md5(C, F){
  var E = str2binl(C);
  if(E.length > 16){
    E = core_md5(E, C.length*chrsz)
  }
  var A = Array(16), D = Array(16);
  for(var B = 0; B < 16; B++){
    A[B] = E[B] ^ 909522486;      // Operación XOR con ipad
    D[B] = E[B] ^ 1549556828       // Operación XOR con opad
  }
  var G = core_md5(A.concat(str2binl(F)), 512+F.length*chrsz);
  return core_md5(D.concat(G), 512+128)
}
```

---

### 11. **hex_hmac_md5(A, B)** 
**Propósito**: HMAC-MD5 en hexadecimal
```javascript
function hex_hmac_md5(A, B){
  return binl2hex(core_hmac_md5(A, B))
}
```

---

### 12. **b64_hmac_md5(A, B)** 
**Propósito**: HMAC-MD5 en Base64
```javascript
function b64_hmac_md5(A, B){
  return binl2b64(core_hmac_md5(A, B))
}
```

---

### 13. **str_hmac_md5(A, B)** 
**Propósito**: HMAC-MD5 en formato string binario
```javascript
function str_hmac_md5(A, B){
  return binl2str(core_hmac_md5(A, B))
}
```

---

### 14. **md5hash(B, A, E, C)** ⭐ Función Principal de Login
**Propósito**: Cifrar la contraseña y rellenar los campos ocultos del formulario
```javascript
function md5hash(B, A, E, C){
  if(navigator.userAgent.indexOf("Mozilla/") == 0 && 
     parseInt(navigator.appVersion) >= 4){
    
    var D = hex_md5(str_to_ent(trim(B.value)));
    A.value = D;
    
    if(E){
      D = hex_md5(trim(B.value));
      E.value = D
    }
    
    if(!C){
      B.value = ""  // Limpiar campo de contraseña
    }
  }
  return true
}
```

**Parámetros**:
- `B` (object): Input de contraseña (vb_login_password)
- `A` (object): Campo oculto vb_login_md5password
- `E` (object): Campo oculto vb_login_md5password_utf
- `C` (boolean): Si no limpiar la contraseña original

**Lógica**:
1. Verifica si es Mozilla/navegador compatible
2. Calcula MD5 de la contraseña codificada UTF
3. Rellena `vb_login_md5password` con el hash
4. Rellena `vb_login_md5password_utf` si existe
5. Opcionalmente limpia el campo de contraseña

---

### 15. **highlight_login_box()** 
**Propósito**: Animar el campo de usuario al hacer focus
```javascript
function highlight_login_box(){
  var E = fetch_object("navbar_username");
  var A = "inlinemod";
  var B, C = 1600, D = 200;
  
  if(E){
    E.focus();
    E.select();
    for(B = 0; B < C; B += 2*D){
      window.setTimeout(function(){
        YAHOO.util.Dom.addClass(E, A)
      }, B);
      window.setTimeout(function(){
        YAHOO.util.Dom.removeClass(E, A)
      }, B+D)
    }
  }
  return false
}
```

---

## 📝 Campos de Formulario Relacionados

### Formulario de Login (form_5)
```html
<form action="https://www.linuxquestions.org/questions/login.php">
  <!-- Usuario -->
  <input type="text" 
         class="bginput" 
         name="vb_login_username" 
         id="navbar_username" 
         value="User Name">
  
  <!-- Contraseña (plana) -->
  <input type="password" 
         class="bginput" 
         name="vb_login_password" 
         size="10">
  
  <!-- Campo oculto: MD5 de contraseña UTF-8 -->
  <input type="hidden" 
         name="vb_login_md5password">
  
  <!-- Campo oculto: MD5 de contraseña UTF-8 alternativo -->
  <input type="hidden" 
         name="vb_login_md5password_utf">
  
  <!-- Otros campos ocultos -->
  <input type="hidden" name="do" value="login">
  <input type="hidden" name="s" value="">
  <input type="hidden" name="securitytoken" value="guest">
  <input type="hidden" name="cookieuser" value="1">
</form>
```

---

## 🔄 Flujo de Autenticación

```
1. Usuario ingresa contraseña en vb_login_password
                    ↓
2. Se llama md5hash() cuando se envía el formulario
                    ↓
3. Se calcula: hex_md5(str_to_ent(trim(contraseña)))
                    ↓
4. Se rellena vb_login_md5password con el hash
                    ↓
5. Se rellena vb_login_md5password_utf con el hash alternativo
                    ↓
6. Se limpia el campo vb_login_password (opcional)
                    ↓
7. Se envía el formulario al servidor con los hashes
                    ↓
8. El servidor verifica los hashes contra su base de datos
```

---

## 🛡️ Seguridad

### Fortalezas:
- ✅ Hash cliente antes de transmisión (previene exposición de contraseña en tránsito)
- ✅ Soporte para UTF-8 (internacionalización)
- ✅ Limpieza de campo de contraseña en memoria del navegador

### Debilidades:
- ❌ MD5 es criptográficamente débil (vulnerabilidades de colisión)
- ❌ Sin salt en el cliente (vulnerable a rainbow tables)
- ⚠️ Requiere HTTPS para protección completa
- ⚠️ No incluye protección contra CSRF visible

---

## 💻 Cómo Usar Estas Funciones

### Ejemplo 1: Cifrar una contraseña
```javascript
// Disponible en la consola del navegador en LinuxQuestions.org
const password = "miContraseña123";
const hashed = hex_md5(password);
console.log(hashed);  // Salida: hash MD5 en hexadecimal
```

### Ejemplo 2: Usar en un script automatizado
```javascript
// Desde Node.js o Puppeteer
const password = "testpassword";
// Necesitarías importar las funciones MD5 desde la página

// O usar una librería equivalente:
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');
console.log(hash);
```

### Ejemplo 3: Obtener referencias en el navegador
```javascript
// En la consola del navegador
typeof hex_md5          // "function"
typeof md5hash          // "function"
typeof core_md5         // "function"

// Verificar disponibilidad
console.log(window.hex_md5);      // function hex_md5(A)
console.log(window.md5hash);      // function md5hash(B,A,E,C)
```

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Total de funciones MD5 | 15 |
| Funciones principales | 3 (hex_md5, md5hash, core_md5) |
| Funciones auxiliares | 7 (md5_ff, md5_gg, md5_hh, md5_ii, md5_cmn, etc.) |
| Funciones HMAC | 3 (hex_hmac_md5, b64_hmac_md5, str_hmac_md5) |
| Campos ocultos | 2 (vb_login_md5password, vb_login_md5password_utf) |
| Tamaño aproximado | ~4-8 KB (minificado) |

---

## 📁 Archivos Generados

- `md5-password-analysis.json` - Análisis completo en JSON
- Este documento - Referencia detallada de funciones

---

**Fecha de análisis**: 2025-10-16
**Sitio**: https://www.linuxquestions.org/questions/login.php
**Framework**: vBulletin (indicado por nombres vb_*)
