const path = require("path")
const express = require ("express")
const app = express()
const router = express.Router()
const multer = require('multer')
const fileUpload = require("../middlewares/multerPagosMiddleware")

const paymentController = require("../controllers/paymentController")

const {body} = require('express-validator')

const paymentValidation = [
    body('booking_code').notEmpty().withMessage('Completar el código de reserva'),
    body('email').notEmpty().withMessage('Completar el mail de reserva').custom(async (value,{req})=>{
        let email = req.body.email

        if(email.indexOf("@")==-1){
           throw new Error ('Completar con un mail valido')  
        }

        return true 
    }),
    body('receipt').custom((value,{req})=>{
        if(!req.file){
            throw new Error('Es necesario subir un comprobante')
        }

        let formatos = ['.JPG','.jpg','.JPEG','.jpeg','.PNG','.png','.GIF','.gif','.pdf','.PDF']
        if(req.file){
        if(!formatos.includes(path.extname(req.file.originalname))){
            throw new Error('El comprobante debe ser jpg, jpeg, png, pdf o gif')
            }
        }
        return true
    }),
]

router.get("/paymentUpload", paymentController.cargarPago)
router.post("/paymentUpload", fileUpload.single("receipt"), paymentValidation, paymentController.pagoCargado)

module.exports=router