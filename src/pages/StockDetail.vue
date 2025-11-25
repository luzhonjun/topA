<template>
  <div class="detail-container">
    <div class="header">
      <h2>个股近30天成交额与排名</h2>
      <div class="controls">
        <div class="code">股票代码：{{ code }}</div>
        <div class="name">股票名称：{{ name }}</div>
        <div class="date">截止日期：{{ endDate }}</div>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="!loading && !error" class="chart-wrapper">
      <div ref="chartRef" class="chart"></div>
      <div class="legend">
        <div>成交额折线 / 排名折线（次轴）</div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>日期</th>
            <th>成交额</th>
            <th>排名</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in history" :key="h.date">
            <td>{{ h.date }}</td>
            <td>{{ formatAmount(h.amount) }}</td>
            <td>{{ h.rank ?? '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { StockService } from '@/services/stockService'
import type { StockHistoryResponse, StockHistoryPoint } from '@/services/stockService'
import * as echarts from 'echarts'

const route = useRoute()
const code = computed(() => String(route.params.code || ''))
const days = ref(30)
const loading = ref(false)
const error = ref('')
const history = ref<StockHistoryPoint[]>([])
const endDate = ref('')
const name = ref('')

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const formatAmount = (amount: number): string => {
  if (amount >= 1e8) return (amount / 1e8).toFixed(2) + '亿'
  if (amount >= 1e4) return (amount / 1e4).toFixed(2) + '万'
  return amount.toFixed(0)
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const dates = history.value.map(h => h.date)
  const amounts = history.value.map(h => h.amount)
  const ranks = history.value.map(h => (h.rank ?? null))
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成交额', '排名'] },
    grid: { left: 50, right: 50, top: 30, bottom: 50 },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '成交额' },
      { type: 'value', name: '排名', inverse: true }
    ],
    series: [
      { name: '成交额', type: 'line', smooth: true, data: amounts },
      { name: '排名', type: 'line', smooth: true, data: ranks, yAxisIndex: 1 }
    ]
  })
}

const loadHistory = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp: StockHistoryResponse = await StockService.getStockHistory(code.value, 30)
    history.value = resp.history || []
    name.value = resp.name || ''
    endDate.value = history.value.length > 0 ? history.value[history.value.length - 1].date : ''
    renderChart()
  } catch (e) {
    error.value = '获取历史数据失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
watch(history, renderChart)
onUnmounted(() => { if (chart) { chart.dispose(); chart = null } })
</script>

<style scoped>
.detail-container { max-width: 1100px; margin: 0 auto; padding: 20px; }
.header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.controls { display: flex; align-items: center; gap: 24px; }
.chart-wrapper { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.chart { width: 100%; height: 360px; }
.legend { margin-top: 8px; color: #4a5568; font-weight: 500; }
.table { width: 100%; border-collapse: collapse; margin-top: 16px; }
.table th, .table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
.loading, .error { padding: 20px; text-align: center; }
</style>
