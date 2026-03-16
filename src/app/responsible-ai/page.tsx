import HeroSection from './HeroSection'
import FeatureGrid from './FeatureGrid'
import ClimateTimeline from './ClimateTimeline'
import HonestySection from './HonestySection'
import WhyAndCtaSection from './WhyAndCtaSection'

export default function ResponsibleAIPage() {
  return (
    <div className="content-max" style={s.page}>
      <HeroSection />
      <FeatureGrid />
      <ClimateTimeline />
      <HonestySection />
      <WhyAndCtaSection />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    color: '#fff',
  },
}
