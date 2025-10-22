const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
      let folder = path.join(__dirname, "../public/pagos")
       cb(null, folder ); 
    }, 
    filename: function (req, file, cb) { 
      let nombreArchivo = Date.now() + "_sena_" + path.extname(file.originalname)
       cb(null,nombreArchivo )
    } 
})

let fileUpload = multer({storage: storage })

module.exports=fileUpload