console.log("📦 Loading AIChatManager module...");

class AIChatManager {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.isOpen = false;
    this.currentPlan = null;
    this.messageId = 0;

    // Debug dependency injection
    console.log(
      "🤖 AIChatManager initializing with dependencies:",
      Object.keys(dependencies)
    );
    if (dependencies.taskManager) {
      console.log("✅ TaskManager dependency available");
      console.log(
        "TaskManager methods:",
        Object.getOwnPropertyNames(
          Object.getPrototypeOf(dependencies.taskManager)
        )
      );
      console.log(
        "TaskManager refreshTasks method:",
        typeof dependencies.taskManager.refreshTasks
      );
    } else {
      console.warn("⚠️ TaskManager dependency not found");
    }

    if (dependencies.apiManager) {
      console.log("✅ APIManager dependency available");
      console.log(
        "APIManager methods:",
        Object.getOwnPropertyNames(
          Object.getPrototypeOf(dependencies.apiManager)
        )
      );
    } else {
      console.warn("⚠️ APIManager dependency not found");
    }

    this.initializeElements();
    this.setupEventListeners();

    console.log("🤖 AIChatManager initialized");
  }

  initializeElements() {
    this.panel = document.getElementById("ai-chat-panel");
    this.messagesContainer = document.getElementById("ai-chat-messages");
    this.inputField = document.getElementById("ai-chat-input");
    this.sendButton = document.getElementById("ai-send-btn");
    this.charCount = document.getElementById("char-count");
    this.planPreview = document.getElementById("ai-plan-preview");
    this.previewContent = document.getElementById("preview-content");
    this.confirmButton = document.getElementById("confirm-plan-btn");
    this.statusElement = document.getElementById("ai-status");
  }

  setupEventListeners() {
    // Input field events
    this.inputField.addEventListener("input", () => this.updateCharCount());
    this.inputField.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // Send button
    this.sendButton.addEventListener("click", () => this.sendMessage());

    // Auto-resize textarea
    this.inputField.addEventListener("input", () => this.autoResizeTextarea());
  }

  updateCharCount() {
    if (!this.inputField || !this.charCount) return;

    const length = this.inputField.value.length;
    this.charCount.textContent = `${length}/2000`;

    if (length > 1800) {
      this.charCount.style.color = "#ef4444";
    } else if (length > 1500) {
      this.charCount.style.color = "#f59e0b";
    } else {
      this.charCount.style.color = "var(--text-muted)";
    }
  }

  autoResizeTextarea() {
    this.inputField.style.height = "auto";
    this.inputField.style.height =
      Math.min(this.inputField.scrollHeight, 120) + "px";
  }

  handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  open() {
    this.isOpen = true;
    this.panel.classList.add("active");
    this.inputField.focus();
    this.updateStatus("Ready to help");
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove("active");
  }

  updateStatus(status) {
    this.statusElement.textContent = status;
  }

  addMessage(content, isUser = false, isLoading = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "user-message" : "ai-message";
    if (isLoading) messageDiv.classList.add("loading");

    const avatar = isUser ? "👤" : "🤖";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-text">${content}</div>
        <div class="message-time">${time}</div>
      </div>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    return messageDiv;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;

    // Disable input while processing
    this.setInputState(false);
    this.updateStatus("Processing...");

    // Add user message
    this.addMessage(message, true);

    // Clear input
    this.inputField.value = "";
    this.updateCharCount();
    this.autoResizeTextarea();

    // Add loading AI message
    const loadingMessage = this.addMessage(
      "Analyzing your plan and generating tasks...",
      false,
      true
    );

    try {
      // Call AI API
      const response = await fetch("php/api/ai/generate_task_plan.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify({
          user_plan: message,
        }),
      });

      const result = await response.json();

      // Remove loading message
      loadingMessage.remove();

      if (result.success) {
        // Store the plan for confirmation
        this.currentPlan = result.data;
        console.log("💾 Current plan stored:", this.currentPlan);
        console.log("📋 Plan details:", {
          project: result.data.ai_plan.project,
          tasks: result.data.ai_plan.tasks,
          workspace_id: result.data.ai_plan.project.workspace_id,
          final_workspace_id: result.data.workspace_id,
        });

        // Debug current workspace
        if (this.dependencies.apiManager) {
          console.log(
            "Current workspace ID:",
            this.dependencies.apiManager.getCurrentWorkspaceId()
          );
        }

        // Add AI response
        this.addMessage(
          "Great! I've analyzed your plan and created a structured project with tasks. Please review the preview below and confirm if you'd like me to add these to your Kanban board."
        );

        // Show plan preview
        this.showPlanPreview(result.data.ai_plan);
        this.updateStatus("Plan ready for review");
      } else {
        this.addMessage(
          `I apologize, but I encountered an error: ${result.message}. Please try rephrasing your plan or check if the AI service is available.`
        );
        this.updateStatus("Error occurred");
      }
    } catch (error) {
      loadingMessage.remove();
      this.addMessage(
        "I'm sorry, but I'm having trouble connecting to the AI service right now. Please try again in a moment."
      );
      this.updateStatus("Connection error");
      console.error("AI Chat error:", error);
    } finally {
      this.setInputState(true);
    }
  }

  setInputState(enabled) {
    this.inputField.disabled = !enabled;
    this.sendButton.disabled = !enabled;

    if (enabled) {
      this.inputField.focus();
    }
  }

  showPlanPreview(aiPlan) {
    const project = aiPlan.project;
    const tasks = aiPlan.tasks;

    let previewHTML = `
      <div class="preview-project">
        <h5>${project.name}</h5>
        <p>${project.description}</p>
        <small>Workspace: ${this.getWorkspaceName(project.workspace_id)}</small>
      </div>
      <div class="preview-tasks">
        <h6 style="margin-bottom: 12px; color: var(--text-primary);">Tasks (${
          tasks.length
        }):</h6>
    `;

    tasks.forEach((task) => {
      previewHTML += `
        <div class="preview-task">
          <div class="task-priority ${task.priority}"></div>
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>
            ${
              task.due_date
                ? `<small style="color: var(--text-muted);">Due: ${task.due_date}</small>`
                : ""
            }
          </div>
        </div>
      `;
    });

    previewHTML += "</div>";

    this.previewContent.innerHTML = previewHTML;
    this.planPreview.style.display = "block";
  }

  getWorkspaceName(workspaceId) {
    const workspaceNames = {
      1: "👤 Personal Workspace",
      2: "💼 Work Workspace",
      3: "🎨 Creative Projects",
    };
    return workspaceNames[workspaceId] || "Unknown Workspace";
  }

  closePlanPreview() {
    this.planPreview.style.display = "none";
    this.currentPlan = null;
  }

  editPlan() {
    console.log("✏️ editPlan method called");
    console.log("Current plan:", this.currentPlan);

    if (this.currentPlan) {
      // Pre-fill input with a suggestion to modify the plan
      this.inputField.value = "Please modify my previous plan: ";
      this.inputField.focus();
      this.inputField.setSelectionRange(
        this.inputField.value.length,
        this.inputField.value.length
      );
      this.closePlanPreview();
      console.log("✅ Edit plan action completed");
    } else {
      console.log("❌ No current plan available for editing");
      // Still close the preview and focus on input
      this.inputField.value = "Please describe your plan: ";
      this.inputField.focus();
      this.closePlanPreview();
    }
  }

  async confirmPlan() {
    console.log("🚀 confirmPlan method called!");

    if (!this.currentPlan) {
      console.log("❌ No current plan found!");
      return;
    }

    this.confirmButton.disabled = true;
    this.confirmButton.innerHTML =
      '<span class="btn-icon">⏳</span>Processing...';
    this.updateStatus("Creating tasks...");

    try {
      // Close preview
      this.closePlanPreview();
      this.updateStatus("Tasks created successfully");

      // Show success notification
      if (typeof showSuccessMessage === "function") {
        showSuccessMessage(
          "✅ AI Plan Confirmed! Your tasks have been created successfully. The page will refresh to show your new tasks.",
          "AI Plan Confirmed"
        );
      } else {
        this.showNotification(
          "✅ Tasks created successfully! The page will refresh to show your new tasks.",
          "success"
        );
      }

      // Add message to chat
      this.addMessage(
        "🎉 Perfect! Your AI-generated tasks have been successfully created and added to your Kanban board. The page will refresh in a moment to show your new tasks."
      );

      // Hard refresh the page after a short delay
      setTimeout(() => {
        console.log("🔄 Hard refreshing page to show new tasks...");
        window.location.reload();
      }, 2000);

      console.log("🎯 AI Plan confirmed successfully - page will refresh");
    } catch (error) {
      this.addMessage(
        "I apologize, but there was an error creating your tasks. Please try again."
      );
      console.error("Error confirming plan:", error);
      this.updateStatus("Error creating tasks");
    } finally {
      this.confirmButton.disabled = false;
      this.confirmButton.innerHTML =
        '<span class="btn-icon">✅</span>Confirm & Create Tasks';
    }
  }

  showNotification(message, type = "info") {
    // Use the existing notification system if available
    if (
      this.dependencies.uiManager &&
      this.dependencies.uiManager.showNotification
    ) {
      this.dependencies.uiManager.showNotification(message, type);
    } else {
      // Fallback notification
      console.log(`Notification (${type}): ${message}`);
    }
  }

  insertQuickText(type) {
    const quickTexts = {
      study: "I need to study ",
      workout: "I want to workout ",
      work: "I need to work on ",
    };

    const currentValue = this.inputField.value;
    const quickText = quickTexts[type] || "";

    if (currentValue && !currentValue.endsWith(" ")) {
      this.inputField.value = currentValue + ". " + quickText;
    } else {
      this.inputField.value = currentValue + quickText;
    }

    this.inputField.focus();
    this.updateCharCount();
    this.autoResizeTextarea();
  }
}

// Global functions for HTML onclick handlers
window.openAIChat = function () {
  if (window.aiChatManager) {
    window.aiChatManager.open();
  }
};

window.closeAIChat = function () {
  if (window.aiChatManager) {
    window.aiChatManager.close();
  }
};

window.sendMessage = function () {
  if (window.aiChatManager) {
    window.aiChatManager.sendMessage();
  }
};

window.closePlanPreview = function () {
  if (window.aiChatManager) {
    window.aiChatManager.closePlanPreview();
  }
};

window.editPlan = function () {
  console.log("🔘 Edit Plan button clicked!");
  console.log("aiChatManager available:", !!window.aiChatManager);
  console.log("aiChatManager type:", typeof window.aiChatManager);
  console.log(
    "aiChatManager methods:",
    Object.keys(window.aiChatManager || {})
  );

  if (
    window.aiChatManager &&
    typeof window.aiChatManager.editPlan === "function"
  ) {
    console.log("✅ aiChatManager found, calling editPlan...");
    window.aiChatManager.editPlan();
  } else {
    console.error("❌ aiChatManager not found or editPlan method missing!");
    console.log(
      "Available methods:",
      Object.getOwnPropertyNames(window.aiChatManager || {})
    );
  }
};

window.confirmPlan = function () {
  console.log("🔘 Confirm Plan button clicked!");
  if (window.aiChatManager) {
    console.log("✅ aiChatManager found, calling confirmPlan...");
    window.aiChatManager.confirmPlan();
  } else {
    console.error("❌ aiChatManager not found!");
  }
};

window.insertQuickText = function (type) {
  if (window.aiChatManager) {
    window.aiChatManager.insertQuickText(type);
  }
};

// Expose class to global scope for module factory
window.AIChatManager = AIChatManager;

console.log("✅ AIChatManager module loaded successfully");
