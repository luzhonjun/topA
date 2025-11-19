import * as XLSX from 'xlsx'
import type { StockData } from './stockService'

export class ExcelExportService {
  static exportToExcel(stocks: StockData[], filename: string = '股票数据') {
    // 准备数据
    const data = stocks.map((stock, index) => ({
      '排名': index + 1,
      '股票代码': stock.code,
      '股票名称': stock.name,
      '当前价格': stock.price,
      '涨跌额': stock.change,
      '涨跌幅(%)': stock.changePercent,
      '成交量(股)': stock.volume,
      '成交额(元)': stock.amount,
      '日期': stock.date
    }))

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(data)
    
    // 设置列宽
    const colWidths = [
      { wch: 6 },  // 排名
      { wch: 10 }, // 股票代码
      { wch: 12 }, // 股票名称
      { wch: 10 }, // 当前价格
      { wch: 10 }, // 涨跌额
      { wch: 10 }, // 涨跌幅
      { wch: 15 }, // 成交量
      { wch: 15 }, // 成交额
      { wch: 12 }  // 日期
    ]
    ws['!cols'] = colWidths

    // 创建工作簿并添加工作表
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '股票数据')

    // 导出文件
    const dataDate = stocks.length > 0 ? stocks[0].date : new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${filename}_${dataDate}.xlsx`)
  }

  // 格式化数字
  static formatNumber(num: number): string {
    if (num >= 1e8) {
      return (num / 1e8).toFixed(2) + '亿'
    } else if (num >= 1e4) {
      return (num / 1e4).toFixed(2) + '万'
    } else {
      return num.toFixed(2)
    }
  }
}