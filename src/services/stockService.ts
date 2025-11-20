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
}