import React, { useState, useEffect } from 'react';
import {
  Wind, Droplets, Eye, Thermometer, MapPin, RefreshCw, Sunrise, Sunset,
} from 'lucide-react';
import { fetchWithTimeout } from '../../../utils/http';
import { API_TIMEOUTS_MS } from '../../../constants';
import { logger } from '../../../lib/logger';

const weatherIcon = (code) => {
  const n = parseInt(code, 10);
  if (n === 113)                       return '☀️';
  if (n === 116)                       return '⛅';
  if (n === 119 || n === 122)          return '☁️';
  if ([143, 248, 260].includes(n))     return '🌫️';
  if ([200, 386, 389, 392, 395].includes(n)) return '⛈️';
  if ([227, 230].includes(n))          return '🌨️';
  if (n >= 263 && n <= 284)            return '🌦️';
  if (n >= 293 && n <= 314)            return '🌧️';
  if (n >= 317 && n <= 338)            return '❄️';
  if (n >= 350 && n <= 377)            return '🌨️';
  return '🌤️';
};

const weatherBg = (code) => {
  const n = parseInt(code, 10);
  if (n === 113) return { accent: '#f59e0b', bg: 'rgba(251,191,36,0.07)', neon: '#d97706' };
  if (n <= 122)  return { accent: '#22d3ee', bg: 'rgba(34,211,238,0.07)', neon: '#0891b2' };
  if ([200, 386, 389, 392, 395].includes(n))
                 return { accent: '#a78bfa', bg: 'rgba(139,92,246,0.07)', neon: '#7c3aed' };
  if (n >= 317)  return { accent: '#93c5fd', bg: 'rgba(147,197,253,0.07)', neon: '#2563eb' };
  return { accent: '#22d3ee', bg: 'rgba(34,211,238,0.05)', neon: '#0891b2' };
};

export const WeatherTile = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async () => {
    setRefreshing(true);
    try {
      const response = await fetchWithTimeout('/api/weather', {}, API_TIMEOUTS_MS.weather);
      const data = await response.json();
      const cur  = data.current_condition[0];
      const area = data.nearest_area[0];
      const ast  = data.weather?.[0]?.astronomy?.[0];
      setWeather({
        tempC:      parseInt(cur.temp_C, 10),
        tempF:      parseInt(cur.temp_F, 10),
        feelsC:     parseInt(cur.FeelsLikeC, 10),
        desc:       cur.weatherDesc[0].value,
        humidity:   cur.humidity,
        windKmph:   cur.windspeedKmph,
        windDir:    cur.winddir16Point,
        uv:         cur.uvIndex,
        visibility: cur.visibility,
        code:       cur.weatherCode,
        city:       area.areaName[0].value,
        country:    area.country[0].value,
        sunrise:    ast?.sunrise  || '—',
        sunset:     ast?.sunset   || '—',
      });
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      logger.warn('WeatherTile.fetch.failed', { message: err?.message });
      setError(true);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchWeather(); }, []);

  const theme = weather ? weatherBg(weather.code) : weatherBg(116);
  const icon  = weather ? weatherIcon(weather.code) : '🌤️';

  if (loading) return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden tile-pop"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', minHeight: 220 }}>
      <div className="p-5 space-y-3">
        <div className="weather-skeleton h-3 w-24 mb-4" />
        <div className="weather-skeleton h-12 w-20" />
        <div className="weather-skeleton h-3 w-32" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[1,2,3,4].map(i => <div key={i} className="weather-skeleton h-8 rounded-lg" />)}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden tile-pop flex flex-col items-center justify-center gap-2"
      style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', minHeight: 220 }}>
      <span className="text-3xl">🌐</span>
      <p className="text-xs text-zinc-500 text-center px-4">Weather unavailable.<br/>Check network connection.</p>
      <button onClick={() => { setError(false); setLoading(true); fetchWeather(); }}
        className="text-xs font-bold mt-1 px-3 py-1 rounded-lg transition-all"
        style={{ background: 'rgba(34,211,238,0.10)', color: '#0891b2', border: '1px solid rgba(34,211,238,0.20)' }}>
        Retry
      </button>
    </div>
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden tile-pop cursor-default"
      style={{
        background: `linear-gradient(145deg, ${theme.bg} 0%, rgba(247,247,250,0.5) 50%, #FFFFFF 100%)`,
        border: `1px solid ${theme.accent}28`,
        boxShadow: `0 0 20px ${theme.accent}08, 0 1px 3px rgba(0,0,0,0.06)`,
        minHeight: 220,
      }}>

      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 70%)` }} />

      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${theme.accent}50, transparent)` }} />

      <div className="relative z-10 p-5 flex flex-col h-full">

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} style={{ color: theme.neon, opacity: 0.8 }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.neon }}>
              {weather.city}, {weather.country}
            </span>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchWeather(); }}
            title="Refresh weather"
            className="p-1 rounded-lg transition-all"
            style={{ color: `${theme.accent}70` }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accent}
            onMouseLeave={e => e.currentTarget.style.color = `${theme.accent}70`}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex items-end gap-3 mb-1">
          <div>
            <div className="text-5xl leading-none font-black tabular-nums"
              style={{ color: '#18181b', textShadow: `0 0 20px ${theme.accent}20` }}>
              {weather.tempC}°
            </div>
            <div className="text-xs font-mono mt-0.5" style={{ color: 'rgba(0,0,0,0.70)' }}>
              {weather.tempF}°F · Feels {weather.feelsC}°C
            </div>
          </div>
          <div className="text-4xl mb-0.5 leading-none select-none">{icon}</div>
        </div>

        <p className="text-xs font-semibold mb-4" style={{ color: theme.neon }}>
          {weather.desc}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          {[
            { Icon: Droplets,    label: 'Humidity',   value: `${weather.humidity}%`           },
            { Icon: Wind,        label: 'Wind',       value: `${weather.windKmph} km/h ${weather.windDir}` },
            { Icon: Eye,         label: 'Visibility', value: `${weather.visibility} km`        },
            { Icon: Thermometer, label: 'UV Index',   value: weather.uv                        },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <Icon size={12} style={{ color: theme.neon, flexShrink: 0, opacity: 0.8 }} />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.66)' }}>{label}</p>
                <p className="text-xs font-bold truncate" style={{ color: 'rgba(0,0,0,0.75)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1">
            <Sunrise size={10} style={{ color: '#f59e0b', opacity: 0.8 }} />
            <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.66)' }}>{weather.sunrise}</span>
          </div>
          <div className="h-px flex-1 mx-2" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.66)' }}>{weather.sunset}</span>
            <Sunset size={10} style={{ color: '#f97316', opacity: 0.8 }} />
          </div>
        </div>
      </div>
    </div>
  );
};
