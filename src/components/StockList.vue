<template>
  <div class="stock-list-container">
  <div class="header">
    <h1 class="title">排行榜</h1>
    <div class="controls">
      <div class="date-selector">
        <input type="date" v-model="selectedDate" @change="scheduleLoad" />
      </div>
      <div class="mode-selector">
        <label class="radio-label">
          <input type="radio" v-model="mode" value="new" @change="scheduleLoad">
          新增入榜
        </label>
        <label class="radio-label">
          <input type="radio" v-model="mode" value="streak2" @change="scheduleLoad">
          连续2天
        </label>
        <label class="radio-label">
          <input type="radio" v-model="mode" value="streak3" @change="scheduleLoad">
          连续3天
        </label>
      </div>
      <div class="limit-selector">
        <label class="radio-label">
          <input 
            type="radio" 
            v-model="limit" 
              value="50"
              @change="scheduleLoad"
            >
            前50
          </label>
          <label class="radio-label">
            <input 
              type="radio" 
              v-model="limit" 
              value="100"
              @change="scheduleLoad"
            >
            前100
          </label>
          <label class="radio-label">
            <input 
              type="radio" 
              v-model="limit" 
              value="200"
              @change="scheduleLoad"
            >
            前200
          </label>
        </div>
        <button 
          class="export-btn" 
          @click="exportToExcel"
          :disabled="stocks.length === 0"
        >
          导出Excel
        </button>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>正在加载数据...</p>
    </div>

    <div class="error" v-if="error">
      <p>{{ error }}</p>
      <button @click="loadData">重新加载</button>
    </div>

    <div class="stock-table-container" v-if="!loading && !error">
      <div class="summary">
        <p>共 {{ stocks.length }} 只股票 | 模式: {{ modeLabel }} | 数据时间: {{ currentDate }} <span v-if="mode==='new'">| 对比: {{ prevDate }}</span></p>
      </div>
      
      <table class="stock-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>股票代码</th>
            <th>股票名称</th>
            <th>当前价格</th>
            <th>涨跌额</th>
            <th>涨跌幅</th>
            <th>成交量</th>
            <th>成交额</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(stock, index) in stocks" 
            :key="stock.code"
            :class="{ 'positive': stock.change > 0, 'negative': stock.change < 0 }"
            @click="goDetail(stock.code)"
          >
            <td class="rank">{{ index + 1 }}</td>
            <td class="code">{{ stock.code }}</td>
            <td class="name">{{ stock.name }}</td>
            <td class="price">¥{{ Number(stock.price).toFixed(2) }}</td>
            <td class="change" :class="{ 'positive': stock.change > 0, 'negative': stock.change < 0 }">
              {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}
            </td>
            <td class="change-percent" :class="{ 'positive': stock.changePercent > 0, 'negative': stock.changePercent < 0 }">
              {{ stock.changePercent > 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
            </td>
            <td class="volume">{{ formatVolume(stock.volume) }}</td>
            <td class="amount">{{ formatAmount(stock.amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import { StockService } from '../services/stockService'
import type { StockData, NewTopResponse, StreakTopResponse } from '../services/stockService'
import { useRouter } from 'vue-router'
import { ExcelExportService } from '../services/excelExportService'

// 响应式数据
const stocks = ref<StockData[]>([])
const loading = ref(false)
const error = ref('')
const selectedDate = ref('')
const limit = ref<'50' | '100' | '200'>('50')
const currentDateVal = ref('')
const prevDate = ref('')
const mode = ref<'new' | 'streak2' | 'streak3'>('new')
const router = useRouter()
const controllerRef = ref<AbortController | null>(null)

// 计算属性
const currentDate = computed(() => currentDateVal.value)
const modeLabel = computed(() => {
  if (mode.value === 'new') return '新增入榜'
  if (mode.value === 'streak2') return '连续2天'
  return '连续3天'
})

// 格式化函数
const formatVolume = (volume: number): string => {
  if (volume >= 1e8) {
    return (volume / 1e8).toFixed(2) + '亿'
  } else if (volume >= 1e4) {
    return (volume / 1e4).toFixed(2) + '万'
  } else {
    return volume.toFixed(0)
  }
}

const formatAmount = (amount: number): string => {
  if (amount >= 1e8) {
    return (amount / 1e8).toFixed(2) + '亿'
  } else if (amount >= 1e4) {
    return (amount / 1e4).toFixed(2) + '万'
  } else {
    return amount.toFixed(0)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (!selectedDate.value) {
      error.value = '请选择日期'
      return
    }
    if (controllerRef.value) controllerRef.value.abort()
    controllerRef.value = new AbortController()
    const limitNum = parseInt(limit.value)
    if (mode.value === 'new') {
      const respNew: NewTopResponse = await StockService.getNewTopStocks(limitNum, selectedDate.value, controllerRef.value.signal)
      stocks.value = respNew.list
      currentDateVal.value = respNew.date || selectedDate.value
      prevDate.value = respNew.prev_date || ''
    } else {
      const k = mode.value === 'streak2' ? 2 : 3
      const respStreak: StreakTopResponse = await StockService.getStreakTopStocks(limitNum, selectedDate.value, k, controllerRef.value.signal)
      stocks.value = respStreak.list
      currentDateVal.value = respStreak.date || selectedDate.value
      prevDate.value = ''
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') return
    error.value = '获取数据失败，请稍后重试'
    console.error('加载数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 导出Excel
const exportToExcel = () => {
  const dateStr = currentDate.value || selectedDate.value
  const filename = `A股${dateStr}${modeLabel.value}前${limit.value}`
  ExcelExportService.exportToExcel(stocks.value, filename)
}

// 生命周期
onMounted(() => {
  scheduleLoad()
})

const scheduleLoad = debounce(() => { loadData() }, 400)

const goDetail = (code: string) => {
  router.push({ name: 'stock-detail', params: { code } })
}
</script>

<style scoped>
.stock-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.date-selector, .limit-selector {
  display: flex;
  gap: 15px;
  align-items: center;
}

.mode-selector {
  display: flex;
  gap: 15px;
  align-items: center;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: 500;
}

.radio-label input[type="radio"] {
  margin: 0;
}

.export-btn {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.export-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e53e3e;
}

.error button {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.stock-table-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
}

.summary {
  background: #f8fafc;
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  color: #4a5568;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
}

.stock-table th {
  background: #667eea;
  color: white;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
}

.stock-table td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.stock-table tbody tr:hover {
  background: #f7fafc;
}

.stock-table tbody tr {
  cursor: pointer;
}

.rank {
  font-weight: bold;
  color: #667eea;
}

.code {
  font-family: monospace;
  font-weight: 500;
}

.name {
  font-weight: 500;
}

.price {
  font-weight: 500;
}

.positive {
  color: #e53e3e;
}

.negative {
  color: #38a169;
}

.change, .change-percent {
  font-weight: 500;
}

.volume, .amount {
  font-weight: 500;
  color: #4a5568;
}

@media (max-width: 768px) {
  .stock-list-container {
    padding: 10px;
  }
  
  .header {
    padding: 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stock-table {
    font-size: 0.8rem;
  }
  
  .stock-table th,
  .stock-table td {
    padding: 8px 6px;
  }
}
</style>
