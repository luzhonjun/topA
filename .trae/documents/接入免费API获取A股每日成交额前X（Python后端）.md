## 可用免费数据源

* **Tushare Pro（日线）**：注册免费账户获取 `token`，调用 `daily` 接口按指定交易日获取全市场日行情，字段含 `amount`（成交额，千元），排序即可得到前 X [来源: Tushare 文档](https://tushare.pro/document/2?doc_id=27)。

* **AkShare（实时）**：无需注册，调用 `stock_zh_a_spot_em` 返回全市场实时行情，字段含 `成交额`，可直接排序得到当日实时前 X [来源: AKShare 文档](https://akshare.akfamily.xyz/data/stock/stock.html)。

* **说明**：

  * 历史“昨日/指定日期”数据：优选 Tushare `daily`（更稳更全）。

  * 当日实时盘中榜单：优选 AkShare `stock_zh_a_spot_em`（实时、免 token）。

  * 第三方未公开的东财接口也可直接调用，但更易变更，建议通过 AkShare 封装。

## 后端设计（Flask）

* **依赖**：`tushare`, `akshare`, `flask`, `flask-cors`

* **环境变量**：`TUSHARE_TOKEN`

* **接口 1（历史/昨日）**：`GET /api/stocks/top/daily?date=YYYY-MM-DD&limit=50`

  * 逻辑：用 Tushare `pro.daily(trade_date=...)` 拉取全市场，按 `amount` 降序取前 `limit`

  * 返回字段：`code, name, close, change, pct_chg, vol, amount, date`

* **接口 2（当日实时）**：`GET /api/stocks/top/realtime?limit=50`

  * 逻辑：用 AkShare `stock_zh_a_spot_em()` 拉取全市场实时，按 `成交额` 降序取前 `limit`

  * 返回字段：`code, name, price, change, pct_chg, volume, amount, time`

* **稳健性**：

  * 日期处理：若 `date` 缺省，自动回退至最近交易日（跳过周末/节假日）。

  * 速率限制与缓存：对 Tushare 加上简单缓存（如 10-30 分钟）以避免重复拉取。

  * 错误处理：统一异常与友好错误消息。

## 前端对接（现有 Vue3 页面）

* 今日/昨日切换：

  * 今日：调用 `/api/stocks/top/realtime?limit=50|100`

  * 昨日：调用 `/api/stocks/top/daily?date=<昨日交易日>&limit=50|100`

* 字段映射：保持与当前 `StockData` 结构一致（`amount` 单位统一为元）。

* 导出 Excel：沿用现有 `xlsx` 逻辑。

## 取数与合规

* **Tushare**：免费+稳定，需注册 token；一次请求可返回全市场单日数据，速率限制友好 [来源: Tushare 文档](https://tushare.pro/document/2?doc_id=27)。

* **AkShare**：免费免 token，封装东财/新浪数据源，用于实时盘中榜单较便捷 [来源: AKShare 文档](https://akshare.akfamily.xyz/data/stock/stock.html)。

* **注意**：外网/代理、节假日空数据、字段单位（Tushare `amount` 为千元）需规范化。

## 交付与下一步

1. 我将按上述接口实现一个 Python 后端（含环境配置与容错）。
2. 修改前端服务调用为后端接口，保留现有 UI 与导出功能。
3. 自测与验证：

   * 任一交易日的前 50/100（历史）榜单

   * 当日实时前 50/100 榜单

   * Excel 导出正确字段/单位
4. 如确认方案，开始后端实现与前端接入。

