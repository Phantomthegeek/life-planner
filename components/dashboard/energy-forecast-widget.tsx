'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Battery, BatteryLow, BatteryMedium, BatteryHigh, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export function EnergyForecastWidget() {
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/predictions/energy-forecast')
      .then((res) => res.json())
      .then((data) => {
        setForecast(data)
      })
      .catch((error) => {
        console.error('Error fetching energy forecast:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!forecast) return null

  const { predicted_energy, peak_hours, suggested_plan_mode, confidence } = forecast

  const EnergyIcon = 
    predicted_energy === 'high' ? BatteryHigh :
    predicted_energy === 'medium' ? BatteryMedium :
    BatteryLow

  const energyColors = {
    high: 'text-green-500',
    medium: 'text-yellow-500',
    low: 'text-red-500',
  }

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <EnergyIcon className={`h-5 w-5 ${energyColors[predicted_energy]}`} />
          Energy Forecast
        </CardTitle>
        <CardDescription>
          {format(new Date(forecast.date), 'EEEE, MMM d')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium capitalize">
              {predicted_energy} Energy Day
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                predicted_energy === 'high' ? 'bg-green-500' :
                predicted_energy === 'medium' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{
                width: predicted_energy === 'high' ? '80%' :
                       predicted_energy === 'medium' ? '50%' :
                       '30%',
              }}
            />
          </div>
        </div>

        {peak_hours.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Peak Hours</p>
            <p className="text-sm font-medium">
              {peak_hours.join(', ')}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1">Suggested Plan</p>
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            suggested_plan_mode === 'intense' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
            suggested_plan_mode === 'normal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}>
            {suggested_plan_mode.charAt(0).toUpperCase() + suggested_plan_mode.slice(1)} Mode
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

