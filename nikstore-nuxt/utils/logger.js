const isDev = import.meta.env.DEV

const LEVELS  = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LVL = isDev ? 0 : 2  // dev: debug+, prod: warn+

const errorBuffer = []
const MAX_BUFFER  = 50

function pushToBuffer(entry) {
  errorBuffer.push(entry)
  if (errorBuffer.length > MAX_BUFFER) errorBuffer.shift()
}

function format(level, context, message, meta) {
  return {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    url:       window.location.pathname,
    ...meta,
  }
}

export const logger = {
  debug(message, meta = {}, context = 'App') {
    if (LEVELS.debug < MIN_LVL) return
    console.debug(`[${context}]`, message, meta)
  },

  info(message, meta = {}, context = 'App') {
    if (LEVELS.info < MIN_LVL) return
    console.info(`[${context}]`, message, meta)
  },

  warn(message, meta = {}, context = 'App') {
    if (LEVELS.warn < MIN_LVL) return
    const entry = format('warn', context, message, meta)
    pushToBuffer(entry)
    console.warn(`[${context}]`, message, meta)
  },

  error(message, error = null, meta = {}, context = 'App') {
    const entry = format('error', context, message, {
      ...meta,
      errorMessage: error?.message ?? String(error ?? ''),
      stack:        error?.stack,
    })
    pushToBuffer(entry)
    console.error(`[${context}]`, message, error, meta)
    // Future: sendToErrorService(entry)
  },

  apiError(endpoint, statusCode, message, meta = {}) {
    const entry = format('error', 'API', `${statusCode} ${endpoint}`, {
      endpoint, statusCode, message, ...meta,
    })
    pushToBuffer(entry)
    if (statusCode >= 500) {
      console.error('[API ERROR]', endpoint, statusCode, message, meta)
    } else if (statusCode >= 400 && statusCode !== 401 && statusCode !== 422) {
      console.warn('[API WARN]', endpoint, statusCode, message)
    }
  },

  getErrors()  { return [...errorBuffer] },
  clearErrors() { errorBuffer.length = 0 },
}

export default logger
