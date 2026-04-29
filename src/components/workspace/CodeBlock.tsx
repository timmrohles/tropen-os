'use client'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  language?: string
  children: string
  customStyle?: React.CSSProperties
}

export default function CodeBlock({ language, children, customStyle }: CodeBlockProps) {
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      PreTag="div"
      customStyle={{ borderRadius: 6, fontSize: 13, margin: '8px 0', ...customStyle }}
    >
      {children}
    </SyntaxHighlighter>
  )
}
