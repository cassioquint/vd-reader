import { readFile } from 'fs'
import { glob } from 'glob'
import iconv from 'iconv-lite'

// Função para processar os logs
export const readLogs = async () => {
  const list = []

  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = String(currentDate.getMonth() + 1).padStart(2, '0')
  const day = String(currentDate.getDate()).padStart(2, '0')

  // Define o padrão do arquivo, ignorando a parte da hora/minutos
  const pattern = `D:/DEV/NODE/log/vd${year}${month}${day}*.log`
  let logFile = ''

  try {
    const files = await glob(pattern, { nodir: true })

    if (files.length === 0) {
      console.log('Nenhum arquivo de log encontrado.')
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
      const logBlocks = logs.split(/\.\s*\r?\n-{120}/).filter(bloco => bloco.trim() !== '')

      logBlocks.forEach((block, counter) => {

        // Quebra o bloco em linhas de logs
        const lines = block.split(/\r?\n/).filter(line => line.trim() != '')

        let logTitle = ''
        let logSendEmail = false
        let logStartedAt = ''
        let logFinishedAt = ''
        let logDuration = ''
        let logsList = []
        let lineCounter = 0
        let lastLine = false

        lines.forEach((line, index) => {
          
          // Ignora as 3 primeiras linhas do primeiro bloco (cabeçalho do arquivo VD)
          if ((counter === 0 && index < 3) || line.startsWith('---------'))   {
            return
          }

          lineCounter++
          
          // A primeira linha do bloco sempre deverá ser o título
          if (lineCounter === 1) {
            logTitle = line
          }
          // A segunda linha sempre será a indicação de envio de e-mail
          else if (lineCounter === 2) {
            line[20] == 'S' ? logSendEmail = true : logSendEmail = false
          }
          else {
            if (line.trim().startsWith('Inicio:')) {
              logStartedAt = line.substring(50, 79)
            }
            else if (line.trim().startsWith('Fim:')) {
              logFinishedAt = line.substring(50, 79)
              lastLine = true
            }
            else {
              if (lastLine) {
                logDuration = line.trim()
              }
              else {
                logsList.push(line.trim())
              }
            }
          }
        })

        // Adiciona o log salvo à lista de logs do dia
        list.push({
          "title": logTitle,
          "sendEmail": logSendEmail,
          "logsList": logsList,
          "startedAt": logStartedAt,
          "finishedAt": logFinishedAt,
          "Duration": logDuration
        })
      })

      resolve(list)
    })
  })
}