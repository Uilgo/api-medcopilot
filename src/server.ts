import dotenv from 'dotenv'

// Configurar variáveis de ambiente ANTES de qualquer outra importação
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes'
import { errorHandler } from './middlewares/errorHandler'

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares de segurança e parsing
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas da API
app.use('/api', routes)

// Tratamento de erros
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
})
