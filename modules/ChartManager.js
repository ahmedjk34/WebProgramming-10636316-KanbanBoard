console.log("📈 Loading ChartManager module...");

class ChartManager {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.charts = new Map();
    this.defaultColors = {
      primary: '#3498db',
      success: '#27ae60',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#17a2b8',
      purple: '#9b59b6',
      teal: '#1abc9c'
    };

    console.log("📈 ChartManager initialized");
  }

  /**
   * Create activity trend chart
   */
  createActivityChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element ${canvasId} not found`);
      return null;
    }

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const dailyActivity = data.daily_activity || [];
    
    // Prepare data for the last 30 days
    const labels = [];
    const createdData = [];
    const completedData = [];
    
    // Fill in missing days with zero values
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const dayData = dailyActivity.find(d => d.date === dateStr);
      createdData.push(dayData ? parseInt(dayData.tasks_created) : 0);
      completedData.push(dayData ? parseInt(dayData.tasks_completed) : 0);
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Tasks Created',
            data: createdData,
            borderColor: this.defaultColors.primary,
            backgroundColor: this.defaultColors.primary + '20',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Tasks Completed',
            data: completedData,
            borderColor: this.defaultColors.success,
            backgroundColor: this.defaultColors.success + '20',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Daily Task Activity'
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Create completion rate chart
   */
  createCompletionChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element ${canvasId} not found`);
      return null;
    }

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const projects = data.projects || [];
    
    const labels = projects.map(p => p.name);
    const completionRates = projects.map(p => p.completion_percentage || 0);
    const colors = projects.map(p => p.color || this.defaultColors.primary);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Completion Rate (%)',
          data: completionRates,
          backgroundColor: colors.map(color => color + '80'),
          borderColor: colors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Project Completion Rates'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Create priority distribution chart
   */
  createPriorityChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas element ${canvasId} not found`);
      return null;
    }

    // Destroy existing chart if it exists
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
    }

    const priorityData = data.priority_distribution || [];
    
    const labels = priorityData.map(p => p.priority.charAt(0).toUpperCase() + p.priority.slice(1));
    const counts = priorityData.map(p => p.count);
    const colors = priorityData.map(p => {
      switch(p.priority) {
        case 'high': return this.defaultColors.danger;
        case 'medium': return this.defaultColors.warning;
        case 'low': return this.defaultColors.success;
        default: return this.defaultColors.info;
      }
    });

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors.map(color => color + '80'),
          borderColor: colors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Task Priority Distribution'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Create productivity heatmap
   */
  createProductivityHeatmap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element ${containerId} not found`);
      return;
    }

    const productivityData = data.productivity_by_day || [];
    
    // Days of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Hours of the day (simplified to 4 time periods)
    const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
    
    // Create heatmap grid
    let heatmapHTML = '<div class="heatmap-grid">';
    
    // Header row
    heatmapHTML += '<div class="heatmap-row header">';
    heatmapHTML += '<div class="heatmap-cell header"></div>';
    timeSlots.forEach(slot => {
      heatmapHTML += `<div class="heatmap-cell header">${slot}</div>`;
    });
    heatmapHTML += '</div>';
    
    // Data rows
    days.forEach((day, dayIndex) => {
      heatmapHTML += '<div class="heatmap-row">';
      heatmapHTML += `<div class="heatmap-cell day-label">${day}</div>`;
      
      timeSlots.forEach((slot, slotIndex) => {
        // Find productivity data for this day
        const dayData = productivityData.find(d => d.day_number === (dayIndex + 1));
        const activity = dayData ? parseInt(dayData.tasks_created) + parseInt(dayData.tasks_completed) : 0;
        
        // Calculate intensity (simplified)
        const intensity = Math.min(activity / 5, 1); // Normalize to 0-1
        const intensityClass = intensity > 0.7 ? 'high' : intensity > 0.3 ? 'medium' : 'low';
        
        heatmapHTML += `<div class="heatmap-cell activity ${intensityClass}" 
                        data-day="${day}" data-slot="${slot}" data-activity="${activity}"
                        title="${day} ${slot}: ${activity} activities">
                        </div>`;
      });
      
      heatmapHTML += '</div>';
    });
    
    heatmapHTML += '</div>';
    
    container.innerHTML = heatmapHTML;
  }

  /**
   * Update chart with new data
   */
  updateChart(canvasId, newData) {
    const chart = this.charts.get(canvasId);
    if (!chart) {
      console.warn(`Chart ${canvasId} not found for update`);
      return;
    }

    // Update chart data based on chart type
    if (chart.config.type === 'line') {
      // Update activity chart
      this.updateActivityChart(chart, newData);
    } else if (chart.config.type === 'bar') {
      // Update completion chart
      this.updateCompletionChart(chart, newData);
    } else if (chart.config.type === 'doughnut') {
      // Update priority chart
      this.updatePriorityChart(chart, newData);
    }

    chart.update();
  }

  /**
   * Update activity chart data
   */
  updateActivityChart(chart, data) {
    const dailyActivity = data.daily_activity || [];
    
    // Update data for the last 30 days
    const today = new Date();
    const createdData = [];
    const completedData = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyActivity.find(d => d.date === dateStr);
      createdData.push(dayData ? parseInt(dayData.tasks_created) : 0);
      completedData.push(dayData ? parseInt(dayData.tasks_completed) : 0);
    }

    chart.data.datasets[0].data = createdData;
    chart.data.datasets[1].data = completedData;
  }

  /**
   * Update completion chart data
   */
  updateCompletionChart(chart, data) {
    const projects = data.projects || [];
    
    chart.data.labels = projects.map(p => p.name);
    chart.data.datasets[0].data = projects.map(p => p.completion_percentage || 0);
    chart.data.datasets[0].backgroundColor = projects.map(p => (p.color || this.defaultColors.primary) + '80');
    chart.data.datasets[0].borderColor = projects.map(p => p.color || this.defaultColors.primary);
  }

  /**
   * Update priority chart data
   */
  updatePriorityChart(chart, data) {
    const priorityData = data.priority_distribution || [];
    
    chart.data.labels = priorityData.map(p => p.priority.charAt(0).toUpperCase() + p.priority.slice(1));
    chart.data.datasets[0].data = priorityData.map(p => p.count);
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    this.charts.forEach((chart, canvasId) => {
      chart.destroy();
      console.log(`📈 Chart ${canvasId} destroyed`);
    });
    this.charts.clear();
  }

  /**
   * Destroy specific chart
   */
  destroyChart(canvasId) {
    const chart = this.charts.get(canvasId);
    if (chart) {
      chart.destroy();
      this.charts.delete(canvasId);
      console.log(`📈 Chart ${canvasId} destroyed`);
    }
  }

  /**
   * Get chart instance
   */
  getChart(canvasId) {
    return this.charts.get(canvasId);
  }

  /**
   * Check if Chart.js is available
   */
  isChartJSAvailable() {
    return typeof Chart !== 'undefined';
  }
}

// Make ChartManager available globally
window.ChartManager = ChartManager;

console.log("✅ ChartManager module loaded successfully");
