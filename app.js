(function () {
  "use strict";
  const STORAGE_KEY = "hallCleaningState";
  const SCHEMA_VERSION = 1;
  const CHECKLISTS = {
    afterMeeting: {
      id: "afterMeeting",
      title: "After Meeting Clean",
      sections: [{
        id: "after-meeting-tasks",
        title: "Cleaning Tasks",
        tasks: [
          { id: "am-empty-bathroom-trash", text: "Empty bathroom trash receptacles and take trash home for disposal." },
          { id: "am-inspect-bathrooms", text: "Inspect bathrooms and address any issues as needed." },
          { id: "am-vacuum-high-traffic", text: "Vacuum high-traffic carpet areas." },
          { id: "am-disinfect-counters", text: "Disinfect all counters." },
          { id: "am-clean-platform", text: "Dust/disinfect platform table, chairs, and lectern." },
          { id: "am-refill-spray-bottles", text: "Refill red and green spray bottles as needed; contact Cleaning Captain for instructions if necessary." },
          { id: "am-report-supplies", text: "Report other supplies that are running low to the Cleaning Captain." }
        ]
      }]
    }
  };
  const DEFAULT_STATE = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    completedTaskIds: { afterMeeting: [], deepCleaning: [] },
    schedule: [null, null, null, null],
    theme: "green"
  });
  const createDefaultState = () => JSON.parse(JSON.stringify(DEFAULT_STATE));
  const isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || stored.schemaVersion !== SCHEMA_VERSION) return createDefaultState();
      const ids = stored.completedTaskIds || {};
      return {
        schemaVersion: SCHEMA_VERSION,
        completedTaskIds: {
          afterMeeting: isStringArray(ids.afterMeeting) ? ids.afterMeeting : [],
          deepCleaning: isStringArray(ids.deepCleaning) ? ids.deepCleaning : []
        },
        schedule: Array.isArray(stored.schedule) && stored.schedule.length === 4 ? stored.schedule : DEFAULT_STATE.schedule,
        theme: typeof stored.theme === "string" ? stored.theme : DEFAULT_STATE.theme
      };
    } catch (error) {
      console.warn("Saved Hall Cleaning state could not be read. Defaults were restored.", error);
      return createDefaultState();
    }
  }

  const state = loadState();
  let activeChecklistId = null;
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn("Hall Cleaning state could not be saved.", error); }
  }
  saveState();

  const tabs = Array.from(document.querySelectorAll("[data-view]"));
  const primaryViews = Array.from(document.querySelectorAll("#cleaning-view, #schedule-view"));
  const checklistView = document.querySelector("#checklist-view");
  const checklistTitle = document.querySelector("#checklist-title");
  const checklistProgress = document.querySelector("#checklist-progress");
  const progressTrack = document.querySelector(".progress-track");
  const progressFill = document.querySelector("#progress-fill");
  const sectionsContainer = document.querySelector("#checklist-sections");
  const resetButton = document.querySelector("#reset-checklist");
  const choiceMessage = document.querySelector("#choice-message");

  function showPrimaryView(viewName) {
    activeChecklistId = null;
    checklistView.hidden = true;
    tabs.forEach((tab) => {
      const active = tab.dataset.view === viewName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    primaryViews.forEach((view) => { view.hidden = view.id !== `${viewName}-view`; });
  }

  const getAllTasks = (checklist) => checklist.sections.flatMap((section) => section.tasks);
  function updateProgress() {
    const checklist = CHECKLISTS[activeChecklistId];
    if (!checklist) return;
    const tasks = getAllTasks(checklist);
    const validIds = new Set(tasks.map((task) => task.id));
    const completed = state.completedTaskIds[activeChecklistId].filter((id) => validIds.has(id)).length;
    checklistProgress.textContent = `${completed} of ${tasks.length} completed`;
    progressTrack.setAttribute("aria-valuemax", String(tasks.length));
    progressTrack.setAttribute("aria-valuenow", String(completed));
    progressFill.style.width = `${tasks.length ? (completed / tasks.length) * 100 : 0}%`;
    resetButton.disabled = completed === 0;
  }

  function renderChecklist(checklistId) {
    const checklist = CHECKLISTS[checklistId];
    if (!checklist) return;
    activeChecklistId = checklistId;
    primaryViews.forEach((view) => { view.hidden = true; });
    checklistView.hidden = false;
    checklistTitle.textContent = checklist.title;
    sectionsContainer.replaceChildren();
    checklist.sections.forEach((section) => {
      const sectionElement = document.createElement("section");
      sectionElement.className = "checklist-section";
      const heading = document.createElement("h3");
      heading.textContent = section.title;
      const taskList = document.createElement("div");
      taskList.className = "task-list";
      section.tasks.forEach((task) => {
        const wrapper = document.createElement("div");
        wrapper.className = "task-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = task.id;
        checkbox.checked = state.completedTaskIds[checklistId].includes(task.id);
        const label = document.createElement("label");
        label.className = "task-label";
        label.htmlFor = task.id;
        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;
        label.append(text);
        checkbox.addEventListener("change", () => {
          const completed = new Set(state.completedTaskIds[checklistId]);
          checkbox.checked ? completed.add(task.id) : completed.delete(task.id);
          state.completedTaskIds[checklistId] = Array.from(completed);
          saveState();
          updateProgress();
        });
        wrapper.append(checkbox, label);
        taskList.append(wrapper);
      });
      sectionElement.append(heading, taskList);
      sectionsContainer.append(sectionElement);
    });
    updateProgress();
    document.querySelector("#back-to-cleaning").focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showPrimaryView(tab.dataset.view));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + direction + tabs.length) % tabs.length];
      showPrimaryView(next.dataset.view);
      next.focus();
    });
  });
  document.querySelector('[data-cleaning-type="after-meeting"]').addEventListener("click", () => renderChecklist("afterMeeting"));
  document.querySelector('[data-cleaning-type="deep-cleaning"]').addEventListener("click", () => { choiceMessage.textContent = "Deep Cleaning will be added in the next development increment."; });
  document.querySelector("#back-to-cleaning").addEventListener("click", () => showPrimaryView("cleaning"));
  resetButton.addEventListener("click", () => {
    if (!activeChecklistId || !window.confirm("Reset every completed task in this checklist?")) return;
    state.completedTaskIds[activeChecklistId] = [];
    saveState();
    renderChecklist(activeChecklistId);
  });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch((error) => console.warn("Offline support could not be started.", error)));
})();
