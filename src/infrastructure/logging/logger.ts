export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    // Structured info log
    const output = {
      level: 'INFO',
      message: msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    process.stdout.write(JSON.stringify(output) + '\n')
  },
  error: (msg: string, error: Error, meta?: Record<string, unknown>) => {
    // Structured error log
    const output = {
      level: 'ERROR',
      message: msg,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...meta
    }
    process.stderr.write(JSON.stringify(output) + '\n')
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    // Structured warn log
    const output = {
      level: 'WARN',
      message: msg,
      timestamp: new Date().toISOString(),
      ...meta
    }
    process.stdout.write(JSON.stringify(output) + '\n')
  }
}
