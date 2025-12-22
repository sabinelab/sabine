import fs from 'node:fs'

export default function () {
  const lines = fs.readFileSync('data.csv').toString().split('\n')
  const headers = lines.shift().split(',')
  const data = []
  
  for (let i = 0; i < lines.length; i++) {
    const obj = {}
    const values = lines[i].split(',')
    
    for (let i = 0; i < values.length; i++) {
      let value = values[i]
      
      if (!Number.isNaN(value)) {
        value = Number(values[i])
      }
      if (value === 'true') {
        value = true
      }
      if (value === 'false') {
        value = false
      }
      obj[headers[i]] = value
    }
    data.push(obj)
  }
  return data
}
