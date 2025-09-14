// Database Layer using IndexedDB
window.StudyGraphDB = {
  dbName: "studygraph_v2",
  version: 1,
  db: null,

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Books store
        if (!db.objectStoreNames.contains("books")) {
          const booksStore = db.createObjectStore("books", { keyPath: "id" })
          booksStore.createIndex("subject", "subject", { unique: false })
          booksStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        // Plans store
        if (!db.objectStoreNames.contains("plans")) {
          const plansStore = db.createObjectStore("plans", { keyPath: "id" })
          plansStore.createIndex("date", "date", { unique: false })
        }

        // Logs store
        if (!db.objectStoreNames.contains("logs")) {
          const logsStore = db.createObjectStore("logs", { keyPath: "id" })
          logsStore.createIndex("datetime", "datetime", { unique: false })
          logsStore.createIndex("bookId", "bookId", { unique: false })
          logsStore.createIndex("date", "date", { unique: false })
        }

        // Images store
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" })
        }

        // Meta store
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" })
        }
      }
    })
  },

  // Generic CRUD operations
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    return store.add(data)
  },

  async get(storeName, id) {
    const transaction = this.db.transaction([storeName], "readonly")
    const store = transaction.objectStore(storeName)
    return store.get(id)
  },

  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], "readonly")
    const store = transaction.objectStore(storeName)
    return store.getAll()
  },

  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    return store.put(data)
  },

  async delete(storeName, id) {
    const transaction = this.db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    return store.delete(id)
  },

  async clear(storeName) {
    const transaction = this.db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    return store.clear()
  },

  // Books operations
  async addBook(book) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    book.id = StudyGraphUtils.generateId("book_")
    book.createdAt = new Date().toISOString()
    book.updatedAt = new Date().toISOString()
    return this.add("books", book)
  },

  async getBooks() {
    return this.getAll("books")
  },

  async updateBook(book) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    book.updatedAt = new Date().toISOString()
    return this.update("books", book)
  },

  async deleteBook(id) {
    return this.delete("books", id)
  },

  // Plans operations
  async addPlan(plan) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    plan.id = StudyGraphUtils.generateId("plan_")
    return this.update("plans", plan)
  },

  async getPlan(date) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    const storeName = "plans" // Declare storeName
    const transaction = this.db.transaction(["plans"], "readonly")
    const store = transaction.objectStore(storeName)
    const index = store.index("date")
    return index.get(date)
  },

  async getPlans() {
    return this.getAll("plans")
  },

  async updatePlan(plan) {
    return this.update("plans", plan)
  },

  async deletePlan(id) {
    return this.delete("plans", id)
  },

  // Logs operations
  async addLog(log) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    log.id = StudyGraphUtils.generateId("log_")
    log.date = StudyGraphUtils.formatDate(log.datetime)
    return this.add("logs", log)
  },

  async getLogs() {
    return this.getAll("logs")
  },

  async getLogsByDateRange(fromDate, toDate) {
    const transaction = this.db.transaction(["logs"], "readonly")
    const store = transaction.objectStore("logs")
    const index = store.index("date")
    const range = IDBKeyRange.bound(fromDate, toDate)
    return index.getAll(range)
  },

  async getLogsByBook(bookId) {
    const transaction = this.db.transaction(["logs"], "readonly")
    const store = transaction.objectStore("logs")
    const index = store.index("bookId")
    return index.getAll(bookId)
  },

  async updateLog(log) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    log.date = StudyGraphUtils.formatDate(log.datetime)
    return this.update("logs", log)
  },

  async deleteLog(id) {
    return this.delete("logs", id)
  },

  // Images operations
  async addImage(imageData) {
    const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils
    const id = StudyGraphUtils.generateId("img_")
    const image = {
      id,
      blob: imageData.blob,
      type: imageData.type,
      width: imageData.width,
      height: imageData.height,
      size: imageData.size,
    }
    await this.add("images", image)
    return id
  },

  async getImage(id) {
    return this.get("images", id)
  },

  async deleteImage(id) {
    return this.delete("images", id)
  },

  // Meta operations
  async setMeta(key, value) {
    return this.update("meta", { key, value })
  },

  async getMeta(key) {
    const result = await this.get("meta", key)
    return result ? result.value : null
  },

  // Storage size calculation
  async getStorageSize() {
    const images = await this.getAll("images")
    const logs = await this.getAll("logs")
    const books = await this.getAll("books")
    const plans = await this.getAll("plans")

    let imagesSize = 0
    images.forEach((img) => {
      imagesSize += img.size || 0
    })

    const dataSize = JSON.stringify({ logs, books, plans }).length

    return {
      images: imagesSize,
      data: dataSize,
      total: imagesSize + dataSize,
    }
  },

  // Clear all data
  async clearAllData() {
    await this.clear("books")
    await this.clear("plans")
    await this.clear("logs")
    await this.clear("images")
    await this.clear("meta")
  },
}
