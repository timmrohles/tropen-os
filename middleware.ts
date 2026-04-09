import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4()
  
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  
  return response
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
