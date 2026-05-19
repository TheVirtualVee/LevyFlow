interface Alert {
  type: 'ocr_failure' | 'high_dispute_rate' | 'storage_full' | 'rate_limit'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export async function sendAlert(alert: Alert) {
  
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alert.type}*\nSeverity: ${alert.severity}\n${alert.message}`
        })
      })
    } catch (err) {
    }
  }
}
