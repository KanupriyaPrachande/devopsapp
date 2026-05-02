const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API = {
  metrics:          `${BASE}/api/metrics`,
  metricsStream:    `${BASE}/api/metrics/stream`,
  containers:       `${BASE}/api/containers`,
  containersStream: `${BASE}/api/containers/stream`,
  logsStream:       `${BASE}/api/logs/stream`,
  containerLogs:    (name) => `${BASE}/api/containers/${name}/logs`,
  startContainer:   (name) => `${BASE}/api/containers/${name}/start`,
  stopContainer:    (name) => `${BASE}/api/containers/${name}/stop`,
}

export default BASE