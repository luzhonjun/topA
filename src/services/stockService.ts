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

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'https://topapy-9zt0.onrender.com'
const client = axios.create({ baseURL: API_BASE })

export interface NewTopResponse {
  date: string
  prev_date?: string
  list: StockData[]
}

export interface StreakTopResponse {
  date: string
  k: number
  limit: number
  list: StockData[]
}

export interface StockHistoryPoint {
  date: string
  amount: number
  rank?: number
}

export interface StockHistoryResponse {
  code: string
  name?: string
  days: number
  history: StockHistoryPoint[]
}

export class StockService {
  // 获取成交额前N的股票列表
  static async getTopStocksByAmount(limit: number = 50, signal?: AbortSignal): Promise<StockData[]> {
    try {
      const { data } = await client.get(`/api/stocks/top/daily`, {
        params: { limit, offset: 0 },
        signal
      })
      return data.list as StockData[]
    } catch (error) {
      throw error
    }
  }

  // 获取昨日成交额前N的股票列表
  static async getYesterdayTopStocksByAmount(limit: number = 50, signal?: AbortSignal): Promise<StockData[]> {
    try {
      const { data } = await client.get(`/api/stocks/top/daily`, {
        params: { limit, offset: -1 },
        signal
      })
      return data.list as StockData[]
    } catch (error) {
      throw error
    }
  }

  // 获取今日新增入榜的股票（相较上一交易日）
  static async getNewTopStocks(limit: number = 50, date?: string, signal?: AbortSignal): Promise<NewTopResponse> {
    try {
      const { data } = await client.get(`/api/stocks/top/new`, {
        params: { limit, date },
        signal
      })
      const list = (data.new ?? data.list ?? []) as StockData[]
      const d = data.date ?? (list.length > 0 ? list[0].date : '')
      const prev = data.prev_date
      return { date: d, prev_date: prev, list }
    } catch (error) {
      throw error
    }
  }

  static async getStreakTopStocks(limit: number = 50, date?: string, k: number = 2, signal?: AbortSignal): Promise<StreakTopResponse> {
    try {
      const { data } = await client.get(`/api/stocks/top/streak`, {
        params: { limit, date, k, db_only: 1 },
        signal
      })
      const list = (data.list ?? []) as StockData[]
      const d = data.date ?? (list.length > 0 ? list[0].date : '')
      return { date: d, k, limit, list }
    } catch (error) {
      throw error
    }
  }

  static async getStockHistory(code: string, days: number = 30, date?: string, signal?: AbortSignal): Promise<StockHistoryResponse> {
    try {
      const { data } = await client.get(`/api/stocks/history`, {
        params: { code, days, date },
        signal
      })
      return data as StockHistoryResponse
    } catch (error) {
      throw error
    }
  }
}
