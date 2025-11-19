export interface StockData {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  date: string
}

import axios from 'axios'

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:5000'
const client = axios.create({ baseURL: API_BASE })

const mockStocks = (count: number): StockData[] => {
  const base = Array.from({ length: 120 }).map((_, i) => ({
    code: String(100000 + i),
    name: `股票${i + 1}`
  }))
  const today = new Date().toISOString().split('T')[0]
  return base.slice(0, count).map((s) => ({
    code: s.code,
    name: s.name,
    price: parseFloat((Math.random() * 100 + 5).toFixed(2)),
    change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    changePercent: parseFloat((Math.random() * 10 - 5).toFixed(2)),
    volume: Math.floor(Math.random() * 8e7 + 1e6),
    amount: Math.floor(Math.random() * 1e9 + 1e8),
    date: today
  })).sort((a, b) => b.amount - a.amount)
}

export class StockService {
  // 获取成交额前N的股票列表
  static async getTopStocksByAmount(limit: number = 50): Promise<StockData[]> {
    try {
      const { data } = await client.get(`/api/stocks/top/daily`, {
        params: { limit, offset: 0 }
      })
      return data.list as StockData[]
    } catch (error) {
      return mockStocks(limit)
    }
  }

  // 获取昨日成交额前N的股票列表
  static async getYesterdayTopStocksByAmount(limit: number = 50): Promise<StockData[]> {
    try {
      const { data } = await client.get(`/api/stocks/top/daily`, {
        params: { limit, offset: -1 }
      })
      return data.list as StockData[]
    } catch (error) {
      return mockStocks(limit).map((s) => ({ ...s, date: s.date }))
    }
  }
}