const path = require("path")
const express = require ("express")
const router = express.Router()
const multer = require('multer')
const fileUpload = require("../middlewares/multerPagosMiddleware")

const paymentController = require("../controllers/paymentController")

const {body} = require('express-validator')

const paymentValidation = [
    body('booking_code').notEmpty().withMessage((value, { req }) => req.__('errores.codigo_reserva')),
    body('email').notEmpty().withMessage((value, { req }) => req.__('errores.mails_reserva')).custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1){
           throw new Error (req.__('errores.mail_invalido'))  
        }

        return true 
    }),
    body('receipt').custom((value,{req})=>{
        if(!req.file){
            throw new Error(req.__('errores.comprobante'))
        }

        let formatos = ['.JPG','.jpg','.JPEG','.jpeg','.PNG','.png','.GIF','.gif','.pdf','.PDF']
        if(req.file){
        if(!formatos.includes(path.extname(req.file.originalname))){
            throw new Error(req.__('errores.formato_comprobante'))
            }
        }
        return true
    }),
]

router.get("/upload", paymentController.cargarPago)
router.post("/upload", fileUpload.single("receipt"), paymentValidation, paymentController.pagoCargado)

module.exports=router