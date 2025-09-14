// Data export functionality
window.StudyGraphExport = {
  // Export all data to JSON
  async exportData() {
    try {
      const StudyGraphStore = window.StudyGraphStore // Declare StudyGraphStore
      const StudyGraphDB = window.StudyGraphDB // Declare StudyGraphDB
      const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils

      StudyGraphStore.setLoading(true)

      const books = await StudyGraphDB.getBooks()
      const plans = await StudyGraphDB.getPlans()
      const logs = await StudyGraphDB.getLogs()
      const images = await StudyGraphDB.getAll("images")
      const prefs = StudyGraphStore.state.prefs

      // Convert image blobs to base64
      const imagesData = await Promise.all(
        images.map(async (image) => {
          const arrayBuffer = await image.blob.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          return {
            id: image.id,
            type: image.type,
            data: `data:${image.type};base64,${base64}`,
            width: image.width,
            height: image.height,
            size: image.size,
          }
        }),
      )

      const exportData = {
        version: "2.0.0",
        exportedAt: new Date().toISOString(),
        prefs,
        books,
        plans,
        logs,
        images: imagesData,
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `studygraph-backup-${StudyGraphUtils.formatDate(new Date(), "YYYY-MM-DD")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      StudyGraphUtils.showToast("バックアップファイルをダウンロードしました")
    } catch (error) {
      console.error("Export failed:", error)
      StudyGraphUtils.showToast("エクスポートに失敗しました")
    } finally {
      const StudyGraphStore = window.StudyGraphStore // Declare StudyGraphStore
      StudyGraphStore.setLoading(false)
    }
  },

  // Export specific data type
  async exportLogs(dateRange = null) {
    try {
      const StudyGraphDB = window.StudyGraphDB // Declare StudyGraphDB
      const StudyGraphUtils = window.StudyGraphUtils // Declare StudyGraphUtils

      let logs
      if (dateRange) {
        logs = await StudyGraphDB.getLogsByDateRange(dateRange.from, dateRange.to)
      } else {
        logs = await StudyGraphDB.getLogs()
      }

      const books = await StudyGraphDB.getBooks()
      const booksMap = books.reduce((map, book) => {
        map[book.id] = book
        return map
      }, {})

      // Create CSV data
      const csvHeaders = [
        "日時",
        "参考書",
        "科目",
        "開始ページ",
        "終了ページ",
        "ページ数",
        "問題数",
        "学習時間（分）",
        "メモ",
      ]

      const csvRows = logs.map((log) => {
        const book = booksMap[log.bookId]
        const pages = (log.toPage || 0) - (log.fromPage || 0)

        return [
          StudyGraphUtils.formatDate(new Date(log.datetime), "YYYY-MM-DD HH:mm"),
          book ? book.title : "不明",
          book ? book.subject : "",
          log.fromPage || "",
          log.toPage || "",
          pages > 0 ? pages : "",
          log.questions || "",
          log.minutes || "",
          log.memo || "",
        ]
      })

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `studygraph-logs-${StudyGraphUtils.formatDate(new Date(), "YYYY-MM-DD")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      StudyGraphUtils.showToast("学習記録をCSVでエクスポートしました")
    } catch (error) {
      console.error("Logs export failed:", error)
      StudyGraphUtils.showToast("学習記録のエクスポートに失敗しました")
    }
  },
}
