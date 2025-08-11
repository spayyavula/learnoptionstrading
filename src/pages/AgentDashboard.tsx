import React, { useState, useEffect } from 'react'
import { 
  Bot, 
  Cpu, 
  Database, 
  Code, 
  Zap, 
  Server,
  Globe, 
  Key,
  FileJson,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

interface ApiEndpoint {
  path: string
  method: string
  description: string
  parameters?: string[]
  responseExample: string
  requiresAuth: boolean
}

interface ApiKey {
  id: string
  name: string
  key: string
  created: Date
  lastUsed?: Date
  status: 'active' | 'revoked'
}

const AgentDashboard: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [testResponse, setTestResponse] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    // Load API keys from localStorage
    const loadApiKeys = () => {
      try {
        const keys = localStorage.getItem('agent_api_keys')
        if (keys) {
          const parsedKeys = JSON.parse(keys)
          setApiKeys(parsedKeys.map((key: any) => ({
            ...key,
            created: new Date(key.created),
            lastUsed: key.lastUsed ? new Date(key.lastUsed) : undefined
          })))
        } else {
          // Create a demo key if none exist
          const demoKey: ApiKey = {
            id: 'demo-key-1',
            name: 'Demo API Key',
            key: `opt_${generateRandomString(32)}`,
            created: new Date(),
            status: 'active'
          }
          setApiKeys([demoKey])
          localStorage.setItem('agent_api_keys', JSON.stringify([demoKey]))
        }
      } catch (error) {
        console.error('Error loading API keys:', error)
      }
    }

    loadApiKeys()
  }, [])

  const apiEndpoints: ApiEndpoint[] = [
    {
      path: '/api/v1/market/options',
      method: 'GET',
      description: 'Get available options contracts',
      parameters: ['underlying', 'expiration', 'strike'],
      responseExample: '{"contracts": [{"ticker": "SPY240315C00580000", "underlying": "SPY", "strike": 580, "expiration": "2024-03-15", "type": "call", "bid": 29.05, "ask": 29.15, "last": 29.10}]}',
      requiresAuth: true
    },
    {
      path: '/api/v1/portfolio',
      method: 'GET',
      description: 'Get current portfolio positions',
      responseExample: '{"balance": 100000, "positions": [{"symbol": "AAPL", "quantity": 10, "avgPrice": 175.43, "currentPrice": 178.25}]}',
      requiresAuth: true
    },
    {
      path: '/api/v1/orders',
      method: 'POST',
      description: 'Place a new order',
      parameters: ['symbol', 'quantity', 'type', 'orderType', 'price'],
      responseExample: '{"orderId": "ord_123456", "status": "pending", "message": "Order placed successfully"}',
      requiresAuth: true
    },
    {
      path: '/api/v1/market/data',
      method: 'GET',
      description: 'Get market data for a symbol',
      parameters: ['symbol', 'timeframe'],
      responseExample: '{"symbol": "SPY", "price": 580.25, "change": 2.15, "changePercent": 0.37, "volume": 45234567}',
      requiresAuth: false
    }
  ]

  const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const createNewApiKey = () => {
    if (!newKeyName.trim()) return

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: `opt_${generateRandomString(32)}`,
      created: new Date(),
      status: 'active'
    }

    const updatedKeys = [...apiKeys, newKey]
    setApiKeys(updatedKeys)
    localStorage.setItem('agent_api_keys', JSON.stringify(updatedKeys))
    setNewKeyName('')
    setShowCreateKey(false)
    setCopiedKey(newKey.key)

    // Auto-clear copied status after 5 seconds
    globalThis.setTimeout(() => {
      if (setCopiedKey) {
        setCopiedKey(null)
      }
    }, 5000)
  }

  const revokeApiKey = (keyId: string) => {
    const updatedKeys = apiKeys.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' as const } : key
    )
    setApiKeys(updatedKeys)
    localStorage.setItem('agent_api_keys', JSON.stringify(updatedKeys))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(text)
    
    // Auto-clear copied status after 5 seconds
    globalThis.setTimeout(() => {
      if (setCopiedKey) {
        setCopiedKey(null)
      }
    }, 5000)
  }

  const testEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setTestStatus('loading')
    setTestResponse(null)

    // Simulate API call
    globalThis.setTimeout(() => {
      setTestStatus('success')
      setTestResponse(endpoint.responseExample)
    }, 1000)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const formatJson = (json: string) => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2)
    } catch (e) {
      return json
    }
  }

  return (
    <div className="space-y-6">
      {/* API Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">API Usage Disclaimer</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                The Options World API is provided for educational and paper trading purposes only. Any automated trading systems or agents built using this API should not be used for real money trading without thorough testing and risk assessment.
              </p>
              <p className="mt-1">
                API users are responsible for ensuring their implementations comply with all applicable laws and regulations. Options World is not responsible for any losses incurred through the use of this API.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Agent API Dashboard</h2>
              <p className="text-gray-600 mt-2">
                Manage API access for AI agents and automated trading systems
              </p>
            </div>
            <Bot className="h-12 w-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              API Keys
            </h3>
            <button
              onClick={() => setShowCreateKey(true)}
              className="btn btn-primary"
            >
              Create New API Key
            </button>
          </div>
        </div>
        <div className="card-body">
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create an API key to allow agents to access your trading data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {copiedKey && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">API key copied to clipboard</p>
                      <p className="text-xs text-green-600 mt-1">Make sure to save this key as it won't be shown again</p>
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-green-100 rounded font-mono text-sm text-green-800 break-all">
                    {copiedKey}
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((key) => (
                      <tr key={key.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{key.name}</div>
                          <div className="text-sm text-gray-500 font-mono">
                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(key.created)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            key.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {key.status === 'active' ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {key.status === 'active' && (
                            <button
                              onClick={() => revokeApiKey(key.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create API Key Modal */}
          {showCreateKey && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateKey(false)} />
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                          Create New API Key
                        </h3>
                        
                        <div className="mb-4">
                          <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-1">
                            Key Name
                          </label>
                          <input
                            type="text"
                            id="keyName"
                            className="form-input"
                            placeholder="e.g., Trading Bot, Backtest Agent"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Give your key a descriptive name to remember what it's used for.
                          </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <Zap className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  API keys provide full access to your account. Keep them secure and never share them publicly.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={createNewApiKey}
                      disabled={!newKeyName.trim()}
                    >
                      Create API Key
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary mr-2"
                      onClick={() => setShowCreateKey(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Code className="h-5 w-5 mr-2" />
            API Documentation
          </h3>
        </div>
        <div className="card-body">
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Authentication</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                All API requests must include your API key in the Authorization header:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm overflow-x-auto">
                Authorization: Bearer YOUR_API_KEY
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Base URL</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                All API endpoints are relative to:
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                https://api.optionsworld.trade
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Available Endpoints</h4>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint) => (
                <div 
                  key={endpoint.path} 
                  className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => testEndpoint(endpoint)}
                >
                  <div className="flex items-start p-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' : 
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {endpoint.method}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-sm">{endpoint.path}</div>
                      <div className="text-sm text-gray-600 mt-1">{endpoint.description}</div>
                      {endpoint.parameters && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">Parameters:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {endpoint.parameters.map(param => (
                              <span key={param} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                                {param}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {endpoint.requiresAuth && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                          Requires Auth
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoint Test Response */}
          {selectedEndpoint && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Test Response: {selectedEndpoint.path}
              </h4>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                {testStatus === 'loading' ? (
                  <div className="flex items-center justify-center h-24">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                  </div>
                ) : testStatus === 'success' && testResponse ? (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {formatJson(testResponse)}
                  </pre>
                ) : testStatus === 'error' ? (
                  <div className="text-red-500">Error fetching response</div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Examples */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileJson className="h-5 w-5 mr-2" />
            Agent Integration Examples
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Python Example</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://api.optionsworld.trade"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get available options contracts
response = requests.get(
    f"{BASE_URL}/api/v1/market/options",
    params={"underlying": "SPY"},
    headers=headers
)

if response.status_code == 200:
    contracts = response.json()["contracts"]
    print(f"Found {len(contracts)} contracts")
else:
    print(f"Error: {response.status_code}")
    print(response.text)`}
              </pre>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">JavaScript Example</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`const API_KEY = "your_api_key_here";
const BASE_URL = "https://api.optionsworld.trade";

async function placeOrder(symbol, quantity, type, orderType, price) {
  try {
    const response = await fetch(\`\${BASE_URL}/api/v1/orders\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol,
        quantity,
        type,
        orderType,
        price
      })
    });
    
    const data = await response.json();
    console.log('Order placed:', data);
    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">LangChain Agent Example</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain.tools import tool
from langchain_openai import ChatOpenAI

@tool
def get_options_data(underlying: str) -> str:
    """Get options data for a specific underlying stock symbol."""
    import requests
    
    API_KEY = "your_api_key_here"
    BASE_URL = "https://api.optionsworld.trade"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{BASE_URL}/api/v1/market/options",
        params={"underlying": underlying},
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        return f"Error: {response.status_code} - {response.text}"

@tool
def place_trade(symbol: str, quantity: int, order_type: str, price: float = None) -> str:
    """Place a trade order. order_type should be 'buy' or 'sell'."""
    import requests
    
    API_KEY = "your_api_key_here"
    BASE_URL = "https://api.optionsworld.trade"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "symbol": symbol,
        "quantity": quantity,
        "type": order_type,
        "orderType": "market" if price is None else "limit",
    }
    
    if price is not None:
        data["price"] = price
    
    response = requests.post(
        f"{BASE_URL}/api/v1/orders",
        json=data,
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        return f"Error: {response.status_code} - {response.text}"

# Create the agent
llm = ChatOpenAI(model="gpt-4o")
tools = [get_options_data, place_trade]

prompt = PromptTemplate.from_template(
    """You are an options trading assistant that helps users analyze and execute trades.
    
    {format_instructions}
    
    User query: {input}
    """
)

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Example usage
result = agent_executor.invoke({"input": "Find call options for SPY and recommend a trade"})
print(result["output"])`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Capabilities */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Cpu className="h-5 w-5 mr-2" />
            Agent Capabilities
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                Trading Agents
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Automated options trading based on predefined strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Real-time market data monitoring and analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Risk management and position sizing automation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Backtesting strategies against historical data</span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Data Analysis Agents
              </h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Options chain analysis and opportunity detection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Volatility surface modeling and visualization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Greeks analysis and risk exposure calculation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Portfolio performance tracking and reporting</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Market Analysis Agents
              </h4>
              <ul className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Market regime detection and strategy adaptation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Sentiment analysis from news and social media</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Correlation analysis between assets and sectors</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Macro economic indicator monitoring</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Notification Agents
              </h4>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Price alerts and threshold notifications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Trade execution confirmations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Risk exposure warnings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span>Market event notifications</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Additional Resources</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/app/trading" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                Trading Platform
              </h4>
              <p className="text-sm text-gray-600">
                Access the full trading platform to execute trades manually.
              </p>
            </Link>
            
            <a href="https://github.com/optionsworld/api-examples" target="_blank" rel="noopener noreferrer" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Code className="h-4 w-4 mr-2 text-purple-600" />
                GitHub Examples
                <ExternalLink className="h-3 w-3 ml-1" />
              </h4>
              <p className="text-sm text-gray-600">
                Sample code and integration examples on our GitHub repository.
              </p>
            </a>
            
            <a href="https://docs.optionsworld.trade/api" target="_blank" rel="noopener noreferrer" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileJson className="h-4 w-4 mr-2 text-green-600" />
                Full API Documentation
                <ExternalLink className="h-3 w-3 ml-1" />
              </h4>
              <p className="text-sm text-gray-600">
                Comprehensive API reference with all endpoints and parameters.
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboard