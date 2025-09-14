// UI Management
window.StudyGraphUI = {
  // Initialize dashboard
  initDashboard() {
    this.updateDashboardKPIs()
    this.updateQuickForm()
    this.updateDashboardChart()
  },

  // Update dashboard KPIs
  updateDashboardKPIs() {
    const todayStats = window.StudyGraphStore.getTodayStats()
    const weekStats = window.StudyGraphStore.getWeekStats()

    // Today's achievement rate
    const progressGauge = document.getElementById("today-progress-gauge")
    if (progressGauge) {
      const valueElement = progressGauge.querySelector(".progress-gauge__value")
      if (valueElement) {
        valueElement.textContent = `${todayStats.achievementRate}%`
      }
    }

    // Today's minutes
    const todayMinutes = document.getElementById("today-minutes")
    if (todayMinutes) {
      todayMinutes.textContent = window.StudyGraphUtils.formatDuration(todayStats.minutes)
    }

    // Week total
    const weekTotal = document.getElementById("week-total")
    if (weekTotal) {
      weekTotal.textContent = window.StudyGraphUtils.formatDuration(weekStats.minutes)
    }
  },

  // Update quick form
  updateQuickForm() {
    const bookSelect = document.getElementById("input-book")
    if (bookSelect) {
      bookSelect.innerHTML = '<option value="">参考書を選択</option>'
      window.StudyGraphStore.state.books.forEach((book) => {
        const option = document.createElement("option")
        option.value = book.id
        option.textContent = book.title
        bookSelect.appendChild(option)
      })
    }

    // Set current datetime
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    const datetimeInput = document.getElementById("log-datetime")
    if (datetimeInput) {
      datetimeInput.value = now.toISOString().slice(0, 16)
    }
  },

  // Update dashboard chart
  updateDashboardChart() {
    window.StudyGraphCharts.createDailyRateChart("chart-daily-rate", 7)
  },

  // Initialize planner
  initPlanner() {
    window.StudyGraphCalendar.currentWeek = new Date()
    window.StudyGraphCalendar.updateWeekView()
    this.updateBookAllocation()

    // Event listeners
    const prevWeekBtn = document.getElementById("btn-prev-week")
    const nextWeekBtn = document.getElementById("btn-next-week")

    if (prevWeekBtn) {
      prevWeekBtn.addEventListener("click", () => {
        window.StudyGraphCalendar.previousWeek()
        this.updateBookAllocation()
      })
    }

    if (nextWeekBtn) {
      nextWeekBtn.addEventListener("click", () => {
        window.StudyGraphCalendar.nextWeek()
        this.updateBookAllocation()
      })
    }
  },

  // Update book allocation
  updateBookAllocation() {
    const container = document.getElementById("book-allocation-list")
    if (!container) return

    const weekDates = window.StudyGraphCalendar.getWeekDates(window.StudyGraphCalendar.currentWeek)
    const books = window.StudyGraphStore.state.books

    container.innerHTML = ""

    books.forEach((book) => {
      const weekStats = window.StudyGraphStore.getBookStats(book.id, 7)
      const weekPlans = weekDates
        .map((date) => {
          const dateStr = window.StudyGraphUtils.formatDate(date)
          const plan = window.StudyGraphStore.state.plansByDate[dateStr]
          return plan ? plan.items.find((item) => item.bookId === book.id) : null
        })
        .filter(Boolean)

      const plannedPages = weekPlans.reduce((sum, item) => sum + (item.targetPages || 0), 0)
      const plannedQuestions = weekPlans.reduce((sum, item) => sum + (item.targetQuestions || 0), 0)

      const allocationItem = document.createElement("div")
      allocationItem.className = "allocation-item"
      allocationItem.innerHTML = `
        <div class="allocation-item__info">
          <div class="allocation-item__title">${book.title}</div>
          <div class="allocation-item__meta">
            計画: p${plannedPages} q${plannedQuestions} | 
            実績: p${weekStats.pages} q${weekStats.questions}
          </div>
        </div>
        <div class="allocation-item__progress">
          ${Math.round((weekStats.pages / Math.max(plannedPages, 1)) * 100)}%
        </div>
      `
      container.appendChild(allocationItem)
    })
  },

  // Initialize logs
  initLogs() {
    this.updateLogForm()
    this.updateLogsList()
  },

  // Update log form
  updateLogForm() {
    const bookSelects = ["log-book", "log-filter-book"]
    bookSelects.forEach((selectId) => {
      const select = document.getElementById(selectId)
      if (select) {
        const currentValue = select.value
        select.innerHTML =
          selectId === "log-filter-book"
            ? '<option value="">全ての参考書</option>'
            : '<option value="">参考書を選択</option>'

        window.StudyGraphStore.state.books.forEach((book) => {
          const option = document.createElement("option")
          option.value = book.id
          option.textContent = book.title
          if (book.id === currentValue) {
            option.selected = true
          }
          select.appendChild(option)
        })
      }
    })

    // Set current datetime
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    const datetimeInput = document.getElementById("log-datetime")
    if (datetimeInput) {
      datetimeInput.value = now.toISOString().slice(0, 16)
    }
  },

  // Update logs list
  updateLogsList() {
    const container = document.getElementById("logs-list")
    const filterSelect = document.getElementById("log-filter-book")

    if (!container) return

    const filterBookId = filterSelect ? filterSelect.value : ""
    const filteredLogs = filterBookId
      ? window.StudyGraphStore.state.logs.filter((log) => log.bookId === filterBookId)
      : window.StudyGraphStore.state.logs

    if (filteredLogs.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty__icon">📚</div>
          <div class="empty__title">学習記録がありません</div>
          <div class="empty__description">上のフォームから学習記録を追加してください</div>
        </div>
      `
      return
    }

    container.innerHTML = ""

    filteredLogs.forEach((log) => {
      const book = window.StudyGraphStore.state.books.find((b) => b.id === log.bookId)
      const pages = (log.toPage || 0) - (log.fromPage || 0)

      const logItem = document.createElement("div")
      logItem.className = "log-item"
      logItem.innerHTML = `
        <div class="log-item__header">
          <div class="log-item__meta">
            <div class="log-item__book">${book ? book.title : "不明な参考書"}</div>
            <div class="log-item__datetime">${window.StudyGraphUtils.formatDate(new Date(log.datetime), "YYYY-MM-DD HH:mm")}</div>
          </div>
          <div class="log-item__actions">
            <button class="button button--icon edit-log" data-id="${log.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="button button--icon delete-log" data-id="${log.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="log-item__content">
          <div class="log-item__stats">
            ${pages > 0 ? `<span class="badge">p${pages}</span>` : ""}
            ${log.questions > 0 ? `<span class="badge">q${log.questions}</span>` : ""}
            <span class="badge badge--primary">${window.StudyGraphUtils.formatDuration(log.minutes)}</span>
          </div>
          ${log.memo ? `<div class="log-item__memo">${log.memo}</div>` : ""}
        </div>
      `

      container.appendChild(logItem)
    })

    // Add event listeners
    container.querySelectorAll(".edit-log").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const logId = e.target.closest(".edit-log").dataset.id
        this.editLog(logId)
      })
    })

    container.querySelectorAll(".delete-log").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const logId = e.target.closest(".delete-log").dataset.id
        this.deleteLog(logId)
      })
    })
  },

  // Edit log
  editLog(logId) {
    const log = window.StudyGraphStore.state.logs.find((l) => l.id === logId)
    if (!log) return

    // Populate form with log data
    const form = document.getElementById("detailed-log-form")
    if (form) {
      form.querySelector("#log-datetime").value = new Date(log.datetime).toISOString().slice(0, 16)
      form.querySelector("#log-book").value = log.bookId
      form.querySelector("#log-from-page").value = log.fromPage || ""
      form.querySelector("#log-to-page").value = log.toPage || ""
      form.querySelector("#log-questions").value = log.questions || ""
      form.querySelector("#log-minutes").value = log.minutes || ""
      form.querySelector("#log-memo").value = log.memo || ""

      // Store log ID for update
      form.dataset.editingId = logId

      // Scroll to form
      form.scrollIntoView({ behavior: "smooth" })
    }
  },

  // Delete log
  deleteLog(logId) {
    if (confirm("この学習記録を削除しますか？")) {
      window.StudyGraphStore.deleteLog(logId)
    }
  },

  // Initialize library
  initLibrary() {
    this.updateBooksGrid()
  },

  // Update books grid
  updateBooksGrid() {
    const container = document.getElementById("books-grid")
    if (!container) return

    if (window.StudyGraphStore.state.books.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <div class="empty__icon">📖</div>
          <div class="empty__title">参考書がありません</div>
          <div class="empty__description">右上のボタンから参考書を追加してください</div>
        </div>
      `
      return
    }

    container.innerHTML = ""

    window.StudyGraphStore.state.books.forEach((book) => {
      const bookCard = document.createElement("div")
      bookCard.className = "book-card"
      bookCard.dataset.bookId = book.id

      bookCard.innerHTML = `
        <div class="book-card__cover" style="background-color: ${book.color || "#6aa3ff"}">
          ${book.coverImageId ? "" : "📚"}
        </div>
        <div class="book-card__content">
          <div class="book-card__title">${book.title}</div>
          ${book.subtitle ? `<div class="book-card__subtitle">${book.subtitle}</div>` : ""}
          <div class="book-card__meta">
            <div>${book.subject || "その他"}</div>
            <div>p${book.totalPages || 0} / q${book.totalQuestions || 0}</div>
            <div>難易度: ${book.difficulty || 1}</div>
          </div>
        </div>
      `

      // Load cover image if exists
      if (book.coverImageId) {
        this.loadBookCover(book.coverImageId, bookCard.querySelector(".book-card__cover"))
      }

      // Click handler
      bookCard.addEventListener("click", () => {
        this.editBook(book.id)
      })

      container.appendChild(bookCard)
    })
  },

  // Load book cover
  async loadBookCover(imageId, coverElement) {
    try {
      const image = await window.StudyGraphDB.getImage(imageId)
      if (image && image.blob) {
        const url = URL.createObjectURL(image.blob)
        coverElement.style.backgroundImage = `url(${url})`
        coverElement.textContent = ""
      }
    } catch (error) {
      console.error("Failed to load book cover:", error)
    }
  },

  // Edit book
  editBook(bookId) {
    const book = window.StudyGraphStore.state.books.find((b) => b.id === bookId)
    if (!book) return

    const content = `
      <form id="book-form" class="form">
        <div class="form-field">
          <label for="book-title">タイトル *</label>
          <input type="text" id="book-title" class="form-field__input" value="${book.title}" required>
        </div>
        
        <div class="form-field">
          <label for="book-subtitle">副題</label>
          <input type="text" id="book-subtitle" class="form-field__input" value="${book.subtitle || ""}">
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="book-subject">科目</label>
            <select id="book-subject" class="form-field__input">
              <option value="数学" ${book.subject === "数学" ? "selected" : ""}>数学</option>
              <option value="物理" ${book.subject === "物理" ? "selected" : ""}>物理</option>
              <option value="化学" ${book.subject === "化学" ? "selected" : ""}>化学</option>
              <option value="英語" ${book.subject === "英語" ? "selected" : ""}>英語</option>
              <option value="国語" ${book.subject === "国語" ? "selected" : ""}>国語</option>
              <option value="地理" ${book.subject === "地理" ? "selected" : ""}>地理</option>
              <option value="生物" ${book.subject === "生物" ? "selected" : ""}>生物</option>
              <option value="その他" ${book.subject === "その他" ? "selected" : ""}>その他</option>
            </select>
          </div>
          <div class="form-field">
            <label for="book-difficulty">難易度</label>
            <select id="book-difficulty" class="form-field__input">
              <option value="1" ${book.difficulty === 1 ? "selected" : ""}>1 (易)</option>
              <option value="2" ${book.difficulty === 2 ? "selected" : ""}>2</option>
              <option value="3" ${book.difficulty === 3 ? "selected" : ""}>3 (普通)</option>
              <option value="4" ${book.difficulty === 4 ? "selected" : ""}>4</option>
              <option value="5" ${book.difficulty === 5 ? "selected" : ""}>5 (難)</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="book-total-pages">総ページ数</label>
            <input type="number" id="book-total-pages" class="form-field__input" value="${book.totalPages || ""}" min="0">
          </div>
          <div class="form-field">
            <label for="book-total-questions">総問題数</label>
            <input type="number" id="book-total-questions" class="form-field__input" value="${book.totalQuestions || ""}" min="0">
          </div>
        </div>
        
        <div class="form-field">
          <label for="book-color">カラー</label>
          <input type="color" id="book-color" class="form-field__input" value="${book.color || "#6aa3ff"}">
        </div>
        
        <div class="form-field">
          <label for="book-cover">表紙画像</label>
          <input type="file" id="book-cover" class="form-field__input" accept="image/*">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="button button--primary">保存</button>
          <button type="button" id="delete-book" class="button button--danger">削除</button>
          <button type="button" id="cancel-book" class="button button--ghost">キャンセル</button>
        </div>
      </form>
    `

    window.StudyGraphUtils.showModal("参考書編集", content)

    // Event listeners
    const form = document.getElementById("book-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveBook(book.id)
    })

    document.getElementById("delete-book").addEventListener("click", () => {
      if (confirm("この参考書を削除しますか？関連する学習記録も削除されます。")) {
        window.StudyGraphStore.deleteBook(book.id)
        window.StudyGraphUtils.hideModal()
      }
    })

    document.getElementById("cancel-book").addEventListener("click", () => {
      window.StudyGraphUtils.hideModal()
    })
  },

  // Add new book
  addBook() {
    const content = `
      <form id="book-form" class="form">
        <div class="form-field">
          <label for="book-title">タイトル *</label>
          <input type="text" id="book-title" class="form-field__input" required>
        </div>
        
        <div class="form-field">
          <label for="book-subtitle">副題</label>
          <input type="text" id="book-subtitle" class="form-field__input">
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="book-subject">科目</label>
            <select id="book-subject" class="form-field__input">
              <option value="数学">数学</option>
              <option value="物理">物理</option>
              <option value="化学">化学</option>
              <option value="英語">英語</option>
              <option value="国語">国語</option>
              <option value="地理">地理</option>
              <option value="生物">生物</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <div class="form-field">
            <label for="book-difficulty">難易度</label>
            <select id="book-difficulty" class="form-field__input">
              <option value="1">1 (易)</option>
              <option value="2">2</option>
              <option value="3" selected>3 (普通)</option>
              <option value="4">4</option>
              <option value="5">5 (難)</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label for="book-total-pages">総ページ数</label>
            <input type="number" id="book-total-pages" class="form-field__input" min="0">
          </div>
          <div class="form-field">
            <label for="book-total-questions">総問題数</label>
            <input type="number" id="book-total-questions" class="form-field__input" min="0">
          </div>
        </div>
        
        <div class="form-field">
          <label for="book-color">カラー</label>
          <input type="color" id="book-color" class="form-field__input" value="#6aa3ff">
        </div>
        
        <div class="form-field">
          <label for="book-cover">表紙画像</label>
          <input type="file" id="book-cover" class="form-field__input" accept="image/*">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="button button--primary">追加</button>
          <button type="button" id="cancel-book" class="button button--ghost">キャンセル</button>
        </div>
      </form>
    `

    window.StudyGraphUtils.showModal("参考書追加", content)

    // Event listeners
    const form = document.getElementById("book-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveBook()
    })

    document.getElementById("cancel-book").addEventListener("click", () => {
      window.StudyGraphUtils.hideModal()
    })
  },

  // Save book
  async saveBook(bookId = null) {
    const form = document.getElementById("book-form")
    const formData = new FormData(form)

    const bookData = {
      title: document.getElementById("book-title").value,
      subtitle: document.getElementById("book-subtitle").value,
      subject: document.getElementById("book-subject").value,
      difficulty: Number.parseInt(document.getElementById("book-difficulty").value),
      totalPages: Number.parseInt(document.getElementById("book-total-pages").value) || 0,
      totalQuestions: Number.parseInt(document.getElementById("book-total-questions").value) || 0,
      color: document.getElementById("book-color").value,
      tags: [],
    }

    // Handle cover image
    const coverFile = document.getElementById("book-cover").files[0]
    if (coverFile) {
      try {
        const resizedImage = await window.StudyGraphUtils.resizeImage(coverFile)
        const imageId = await window.StudyGraphDB.addImage({
          blob: resizedImage,
          type: resizedImage.type,
          width: 0,
          height: 0,
          size: resizedImage.size,
        })
        bookData.coverImageId = imageId
      } catch (error) {
        console.error("Failed to process cover image:", error)
      }
    }

    if (bookId) {
      // Update existing book
      const existingBook = window.StudyGraphStore.state.books.find((b) => b.id === bookId)
      const updatedBook = { ...existingBook, ...bookData }
      await window.StudyGraphStore.updateBook(updatedBook)
    } else {
      // Add new book
      await window.StudyGraphStore.addBook(bookData)
    }

    window.StudyGraphUtils.hideModal()
  },

  // Initialize analytics
  initAnalytics() {
    this.updateAnalyticsCharts()
    this.setupAnalyticsEventListeners()
  },

  // Update analytics charts
  updateAnalyticsCharts(days = 90) {
    window.StudyGraphCharts.createBookBreakdownChart("chart-book-breakdown", days)
    window.StudyGraphCharts.createSubjectPieChart("chart-subject-pie", days)
    window.StudyGraphCharts.createCumulativeChart("chart-cumulative", days)
    window.StudyGraphCharts.createHeatmap("heatmap-container")
  },

  // Setup analytics event listeners
  setupAnalyticsEventListeners() {
    document.querySelectorAll(".period-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Remove active class from all buttons
        document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"))

        // Add active class to clicked button
        e.target.classList.add("active")

        // Update charts
        const days = Number.parseInt(e.target.dataset.period)
        this.updateAnalyticsCharts(days)
      })
    })
  },

  // Initialize settings
  initSettings() {
    this.updateThemeSelector()
    this.updateStorageInfo()
    this.setupSettingsEventListeners()
  },

  // Update theme selector
  updateThemeSelector() {
    const currentTheme = window.StudyGraphStore.state.prefs.theme
    const currentAccent = window.StudyGraphStore.state.prefs.accent

    // Update theme buttons
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.remove("active")
      if (btn.dataset.theme === currentTheme) {
        btn.classList.add("active")
      }
    })

    // Update color buttons
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.classList.remove("active")
      if (btn.dataset.color === currentAccent) {
        btn.classList.add("active")
      }
    })
  },

  // Update storage info
  async updateStorageInfo() {
    try {
      const storageSize = await window.StudyGraphDB.getStorageSize()

      const imagesSize = document.getElementById("images-size")
      const dataSize = document.getElementById("data-size")

      if (imagesSize) {
        imagesSize.textContent = window.StudyGraphUtils.formatFileSize(storageSize.images)
      }

      if (dataSize) {
        dataSize.textContent = window.StudyGraphUtils.formatFileSize(storageSize.data)
      }
    } catch (error) {
      console.error("Failed to get storage info:", error)
    }
  },

  // Setup settings event listeners
  setupSettingsEventListeners() {
    // Theme selection
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const theme = e.target.dataset.theme
        this.changeTheme(theme)
      })
    })

    // Color selection
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const color = e.target.dataset.color
        this.changeAccentColor(color)
      })
    })

    // Export button
    const exportBtn = document.getElementById("btn-export-json")
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        window.StudyGraphExport.exportData()
      })
    }

    // Import button
    const importBtn = document.getElementById("btn-import-json")
    const importFile = document.getElementById("import-file")

    if (importBtn && importFile) {
      importBtn.addEventListener("click", () => {
        importFile.click()
      })

      importFile.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (file) {
          window.StudyGraphImport.importData(file)
        }
      })
    }

    // Reset data button
    const resetBtn = document.getElementById("btn-reset-data")
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetAllData()
      })
    }
  },

  // Change theme
  changeTheme(theme) {
    window.StudyGraphStore.updatePrefs({ theme })

    // Update theme buttons
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.remove("active")
      if (btn.dataset.theme === theme) {
        btn.classList.add("active")
      }
    })

    // Apply theme
    this.applyTheme(theme)
  },

  // Change accent color
  changeAccentColor(color) {
    window.StudyGraphStore.updatePrefs({ accent: color })

    // Update color buttons
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.classList.remove("active")
      if (btn.dataset.color === color) {
        btn.classList.add("active")
      }
    })

    // Apply color
    document.documentElement.style.setProperty("--primary", color)
  },

  // Apply theme
  applyTheme(theme) {
    const themeStylesheet = document.getElementById("theme-stylesheet")

    if (theme === "light") {
      themeStylesheet.href = "assets/css/theme-light.css"
    } else if (theme === "dark") {
      themeStylesheet.href = "assets/css/theme-dark.css"
    } else {
      // Auto theme - detect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      themeStylesheet.href = prefersDark ? "assets/css/theme-dark.css" : "assets/css/theme-light.css"
    }
  },

  // Reset all data
  resetAllData() {
    const confirmText = "DELETE"
    const userInput = prompt(
      `全てのデータを削除します。この操作は取り消せません。\n確認のため「${confirmText}」と入力してください:`,
    )

    if (userInput === confirmText) {
      window.StudyGraphDB.clearAllData().then(() => {
        window.StudyGraphStore.state.books = []
        window.StudyGraphStore.state.logs = []
        window.StudyGraphStore.state.plansByDate = {}

        window.StudyGraphStore.emit("BOOKS_CHANGED", [])
        window.StudyGraphStore.emit("LOGS_CHANGED", [])
        window.StudyGraphStore.emit("PLANS_CHANGED", {})

        window.StudyGraphUtils.showToast("全てのデータを削除しました")

        // Refresh current view
        const currentRoute = window.StudyGraphRouter.currentRoute
        window.StudyGraphRouter.initializeRoute(currentRoute)
      })
    }
  },
}
