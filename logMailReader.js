import { readFileSync } from 'fs'

export const searchMailLog = async (program, date) => {

    return new Promise((resolve, reject) => {
        try {
            const filePath = 'D:/DEV/NODE/log/VD_LOGMAIL.LOG'
            const formattedDate = formatDate(date)
            const fileContent = readFileSync(filePath, 'utf-8')
            const lines = fileContent.split('\n')
            const mailList = []
            let cont = 0

            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i]

                const lineDate = line.substring(0, 10).trim()
                const lineProgram = line.substring(20).split(/;|\s/)[0].trim()

                // Compara a data formatada com a data do arquivo
                if (lineDate === formattedDate && lineProgram === program) {
                    mailList.push(line)
                    cont++
                }
            }

            if (cont) {
                resolve(mailList.reverse())
                return
            } else {
                reject(`Linha não encontrada para o programa "${program}" na data "${formatDate(date)}".`)
            }

        } catch (error) {
            // Caso ocorra um erro ao ler o arquivo
            reject(`Erro ao ler o arquivo: ${error.message}`)
        }
    })
}

const formatDate = (date) => {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
}