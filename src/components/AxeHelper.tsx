'use client'

import { useEffect } from 'react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

export default function AxeHelper() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    // Pass static imports, not dynamic import() results — axe mutates React.createElement
    // which fails on frozen ES module namespace objects returned by import().
    import('@axe-core/react').then(({ default: axe }) => {
      void axe(React, ReactDOM, 1000)
    }).catch(() => {})
  }, [])

  return null
}
