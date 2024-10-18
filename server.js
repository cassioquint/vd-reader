import express from 'express'
import cors from 'cors'
import { readLogs } from './fsReader.js'

const app = express()
const port = 3000

app.use(cors());

app.get('/', async (req, res) => {

  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  const currentDate = `${year}${month}${day}`

  try {
    const logsList = await readLogs(currentDate)
    res.json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.get('/:date', async (req, res) => {
  const { date } = req.params
  const newDate = date.replace(/-/g, '')
  try {
    const logsList = await readLogs(newDate)
    res.json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})