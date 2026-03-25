
# Securización con JWT I – Implementación Paso a Paso

## Objetivo
Comprender qué es JWT, cómo funciona el modelo stateless y aplicar autenticación en una API con Express, protegiendo endpoints de subida y lectura de archivos.

## 1. ¿Qué es JWT? Json Web Token
JWT (JSON Web Token) es un mecanismo de autenticación que permite enviar información segura entre cliente y servidor. Se utiliza principalmente para autenticación y autorización.

## 2. Modelo Stateless
JWT trabaja sin sesiones en servidor: el servidor no guarda información del usuario, el cliente guarda el token y cada request incluye el token. Esto permite escalabilidad y menor carga en servidor.

## 3. Estructura de un JWT
Un token tiene 3 partes: HEADER.PAYLOAD.SIGNATURE. El Header define el algoritmo y tipo, el Payload contiene datos del usuario y la Signature valida el token.

## 4. Instalación del Proyecto
npm init -y
npm install express jsonwebtoken express-fileupload

## 5. Estructura del Proyecto
/proyecto
  app.js
  /uploads

## 6. Implementación Paso a Paso

### 6.1 Crear servidor base
const express = require("express");
const app = express();
app.use(express.json());
app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});

### 6.2 Agregar dependencias
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
app.use(fileUpload());
const SECRET = "mi_clave_secreta";

### 6.3 Endpoint de Login (Generar Token)
app.post("/login", (req, res) => {
  const user = { user: "roberto", role: "admin" };
  const token = jwt.sign(user, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

### 6.4 Middleware de Verificación
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

### 6.5 Endpoint para subir video (máx 30MB)
app.post("/upload", verificarToken, (req, res) => {
  if (!req.files || !req.files.video) {
    return res.status(400).json({ error: "Archivo no enviado" });
  }
  const video = req.files.video;
  if (video.size > 30 * 1024 * 1024) {
    return res.status(400).json({ error: "Máximo 30MB" });
  }
  const ext = path.extname(video.name);
  if (ext !== ".mp4" && ext !== ".mpeg") {
    return res.status(400).json({ error: "Formato inválido" });
  }
  const ruta = path.join(__dirname, "uploads", video.name);
  video.mv(ruta, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error al guardar archivo" });
    }
    res.json({ mensaje: "Video subido correctamente" });
  });
});

### 6.6 Endpoint para obtener video
app.get("/video/:nombre", verificarToken, (req, res) => {
  const nombre = req.params.nombre;
  const ruta = path.join(__dirname, "uploads", nombre);
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({ error: "Archivo no encontrado" });
  }
  res.sendFile(ruta);
});

## 7. Flujo de Uso
Paso 1: POST /login  
Paso 2: Guardar token  
Paso 3: Authorization: Bearer TOKEN  
Paso 4: Acceder a endpoints protegidos  

## 8. Diagrama de Secuencia (JWT Flow)
sequenceDiagram
    participant Cliente
    participant Servidor
    Cliente->>Servidor: POST /login (credenciales)
    Servidor-->>Cliente: Token JWT
    Cliente->>Servidor: POST /upload (Authorization: Bearer Token)
    Servidor->>Servidor: Verifica JWT
    Servidor-->>Cliente: Video subido
    Cliente->>Servidor: GET /video/:nombre (Authorization: Bearer Token)
    Servidor->>Servidor: Verifica JWT
    Servidor-->>Cliente: Retorna video

## 9. Conceptos Clave
JWT no encripta, firma. Stateless significa sin sesiones. Middleware protege rutas. El token viaja en headers. Se valida el archivo antes de guardarlo.

## 10. Buenas Prácticas
No guardar contraseñas en el payload. Usar expiración. Usar HTTPS. No subir node_modules. Usar .env para secretos.

## 11. Resultado Final
Una API que genera tokens JWT, protege endpoints, permite subir y obtener videos y aplica modelo stateless.

