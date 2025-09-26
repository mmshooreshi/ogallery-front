// // server/utils/withTiming.ts
// import { getRequestEvent, setResponseHeader, getResponseHeader } from 'h3'
// import { performance } from 'node:perf_hooks'

// export async function withTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
//   const t0 = performance.now()
//   try {
//     return await fn()
//   } finally {
//     const ms = Math.round(performance.now() - t0)
//     const event = getRequestEvent()
//     if (event) {
//       const prev = getResponseHeader(event, 'Server-Timing')
//       const val = `${prev ? prev + ', ' : ''}${name};dur=${ms}`
//       setResponseHeader(event, 'Server-Timing', val)
//     }
//     if (process.dev) console.info(`[timing] ${name}: ${ms}ms`)
//   }
// }
