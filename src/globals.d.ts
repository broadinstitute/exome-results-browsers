declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.md' {
  interface MarkdownContent {
    html: string
    title?: string
    [key: string]: unknown
  }
  const content: MarkdownContent
  export default content
}
