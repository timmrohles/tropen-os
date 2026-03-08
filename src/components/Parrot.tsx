interface ParrotProps {
  size?: number
  style?: React.CSSProperties
  className?: string
}

export default function Parrot({ size = 24, style, className }: ParrotProps) {
  return (
    <video
      src="/animations/Parrot.webm"
      autoPlay
      loop
      muted
      playsInline
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
