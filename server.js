import express from 'express'
import { readLogs } from './fsReader.js'

const app = express()
const port = 3000

app.get('/', async (req, res) => {
  try {
    const logsList = await readLogs()
    res.json(logsList)
  } catch (error) {
    res.status(500).json({error: 'Error reading logs'})
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})