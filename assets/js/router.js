// Router for SPA navigation
window.StudyGraphRouter = {
  routes: {
    "#/dashboard": "view-dashboard",
    "#/planner": "view-planner",
    "#/logs": "view-logs",
    "#/library": "view-library",
    "#/analytics": "view-analytics",
    "#/settings": "view-settings",
  },

  currentRoute: "#/dashboard",

  init() {
    // Handle initial route
    this.handleRoute()

    // Listen for hash changes
    window.addEventListener("hashchange", () => this.handleRoute())

    // Listen for navigation clicks
    document.addEventListener("click", (e) => {
      const navTab = e.target.closest(".nav-tab")
      if (navTab) {
        const route = navTab.dataset.route
        if (route) {
          this.navigate(route)
        }
      }
    })
  },

  handleRoute() {
    const hash = window.location.hash || "#/dashboard"
    this.navigate(hash, false)
  },

  navigate(route, updateHistory = true) {
    if (!this.routes[route]) {
      route = "#/dashboard"
    }

    // Update history if needed
    if (updateHistory && window.location.hash !== route) {
      window.location.hash = route
      return
    }

    // Hide all views
    Object.values(this.routes).forEach((viewId) => {
      const view = document.getElementById(viewId)
      if (view) {
        view.classList.add("view--hidden")
      }
    })

    // Show current view
    const currentViewId = this.routes[route]
    const currentView = document.getElementById(currentViewId)
    if (currentView) {
      currentView.classList.remove("view--hidden")
    }

    // Update navigation tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active")
      if (tab.dataset.route === route) {
        tab.classList.add("active")
      }
    })

    // Update store
    this.currentRoute = route
    window.StudyGraphStore.setRoute(route)

    // Trigger route-specific initialization
    this.initializeRoute(route)
  },

  initializeRoute(route) {
    const StudyGraphUI = window.StudyGraphUI // Declare StudyGraphUI variable
    switch (route) {
      case "#/dashboard":
        StudyGraphUI.initDashboard()
        break
      case "#/planner":
        StudyGraphUI.initPlanner()
        break
      case "#/logs":
        StudyGraphUI.initLogs()
        break
      case "#/library":
        StudyGraphUI.initLibrary()
        break
      case "#/analytics":
        StudyGraphUI.initAnalytics()
        break
      case "#/settings":
        StudyGraphUI.initSettings()
        break
    }
  },
}

// Declare StudyGraphStore variable
window.StudyGraphStore = {
  setRoute(route) {
    // Implementation for setting route in store
    console.log(`Route set to: ${route}`)
  },
}

// Declare StudyGraphUI variable
window.StudyGraphUI = {
  initDashboard() {
    // Implementation for initializing dashboard
    console.log("Initializing Dashboard")
  },
  initPlanner() {
    // Implementation for initializing planner
    console.log("Initializing Planner")
  },
  initLogs() {
    // Implementation for initializing logs
    console.log("Initializing Logs")
  },
  initLibrary() {
    // Implementation for initializing library
    console.log("Initializing Library")
  },
  initAnalytics() {
    // Implementation for initializing analytics
    console.log("Initializing Analytics")
  },
  initSettings() {
    // Implementation for initializing settings
    console.log("Initializing Settings")
  },
}
