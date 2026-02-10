import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { Button } from '@gnomad/ui'

const formatCell = (value: any): string => {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (value.includes(',') || value.includes('"') || value.includes("'")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

type CsvData = any[]
type CsvColumn = {
  key: string
  heading: string
  //TK:  TODO: more strictly type 'renderForCSV' this in all places
  //   should really be something like: [(a: string, b: string) -> string | number]
  //   but its inconsistent sometimes, some browsers use only 1 arg in a few places
  renderForCSV: (...args: any) => any
}

interface CsvExportButtonProps {
  data: CsvData
  columns: CsvColumn[]
  filename: string
  children?: React.ReactNode
}

const generateCSV = (data: CsvData) =>
  `${data.map((row) => row.map((val: any) => formatCell(val)).join(',')).join('\r\n')}\r\n`

const downloadCSV = (data: CsvData, baseFileName: string) => {
  const date = new Date()
  const timestamp = `${date.getFullYear()}_${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}_${date
      .getDate()
      .toString()
      .padStart(2, '0')}_${date
        .getHours()
        .toString()
        .padStart(2, '0')}_${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}_${date.getSeconds().toString().padStart(2, '0')}`

  const csv = generateCSV(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${baseFileName.replace(/\s+/g, '_')}_${timestamp}.csv`)
  link.onclick = () => {
    URL.revokeObjectURL(url)
    link.remove()
  }
  document.body.appendChild(link)
  link.click()
}

const exportToCSV = (data: CsvData, columns: CsvColumn[], baseFileName: string) => {
  const headerRow = columns.map((col) => col.heading || col.key)
  const dataRows = data.map((d) => columns.map((col) => col.renderForCSV(d, col.key)))
  downloadCSV([headerRow].concat(dataRows), baseFileName)
}

const CSVExportButton = ({ data, columns, filename, children, ...rest }: CsvExportButtonProps) => (
  <Button
    {...rest}
    disabled={data.length === 0}
    onClick={() => {
      exportToCSV(data, columns, filename)
    }}
  >
    {children}
  </Button>
)

export default CSVExportButton
