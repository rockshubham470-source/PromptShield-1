import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react'

interface Rule {
  id: number
  name: string
  category: string
  patterns: number
  weight: number
  enabled: boolean
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: 1,
      name: 'Direct Override Keywords',
      category: 'direct_injection',
      patterns: 3,
      weight: 0.85,
      enabled: true,
    },
    {
      id: 2,
      name: 'Delimiter Injection',
      category: 'delimiter_based',
      patterns: 2,
      weight: 0.8,
      enabled: true,
    },
    {
      id: 3,
      name: 'Roleplay Jailbreak',
      category: 'roleplay',
      patterns: 4,
      weight: 0.75,
      enabled: true,
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] =
    useState<Rule | null>(null)

  const [form, setForm] = useState({
    name: '',
    category: '',
    patterns: 1,
    weight: 0.5,
  })

  const openNewRule = () => {
    setEditingRule(null)

    setForm({
      name: '',
      category: '',
      patterns: 1,
      weight: 0.5,
    })

    setShowModal(true)
  }

  const openEditRule = (rule: Rule) => {
    setEditingRule(rule)

    setForm({
      name: rule.name,
      category: rule.category,
      patterns: rule.patterns,
      weight: rule.weight,
    })

    setShowModal(true)
  }

  const saveRule = () => {
    if (!form.name.trim()) return

    if (editingRule) {
      setRules(
        rules.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                ...form,
              }
            : rule
        )
      )
    } else {
      setRules([
        ...rules,
        {
          id: Date.now(),
          ...form,
          enabled: true,
        },
      ])
    }

    setShowModal(false)
  }

  const deleteRule = (id: number) => {
    const confirmed = window.confirm(
      'Delete this rule permanently?'
    )

    if (!confirmed) return

    setRules(
      rules.filter((rule) => rule.id !== id)
    )
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-4xl font-bold mb-2">
            Detection Rules
          </h1>

          <p className="text-gray-400">
            Configure and manage AI security rules
          </p>
        </div>

        <button
          onClick={openNewRule}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Rule
        </button>

      </div>

      {/* Rules Table */}

      <div className="card overflow-hidden">

        <table className="w-full">

          <thead>
            <tr className="border-b border-gray-700">

              <th className="px-4 py-4 text-left">
                Name
              </th>

              <th className="px-4 py-4 text-left">
                Category
              </th>

              <th className="px-4 py-4 text-left">
                Patterns
              </th>

              <th className="px-4 py-4 text-left">
                Weight
              </th>

              <th className="px-4 py-4 text-left">
                Status
              </th>

              <th className="px-4 py-4 text-left">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="
                  border-b border-gray-700
                  hover:bg-white/5
                  transition
                "
              >
                <td className="px-4 py-4 font-medium">
                  {rule.name}
                </td>

                <td className="px-4 py-4">
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-xs">
                    {rule.category}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {rule.patterns}
                </td>

                <td className="px-4 py-4 font-mono">
                  {rule.weight.toFixed(2)}
                </td>

                <td className="px-4 py-4">

                  <button
                    onClick={() =>
                      setRules(
                        rules.map((r) =>
                          r.id === rule.id
                            ? {
                                ...r,
                                enabled: !r.enabled,
                              }
                            : r
                        )
                      )
                    }
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      rule.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {rule.enabled
                      ? 'Enabled'
                      : 'Disabled'}
                  </button>

                </td>

                <td className="px-4 py-4">

                  <div className="flex gap-4">

                    <button
                      onClick={() =>
                        openEditRule(rule)
                      }
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      onClick={() =>
                        deleteRule(rule.id)
                      }
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* Rule Performance */}

      <div className="card mt-8">

        <h3 className="text-xl font-semibold mb-6">
          Rule Performance
        </h3>

        <div className="space-y-4">

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {rule.name}
                </div>

                <div className="text-xs text-gray-400">
                  Detection Rate
                </div>
              </div>

              <div className="flex items-center gap-4">

                <div className="w-48 bg-gray-700 rounded-full h-3">

                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${rule.weight * 100}%`,
                    }}
                  />

                </div>

                <div className="font-mono">
                  {(rule.weight * 100).toFixed(0)}%
                </div>

              </div>
            </div>
          ))}

        </div>

      </div>

      {/* Modal */}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111827] p-6">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold">
                {editingRule
                  ? 'Edit Rule'
                  : 'Create Rule'}
              </h2>

              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X />
              </button>

            </div>

            <div className="space-y-4">

              <input
                placeholder="Rule Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full"
              />

              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                className="w-full"
              />

              <input
                type="number"
                value={form.patterns}
                onChange={(e) =>
                  setForm({
                    ...form,
                    patterns: Number(
                      e.target.value
                    ),
                  })
                }
                className="w-full"
              />

              <input
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weight: Number(
                      e.target.value
                    ),
                  })
                }
                className="w-full"
              />

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                onClick={saveRule}
                className="btn-primary"
              >
                Save Rule
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}