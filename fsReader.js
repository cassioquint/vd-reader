import { readFile } from 'fs'
import { glob } from 'glob'
import iconv from 'iconv-lite'

// Função para processar os logs
export const readLogs = async (date = "") => {
  const list = []

  // Define se está em ambiente de Produção (RECH) ou Homologação
  let production = true

  let logFile = ''
  let logId = 0
  let lineIndex = 0

  // Se estiver em ambiente de produção (RECH), utiliza a pasta de logs
  let directory = production ? 'F:/TMP/LOG/' : 'D:/DEV/NODE/log/'

  // Se recebeu uma data por parâmetro
  let fileName = date ? `vd${date}*.log` : 'vd.log'

  // Define o padrão do arquivo, ignorando a parte da hora/minutos
  const pattern = directory + fileName
  console.log(pattern)

  try {
    const files = await glob(pattern, { nodir: true })

    if (files.length === 0) {
      //console.log('Nenhum arquivo de log encontrado.')
      return list
    }
    else {
      logFile = files[files.length - 1]
    }
  }
  catch (error) {
    console.error('Erro ao buscar o arquivo de log: ', error)
    return list
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

      logBlocks.forEach((block, counter) => {

        // Quebra o bloco em linhas de logs
        const lines = block.split(/\r?\n/)

        logId = counter + 1
        let logTitle = ''
        let batName = ''
        let logSendEmail = false
        let logStartedAt = ''
        let logFinishedAt = ''
        let logDuration = ''
        let logsList = []
        let lineCounter = 0
        let fileLine = 0
        let lastLine = false
        let numRegs = 0

        lines.forEach((line, index) => {

          lineIndex++

          if (line === '') return

          // Ignora as 3 primeiras linhas do primeiro bloco (cabeçalho do arquivo VD)
          if ((counter === 0 && index < 3) || line.startsWith('---------'))   {
            return
          }

          lineCounter++

          // A primeira linha do bloco sempre deverá ser o título
          if (lineCounter === 1) {
            logTitle = line.trim()
            batName = extractBatName(logTitle)
            fileLine = lineIndex
          }
          // A segunda linha sempre será a indicação de envio de e-mail
          else if (lineCounter === 2) {
            line[20] == 'S' ? logSendEmail = true : logSendEmail = false
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

        if (logTitle === '') return

        // Adiciona o log salvo à lista de logs do dia
        list.push({
          "id": logId,
          "title": logTitle,
          "bat": batName,
          "sendEmail": logSendEmail,
          "logsList": logsList,
          "startedAt": logStartedAt,
          "finishedAt": logFinishedAt,
          "duration": logDuration,
          "fileLine": fileLine,
          "numRegs": numRegs
        })
      })

      resolve(list)
    })
  })

  function extractBatName(title) {
    const regex = /\(([^)]+)\)$/
    const match = title.match(regex)
    if (match) {
      return match[1]
    } else {
      return null
    }
  }
}
