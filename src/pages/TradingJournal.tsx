import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Search,
  Download,
  BarChart3,
  Target,
  Brain,
  Tag,
  AlertTriangle,
  BookMarked
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'
import { LearningService } from '../services/learningService'
import type { TradingJournalEntry } from '../types/learning'
import { format } from 'date-fns'

export default function TradingJournal() {
  const [entries, setEntries] = useState<TradingJournalEntry[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TradingJournalEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStrategy, setFilterStrategy] = useState('all')
  const [filterOutcome, setFilterOutcome] = useState('all')
  const [newEntry, setNewEntry] = useState({
    contractTicker: '',
    underlyingTicker: '',
    strategy: '',
    entryPrice: 0,
    exitPrice: 0,
    quantity: 1,
    reasoning: '',
    marketContext: '',
    emotionalState: '',
    outcome: 'win' as 'win' | 'loss' | 'breakeven',
    pnl: 0,
    lessonsLearned: '',
    tags: [] as string[],
    newTag: ''
  })

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = () => {
    setEntries(LearningService.getJournalEntries())
  }

  const handleAddEntry = () => {
    if (!newEntry.contractTicker || !newEntry.strategy) return

    const entry = {
      contractTicker: newEntry.contractTicker,
      underlyingTicker: newEntry.underlyingTicker,
      strategy: newEntry.strategy,
     date: new Date(),
      entryPrice: newEntry.entryPrice,
      exitPrice: newEntry.exitPrice || undefined,
      quantity: newEntry.quantity,
      reasoning: newEntry.reasoning,
      marketContext: newEntry.marketContext,
      emotionalState: newEntry.emotionalState,
      outcome: newEntry.outcome,
      pnl: newEntry.pnl || undefined,
      lessonsLearned: newEntry.lessonsLearned,
      tags: newEntry.tags
    }

    LearningService.addJournalEntry(entry)
    loadEntries()
    setShowAddModal(false)
    resetForm()
  }

  const handleUpdateEntry = () => {
    if (!editingEntry) return

    LearningService.updateJournalEntry(editingEntry.id, {
      ...editingEntry,
      exitPrice: editingEntry.exitPrice || undefined,
      pnl: editingEntry.pnl || undefined
    })
    loadEntries()
    setEditingEntry(null)
  }

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      LearningService.deleteJournalEntry(id)
      loadEntries()
    }
  }

  const resetForm = () => {
    setNewEntry({
      contractTicker: '',
      underlyingTicker: '',
      strategy: '',
      entryPrice: 0,
      exitPrice: 0,
      quantity: 1,
      reasoning: '',
      marketContext: '',
      emotionalState: '',
      outcome: 'win',
      pnl: 0,
      lessonsLearned: '',
      tags: [],
      newTag: ''
    })
  }

  const addTag = (tagInput: string, isNewEntry: boolean = true) => {
    const tag = tagInput.trim()
    if (!tag) return

    if (isNewEntry) {
      if (!newEntry.tags.includes(tag)) {
        setNewEntry(prev => ({
          ...prev,
          tags: [...prev.tags, tag],
          newTag: ''
        }))
      }
    } else if (editingEntry) {
      if (!editingEntry.tags.includes(tag)) {
        setEditingEntry(prev => prev ? {
          ...prev,
          tags: [...prev.tags, tag]
        } : null)
      }
    }
  }

  const removeTag = (tagToRemove: string, isNewEntry: boolean = true) => {
    if (isNewEntry) {
      setNewEntry(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }))
    } else if (editingEntry) {
      setEditingEntry(prev => prev ? {
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      } : null)
    }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.contractTicker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reasoning.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStrategy = filterStrategy === 'all' || entry.strategy === filterStrategy
    const matchesOutcome = filterOutcome === 'all' || entry.outcome === filterOutcome

    return matchesSearch && matchesStrategy && matchesOutcome
  })

  const strategies = [...new Set(entries.map(entry => entry.strategy))].filter(Boolean)
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))].filter(Boolean)

  const stats = {
    totalTrades: entries.length,
    winRate: entries.length > 0 ? (entries.filter(e => e.outcome === 'win').length / entries.length) * 100 : 0,
    totalPnL: entries.reduce((sum, entry) => sum + (entry.pnl || 0), 0),
    avgPnL: entries.length > 0 ? entries.reduce((sum, entry) => sum + (entry.pnl || 0), 0) / entries.length : 0
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const exportJournal = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trading-journal-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Journal Disclaimer */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <BookMarked className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Learning Journal Purpose</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This journal is designed to help you reflect on your learning journey and develop trading expertise. Focus on documenting what you've learned, not just profits and losses.
              </p>
              <p className="mt-1">
                The most valuable insights often come from analyzing your thought process, emotions, and decision-making. Use this journal to build self-awareness and improve your trading skills.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Learning Journal</h2>
              <p className="text-gray-600 mt-2">
                Document your learning journey, reflect on experiences, and build trading expertise
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportJournal}
                className="btn btn-secondary"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Learning Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card shadow-md border-blue-200">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Learning Entries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
                <p className="text-xs text-gray-500">Documented experiences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-md border-green-200">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.winRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Learning objectives met</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-md border-purple-200">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Skill Growth</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalTrades > 0 ? '+' + (stats.totalTrades * 5).toString() : '0'} pts
                </p>
                <p className="text-xs text-gray-500">Estimated skill development</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-md border-orange-200">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Brain className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Insights Gained</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalTrades * 3}
                </p>
                <p className="text-xs text-gray-500">Learning moments identified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-md border-gray-200">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search trades..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-select"
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
            >
              <option value="all">All Strategies</option>
              {strategies.map(strategy => (
                <option key={strategy} value={strategy}>{strategy}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
            >
              <option value="all">All Learning Outcomes</option>
              <option value="win">Successful Learning</option>
              <option value="loss">Needs Improvement</option>
              <option value="breakeven">Neutral Learning</option>
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-2" />
              {filteredEntries.length} of {entries.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="card shadow-md border-blue-200">
        <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-medium text-gray-900">Learning Journal Entries</h3>
        </div>
        <div className="card-body">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No learning entries</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start documenting your learning experiences to build trading expertise.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Your First Learning Entry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="font-semibold text-gray-900">{entry.contractTicker}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {entry.strategy}
                        </span>
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          entry.outcome === 'win' 
                            ? 'bg-green-100 text-green-800'
                            : entry.outcome === 'loss'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.outcome}
                        </span>
                        {entry.pnl !== undefined && (
                          <span className={`font-medium ${entry.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(entry.pnl)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Entry: {formatCurrency(entry.entryPrice)}</p>
                          {entry.exitPrice && (
                            <p className="text-sm text-gray-500">Exit: {formatCurrency(entry.exitPrice)}</p>
                          )}
                          <p className="text-sm text-gray-500">Quantity: {entry.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date: {format(entry.date, 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-gray-500">Underlying: {entry.underlyingTicker}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Reasoning</h5>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">{entry.reasoning}</p>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Market Context</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{entry.marketContext}</p>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Emotional State</h5>
                        <p className="text-sm text-gray-600 bg-purple-50 p-2 rounded-lg">{entry.emotionalState}</p>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-blue-700 mb-1">Key Learning Points</h5>
                        <p className="text-sm text-gray-600 bg-green-50 p-2 rounded-lg border-l-4 border-green-500">{entry.lessonsLearned}</p>
                      </div>

                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-blue-200">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-blue-900 mb-4 flex items-center">
                      <BookMarked className="h-5 w-5 mr-2 text-blue-600" />
                      Add Learning Journal Entry
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Contract Ticker</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newEntry.contractTicker}
                          onChange={(e) => setNewEntry({...newEntry, contractTicker: e.target.value})}
                          placeholder="SPY240315C00580000"
                        />
                      </div>
                      <div>
                        <label className="form-label">Underlying</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newEntry.underlyingTicker}
                          onChange={(e) => setNewEntry({...newEntry, underlyingTicker: e.target.value})}
                          placeholder="SPY"
                        />
                      </div>
                      <div>
                        <label className="form-label">Strategy</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newEntry.strategy}
                          onChange={(e) => setNewEntry({...newEntry, strategy: e.target.value})}
                          placeholder="Long Call"
                        />
                      </div>
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newEntry.quantity}
                          onChange={(e) => setNewEntry({...newEntry, quantity: parseInt(e.target.value)})}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Entry Price</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newEntry.entryPrice}
                          onChange={(e) => setNewEntry({...newEntry, entryPrice: parseFloat(e.target.value)})}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="form-label">Exit Price (if closed)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newEntry.exitPrice}
                          onChange={(e) => setNewEntry({...newEntry, exitPrice: parseFloat(e.target.value)})}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="form-label">Outcome</label>
                        <select
                          className="form-select"
                          value={newEntry.outcome}
                          onChange={(e) => setNewEntry({...newEntry, outcome: e.target.value as 'win' | 'loss' | 'breakeven'})}
                        >
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="breakeven">Breakeven</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">P&L</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newEntry.pnl}
                          onChange={(e) => setNewEntry({...newEntry, pnl: parseFloat(e.target.value)})}
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Learning Objective & Reasoning</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={newEntry.reasoning}
                        onChange={(e) => setNewEntry({...newEntry, reasoning: e.target.value})}
                        placeholder="What were you trying to learn from this trade?"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Market Context</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={newEntry.marketContext}
                        onChange={(e) => setNewEntry({...newEntry, marketContext: e.target.value})}
                        placeholder="What was happening in the market?"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Emotional State</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={newEntry.emotionalState}
                        onChange={(e) => setNewEntry({...newEntry, emotionalState: e.target.value})}
                        placeholder="How were you feeling during this trade?"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label text-blue-700 font-medium">Key Learning Points</label>
                      <textarea
                        className="form-input border-blue-300 focus:border-blue-500"
                        rows={2}
                        value={newEntry.lessonsLearned}
                        onChange={(e) => setNewEntry({...newEntry, lessonsLearned: e.target.value})}
                        placeholder="What specific skills or knowledge did you gain from this experience?"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Tags</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="form-input"
                          value={newEntry.newTag}
                          onChange={(e) => setNewEntry({...newEntry, newTag: e.target.value})}
                          placeholder="Add tag"
                          onKeyPress={(e) => e.key === 'Enter' && addTag(newEntry.newTag)}
                        />
                        <button
                          onClick={() => addTag(newEntry.newTag)}
                          className="btn btn-secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {newEntry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newEntry.tags.map(tag => (
                            <span key={tag} className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddEntry}
                  className="btn btn-primary bg-blue-600"
                >
                  Add Learning Entry
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary mr-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingEntry(null)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit Journal Entry
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="form-label">Contract Ticker</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingEntry.contractTicker}
                          onChange={(e) => setEditingEntry({...editingEntry, contractTicker: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="form-label">Underlying</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingEntry.underlyingTicker}
                          onChange={(e) => setEditingEntry({...editingEntry, underlyingTicker: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="form-label">Strategy</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingEntry.strategy}
                          onChange={(e) => setEditingEntry({...editingEntry, strategy: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingEntry.quantity}
                          onChange={(e) => setEditingEntry({...editingEntry, quantity: parseInt(e.target.value)})}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="form-label">Entry Price</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingEntry.entryPrice}
                          onChange={(e) => setEditingEntry({...editingEntry, entryPrice: parseFloat(e.target.value)})}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="form-label">Exit Price (if closed)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingEntry.exitPrice || ''}
                          onChange={(e) => setEditingEntry({...editingEntry, exitPrice: parseFloat(e.target.value)})}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="form-label">Outcome</label>
                        <select
                          className="form-select"
                          value={editingEntry.outcome || 'win'}
                          onChange={(e) => setEditingEntry({...editingEntry, outcome: e.target.value as 'win' | 'loss' | 'breakeven'})}
                        >
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="breakeven">Breakeven</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">P&L</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingEntry.pnl || ''}
                          onChange={(e) => setEditingEntry({...editingEntry, pnl: parseFloat(e.target.value)})}
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Reasoning</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editingEntry.reasoning}
                        onChange={(e) => setEditingEntry({...editingEntry, reasoning: e.target.value})}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Market Context</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editingEntry.marketContext}
                        onChange={(e) => setEditingEntry({...editingEntry, marketContext: e.target.value})}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Emotional State</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editingEntry.emotionalState}
                        onChange={(e) => setEditingEntry({...editingEntry, emotionalState: e.target.value})}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Lessons Learned</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editingEntry.lessonsLearned}
                        onChange={(e) => setEditingEntry({...editingEntry, lessonsLearned: e.target.value})}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="form-label">Tags</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add tag"
                          onKeyPress={(e) => e.key === 'Enter' && addTag(e.currentTarget.value, false)}
                        />
                        <button
                          onClick={(e) => addTag((e.currentTarget.previousSibling as HTMLInputElement).value, false)}
                          className="btn btn-secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {editingEntry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editingEntry.tags.map(tag => (
                            <span key={tag} className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              #{tag}
                              <button
                                onClick={() => removeTag(tag, false)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleUpdateEntry}
                  className="btn btn-primary"
                >
                  Update Entry
                </button>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="btn btn-secondary mr-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}