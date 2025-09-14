// Data import functionality
window.StudyGraphImport = {
  // Import data from JSON file
  async importData(file) {
    try {
      window.StudyGraphStore.setLoading(true)

      const text = await file.text()
      const importData = JSON.parse(text)

      // Validate import data
      if (!this.validateImportData(importData)) {
        throw new Error("Invalid import data format")
      }

      // Show import options
      this.showImportOptions(importData)
    } catch (error) {
      console.error("Import failed:", error)
      window.StudyGraphUtils.showToast("インポートファイルの読み込みに失敗しました")
    } finally {
      window.StudyGraphStore.setLoading(false)
    }
  },

  // Validate import data
  validateImportData(data) {
    return (
      data &&
      typeof data === "object" &&
      data.version &&
      Array.isArray(data.books) &&
      Array.isArray(data.plans) &&
      Array.isArray(data.logs)
    )
  },

  // Show import options modal
  showImportOptions(importData) {
    const content = `
      <div class="import-options">
        <h3>インポートオプション</h3>
        <p>インポートするデータ: ${importData.books.length}冊の参考書、${importData.logs.length}件の学習記録</p>
        
        <div class="form-field">
          <label>
            <input type="radio" name="import-mode" value="merge" checked>
            マージ（既存データと統合）
          </label>
        </div>
        
        <div class="form-field">
          <label>
            <input type="radio" name="import-mode" value="overwrite">
            上書き（既存データを削除して置換）
          </label>
        </div>
        
        <div class="import-actions">
          <button id="confirm-import" class="button button--primary">インポート実行</button>
          <button id="cancel-import" class="button button--ghost">キャンセル</button>
        </div>
      </div>
    `

    window.StudyGraphUtils.showModal("データインポート", content)

    // Event listeners
    document.getElementById("confirm-import").addEventListener("click", () => {
      const mode = document.querySelector('input[name="import-mode"]:checked').value
      this.executeImport(importData, mode)
    })

    document.getElementById("cancel-import").addEventListener("click", () => {
      window.StudyGraphUtils.hideModal()
    })
  },

  // Execute import
  async executeImport(importData, mode) {
    try {
      window.StudyGraphStore.setLoading(true)

      if (mode === "overwrite") {
        // Clear existing data
        await window.StudyGraphDB.clearAllData()
      }

      // Import images first
      const imageIdMap = {}
      if (importData.images && importData.images.length > 0) {
        for (const imageData of importData.images) {
          try {
            // Convert base64 to blob
            const response = await fetch(imageData.data)
            const blob = await response.blob()

            const newImageId = await window.StudyGraphDB.addImage({
              blob,
              type: imageData.type,
              width: imageData.width,
              height: imageData.height,
              size: imageData.size,
            })

            imageIdMap[imageData.id] = newImageId
          } catch (error) {
            console.error("Failed to import image:", error)
          }
        }
      }

      // Import books
      for (const book of importData.books) {
        // Update image references
        if (book.coverImageId && imageIdMap[book.coverImageId]) {
          book.coverImageId = imageIdMap[book.coverImageId]
        }

        if (mode === "merge") {
          // Check if book already exists
          const existingBook = window.StudyGraphStore.state.books.find((b) => b.title === book.title)
          if (!existingBook) {
            await window.StudyGraphDB.addBook(book)
          }
        } else {
          await window.StudyGraphDB.addBook(book)
        }
      }

      // Import plans
      for (const plan of importData.plans) {
        if (mode === "merge") {
          const existingPlan = window.StudyGraphStore.state.plansByDate[plan.date]
          if (!existingPlan) {
            await window.StudyGraphDB.updatePlan(plan)
          }
        } else {
          await window.StudyGraphDB.updatePlan(plan)
        }
      }

      // Import logs
      for (const log of importData.logs) {
        // Update photo references
        if (log.photoId && imageIdMap[log.photoId]) {
          log.photoId = imageIdMap[log.photoId]
        }

        if (mode === "merge") {
          // Always add logs in merge mode (no duplicate check for logs)
          await window.StudyGraphDB.addLog(log)
        } else {
          await window.StudyGraphDB.addLog(log)
        }
      }

      // Import preferences
      if (importData.prefs) {
        window.StudyGraphStore.updatePrefs(importData.prefs)
      }

      // Reload data
      await window.StudyGraphStore.loadBooks()
      await window.StudyGraphStore.loadPlans()
      await window.StudyGraphStore.loadLogs()

      window.StudyGraphUtils.hideModal()
      window.StudyGraphUtils.showToast("データのインポートが完了しました")

      // Refresh current view
      const currentRoute = window.StudyGraphRouter.currentRoute
      window.StudyGraphRouter.initializeRoute(currentRoute)
    } catch (error) {
      console.error("Import execution failed:", error)
      window.StudyGraphUtils.showToast("インポートの実行に失敗しました")
    } finally {
      window.StudyGraphStore.setLoading(false)
    }
  },
}
