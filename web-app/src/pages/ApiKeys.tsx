import React, { useState, useEffect } from 'react'
import { Copy, Trash2, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getApplications, getApplicationApiKeys, deactivateApiKey } from '@/services/applicationService'
import { useAuthStore } from '@/lib/auth'

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<Array<any>>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  const { user } = useAuthStore()

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        // Get the user's applications first
        const appsResponse = await getApplications()
        if (appsResponse.data && appsResponse.data.length > 0) {
          // Get API keys for the first application
          // In a real implementation, you might want to let the user select an application
          // or show keys from all applications
          const keysResponse = await getApplicationApiKeys(appsResponse.data[0].id)
          setApiKeys(keysResponse.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch API keys:', err)
        setError('Failed to load API keys')
      } finally {
        setLoading(false)
      }
    }

    fetchApiKeys()
  }, [user?.id])

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDelete = async (keyId: string) => {
    try {
      setDeletingKeyId(keyId)
      await deactivateApiKey(keyId)
      // Remove the deleted key from the list
      setApiKeys(prev => prev.filter(key => key.id !== keyId))
    } catch (err) {
      console.error('Failed to delete API key:', err)
      setError('Failed to delete API key')
    } finally {
      setDeletingKeyId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading API keys...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-500/20 border border-red-500/rounded-lg text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-400">Manage your API keys and access tokens</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Key
          </button>
          <button onClick={() => window.location.reload()} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {apiKeys.length === 0 && !loading && !error ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No API keys found. Create a new key to get started.</p>
        </div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Key</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Used</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key: any) => (
                <tr key={key.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium">{key.name || 'Unnamed Key'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                        {showSecret[key.id] ? key.key_hash : '•'.repeat(20)}
                      </code>
                      <button
                        onClick={() => toggleSecret(key.id)}
                        className="text-gray-400 hover:text-gray-200"
                        disabled={deletingKeyId === key.id}
                      >
                        {showSecret[key.id] ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(key.key_hash || '')}
                        className="text-gray-400 hover:text-blue-400"
                        disabled={deletingKeyId === key.id}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {key.created_at ? new Date(key.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {deletingKeyId === key.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                    ) : (
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-400 hover:text-red-300"
                        disabled={deletingKeyId === key.id}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documentation */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold mb-4">API Documentation</h3>
        <div className="bg-gray-700 rounded p-4">
          <pre className="text-sm overflow-x-auto">
{`curl -X POST https://api.promptshield.io/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "User input here",
    "threshold": 60
  }'`}
          </pre>
        </div>
      </div>
    </div>
  )
}
