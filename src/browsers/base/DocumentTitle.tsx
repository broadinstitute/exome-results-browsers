import { useEffect } from 'react'

type DocumentTitleProps = {
  title: string,
}

const DocumentTitle = ({ title }: DocumentTitleProps) => {
  useEffect(() => {
    document.title = title
  }, [title])
  return null
}

export default DocumentTitle
