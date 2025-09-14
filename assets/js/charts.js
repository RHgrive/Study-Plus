// Chart utilities using Chart.js
window.StudyGraphCharts = {
  charts: {},
  StudyGraphStore: window.StudyGraphStore, // Declare StudyGraphStore
  StudyGraphUtils: window.StudyGraphUtils, // Declare StudyGraphUtils

  // Initialize chart
  createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return null

    // Ensure Chart.js is available
    if (typeof window.Chart === "undefined") {
      console.error("Chart.js is not loaded")
      const placeholder = document.createElement("div")
      placeholder.className = "chart-error"
      placeholder.textContent = "グラフを表示できません"
      canvas.replaceWith(placeholder)
      return null
    }

    // Show placeholder when no data
    const hasData =
      config?.data?.datasets?.some((ds) => Array.isArray(ds.data) && ds.data.length > 0)
    if (!hasData) {
      const placeholder = document.createElement("div")
      placeholder.className = "chart-placeholder"
      placeholder.textContent = "データがありません"
      canvas.replaceWith(placeholder)
      return null
    }

    // Destroy existing chart
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy()
    }

    // Create new chart
    const ctx = canvas.getContext("2d")
    this.charts[canvasId] = new window.Chart(ctx, config)
    return this.charts[canvasId]
  },

  // Daily achievement rate chart
  createDailyRateChart(canvasId, days = 7) {
    const dailyStats = this.StudyGraphStore.getDailyStats(days)

    const config = {
      type: "bar",
      data: {
        labels: dailyStats.map((stat) => this.StudyGraphUtils.formatDate(new Date(stat.date), "MM/DD")),
        datasets: [
          {
            label: "達成率",
            data: dailyStats.map((stat) => stat.achievementRate),
            backgroundColor: "rgba(106, 163, 255, 0.8)",
            borderColor: "rgba(106, 163, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 150,
            ticks: {
              callback: (value) => value + "%",
            },
          },
        },
      },
    }

    return this.createChart(canvasId, config)
  },

  // Book breakdown chart
  createBookBreakdownChart(canvasId, days = 30) {
    const books = this.StudyGraphStore.state.books
    const bookStats = books
      .map((book) => ({
        ...book,
        stats: this.StudyGraphStore.getBookStats(book.id, days),
      }))
      .filter((book) => book.stats.minutes > 0)

    const config = {
      type: "bar",
      data: {
        labels: bookStats.map((book) => (book.title.length > 15 ? book.title.substring(0, 15) + "..." : book.title)),
        datasets: [
          {
            label: "学習時間（分）",
            data: bookStats.map((book) => book.stats.minutes),
            backgroundColor: "rgba(106, 163, 255, 0.8)",
            borderColor: "rgba(106, 163, 255, 1)",
            borderWidth: 1,
          },
          {
            label: "ページ数",
            data: bookStats.map((book) => book.stats.pages),
            backgroundColor: "rgba(139, 92, 246, 0.8)",
            borderColor: "rgba(139, 92, 246, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    }

    return this.createChart(canvasId, config)
  },

  // Subject pie chart
  createSubjectPieChart(canvasId, days = 30) {
    const subjectStats = this.StudyGraphStore.getSubjectStats(days)
    const subjects = Object.keys(subjectStats)

    const colors = [
      "rgba(106, 163, 255, 0.8)",
      "rgba(139, 92, 246, 0.8)",
      "rgba(34, 197, 94, 0.8)",
      "rgba(245, 158, 11, 0.8)",
      "rgba(239, 68, 68, 0.8)",
      "rgba(168, 85, 247, 0.8)",
      "rgba(59, 130, 246, 0.8)",
      "rgba(16, 185, 129, 0.8)",
    ]

    const config = {
      type: "doughnut",
      data: {
        labels: subjects,
        datasets: [
          {
            data: subjects.map((subject) => subjectStats[subject].minutes),
            backgroundColor: colors.slice(0, subjects.length),
            borderWidth: 2,
            borderColor: "var(--bg)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    }

    return this.createChart(canvasId, config)
  },

  // Cumulative progress chart
  createCumulativeChart(canvasId, days = 30) {
    const dailyStats = this.StudyGraphStore.getDailyStats(days)

    let cumulativePages = 0
    let cumulativeQuestions = 0

    const cumulativeData = dailyStats.map((stat) => {
      cumulativePages += stat.pages
      cumulativeQuestions += stat.questions
      return {
        date: stat.date,
        pages: cumulativePages,
        questions: cumulativeQuestions,
      }
    })

    const config = {
      type: "line",
      data: {
        labels: dailyStats.map((stat) => this.StudyGraphUtils.formatDate(new Date(stat.date), "MM/DD")),
        datasets: [
          {
            label: "累積ページ数",
            data: cumulativeData.map((data) => data.pages),
            borderColor: "rgba(106, 163, 255, 1)",
            backgroundColor: "rgba(106, 163, 255, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "累積問題数",
            data: cumulativeData.map((data) => data.questions),
            borderColor: "rgba(139, 92, 246, 1)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    }

    return this.createChart(canvasId, config)
  },

  // Create heatmap
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

    // Generate year data
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const days = []

    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = this.StudyGraphUtils.formatDate(current)
      const dayLogs = this.StudyGraphStore.state.logs.filter((log) => log.date === dateStr)
      const minutes = dayLogs.reduce((sum, log) => sum + (log.minutes || 0), 0)

      // Calculate level (0-4)
      let level = 0
      if (minutes > 0) {
        if (minutes >= 240)
          level = 4 // 4+ hours
        else if (minutes >= 120)
          level = 3 // 2+ hours
        else if (minutes >= 60)
          level = 2 // 1+ hour
        else level = 1 // Any study
      }

      days.push({
        date: dateStr,
        minutes,
        level,
      })

      current.setDate(current.getDate() + 1)
    }

    // Render heatmap
    days.forEach((day) => {
      const dayElement = document.createElement("div")
      dayElement.className = `heatmap-day heatmap-day--level-${day.level}`
      dayElement.title = `${day.date}: ${this.StudyGraphUtils.formatDuration(day.minutes)}`
      container.appendChild(dayElement)
    })
  },

  // Destroy all charts
  destroyAll() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy()
    })
    this.charts = {}
  },
}
