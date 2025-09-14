// State Management Store
window.StudyGraphStore = {
  state: {
    books: [],
    plansByDate: {},
    logs: [],
    prefs: {
      theme: "dark",
      accent: "#6aa3ff",
      firstDayOfWeek: 1,
      timeFormat: "HH:mm",
      displayUnit: "page-first",
    },
    ui: {
      route: "#/dashboard",
      loading: false,
      modal: null,
      toast: null,
      range: {
        from: "",
        to: "",
      },
    },
  },

  listeners: {},

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  },

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  },

  // Initialize store
  async init() {
    try {
      // Load preferences from localStorage
      const savedPrefs = localStorage.getItem("studygraph_prefs")
      if (savedPrefs) {
        this.state.prefs = { ...this.state.prefs, ...JSON.parse(savedPrefs) }
      }

      // Load data from IndexedDB
      await this.loadBooks()
      await this.loadPlans()
      await this.loadLogs()

      this.emit("STORE_INITIALIZED")
    } catch (error) {
      console.error("Failed to initialize store:", error)
    }
  },

  // Books management
  async loadBooks() {
    try {
      this.state.books = await window.StudyGraphDB.getBooks()
      this.emit("BOOKS_CHANGED", this.state.books)
    } catch (error) {
      console.error("Failed to load books:", error)
    }
  },

  async addBook(bookData) {
    try {
      await window.StudyGraphDB.addBook(bookData)
      await this.loadBooks()
      window.StudyGraphUtils.showToast("参考書を追加しました")
    } catch (error) {
      console.error("Failed to add book:", error)
      window.StudyGraphUtils.showToast("参考書の追加に失敗しました")
    }
  },

  async updateBook(book) {
    try {
      await window.StudyGraphDB.updateBook(book)
      await this.loadBooks()
      window.StudyGraphUtils.showToast("参考書を更新しました")
    } catch (error) {
      console.error("Failed to update book:", error)
      window.StudyGraphUtils.showToast("参考書の更新に失敗しました")
    }
  },

  async deleteBook(id) {
    try {
      await window.StudyGraphDB.deleteBook(id)
      await this.loadBooks()
      window.StudyGraphUtils.showToast("参考書を削除しました")
    } catch (error) {
      console.error("Failed to delete book:", error)
      window.StudyGraphUtils.showToast("参考書の削除に失敗しました")
    }
  },

  // Plans management
  async loadPlans() {
    try {
      const plans = await window.StudyGraphDB.getPlans()
      this.state.plansByDate = {}
      plans.forEach((plan) => {
        this.state.plansByDate[plan.date] = plan
      })
      this.emit("PLANS_CHANGED", this.state.plansByDate)
    } catch (error) {
      console.error("Failed to load plans:", error)
    }
  },

  async savePlan(date, items) {
    try {
      const plan = {
        date,
        items,
        frozen: false,
      }
      await window.StudyGraphDB.updatePlan(plan)
      await this.loadPlans()
      window.StudyGraphUtils.showToast("計画を保存しました")
    } catch (error) {
      console.error("Failed to save plan:", error)
      window.StudyGraphUtils.showToast("計画の保存に失敗しました")
    }
  },

  // Logs management
  async loadLogs() {
    try {
      this.state.logs = await window.StudyGraphDB.getLogs()
      this.state.logs.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
      this.emit("LOGS_CHANGED", this.state.logs)
    } catch (error) {
      console.error("Failed to load logs:", error)
    }
  },

  async addLog(logData) {
    try {
      await window.StudyGraphDB.addLog(logData)
      await this.loadLogs()
      window.StudyGraphUtils.showToast("学習記録を保存しました")
      this.emit("LOG_ADDED", logData)
    } catch (error) {
      console.error("Failed to add log:", error)
      window.StudyGraphUtils.showToast("学習記録の保存に失敗しました")
    }
  },

  async updateLog(log) {
    try {
      await window.StudyGraphDB.updateLog(log)
      await this.loadLogs()
      window.StudyGraphUtils.showToast("学習記録を更新しました")
    } catch (error) {
      console.error("Failed to update log:", error)
      window.StudyGraphUtils.showToast("学習記録の更新に失敗しました")
    }
  },

  async deleteLog(id) {
    try {
      await window.StudyGraphDB.deleteLog(id)
      await this.loadLogs()
      window.StudyGraphUtils.showToast("学習記録を削除しました")
    } catch (error) {
      console.error("Failed to delete log:", error)
      window.StudyGraphUtils.showToast("学習記録の削除に失敗しました")
    }
  },

  // Preferences management
  updatePrefs(newPrefs) {
    this.state.prefs = { ...this.state.prefs, ...newPrefs }
    localStorage.setItem("studygraph_prefs", JSON.stringify(this.state.prefs))
    this.emit("PREFS_CHANGED", this.state.prefs)
  },

  // UI state management
  setRoute(route) {
    this.state.ui.route = route
    this.emit("ROUTE_CHANGED", route)
  },

  setLoading(loading) {
    this.state.ui.loading = loading
    this.emit("LOADING_CHANGED", loading)
  },

  setRange(range) {
    this.state.ui.range = range
    this.emit("RANGE_CHANGED", range)
  },

  // Analytics calculations
  getTodayStats() {
    const today = window.StudyGraphUtils.formatDate(new Date())
    const todayLogs = this.state.logs.filter((log) => log.date === today)

    const totalMinutes = todayLogs.reduce((sum, log) => sum + (log.minutes || 0), 0)
    const totalPages = todayLogs.reduce((sum, log) => {
      const pages = (log.toPage || 0) - (log.fromPage || 0)
      return sum + Math.max(0, pages)
    }, 0)
    const totalQuestions = todayLogs.reduce((sum, log) => sum + (log.questions || 0), 0)

    // Calculate achievement rate
    const todayPlan = this.state.plansByDate[today]
    let achievementRate = 0

    if (todayPlan && todayPlan.items.length > 0) {
      const targetPages = todayPlan.items.reduce((sum, item) => sum + (item.targetPages || 0), 0)
      const targetQuestions = todayPlan.items.reduce((sum, item) => sum + (item.targetQuestions || 0), 0)

      if (targetPages > 0 || targetQuestions > 0) {
        const pageRate = targetPages > 0 ? Math.min(totalPages / targetPages, 1) : 0
        const questionRate = targetQuestions > 0 ? Math.min(totalQuestions / targetQuestions, 1) : 0
        achievementRate = Math.round(((pageRate + questionRate) / 2) * 100)
      }
    }

    return {
      minutes: totalMinutes,
      pages: totalPages,
      questions: totalQuestions,
      achievementRate,
    }
  },

  getWeekStats() {
    const weekDates = window.StudyGraphUtils.getWeekDates()
    const weekLogs = this.state.logs.filter((log) => weekDates.includes(log.date))

    const totalMinutes = weekLogs.reduce((sum, log) => sum + (log.minutes || 0), 0)
    const totalPages = weekLogs.reduce((sum, log) => {
      const pages = (log.toPage || 0) - (log.fromPage || 0)
      return sum + Math.max(0, pages)
    }, 0)
    const totalQuestions = weekLogs.reduce((sum, log) => sum + (log.questions || 0), 0)

    return {
      minutes: totalMinutes,
      pages: totalPages,
      questions: totalQuestions,
    }
  },

  getBookStats(bookId, days = 30) {
    const range = window.StudyGraphUtils.getDateRange(days)
    const bookLogs = this.state.logs.filter(
      (log) => log.bookId === bookId && log.date >= range.from && log.date <= range.to,
    )

    const totalMinutes = bookLogs.reduce((sum, log) => sum + (log.minutes || 0), 0)
    const totalPages = bookLogs.reduce((sum, log) => {
      const pages = (log.toPage || 0) - (log.fromPage || 0)
      return sum + Math.max(0, pages)
    }, 0)
    const totalQuestions = bookLogs.reduce((sum, log) => sum + (log.questions || 0), 0)

    return {
      minutes: totalMinutes,
      pages: totalPages,
      questions: totalQuestions,
      sessions: bookLogs.length,
    }
  },

  getSubjectStats(days = 30) {
    const range = window.StudyGraphUtils.getDateRange(days)
    const rangeLogs = this.state.logs.filter((log) => log.date >= range.from && log.date <= range.to)

    const subjectStats = {}

    rangeLogs.forEach((log) => {
      const book = this.state.books.find((b) => b.id === log.bookId)
      const subject = book ? book.subject : "その他"

      if (!subjectStats[subject]) {
        subjectStats[subject] = { minutes: 0, pages: 0, questions: 0 }
      }

      subjectStats[subject].minutes += log.minutes || 0
      const pages = (log.toPage || 0) - (log.fromPage || 0)
      subjectStats[subject].pages += Math.max(0, pages)
      subjectStats[subject].questions += log.questions || 0
    })

    return subjectStats
  },

  getDailyStats(days = 7) {
    const range = window.StudyGraphUtils.getDateRange(days)
    const dates = []
    const current = new Date(range.from)
    const end = new Date(range.to)

    while (current <= end) {
      dates.push(window.StudyGraphUtils.formatDate(current))
      current.setDate(current.getDate() + 1)
    }

    return dates.map((date) => {
      const dayLogs = this.state.logs.filter((log) => log.date === date)
      const minutes = dayLogs.reduce((sum, log) => sum + (log.minutes || 0), 0)
      const pages = dayLogs.reduce((sum, log) => {
        const p = (log.toPage || 0) - (log.fromPage || 0)
        return sum + Math.max(0, p)
      }, 0)
      const questions = dayLogs.reduce((sum, log) => sum + (log.questions || 0), 0)

      // Calculate achievement rate
      const plan = this.state.plansByDate[date]
      let achievementRate = 0

      if (plan && plan.items.length > 0) {
        const targetPages = plan.items.reduce((sum, item) => sum + (item.targetPages || 0), 0)
        const targetQuestions = plan.items.reduce((sum, item) => sum + (item.targetQuestions || 0), 0)

        if (targetPages > 0 || targetQuestions > 0) {
          const pageRate = targetPages > 0 ? Math.min(pages / targetPages, 1) : 0
          const questionRate = targetQuestions > 0 ? Math.min(questions / targetQuestions, 1) : 0
          achievementRate = ((pageRate + questionRate) / 2) * 100
        }
      }

      return {
        date,
        minutes,
        pages,
        questions,
        achievementRate,
      }
    })
  },
}

