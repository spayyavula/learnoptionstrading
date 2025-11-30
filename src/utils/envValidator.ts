export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  invalid: string[]
  loaded: Record<string, string>
  errors: string[]
}

export interface EnvConfig {
  required?: string[]
  optional?: string[]
  validators?: Record<string, (value: string) => boolean>
}

const DEFAULT_REQUIRED_VARS = [
  'VITE_AZURE_CLIENT_ID',
  'VITE_AZURE_B2C_TENANT'
]

const DEFAULT_OPTIONAL_VARS = [
  'VITE_AZURE_B2C_POLICY_SIGNIN',
  'VITE_AZURE_B2C_POLICY_RESET',
  'VITE_POLYGON_API_KEY',
  'VITE_ENABLE_REAL_TIME_DATA',
  'VITE_ENABLE_MOCK_DATA',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_MONTHLY_PRICE_ID',
  'VITE_STRIPE_YEARLY_PRICE_ID'
]

const DEFAULT_VALIDATORS: Record<string, (value: string) => boolean> = {
  VITE_AZURE_CLIENT_ID: (value) => {
    // Azure client IDs are GUIDs
    return value.length >= 32 && value !== 'your-client-id'
  },
  VITE_AZURE_B2C_TENANT: (value) => {
    // Tenant name should be alphanumeric
    return value.length > 3 && value !== 'your-tenant'
  },
  VITE_POLYGON_API_KEY: (value) => {
    return value.length > 10
  }
}

export function validateEnvironment(config?: EnvConfig): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missing: [],
    invalid: [],
    loaded: {},
    errors: []
  }

  const requiredVars = config?.required || DEFAULT_REQUIRED_VARS
  const optionalVars = config?.optional || DEFAULT_OPTIONAL_VARS
  const validators = config?.validators || DEFAULT_VALIDATORS

  try {
    console.group('🔍 Environment Validation')
    console.log('Environment mode:', import.meta.env.MODE)
    console.log('Base URL:', import.meta.env.BASE_URL)
    console.log('Dev mode:', import.meta.env.DEV)
    console.log('Prod mode:', import.meta.env.PROD)

    for (const varName of requiredVars) {
      const value = import.meta.env[varName]

      if (!value) {
        result.missing.push(varName)
        result.isValid = false
        console.error(`❌ Missing required variable: ${varName}`)
      } else {
        result.loaded[varName] = maskSensitiveValue(varName, value)

        const validator = validators[varName]
        if (validator && !validator(value)) {
          result.invalid.push(varName)
          result.isValid = false
          console.warn(`⚠️ Invalid value for: ${varName}`)
        } else {
          console.log(`✅ ${varName}: ${maskSensitiveValue(varName, value)}`)
        }
      }
    }

    for (const varName of optionalVars) {
      const value = import.meta.env[varName]

      if (value) {
        result.loaded[varName] = maskSensitiveValue(varName, value)

        const validator = validators[varName]
        if (validator && !validator(value)) {
          result.invalid.push(varName)
          console.warn(`⚠️ Invalid value for optional: ${varName}`)
        } else {
          console.log(`✅ ${varName}: ${maskSensitiveValue(varName, value)}`)
        }
      } else {
        console.log(`ℹ️ Optional variable not set: ${varName}`)
      }
    }

    if (result.missing.length > 0) {
      result.errors.push(`Missing required environment variables: ${result.missing.join(', ')}`)
    }

    if (result.invalid.length > 0) {
      result.errors.push(`Invalid environment variables: ${result.invalid.join(', ')}`)
    }

    console.groupEnd()

    return result
  } catch (error) {
    result.isValid = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown validation error')
    console.error('❌ Environment validation error:', error)
    console.groupEnd()
    return result
  }
}

function maskSensitiveValue(varName: string, value: string): string {
  const sensitivePatterns = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CLIENT_ID']

  const isSensitive = sensitivePatterns.some(pattern => varName.includes(pattern))

  if (isSensitive && value.length > 8) {
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
  }

  if (value.length > 50) {
    return `${value.substring(0, 30)}...`
  }

  return value
}

export function logEnvironmentDiagnostics(): void {
  console.group('🔧 Environment Diagnostics')

  try {
    console.log('Working Directory:', window.location.origin)
    console.log('Environment Mode:', import.meta.env.MODE)
    console.log('Is Development:', import.meta.env.DEV)
    console.log('Is Production:', import.meta.env.PROD)
    console.log('Base URL:', import.meta.env.BASE_URL)

    const allEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    console.log(`Total VITE_ variables loaded: ${allEnvVars.length}`)
    console.log('Loaded variables:', allEnvVars)

    if (allEnvVars.length === 0) {
      console.error('⚠️ WARNING: No VITE_ environment variables detected!')
      console.error('This usually means:')
      console.error('1. The .env file is not in the project root')
      console.error('2. The dev server needs to be restarted')
      console.error('3. Environment variables are not prefixed with VITE_')
      console.error('4. The .env file has syntax errors')
    }
  } catch (error) {
    console.error('Error generating diagnostics:', error)
  }

  console.groupEnd()
}

export function getEnvFilePath(): string {
  return import.meta.env.DEV
    ? '.env (development)'
    : '.env.production (or Azure Static Web App environment variables)'
}

export function checkEnvFileExists(): boolean {
  const allVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  return allVars.length > 0
}
