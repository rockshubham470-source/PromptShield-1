import api from '../lib/api.service'

export const getApplications = () =>
  api.get('/applications')

export const createApplication = (data: any, createApiKey = false) => {
  const params = createApiKey ? { create_api_key: true } : {}
  return api.post('/applications', data, { params })
}

export const deleteApplication = (id: string) =>
  api.delete(`/applications/${id}`)

export const getApplication = (id: string) =>
  api.get(`/applications/${id}`)

export const getApplicationMetrics = (id: string) =>
  api.get(`/applications/${id}/metrics`)

export const getApplicationApiKeys = (id: string) =>
  api.get(`/applications/${id}/api-keys`)

export const getApplicationDetections = (id: string) =>
  api.get(`/applications/${id}/detections`)

export const rotateApiKey = async (
  applicationId: string
) => {
  const response = await api.post(
    `/applications/${applicationId}/rotate-key`
  )

  return response
}

export const deactivateApiKey = (keyId: string) =>
  api.delete(`/application-keys/${keyId}`)

export const getApplicationAuditLogs = (applicationId: string, limit = 50) =>
  api.get(`/applications/${applicationId}/audit-logs?limit=${limit}`)

export const getAllAuditLogs = async () => {
  const apps = await getApplications()

  let allLogs: any[] = []

  for (const app of apps.data) {
    const res = await getApplicationAuditLogs(app.id)

    const logs = res.data.map((log: any) => ({
      ...log,
      application_name: app.name,
      application_id: app.id,
    }))

    allLogs = [...allLogs, ...logs]
  }

  return allLogs
}