// Calendar utilities
window.StudyGraphCalendar = {
  currentWeek: new Date(),
  StudyGraphUtils: window.StudyGraphUtils, // Declare StudyGraphUtils
  StudyGraphStore: window.StudyGraphStore, // Declare StudyGraphStore

  // Get week dates starting from Monday
  getWeekDates(date = new Date()) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  },

  // Format week title
  getWeekTitle(date = new Date()) {
    const dates = this.getWeekDates(date)
    const start = dates[0]
    const end = dates[6]

    const year = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const endMonth = end.getMonth() + 1

    if (startMonth === endMonth) {
      return `${year}年${startMonth}月 第${Math.ceil(start.getDate() / 7)}週`
    } else {
      return `${year}年${startMonth}月${start.getDate()}日 - ${endMonth}月${end.getDate()}日`
    }
  },

  // Render weekly calendar
  renderWeeklyCalendar(container, date = new Date()) {
    const dates = this.getWeekDates(date)
    const today = this.StudyGraphUtils.formatDate(new Date()) // Use StudyGraphUtils

    container.innerHTML = ""

    // Day headers
    const dayNames = ["月", "火", "水", "木", "金", "土", "日"]
    dayNames.forEach((dayName) => {
      const header = document.createElement("div")
      header.className = "calendar-header"
      header.textContent = dayName
      container.appendChild(header)
    })

    // Day cells
    dates.forEach((date, index) => {
      const dateStr = this.StudyGraphUtils.formatDate(date) // Use StudyGraphUtils
      const dayCell = document.createElement("div")
      dayCell.className = "calendar-day"
      dayCell.dataset.date = dateStr

      if (dateStr === today) {
        dayCell.classList.add("calendar-day--today")
      }

      // Day number
      const dayNumber = document.createElement("div")
      dayNumber.className = "calendar-day__number"
      dayNumber.textContent = date.getDate()
      dayCell.appendChild(dayNumber)

      // Plan badges
      const plan = this.StudyGraphStore.state.plansByDate[dateStr]
      if (plan && plan.items.length > 0) {
        const totalPages = plan.items.reduce((sum, item) => sum + (item.targetPages || 0), 0)
        const totalQuestions = plan.items.reduce((sum, item) => sum + (item.targetQuestions || 0), 0)

        if (totalPages > 0) {
          const pageBadge = document.createElement("div")
          pageBadge.className = "calendar-badge calendar-badge--pages"
          pageBadge.textContent = `p${totalPages}`
          dayCell.appendChild(pageBadge)
        }

        if (totalQuestions > 0) {
          const questionBadge = document.createElement("div")
          questionBadge.className = "calendar-badge calendar-badge--questions"
          questionBadge.textContent = `q${totalQuestions}`
          dayCell.appendChild(questionBadge)
        }
      }

      // Progress indicator
      const dayLogs = this.StudyGraphStore.state.logs.filter((log) => log.date === dateStr)
      if (dayLogs.length > 0) {
        const progressIndicator = document.createElement("div")
        progressIndicator.className = "calendar-progress"
        dayCell.appendChild(progressIndicator)
      }

      // Click handler
      dayCell.addEventListener("click", () => {
        this.selectDate(dateStr)
      })

      container.appendChild(dayCell)
    })
  },

  // Select date for planning
  selectDate(dateStr) {
    // Remove previous selection
    document.querySelectorAll(".calendar-day--selected").forEach((day) => {
      day.classList.remove("calendar-day--selected")
    })

    // Add selection to clicked day
    const dayCell = document.querySelector(`[data-date="${dateStr}"]`)
    if (dayCell) {
      dayCell.classList.add("calendar-day--selected")
    }

    // Show day planning panel
    this.showDayPlanningPanel(dateStr)
  },

  // Show day planning panel
  showDayPlanningPanel(dateStr) {
    const plan = this.StudyGraphStore.state.plansByDate[dateStr] || { date: dateStr, items: [] }

    const content = `
      <div class="day-planning-panel">
        <h3>${this.StudyGraphUtils.formatDate(new Date(dateStr), "M月D日")}の計画</h3>
        <div id="day-plan-items">
          ${this.renderPlanItems(plan.items)}
        </div>
        <button id="add-plan-item" class="button button--ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          項目を追加
        </button>
        <div class="day-planning-actions">
          <button id="save-day-plan" class="button button--primary">保存</button>
          <button id="cancel-day-plan" class="button button--ghost">キャンセル</button>
        </div>
      </div>
    `

    this.StudyGraphUtils.showModal("日別計画", content) // Use StudyGraphUtils

    // Event listeners
    document.getElementById("add-plan-item").addEventListener("click", () => {
      this.addPlanItem()
    })

    document.getElementById("save-day-plan").addEventListener("click", () => {
      this.saveDayPlan(dateStr)
    })

    document.getElementById("cancel-day-plan").addEventListener("click", () => {
      this.StudyGraphUtils.hideModal() // Use StudyGraphUtils
    })
  },

  // Render plan items
  renderPlanItems(items) {
    return items
      .map(
        (item, index) => `
      <div class="plan-item" data-index="${index}">
        <div class="plan-item__content">
          <select class="form-field__input plan-item__book">
            <option value="">参考書を選択</option>
            ${this.StudyGraphStore.state.books
              .map(
                (book) =>
                  `<option value="${book.id}" ${book.id === item.bookId ? "selected" : ""}>${book.title}</option>`,
              )
              .join("")}
          </select>
          <div class="plan-item__targets">
            <input type="number" class="form-field__input plan-item__pages" 
                   placeholder="ページ" value="${item.targetPages || ""}" min="0">
            <input type="number" class="form-field__input plan-item__questions" 
                   placeholder="問題数" value="${item.targetQuestions || ""}" min="0">
          </div>
          <select class="form-field__input plan-item__priority">
            <option value="0" ${item.priority === 0 ? "selected" : ""}>通常</option>
            <option value="1" ${item.priority === 1 ? "selected" : ""}>重要</option>
            <option value="2" ${item.priority === 2 ? "selected" : ""}>最重要</option>
          </select>
        </div>
        <button class="button button--icon remove-plan-item" data-index="${index}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `,
      )
      .join("")
  },

  // Add plan item
  addPlanItem() {
    const container = document.getElementById("day-plan-items")
    const newItem = document.createElement("div")
    newItem.innerHTML = this.renderPlanItems([{ bookId: "", targetPages: 0, targetQuestions: 0, priority: 0 }])
    container.appendChild(newItem.firstElementChild)

    // Add event listener for remove button
    newItem.querySelector(".remove-plan-item").addEventListener("click", (e) => {
      e.target.closest(".plan-item").remove()
    })
  },

  // Save day plan
  saveDayPlan(dateStr) {
    const planItems = []
    const itemElements = document.querySelectorAll(".plan-item")

    itemElements.forEach((element) => {
      const bookId = element.querySelector(".plan-item__book").value
      const targetPages = Number.parseInt(element.querySelector(".plan-item__pages").value) || 0
      const targetQuestions = Number.parseInt(element.querySelector(".plan-item__questions").value) || 0
      const priority = Number.parseInt(element.querySelector(".plan-item__priority").value) || 0

      if (bookId && (targetPages > 0 || targetQuestions > 0)) {
        planItems.push({
          bookId,
          targetPages,
          targetQuestions,
          priority,
          notes: "",
        })
      }
    })

    this.StudyGraphStore.savePlan(dateStr, planItems) // Use StudyGraphStore
    this.StudyGraphUtils.hideModal() // Use StudyGraphUtils

    // Refresh calendar
    this.renderWeeklyCalendar(document.getElementById("weekly-calendar"), this.currentWeek)
  },

  // Navigate weeks
  previousWeek() {
    this.currentWeek.setDate(this.currentWeek.getDate() - 7)
    this.updateWeekView()
  },

  nextWeek() {
    this.currentWeek.setDate(this.currentWeek.getDate() + 7)
    this.updateWeekView()
  },

  // Update week view
  updateWeekView() {
    const titleElement = document.getElementById("current-week-title")
    const calendarElement = document.getElementById("weekly-calendar")

    if (titleElement) {
      titleElement.textContent = this.getWeekTitle(this.currentWeek)
    }

    if (calendarElement) {
      this.renderWeeklyCalendar(calendarElement, this.currentWeek)
    }
  },
}
