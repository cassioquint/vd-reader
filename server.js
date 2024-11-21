import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { readLogs } from './fsReader.js'
import { searchMailLog } from './logMailReader.js'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  try {
    const logsList = await readLogs()
    res.status(200).json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.get('/:date', async (req, res) => {
  const { date } = req.params

  // Verifica se a data está no formato esperado (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' })
  }

  const today = new Date()
  const formattedToday = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0')

  // Se a data recebida for a data atual, limpa o campo de data
  const formattedDate = (date === formattedToday) ? "" : date.replace(/-/g, '')
  
  try {
    const logsList = await readLogs(formattedDate)
    res.status(200).json(logsList)
  } catch (error) {
    res.status(500).json({ error: 'Error reading logs' })
  }
})

app.get('/:prog/:date', async (req, res) => {
  const { prog, date } = req.params

  try {
    const result = await searchMailLog(prog, date)
    res.status(200).json(result)
  } catch (error) {
    res.status(404).send('Nenhuma linha correspondente encontrada.')
  }
})

app.post('/open-file', async (req, res) => {
  const { lineNumber, fileName } = req.body

  if (!lineNumber || isNaN(lineNumber)) {
    return res.status(400).json({error: 'Invalid line number.'})
  }

  if (!fileName) {
    return res.status(400).json({ error: 'File name is required.' })
  }

  const command = `code --goto ${fileName}:${lineNumber}:1`

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao abrir o arquivo no VSCode: ${error.message}`)
      return res.status(500).json({error: 'Error opening file in editor'})
    }
    if (stderr) {
      console.error(`Erro ao executar o comando: ${stderr}`)
      return res.status(500).json({error: 'Error executing command'})
    }
    return res.status(200).json('Success to opening file')
  })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})
