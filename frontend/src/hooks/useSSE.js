import { useEffect, useRef, useCallback } from 'react'

export function useSSE(url, onMessage) {
  const esRef = useRef(null)

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close()
    const es = new EventSource(url)
    esRef.current = es
    es.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)) } catch {}
    }
    es.onerror = () => {
      es.close()
      setTimeout(connect, 3000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => esRef.current?.close()
  }, [connect])
}