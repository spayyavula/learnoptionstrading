// Debug utility to help identify JSON parsing issues
export class JsonDebugger {
  private static logBuffer: string[] = []
  
  /**
   * Enhanced logging for JSON operations
   */
  static logJsonOperation(operation: string, data: any, context?: string) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${operation} ${context ? `(${context})` : ''}: ${JSON.stringify(data, null, 2)}`
    
    console.log(`🔍 JSON Debug: ${logEntry}`)
    this.logBuffer.push(logEntry)
    
    // Keep only last 50 entries
    if (this.logBuffer.length > 50) {
      this.logBuffer.shift()
    }
  }
  
  /**
   * Safe JSON parse with enhanced debugging
   */
  static safeParse(jsonString: string, context: string = 'unknown') {
    try {
      if (!jsonString) {
        this.logJsonOperation('PARSE_EMPTY', { input: jsonString }, context)
        return null
      }
      
      if (typeof jsonString !== 'string') {
        this.logJsonOperation('PARSE_NOT_STRING', { input: jsonString, type: typeof jsonString }, context)
        return null
      }
      
      const trimmed = jsonString.trim()
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        this.logJsonOperation('PARSE_INVALID_START', { input: trimmed.substring(0, 100) }, context)
        return null
      }
      
      const result = JSON.parse(jsonString)
      this.logJsonOperation('PARSE_SUCCESS', { result }, context)
      return result
      
    } catch (error) {
      this.logJsonOperation('PARSE_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input: jsonString?.substring(0, 200) || 'null/undefined',
        inputLength: jsonString?.length || 0
      }, context)
      
      // Additional debugging for common JSON errors
      if (error instanceof Error) {
        if (error.message.includes('Unexpected end of JSON input')) {
          console.error('🚨 Incomplete JSON detected:', {
            partialJson: jsonString?.substring(0, 100),
            possibleCauses: [
              'Network request was cut off',
              'Server returned incomplete response',
              'Response was truncated',
              'Empty response body'
            ]
          })
        } else if (error.message.includes('Unexpected token')) {
          console.error('🚨 Malformed JSON detected:', {
            jsonStart: jsonString?.substring(0, 50),
            possibleCauses: [
              'Server returned HTML instead of JSON',
              'Response has extra characters',
              'Content-Type mismatch',
              'CORS or network error response'
            ]
          })
        }
      }
      
      return null
    }
  }
  
  /**
   * Safe JSON stringify with debugging
   */
  static safeStringify(obj: any, context: string = 'unknown') {
    try {
      const result = JSON.stringify(obj)
      this.logJsonOperation('STRINGIFY_SUCCESS', { input: obj }, context)
      return result
    } catch (error) {
      this.logJsonOperation('STRINGIFY_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        inputType: typeof obj
      }, context)
      return null
    }
  }
  
  /**
   * Get debug log for troubleshooting
   */
  static getDebugLog() {
    return this.logBuffer.join('\n')
  }
  
  /**
   * Clear debug log
   */
  static clearLog() {
    this.logBuffer = []
  }
  
  /**
   * Export debug log to console for easy copying
   */
  static exportLog() {
    console.log('📋 JSON Debug Log (copy this for support):')
    console.log('═'.repeat(50))
    console.log(this.getDebugLog())
    console.log('═'.repeat(50))
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).JsonDebugger = JsonDebugger
  console.log('🔧 JsonDebugger available globally. Use JsonDebugger.exportLog() to get debug info.')
}
