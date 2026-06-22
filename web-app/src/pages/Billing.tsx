import React, { useState, useEffect } from 'react'
import {
  CreditCard, CheckCircle, Zap, Shield, BarChart3,
  Users, Infinity, ArrowRight, Star, AlertCircle,
} from 'lucide-react'
import api from '../lib/api.service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  price_monthly: number
  features: Record<string, any>
}

interface Subscription {
  id: string | null
  plan_id: string | null
  plan_name: string
  price_monthly: number
  status: string
  starts_at: string | null
  ends_at: string | null
}

// ─── Static plan definitions ───────────────────────────────────────────────

const PLAN_HIGHLIGHTS: Record<string, { color: string; gradient: string; icon: React.ElementType; badge?: string }> = {
  Free:         { color: 'border-white/10',   gradient: '',                                      icon: Shield },
  Starter:      { color: 'border-blue-500/40', gradient: 'from-blue-600/10 to-transparent',       icon: Zap },
  Professional: { color: 'border-purple-500/50',gradient: 'from-purple-600/10 to-transparent',    icon: Star,  badge: 'Most Popular' },
  Enterprise:   { color: 'border-yellow-500/40',gradient: 'from-yellow-600/10 to-transparent',    icon: Infinity },
}

const PLAN_FEATURE_LABELS: Record<string, string> = {
  api_calls_per_month: 'API calls / month',
  max_applications:    'Applications',
  max_team_members:    'Team members',
  custom_rules:        'Custom rules',
  webhooks:            'Webhooks',
  audit_logs:          'Audit logs',
  sso:                 'SSO / SAML',
  sla:                 'SLA',
  dedicated_support:   'Dedicated support',
}

function formatFeatureValue(val: any): string {
  if (val === true) return '✓'
  if (val === false) return '—'
  if (val === -1 || val === null || val === undefined) return 'Unlimited'
  if (typeof val === 'number') return val.toLocaleString()
  return String(val)
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  loading,
}: {
  plan: Plan
  isCurrent: boolean
  onSelect: () => void
  loading: boolean
}) {
  const meta = PLAN_HIGHLIGHTS[plan.name] ?? PLAN_HIGHLIGHTS.Free
  const Icon = meta.icon

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-b ${meta.gradient} bg-white/5 p-6 flex flex-col transition-all ${meta.color} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
    >
      {meta.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          {meta.badge}
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Current
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">{plan.name}</h3>
          <p className="text-gray-400 text-xs">
            {plan.price_monthly === 0 ? 'Free forever' : `$${plan.price_monthly} / month`}
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {Object.entries(PLAN_FEATURE_LABELS).map(([key, label]) => {
          const val = plan.features?.[key]
          if (val === undefined) return null
          const display = formatFeatureValue(val)
          const positive = val !== false && val !== 0

          return (
            <li key={key} className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">{label}</span>
              <span className={`text-xs font-medium ${positive ? 'text-white' : 'text-gray-600'}`}>
                {display}
              </span>
            </li>
          )
        })}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent || loading}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isCurrent
            ? 'bg-white/5 text-gray-500 cursor-default border border-white/10'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {isCurrent ? 'Current Plan' : (
          <>
            {plan.price_monthly === 0 ? 'Downgrade' : 'Upgrade'} <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  )
}

// ─── Current Subscription Card ────────────────────────────────────────────────

function CurrentPlanCard({ sub }: { sub: Subscription }) {
  const statusColor = sub.status === 'active' ? 'text-green-400' : 'text-yellow-400'
  const statusBg = sub.status === 'active' ? 'bg-green-500/20 border-green-500/30' : 'bg-yellow-500/20 border-yellow-500/30'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Current Plan</p>
            <h2 className="text-xl font-bold text-white">{sub.plan_name}</h2>
            <p className="text-gray-400 text-sm">
              {sub.price_monthly === 0 ? 'Free' : `$${sub.price_monthly} / month`}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium ${statusBg} ${statusColor}`}>
          <CheckCircle className="h-3 w-3" />
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>
      </div>

      {sub.ends_at && (
        <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Subscription ends on {new Date(sub.ends_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

// ─── Usage Widget ─────────────────────────────────────────────────────────────

function UsageWidget() {
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    api.get('/usage/summary').then(r => setUsage(r.data)).catch(() => {})
  }, [])

  if (!usage) return null

  const pct = usage.api_calls_limit > 0
    ? Math.min(100, Math.round((usage.api_calls_this_month / usage.api_calls_limit) * 100))
    : 0

  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        <h3 className="text-white font-medium text-sm">This Month's Usage</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">API Calls</span>
            <span className="text-white">
              {usage.api_calls_this_month?.toLocaleString()} / {usage.api_calls_limit === -1 ? '∞' : usage.api_calls_limit?.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          {pct >= 80 && (
            <p className="text-xs text-yellow-400 mt-1">
              You've used {pct}% of your monthly quota.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/3 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-gray-400 text-xs">Applications</p>
            <p className="text-white font-bold text-lg mt-0.5">{usage.applications_count ?? '—'}</p>
          </div>
          <div className="bg-white/3 rounded-xl px-4 py-3 border border-white/10">
            <p className="text-gray-400 text-xs">Team Members</p>
            <p className="text-white font-bold text-lg mt-0.5">{usage.team_members_count ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Billing() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/current'),
      ])
      setPlans(plansRes.data)
      setSubscription(subRes.data)
    } catch {
      // handled below
    }
  }

  useEffect(() => { load() }, [])

  const handleSelect = async (planId: string, planName: string) => {
    setUpgrading(planId)
    setMsg('')
    try {
      await api.post(`/billing/subscribe/${planId}`)
      setMsg(`Successfully switched to the ${planName} plan.`)
      load()
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Failed to update plan.')
    }
    setUpgrading(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Plans</h1>
        <p className="text-gray-400 mt-1">
          Manage your subscription and monitor usage.
        </p>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${msg.includes('Success') || msg.includes('success')
          ? 'border-green-500/30 bg-green-500/10 text-green-300'
          : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {msg.includes('Success') || msg.includes('success')
            ? <CheckCircle className="h-4 w-4" />
            : <AlertCircle className="h-4 w-4" />
          }
          {msg}
        </div>
      )}

      {/* Current plan + usage side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subscription && <CurrentPlanCard sub={subscription} />}
        <UsageWidget />
      </div>

      {/* Plans grid */}
      <div>
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Available Plans</h2>
        {plans.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-12 rounded-2xl border border-white/10 bg-white/3">
            Loading plans…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={subscription?.plan_name === plan.name}
                onSelect={() => handleSelect(plan.id, plan.name)}
                loading={upgrading === plan.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enterprise CTA */}
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Need a custom plan?</h3>
            <p className="text-gray-400 text-sm mt-0.5">
              Volume pricing, dedicated infrastructure, SSO, and SLA guarantees available for large teams.
            </p>
          </div>
        </div>
        <a
          href="mailto:sales@promptshield.io"
          className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
        >
          Contact Sales <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
