// Utility Functions
const StudyGraphUtils = {
  // Generate unique ID
  generateId: (prefix = "") => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}${timestamp}_${random}`
  },

  // Format date
  formatDate: (date, format = "YYYY-MM-DD") => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")

    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`
      case "YYYY-MM-DD HH:mm":
        return `${year}-${month}-${day} ${hours}:${minutes}`
      case "MM/DD":
        return `${month}/${day}`
      case "M月D日":
        return `${Number.parseInt(month)}月${Number.parseInt(day)}日`
      default:
        return `${year}-${month}-${day}`
    }
  },

  // Format duration
  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${minutes}分`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`
  },

  // Calculate date range
  getDateRange: (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days + 1)
    return {
      from: StudyGraphUtils.formatDate(start),
      to: StudyGraphUtils.formatDate(end),
    }
  },

  // Get week dates
  getWeekDates: (date = new Date()) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(StudyGraphUtils.formatDate(date))
    }
    return dates
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle
    return function () {
      const args = arguments
      
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Deep clone object
  deepClone: (obj) => {
    if (obj === null || typeof obj !== "object") return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map((item) => StudyGraphUtils.deepClone(item))
    if (typeof obj === "object") {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = StudyGraphUtils.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },

  // Validate form data
  validateLog: (data) => {
    const errors = []

    if (!data.bookId) {
      errors.push("参考書を選択してください")
    }

    if (!data.minutes || data.minutes <= 0) {
      errors.push("学習時間を入力してください")
    }

    if (data.fromPage && data.toPage && data.fromPage > data.toPage) {
      errors.push("開始ページは終了ページより小さくしてください")
    }

    if (!data.fromPage && !data.toPage && !data.questions) {
      errors.push("ページ数または問題数を入力してください")
    }

    return errors
  },

  // Calculate file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  // Resize image
  resizeImage: (file, maxWidth = 2048, maxHeight = 2048, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, file.type, quality)
      }

      img.src = URL.createObjectURL(file)
    })
  },

  // Show toast notification
  showToast: (message, duration = 3000) => {
    const toast = document.getElementById("toast")
    const toastMessage = document.getElementById("toast-message")

    toastMessage.textContent = message
    toast.classList.remove("toast--hidden")

    setTimeout(() => {
      toast.classList.add("toast--hidden")
    }, duration)
  },

  // Show modal
  showModal: (title, content) => {
    const overlay = document.getElementById("modal-overlay")
    const modalTitle = document.getElementById("modal-title")
    const modalContent = document.getElementById("modal-content")

    modalTitle.textContent = title
    modalContent.innerHTML = content
    overlay.classList.remove("modal-overlay--hidden")
  },

  // Hide modal
  hideModal: () => {
    const overlay = document.getElementById("modal-overlay")
    overlay.classList.add("modal-overlay--hidden")
  },
}

window.StudyGraphUtils = StudyGraphUtils
