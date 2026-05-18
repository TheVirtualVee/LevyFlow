'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export function CountdownTimer({ deadline }: { deadline: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  
  const [percentage, setPercentage] = useState(0)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    const targetTime = new Date(deadline).getTime()
    
    // Assume standard 14 days campaign window for progress calculation
    const campaignStart = new Date(deadline)
    campaignStart.setDate(campaignStart.getDate() - 14)
    const totalDuration = targetTime - campaignStart.getTime()
    
    const calculateTime = () => {
      const now = new Date().getTime()
      const distance = targetTime - now
      
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setPercentage(100)
        return
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      
      setTimeLeft({ days, hours, minutes, seconds })
      
      const elapsed = totalDuration - distance
      const percent = (elapsed / totalDuration) * 100
      setPercentage(Math.min(100, Math.max(0, percent)))
    }
    
    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    
    return () => clearInterval(timer)
  }, [deadline])
  
  if (!isClient) return null
  
  const isUrgent = timeLeft.days < 3
  
  return (
    <div className={`rounded-2xl p-5 border text-center transition-all duration-300 shadow-sm ${
      isUrgent 
        ? 'bg-rose-50/90 border-rose-200/60 shadow-rose-100/50' 
        : 'bg-slate-50/90 border-slate-200/60 shadow-slate-100/50'
    }`}>
      <div className="flex items-center justify-center gap-2 mb-3.5">
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
        <span className={`text-xs font-black tracking-widest uppercase ${
          isUrgent ? 'text-rose-700' : 'text-slate-650'
        }`}>
          {isUrgent ? '⚠️ Urgent - Deadline Approaching' : 'Remaining Time Window'}
        </span>
      </div>
      
      <div className="flex justify-center gap-5 text-slate-800">
        <div>
          <div className={`text-2xl font-black font-mono tracking-tight leading-none ${isUrgent ? 'text-rose-700' : 'text-slate-900'}`}>{timeLeft.days}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Days</div>
        </div>
        <div className="text-slate-350 text-2xl font-light font-mono select-none">:</div>
        <div>
          <div className={`text-2xl font-black font-mono tracking-tight leading-none ${isUrgent ? 'text-rose-700' : 'text-slate-900'}`}>{timeLeft.hours}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Hours</div>
        </div>
        <div className="text-slate-350 text-2xl font-light font-mono select-none">:</div>
        <div>
          <div className={`text-2xl font-black font-mono tracking-tight leading-none ${isUrgent ? 'text-rose-700' : 'text-slate-900'}`}>{timeLeft.minutes}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mins</div>
        </div>
        <div className="text-slate-350 text-2xl font-light font-mono select-none">:</div>
        <div>
          <div className={`text-2xl font-black font-mono tracking-tight leading-none ${isUrgent ? 'text-rose-700' : 'text-slate-900'}`}>{timeLeft.seconds}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Secs</div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="overflow-hidden h-2.5 flex rounded-full bg-slate-200/80 shadow-inner">
          <div 
            className={`rounded-full transition-all duration-1000 ease-out shadow-inner ${
              isUrgent ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-650'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2.5">
          <span>Campaign Elapsed</span>
          <span className={isUrgent ? 'text-rose-600 font-extrabold' : 'text-slate-650'}>{Math.round(percentage)}%</span>
        </div>
      </div>
      
      {timeLeft.days === 0 && timeLeft.hours < 4 && (
        <div className="mt-3.5 text-xs font-black text-rose-600 animate-pulse uppercase tracking-wider">
          🚨 Final hours remaining — Pay immediately!
        </div>
      )}
    </div>
  )
}
