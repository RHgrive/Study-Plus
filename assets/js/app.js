// Main application initialization
window.StudyGraphApp = {
  // Initialize application
  async init() {
    try {
      console.log("Initializing StudyGraph V2...")

      // Initialize database
      await window.StudyGraphDB.init()
      console.log("Database initialized")

      // Initialize store
      await window.StudyGraphStore.init()
      console.log("Store initialized")

      // Initialize router
      window.StudyGraphRouter.init()
      console.log("Router initialized")

      // Setup event listeners
      this.setupEventListeners()
      console.log("Event listeners setup")

      // Apply initial theme
      const theme = window.StudyGraphStore.state.prefs.theme
      window.StudyGraphUI.applyTheme(theme)

      // Apply initial accent color
      const accent = window.StudyGraphStore.state.prefs.accent
      document.documentElement.style.setProperty("--primary", accent)

      const el = document.getElementById("countdown-days")
      if (el) {
        const target = new Date("2026-01-17T00:00:00+09:00")
        const now = new Date()
        const diff = Math.ceil((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
        el.textContent = diff > 0 ? diff : 0
      }

      console.log("StudyGraph V2 initialized successfully")
    } catch (error) {
      console.error("Failed to initialize StudyGraph V2:", error)

      // Show error message
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; text-align: center; padding: 20px;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">初期化エラー</h1>
          <p style="color: #64748b; margin-bottom: 24px;">アプリケーションの初期化に失敗しました。</p>
          <p style="color: #64748b; font-size: 14px;">ブラウザがIndexedDBをサポートしているか確認してください。</p>
          <button onclick="location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
            再読み込み
          </button>
        </div>
      `
    }
  },

  // Setup global event listeners
  setupEventListeners() {
    // Store event listeners
    window.StudyGraphStore.on("BOOKS_CHANGED", () => {
      if (window.StudyGraphRouter.currentRoute === "#/library") {
        window.StudyGraphUI.updateBooksGrid()
      }
      window.StudyGraphUI.updateQuickForm()
      window.StudyGraphUI.updateLogForm()
    })

    window.StudyGraphStore.on("LOGS_CHANGED", () => {
      if (window.StudyGraphRouter.currentRoute === "#/dashboard") {
        window.StudyGraphUI.updateDashboardKPIs()
        window.StudyGraphUI.updateDashboardChart()
      }
      if (window.StudyGraphRouter.currentRoute === "#/logs") {
        window.StudyGraphUI.updateLogsList()
      }
      if (window.StudyGraphRouter.currentRoute === "#/analytics") {
        window.StudyGraphUI.updateAnalyticsCharts()
      }
    })

    window.StudyGraphStore.on("PLANS_CHANGED", () => {
      if (window.StudyGraphRouter.currentRoute === "#/planner") {
        window.StudyGraphCalendar.updateWeekView()
        window.StudyGraphUI.updateBookAllocation()
      }
      if (window.StudyGraphRouter.currentRoute === "#/dashboard") {
        window.StudyGraphUI.updateDashboardKPIs()
      }
    })

    window.StudyGraphStore.on("PREFS_CHANGED", (prefs) => {
      window.StudyGraphUI.applyTheme(prefs.theme)
      document.documentElement.style.setProperty("--primary", prefs.accent)
    })

    // Form submissions
    const quickLogForm = document.getElementById("quick-log-form")
    if (quickLogForm) {
      quickLogForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleQuickLogSubmit()
      })
    }

    const detailedLogForm = document.getElementById("detailed-log-form")
    if (detailedLogForm) {
      detailedLogForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleDetailedLogSubmit()
      })
    }

    // Quick add button
    const quickAddBtn = document.getElementById("btn-quick-add")
    if (quickAddBtn) {
      quickAddBtn.addEventListener("click", () => {
        window.StudyGraphRouter.navigate("#/logs")
      })
    }

    // Add book button
    const addBookBtn = document.getElementById("btn-add-book")
    if (addBookBtn) {
      addBookBtn.addEventListener("click", () => {
        window.StudyGraphUI.addBook()
      })
    }

    // Log filter
    const logFilterSelect = document.getElementById("log-filter-book")
    if (logFilterSelect) {
      logFilterSelect.addEventListener("change", () => {
        window.StudyGraphUI.updateLogsList()
      })
    }

    // Modal close
    const modalClose = document.getElementById("modal-close")
    const modalOverlay = document.getElementById("modal-overlay")

    if (modalClose) {
      modalClose.addEventListener("click", () => {
        window.StudyGraphUtils.hideModal()
      })
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          window.StudyGraphUtils.hideModal()
        }
      })
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // ESC to close modal
      if (e.key === "Escape") {
        window.StudyGraphUtils.hideModal()
      }

      // Ctrl/Cmd + S to save (prevent default)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
      }
    })

    // Auto-save preferences
    window.addEventListener("beforeunload", () => {
      localStorage.setItem("studygraph_prefs", JSON.stringify(window.StudyGraphStore.state.prefs))
    })

    // Handle system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", () => {
      if (window.StudyGraphStore.state.prefs.theme === "auto") {
        window.StudyGraphUI.applyTheme("auto")
      }
    })
  },

  // Handle quick log form submission
  async handleQuickLogSubmit() {
    const form = document.getElementById("quick-log-form")
    const formData = new FormData(form)

    const logData = {
      datetime: new Date().toISOString(),
      bookId: document.getElementById("input-book").value,
      fromPage: Number.parseInt(document.getElementById("input-from-page").value) || null,
      toPage: Number.parseInt(document.getElementById("input-to-page").value) || null,
      questions: Number.parseInt(document.getElementById("input-questions").value) || null,
      minutes: Number.parseInt(document.getElementById("input-minutes").value) || 0,
      memo: document.getElementById("input-memo").value || "",
      photoId: null,
      tags: [],
    }

    // Validate
    const errors = window.StudyGraphUtils.validateLog(logData)
    if (errors.length > 0) {
      window.StudyGraphUtils.showToast(errors[0])
      return
    }

    try {
      await window.StudyGraphStore.addLog(logData)
      form.reset()

      // Set focus back to book select
      document.getElementById("input-book").focus()
    } catch (error) {
      console.error("Failed to save quick log:", error)
    }
  },

  // Handle detailed log form submission
  async handleDetailedLogSubmit() {
    const form = document.getElementById("detailed-log-form")
    const editingId = form.dataset.editingId

    const logData = {
      datetime: document.getElementById("log-datetime").value,
      bookId: document.getElementById("log-book").value,
      fromPage: Number.parseInt(document.getElementById("log-from-page").value) || null,
      toPage: Number.parseInt(document.getElementById("log-to-page").value) || null,
      questions: Number.parseInt(document.getElementById("log-questions").value) || null,
      minutes: Number.parseInt(document.getElementById("log-minutes").value) || 0,
      memo: document.getElementById("log-memo").value || "",
      photoId: null,
      tags: [],
    }

    // Handle photo upload
    const photoFile = document.getElementById("log-photo").files[0]
    if (photoFile) {
      try {
        const resizedImage = await window.StudyGraphUtils.resizeImage(photoFile)
        const imageId = await window.StudyGraphDB.addImage({
          blob: resizedImage,
          type: resizedImage.type,
          width: 0,
          height: 0,
          size: resizedImage.size,
        })
        logData.photoId = imageId
      } catch (error) {
        console.error("Failed to process photo:", error)
      }
    }

    // Validate
    const errors = window.StudyGraphUtils.validateLog(logData)
    if (errors.length > 0) {
      window.StudyGraphUtils.showToast(errors[0])
      return
    }

    try {
      if (editingId) {
        // Update existing log
        const existingLog = window.StudyGraphStore.state.logs.find((l) => l.id === editingId)
        const updatedLog = { ...existingLog, ...logData }
        await window.StudyGraphStore.updateLog(updatedLog)
        delete form.dataset.editingId
      } else {
        // Add new log
        await window.StudyGraphStore.addLog(logData)
      }

      form.reset()

      // Set current datetime
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      document.getElementById("log-datetime").value = now.toISOString().slice(0, 16)
    } catch (error) {
      console.error("Failed to save detailed log:", error)
    }
  },
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.StudyGraphApp.init()
})

// Handle service worker registration (for future PWA support)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Service worker registration will be added in V3
  })
}
