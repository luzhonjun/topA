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

export class StockService {
  // 获取成交额前N的股票列表
  static async getTopStocksByAmount(limit: number = 50): Promise<StockData[]> {
    try {
      const { data } = await client.get(`/api/stocks/top/daily`, {
        params: { limit, offset: 0 }
      })
      return data.list as StockData[]
    } catch (error) {
      throw error
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
      throw error
    }
  }

  // 获取今日新增入榜的股票（相较上一交易日）
  static async getNewTopStocks(limit: number = 50, date?: string): Promise<NewTopResponse> {
    try {
      const { data } = await client.get(`/api/stocks/top/new`, {
        params: { limit, date }
      })
      const list = (data.new ?? data.list ?? []) as StockData[]
      const d = data.date ?? (list.length > 0 ? list[0].date : '')
      const prev = data.prev_date
      return { date: d, prev_date: prev, list }
    } catch (error) {
      throw error
    }
  }
}