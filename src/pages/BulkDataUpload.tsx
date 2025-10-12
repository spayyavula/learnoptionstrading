import React, { useState, useCallback } from 'react'
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  TrendingUp,
  BarChart3,
  Activity,
  Calendar,
  Zap,
  FileJson,
  FileSpreadsheet,
  Eye,
  Play,
  X,
  Info,
  Clock
} from 'lucide-react'
import {
  BulkDataUploadService,
  TABLE_SCHEMAS,
  UploadTableType,
  UploadProgress,
  UploadResult,
  TableSchema
} from '../services/bulkDataUploadService'

export const BulkDataUpload: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<UploadTableType | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [step, setStep] = useState<'select' | 'upload' | 'preview' | 'uploading' | 'complete'>('select')
  const [showErrors, setShowErrors] = useState(false)

  // Table categories for better organization
  const tableCategories = {
    'Stock & Options Data': [
      'historical_data',
      'options_historical_data',
      'intraday_price_data'
    ] as UploadTableType[],
    'Advanced Greeks & Volatility': [
      'historical_greeks_snapshots',
      'historical_volatility_surface'
    ] as UploadTableType[],
    'Market Indicators & Events': [
      'corporate_actions',
      'historical_market_indicators'
    ] as UploadTableType[]
  }

  // Icons for different table types
  const tableIcons: Record<UploadTableType, any> = {
    historical_data: TrendingUp,
    options_historical_data: BarChart3,
    historical_greeks_snapshots: Activity,
    historical_volatility_surface: Zap,
    corporate_actions: Calendar,
    historical_market_indicators: Database,
    intraday_price_data: Clock
  }

  const handleTableSelect = (table: UploadTableType) => {
    setSelectedTable(table)
    setStep('upload')
    setUploadedFile(null)
    setParsedData(null)
    setUploadResult(null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      await handleFileSelect(file)
    }
  }, [selectedTable])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFileSelect(file)
    }
  }, [selectedTable])

  const handleFileSelect = async (file: File) => {
    if (!selectedTable) return

    setUploadedFile(file)
    try {
      const data = await BulkDataUploadService.parseFile(file)
      setParsedData(data)
      setStep('preview')
    } catch (error: any) {
      alert(`Error parsing file: ${error.message}`)
    }
  }

  const handleUpload = async () => {
    if (!parsedData || !selectedTable) return

    setStep('uploading')
    setUploadResult(null)

    try {
      const result = await BulkDataUploadService.uploadData(
        parsedData,
        selectedTable,
        (progress) => {
          setUploadProgress(progress)
        },
        100 // batch size
      )

      setUploadResult(result)
      setStep('complete')
    } catch (error: any) {
      alert(`Upload error: ${error.message}`)
      setStep('preview')
    }
  }

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    if (!selectedTable) return
    BulkDataUploadService.downloadTemplate(selectedTable, format)
  }

  const handleReset = () => {
    setSelectedTable(null)
    setUploadedFile(null)
    setParsedData(null)
    setUploadProgress(null)
    setUploadResult(null)
    setStep('select')
    setShowErrors(false)
  }

  const renderTableSelect = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
          <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Bulk Data Upload
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload historical market data to power your trading analytics. Select a table type to begin.
        </p>
      </div>

      {/* Table Categories */}
      {Object.entries(tableCategories).map(([category, tables]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => {
              const schema = TABLE_SCHEMAS[table]
              const Icon = tableIcons[table]
              return (
                <button
                  key={table}
                  onClick={() => handleTableSelect(table)}
                  className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {schema.displayName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {schema.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                        <FileText className="w-3 h-3 mr-1" />
                        {schema.fields.length} fields
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  const renderUploadZone = () => {
    const schema = selectedTable ? TABLE_SCHEMAS[selectedTable] : null
    if (!schema) return null

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Upload {schema.displayName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {schema.description}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Need a template?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                Download a sample file to see the required format and fields.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download CSV
                </button>
                <button
                  onClick={() => handleDownloadTemplate('json')}
                  className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Download JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            <Upload className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Drop your file here, or click to browse
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Supports CSV and JSON formats
            </p>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
              <FileSpreadsheet className="w-4 h-4" />
              <span>CSV</span>
              <span>•</span>
              <FileJson className="w-4 h-4" />
              <span>JSON</span>
            </div>
          </div>
        </div>

        {/* Schema Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Required Fields ({schema.fields.filter(f => f.required).length} required, {schema.fields.length} total)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema.fields.map((field) => (
              <div key={field.name} className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-1">
                  {field.required ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Required" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" title="Optional" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {field.name}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                      ({field.type})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {field.description}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-1">
                    Example: {String(field.example)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderPreview = () => {
    if (!parsedData || !selectedTable) return null

    const schema = TABLE_SCHEMAS[selectedTable]
    const validation = BulkDataUploadService.validateData(parsedData, selectedTable)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Preview & Validate
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Review your data before uploading
            </p>
          </div>
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Validation Summary */}
        <div className={`rounded-xl p-6 ${
          validation.valid
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start space-x-3">
            {validation.valid ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                validation.valid
                  ? 'text-green-900 dark:text-green-300'
                  : 'text-red-900 dark:text-red-300'
              }`}>
                {validation.valid
                  ? 'All data validated successfully!'
                  : `Found ${validation.errors.length} validation error(s)`}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Total Records</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parsedData.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">File</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {uploadedFile?.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Table</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {schema.displayName}
                  </div>
                </div>
              </div>

              {!validation.valid && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="text-sm font-medium text-red-700 dark:text-red-400 hover:underline"
                  >
                    {showErrors ? 'Hide' : 'Show'} errors
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Details */}
        {!validation.valid && showErrors && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-300">
                Validation Errors
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {validation.errors.slice(0, 50).map((error, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Row {error.row}{error.field && `, Field: ${error.field}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {error.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Data Preview (first 10 rows)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  {schema.fields.map((field) => (
                    <th
                      key={field.name}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {field.name}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {parsedData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    {schema.fields.map((field) => (
                      <td
                        key={field.name}
                        className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap"
                      >
                        {String(row[field.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep('upload')}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            ← Choose Different File
          </button>
          <button
            onClick={handleUpload}
            disabled={!validation.valid}
            className={`inline-flex items-center px-8 py-3 rounded-lg font-semibold transition-all ${
              validation.valid
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 mr-2" />
            Start Upload
          </button>
        </div>
      </div>
    )
  }

  const renderUploading = () => {
    if (!uploadProgress) return null

    const progressPercent = (uploadProgress.processed / uploadProgress.total) * 100

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 animate-pulse">
            <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Uploading Data...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {uploadProgress.status === 'validating' && 'Validating data...'}
            {uploadProgress.status === 'uploading' && 'Uploading records...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Progress
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {uploadProgress.processed} / {uploadProgress.total}
            </span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
            {progressPercent.toFixed(1)}%
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {uploadProgress.successful}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
            <div className="text-sm text-red-600 dark:text-red-400 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {uploadProgress.failed}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Remaining</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {uploadProgress.total - uploadProgress.processed}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderComplete = () => {
    if (!uploadResult) return null

    const successRate = (uploadResult.inserted / uploadResult.totalRecords) * 100

    return (
      <div className="space-y-6">
        {/* Success/Error Header */}
        <div className={`text-center p-8 rounded-xl ${
          uploadResult.success
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            uploadResult.success
              ? 'bg-green-100 dark:bg-green-900/40'
              : 'bg-yellow-100 dark:bg-yellow-900/40'
          }`}>
            {uploadResult.success ? (
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${
            uploadResult.success
              ? 'text-green-900 dark:text-green-300'
              : 'text-yellow-900 dark:text-yellow-300'
          }`}>
            {uploadResult.success
              ? 'Upload Complete!'
              : 'Upload Completed with Errors'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {uploadResult.success
              ? 'All records were uploaded successfully'
              : `${uploadResult.inserted} of ${uploadResult.totalRecords} records uploaded successfully`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Records</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {uploadResult.totalRecords}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Inserted</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {uploadResult.inserted}
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 text-center border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-600 dark:text-red-400 mb-1">Failed</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {uploadResult.failed}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Duration</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {(uploadResult.duration / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-900 dark:text-white">Success Rate</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {successRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                successRate === 100
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-600'
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Errors */}
        {uploadResult.errors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-300">
                Upload Errors ({uploadResult.errors.length})
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {uploadResult.errors.slice(0, 20).map((error, index) => (
                <div
                  key={index}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Row {error.row}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {error.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Upload More Data
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {step === 'select' && renderTableSelect()}
        {step === 'upload' && renderUploadZone()}
        {step === 'preview' && renderPreview()}
        {step === 'uploading' && renderUploading()}
        {step === 'complete' && renderComplete()}
      </div>
    </div>
  )
}
