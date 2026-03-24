import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createLogger } from '@/lib/logger'
import PptxGenJS from 'pptxgenjs'
import { z } from 'zod'

const logger = createLogger('api:artifacts:export-pptx')

const bodySchema = z.object({
  html: z.string().min(1),
  name: z.string().min(1).max(200),
})

// Strip HTML tags from a string
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
}

interface SlideData {
  title: string | null
  subtitle: string | null
  bullets: string[]
  body: string[]
}

// Parse Reveal.js HTML into slide data.
// Each <section> tag inside .slides is one slide.
function parseRevealSlides(html: string): SlideData[] {
  // Extract content inside <div class="slides"> ... </div>
  const slidesMatch = html.match(/<div[^>]*class="slides"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    ?? html.match(/<div[^>]*class="slides"[^>]*>([\s\S]*)/i)
  const slidesHtml = slidesMatch ? slidesMatch[1] : html

  // Split into sections (each top-level <section> is one slide)
  const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi
  const slides: SlideData[] = []
  let match: RegExpExecArray | null

  while ((match = sectionRegex.exec(slidesHtml)) !== null) {
    const content = match[1]

    const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
    const h3Match = content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)

    // Bullet points from <li>
    const bullets: string[] = []
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let liMatch: RegExpExecArray | null
    while ((liMatch = liRegex.exec(content)) !== null) {
      const text = stripTags(liMatch[1]).trim()
      if (text) bullets.push(text)
    }

    // Plain paragraphs (excluding those inside ul/ol)
    const cleanedContent = content.replace(/<[uo]l[^>]*>[\s\S]*?<\/[uo]l>/gi, '')
    const body: string[] = []
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let pMatch: RegExpExecArray | null
    while ((pMatch = pRegex.exec(cleanedContent)) !== null) {
      const text = stripTags(pMatch[1]).trim()
      if (text) body.push(text)
    }

    slides.push({
      title: h1Match ? stripTags(h1Match[1]) : null,
      subtitle: h2Match ? stripTags(h2Match[1]) : (h3Match ? stripTags(h3Match[1]) : null),
      bullets,
      body,
    })
  }

  return slides
}

// POST /api/artifacts/export-pptx
// Accepts { html, name } and returns a .pptx binary download.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const { html, name } = parsed.data
  const slides = parseRevealSlides(html)

  if (slides.length === 0) {
    return NextResponse.json({ error: 'Keine Slides gefunden' }, { status: 422 })
  }

  logger.info('export-pptx start', { userId: user.id, slideCount: slides.length, name })

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.author = 'Toro / Tropen OS'
  pptx.subject = name

  // Tropen OS accent green
  const ACCENT = '2D7A50'
  const TEXT_DARK = '1A1714'
  const TEXT_LIGHT = 'FFFFFF'
  const BG_DARK = '1A2E23'

  for (const [i, slide] of slides.entries()) {
    const pSlide = pptx.addSlide()

    const isTitle = i === 0

    if (isTitle) {
      // Title slide: dark background
      pSlide.background = { color: BG_DARK }

      if (slide.title) {
        pSlide.addText(slide.title, {
          x: 0.8, y: 2.2, w: 8.4, h: 1.4,
          fontSize: 40, bold: true, color: TEXT_LIGHT,
          align: 'center',
        })
      }
      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.8, y: 3.8, w: 8.4, h: 0.8,
          fontSize: 20, color: 'A3B89A',
          align: 'center',
        })
      }
      // Green accent line
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 3.5, y: 4.8, w: 3, h: 0.06, fill: { color: ACCENT },
      })
    } else {
      // Content slide: light background
      pSlide.background = { color: 'F5F4F0' }

      // Title bar
      if (slide.title) {
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: 10, h: 1.2, fill: { color: ACCENT },
        })
        pSlide.addText(slide.title, {
          x: 0.4, y: 0.15, w: 9.2, h: 0.9,
          fontSize: 24, bold: true, color: TEXT_LIGHT,
          valign: 'middle',
        })
      }

      let contentY = slide.title ? 1.4 : 0.4

      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.4, y: contentY, w: 9.2, h: 0.55,
          fontSize: 16, color: TEXT_DARK, italic: true,
        })
        contentY += 0.65
      }

      if (slide.bullets.length > 0) {
        const bulletItems = slide.bullets.map(b => ({
          text: b,
          options: { bullet: { code: '25AA' }, fontSize: 16, color: TEXT_DARK, paraSpaceAfter: 6 },
        }))
        pSlide.addText(bulletItems, {
          x: 0.4, y: contentY, w: 9.2, h: 5 - contentY,
          valign: 'top',
        })
      } else if (slide.body.length > 0) {
        pSlide.addText(slide.body.join('\n'), {
          x: 0.4, y: contentY, w: 9.2, h: 5 - contentY,
          fontSize: 16, color: TEXT_DARK, valign: 'top',
        })
      }

      // Slide number (bottom right)
      pSlide.addText(String(i + 1), {
        x: 9.2, y: 5.3, w: 0.6, h: 0.3,
        fontSize: 10, color: '999999', align: 'right',
      })
    }
  }

  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer

  const safeName = name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'praesentation'

  logger.info('export-pptx done', { userId: user.id, slideCount: slides.length })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${safeName}.pptx"`,
    },
  })
}
