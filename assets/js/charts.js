window.StudyGraphCharts = {
  charts: {},
  StudyGraphStore: window.StudyGraphStore,
  StudyGraphUtils: window.StudyGraphUtils,

  palette: ["#6AA3FF","#8B5CF6","#22C55E","#F59E0B","#EF4444","#A855F7","#3B82F6","#10B981","#F97316","#E11D48","#14B8A6","#4F46E5"],

  ensureChart() {
    return typeof window.Chart !== "undefined"
  },

  centerTextPlugin: {
    id: "centerText",
    afterDraw(chart) {
      const opts = chart.config.options
      if (!opts || !opts.plugins || !opts.plugins.centerText) return
      const ctx = chart.ctx
      const t1 = opts.plugins.centerText.value || ""
      const t2 = opts.plugins.centerText.label || ""
      const w = chart.width, h = chart.height
      ctx.save()
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = opts.plugins.centerText.color || "#111827"
      ctx.font = "600 28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      ctx.fillText(t1, w / 2, h / 2 - 6)
      ctx.font = "400 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      ctx.fillText(t2, w / 2, h / 2 + 14)
      ctx.restore()
    }
  },

  createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return null
    if (!this.ensureChart()) {
      const placeholder = document.createElement("div")
      placeholder.className = "chart-error"
      placeholder.textContent = "グラフを表示できません"
      canvas.replaceWith(placeholder)
      return null
    }
    const hasData = config && config.data && Array.isArray(config.data.datasets) && config.data.datasets.some(ds => Array.isArray(ds.data))
    if (!hasData) {
      const placeholder = document.createElement("div")
      placeholder.className = "chart-placeholder"
      placeholder.textContent = "データがありません"
      canvas.replaceWith(placeholder)
      return null
    }
    const ctx = canvas.getContext("2d")
    const base = window.Chart.defaults
    base.font.family = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
    base.color = getComputedStyle(document.documentElement).color || "#e5e7eb"
    base.plugins.legend.labels.boxWidth = 12
    base.plugins.legend.labels.boxHeight = 12
    base.plugins.tooltip.intersect = false
    base.plugins.tooltip.mode = "index"
    if (!config.options) config.options = {}
    if (!config.options.plugins) config.options.plugins = {}
    if (!config.options.plugins.legend) config.options.plugins.legend = { position: "bottom" }
    if (!config.options.scales) config.options.scales = {}
    if (config.options.scales.x) {
      if (!config.options.scales.x.grid) config.options.scales.x.grid = {}
      config.options.scales.x.grid.color = "rgba(148,163,184,.3)"
      if (!config.options.scales.x.ticks) config.options.scales.x.ticks = {}
      config.options.scales.x.ticks.maxRotation = 0
    }
    if (config.options.scales.y) {
      if (!config.options.scales.y.grid) config.options.scales.y.grid = {}
      config.options.scales.y.grid.color = "rgba(148,163,184,.3)"
      if (!config.options.scales.y.ticks) config.options.scales.y.ticks = {}
      config.options.scales.y.ticks.callback = v => v
    }
    config.plugins = Array.isArray(config.plugins) ? config.plugins.concat([this.centerTextPlugin]) : [this.centerTextPlugin]
    if (this.charts[canvasId]) this.charts[canvasId].destroy()
    this.charts[canvasId] = new window.Chart(ctx, config)
    return this.charts[canvasId]
  },

  createWeeklyStackedTimeChart(canvasId, days) {
    const range = this.StudyGraphUtils.getDateRange(days)
    const labels = []
    const idxByDate = {}
    const cur = new Date(range.from)
    const end = new Date(range.to)
    while (cur <= end) {
      const key = this.StudyGraphUtils.formatDate(cur)
      idxByDate[key] = labels.length
      labels.push(this.StudyGraphUtils.formatDate(new Date(key), "M/D"))
      cur.setDate(cur.getDate() + 1)
    }
    const books = this.StudyGraphStore.state.books
    const logs = this.StudyGraphStore.state.logs.filter(l => l.date in idxByDate)
    const totalsByBook = new Map()
    const dataByBook = new Map()
    books.forEach(b => {
      totalsByBook.set(b.id, 0)
      dataByBook.set(b.id, new Array(labels.length).fill(0))
    })
    logs.forEach(l => {
      const i = idxByDate[l.date]
      const id = l.bookId
      const m = l.minutes || 0
      if (!dataByBook.has(id)) {
        dataByBook.set(id, new Array(labels.length).fill(0))
        totalsByBook.set(id, 0)
      }
      dataByBook.get(id)[i] += m
      totalsByBook.set(id, (totalsByBook.get(id) || 0) + m)
    })
    const sorted = Array.from(totalsByBook.entries()).filter(([,t]) => t > 0).sort((a,b) => b[1]-a[1])
    const top = sorted.slice(0, 12)
    const others = sorted.slice(12)
    const datasets = []
    top.forEach(([bookId], i) => {
      const book = books.find(b => b.id === bookId)
      const color = this.palette[i % this.palette.length]
      datasets.push({
        label: book ? book.title : "教材",
        data: dataByBook.get(bookId),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        stack: "time"
      })
    })
    if (others.length > 0) {
      const sum = new Array(labels.length).fill(0)
      others.forEach(([bookId]) => {
        const arr = dataByBook.get(bookId) || []
        for (let i = 0; i < sum.length; i++) sum[i] += arr[i] || 0
      })
      const color = "#94a3b8"
      datasets.push({ label: "その他", data: sum, backgroundColor: color, borderColor: color, borderWidth: 1, stack: "time" })
    }
    const config = {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { callback: v => v + "分" } }
        }
      }
    }
    return this.createChart(canvasId, config)
  },

  createBookBreakdownChart(canvasId, days) {
    const books = this.StudyGraphStore.state.books
    const stats = books.map(b => ({ book: b, stats: this.StudyGraphStore.getBookStats(b.id, days) })).filter(x => x.stats.minutes > 0)
    const labels = stats.map(x => x.book.title.length > 15 ? x.book.title.substring(0, 15) + "..." : x.book.title)
    const data = stats.map(x => x.stats.minutes)
    const colors = labels.map((_, i) => this.palette[i % this.palette.length])
    const config = {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: { position: "right" },
          centerText: { value: Math.round(data.reduce((a,b)=>a+b,0)) + "分", label: "時間配分", color: getComputedStyle(document.documentElement).color }
        }
      }
    }
    return this.createChart(canvasId, config)
  },

  createSubjectPieChart(canvasId, days) {
    const bySubj = this.StudyGraphStore.getSubjectStats(days)
    const labels = Object.keys(bySubj)
    const data = labels.map(k => bySubj[k].minutes)
    const colors = labels.map((_, i) => this.palette[i % this.palette.length])
    const config = {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "50%",
        plugins: {
          legend: { position: "right" }
        }
      }
    }
    return this.createChart(canvasId, config)
  },

  createDailyRateChart(canvasId, days) {
    const daily = this.StudyGraphStore.getDailyStats(days)
    const labels = daily.map(s => this.StudyGraphUtils.formatDate(new Date(s.date), "M/D"))
    const data = daily.map(s => s.achievementRate)
    const config = {
      type: "bar",
      data: { labels, datasets: [{ label: "達成率", data, backgroundColor: "rgba(106,163,255,.8)", borderColor: "rgba(106,163,255,1)", borderWidth: 1 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 150, ticks: { callback: v => v + "%" } }
        }
      }
    }
    return this.createChart(canvasId, config)
  },

  createCumulativeChart(canvasId, days) {
    const daily = this.StudyGraphStore.getDailyStats(days)
    let cp = 0, cq = 0
    const labels = daily.map(s => this.StudyGraphUtils.formatDate(new Date(s.date), "M/D"))
    const pages = daily.map(s => { cp += s.pages; return cp })
    const questions = daily.map(s => { cq += s.questions; return cq })
    const config = {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "累積ページ数", data: pages, borderColor: "rgba(106,163,255,1)", backgroundColor: "rgba(106,163,255,.1)", fill: true, tension: .4 },
          { label: "累積問題数", data: questions, borderColor: "rgba(139,92,246,1)", backgroundColor: "rgba(139,92,246,.1)", fill: true, tension: .4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    }
    return this.createChart(canvasId, config)
  },

  createGoalDonutChart(canvasId, currentMinutes, targetMinutes) {
    const v = Math.max(0, Math.min(100, targetMinutes > 0 ? Math.round(currentMinutes / targetMinutes * 100) : 0))
    const config = {
      type: "doughnut",
      data: { labels: ["達成","残り"], datasets: [{ data: [v, 100 - v], backgroundColor: ["#6AA3FF","#E5E7EB"], borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: { legend: { display: false }, centerText: { value: v + " %", label: "今週の目標", color: getComputedStyle(document.documentElement).color } }
      }
    }
    return this.createChart(canvasId, config)
  },

  createHeatmap(containerId, year = new Date().getFullYear()) {
    const container = document.getElementById(containerId)
    if (!container) return
    container.innerHTML = ""
    if (this.StudyGraphStore.state.logs.length === 0) {
      const placeholder = document.createElement("div")
      placeholder.className = "chart-placeholder"
      placeholder.textContent = "データがありません"
      container.appendChild(placeholder)
      return
    }
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const days = []
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = this.StudyGraphUtils.formatDate(current)
      const dayLogs = this.StudyGraphStore.state.logs.filter(l => l.date === dateStr)
      const minutes = dayLogs.reduce((sum, l) => sum + (l.minutes || 0), 0)
      let level = 0
      if (minutes > 0) {
        if (minutes >= 240) level = 4
        else if (minutes >= 120) level = 3
        else if (minutes >= 60) level = 2
        else level = 1
      }
      days.push({ date: dateStr, minutes, level })
      current.setDate(current.getDate() + 1)
    }
    days.forEach(day => {
      const el = document.createElement("div")
      el.className = `heatmap-day heatmap-day--level-${day.level}`
      el.title = `${day.date}: ${this.StudyGraphUtils.formatDuration(day.minutes)}`
      container.appendChild(el)
    })
  },

  destroyAll() {
    Object.values(this.charts).forEach(c => { if (c) c.destroy() })
    this.charts = {}
  }
}
