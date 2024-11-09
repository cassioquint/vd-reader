import { readFile } from 'fs'
import { glob } from 'glob'
import iconv from 'iconv-lite'

// Função auxiliar para extrair o nome do bat a partir do título do log
const extractBatName = (title) => {
  const regex = /\(([^)]+)\)$/
  const match = title.match(regex)
  return match ? match[1] : null
}

// Função para processar linhas dentro de um bloco
const processLogLines = (lines, logId, isFirstBlock, lineIndex) => {
  let logTitle = ''
  let batName = ''
  let logSendEmail = false
  let logStartedAt = ''
  let logFinishedAt = ''
  let logDuration = ''
  let logsList = []
  let fileLine = 0
  let lastLine = false
  let numRegs = 0
  let lineCounter = 0

  lines.forEach((line, index) => {
    lineIndex++

    // Ignora as 3 primeiras linhas do primeiro bloco (cabeçalho do arquivo)
    if (isFirstBlock && index < 3) return

    if (line === '' || line.startsWith('---------')) return

    lineCounter++

    // A primeira linha do bloco sempre deverá ser o título
    if (lineCounter === 1) {
      logTitle = line.trim()
      batName = extractBatName(logTitle) || ''
      fileLine = lineIndex
    }
    // A segunda linha sempre será a indicação de envio de e-mail
    else if (lineCounter === 2) {
      logSendEmail = line[20] === 'S'
    }
    else {
      if (line.trim().startsWith('Inicio:')) {
        logStartedAt = line.substring(50, 62)
      }
      else if (line.trim().startsWith('Fim:')) {
        logFinishedAt = line.substring(50, 62)
        lastLine = true
      }
      else {
        if (lastLine) {
          logDuration = line.trim()
        }
        else {
          logsList.push(line.trim())
          numRegs++
        }
      }
    }
  })
  if (!logTitle) return { lineIndex }

  return {
    "id": logId,
    "title": logTitle,
    "bat": batName,
    "sendEmail": logSendEmail,
    logsList,
    "startedAt": logStartedAt,
    "finishedAt": logFinishedAt,
    "duration": logDuration,
    fileLine,
    numRegs,
    lineIndex
  }
}

// Função para processar os blocos de logs
const processLogBlocks = (logBlocks) => {
  let logId = 0
  let lineIndex = 0
  const dataList = []

  logBlocks.forEach((block, blockIndex) => {
    logId++
    const lines = block.split(/\r?\n/)

    // Verifica se é o primeiro bloco para ignorar as 3 primeiras linhas
    const isFirstBlock = blockIndex === 0
    const result = processLogLines(lines, logId, isFirstBlock, lineIndex)
    
    if (result) {
      const { lineIndex: updatedLineIndex, ...logData } = result
      lineIndex = updatedLineIndex
      dataList.push(logData)
    }
  })
  return dataList
}

// Função para processar os logs
export const readLogs = async (date = "") => {

  // Define se está em ambiente de Produção (RECH) ou Homologação
  const production = false
  // Se estiver em ambiente de produção (RECH), utiliza a pasta de logs
  const directory = production ? 'F:/TMP/LOG/' : 'D:/DEV/NODE/log/'
  // Se recebeu uma data por parâmetro
  const fileName = date ? `vd${date}*.log` : 'vd.log'
  // Define o padrão do arquivo, ignorando a parte da hora/minutos
  const pattern = directory + fileName

  let logFile = ''

  try {
    const files = await glob(pattern, { nodir: true })

    if (files.length === 0) {
      console.error('Nenhum arquivo de log encontrado.')
      return { file: logFile, data: [] }
    }
    logFile = files[files.length - 1]
  }
  catch (error) {
    console.error('Erro ao buscar o arquivo de log: ', error)
    return { file: logFile, data: [] }
  }

  return new Promise((resolve, reject) => {
    readFile(logFile, (err, data) => {
      if (err) {
        console.error('Error reading the log file:', err)
        reject(err)
        return
      }

      // Converte o buffer usando o encoding Windows-1252
      const logs = iconv.decode(data, 'windows-1252')
      // Quebra os logs em blocos de linha
      const logBlocks = logs.split(/\.\s*\r?\n-{120}/)

      const dataList = processLogBlocks(logBlocks)

      resolve({
        file: logFile,
        data: dataList
      })
    })
  })
}
