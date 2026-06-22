import React, { useEffect, useState } from 'react'
import {
  getApplications,
  createApplication,
  deleteApplication
} from '../services/applicationService'
import { Copy } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Application {
  id: string
  name: string
  description: string
  created_at: string
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [createApiKey, setCreateApiKey] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  // New state to store created app details when API key is generated
  const [createdAppId, setCreatedAppId] = useState<string | null>(null)
  const [createdAppName, setCreatedAppName] = useState<string | null>(null)

  const loadApplications = async () => {
    try {
      const res = await getApplications()
      setApplications(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return

    try {
      const res = await createApplication(
        {
          name,
          description
        },
        createApiKey
      )

      setName('')
      setDescription('')
      setCreateApiKey(false)

      loadApplications()

      // If we requested an API key and the response contains it, show it
      if (createApiKey && res.data.api_key) {
        const fullKey = res.data.api_key.api_key // The raw key is under api_key.api_key
        const apiKeyInfo = res.data.api_key.api_key_info
        setApiKey(fullKey)
        // Store app details to show in modal
        setCreatedAppId(res.data.id)
        setCreatedAppName(res.data.name)
        // Store the full key in localStorage so the detail page can retrieve it once, keyed by API key id
        if (apiKeyInfo && apiKeyInfo.id) {
          localStorage.setItem(`promptshield_apiKey_${apiKeyInfo.id}`, fullKey)
        }
        setShowApiKeyModal(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id)
      loadApplications()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyApiKey = async () => {
    if (!apiKey) {
      alert('No API key to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(apiKey)
      alert('API key copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      alert('Failed to copy API key')
    }
  }

  return (
    <div className="p-8">

      <h1 className="text-5xl font-bold mb-8">
        Applications
      </h1>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-4">
          Create Application
        </h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Application Name"
          className="w-full mb-4 p-3 rounded-xl bg-[#091325] border border-white/10"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={4}
          className="w-full mb-4 p-3 rounded-xl bg-[#091325] border border-white/10"
        />

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="create-api-key"
            checked={createApiKey}
            onChange={(e) => setCreateApiKey(e.target.checked)}
            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="create-api-key" className="ml-2 text-gray-400">
            Also create API key
          </label>
        </div>

        <button
          onClick={handleCreate}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500"
        >
          Create Application
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white/5 border border-white/10 rounded-3xl p-6"
          >
            <Link to={`/applications/${app.id}`} className="block mb-4">
              <h3 className="text-xl font-bold mb-2">
                {app.name}
              </h3>

              <p className="text-gray-400 mb-4">
                {app.description}
              </p>

              <div className="text-xs text-gray-500 mb-4">
                Created:
                {' '}
                {new Date(app.created_at).toLocaleDateString()}
              </div>
            </Link>

            <button
              onClick={() => handleDelete(app.id)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        ))}

      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">API Key Created</h2>
            <p className="mb-4 text-gray-400">
              Your API key has been created. Please copy it now as it will not be shown again.
            </p>
            {createdAppId && createdAppName && (
              <div className="mb-4">
                <p className="text-gray-400 mb-1">Application ID:</p>
                <p className="font-mono text-sm bg-gray-700 px-2 py-1 rounded break-all">
                  {createdAppId}
                </p>
              </div>
            )}
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">API Key:</label>
              <div className="flex items-center">
                <code className="font-mono text-sm bg-gray-700 px-3 py-1 rounded flex-1">
                  {apiKey}
                </code>
                <button
                  onClick={handleCopyApiKey}
                  className="ml-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setShowApiKeyModal(false)
                setApiKey(null)
                setCreatedAppId(null)
                setCreatedAppName(null)
              }}
              className="px-5 py-3 rounded-xl bg-gray-700 hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}