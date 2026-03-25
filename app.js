//Importando dependencias de módulos Node.js
const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

//Importando la biblioteca jsonwebtoken para manejar la creación 
// y verificación de tokens JWT. (Para agregar seguridad a nuestra API RESTFul)
const jwt = require("jsonwebtoken");

const app = express();

//Middleware para parsear el cuerpo de las solicitudes como JSON y manejar
app.use(express.json());

app.use(fileUpload());


//Este SECRET se utiliza para tener de referencia y poder comparar en cada petición 
// que necesite autenticación, que el token que se le envíe sea válido 
// y no haya sido modificado por terceros.
const SECRET = process.env.JWT_SECRET;
//Esto representa un usuario en la base de datos.
let user_db = { user: "roberto", role: "admin", password: "123456" };

app.post("/login", (req, res) => {

    //Select ala DB con el nombre de usuario
    //comparar la contraseña enviada con la contraseña almacenada en la DB

    if (!req.body || !req.body.user || !req.body.password) {
        return res.status(400).json({ message: "Faltan credenciales" });
    }
    const user = req.body.user;
    const password = req.body.password;

    if (user !== user_db.user || password !== user_db.password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(user_db, SECRET, { expiresIn: "1h" });

    //"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
    // eyJ1c2VyIjoicm9iZXJ0byIsInJvbGUiOiJhZG1pbiIsInBhc3N3b3JkIjoiMTIzNDU2IiwiaWF0IjoxNzc0Mzk0MjkxLCJleHAiOjE3NzQzOTc4OTF9.
    // IbzVT-bZQuOUTc0XGXUtODn9kO7LyjIsWGs8ziMDqr0"

    res.json({ token });
});

//Este middleware será implementado en las rutas que requieran autenticación 
// para verificar que el token enviado por el cliente sea válido antes de 
// permitir el acceso a la ruta.
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


app.get("/testToken", verificarToken, (req, res) => {
    res.json({ message: "Token válido", user: req.user });
});

app.post("/videoupload", verificarToken, (req, res) => {
  if (!req.files || !req.files.video) {
    return res.status(400).json({ error: "Archivo no enviado" });
  }
  const video = req.files.video;
  //el video no debe pesar más de 30MB y debe ser un formato mp4 o mpeg
  if (video.size > 30 * 1024 * 1024) {
    return res.status(400).json({ error: "El video debe pesar máximo 30MB" });
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

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000");
});
