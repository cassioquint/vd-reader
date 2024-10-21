import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { readLogs } from './fsReader.js'

const app = express()
const port = 3000

app.use(cors());

app.get('/', async (req, res) => {
  try {
    const logsList = await readLogs()
    res.json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.get('/:date', async (req, res) => {
  const { date } = req.params

  // Verifica se a data está no formato esperado (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const newDate = date.replace(/-/g, '')
  try {
    const logsList = await readLogs(newDate)
    res.json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.get('/line/:line', async (req, res) => {
  const { line } = req.params
  const logFilePath = 'D:/DEV/NODE/log/vd.log'

  if (!line || isNaN(line)) {
    return res.status(400).json({error: 'Invalid line number.'})
  }

  const command = `code --goto ${logFilePath}:${line}:1`

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
