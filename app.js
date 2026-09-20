(function () {
  "use strict";
  const STORAGE_KEY = "hallCleaningState";
  const SCHEMA_VERSION = 1;
  const VALID_THEMES = ["green", "blue", "orange", "dark"];
  const THEME_COLORS = { green: "#2f6b4f", blue: "#356b9a", orange: "#984b1b", dark: "#1d4b35" };
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
    },
    deepCleaning: {
      id: "deepCleaning",
      title: "Deep Cleaning",
      sections: [
        {
          id: "deep-main-hall",
          title: "Main Hall",
          tasks: [
            { id: "dc-main-disinfect-counters", text: "Disinfect all counters." },
            { id: "dc-main-clean-platform", text: "Dust/disinfect platform table, chairs, and lectern." },
            { id: "dc-main-inspect-seats", text: "Inspect seats and clean as needed." },
            { id: "dc-main-clean-armrests", text: "Clean armrests." },
            { id: "dc-main-vacuum-carpets", text: "Thoroughly vacuum all carpets." },
            { id: "dc-main-check-vacuums", text: "Check vacuums after use and empty as needed." },
            { id: "dc-main-sweep-mop-tile", text: "Sweep and mop tile floors." }
          ]
        },
        {
          id: "deep-second-school",
          title: "Second School",
          tasks: [
            { id: "dc-school-clean-window", text: "Clean front and back of Second School window." },
            { id: "dc-school-dust-blinds", text: "Dust Second School blinds." }
          ]
        },
        {
          id: "deep-bathrooms",
          title: "Bathrooms",
          tasks: [
            { id: "dc-bath-clean-mirrors", text: "Clean bathroom mirrors." },
            { id: "dc-bath-clean-sinks", text: "Clean bathroom sinks." },
            { id: "dc-bath-clean-toilets", text: "Clean toilets and urinals." },
            { id: "dc-bath-clean-splash-guards", text: "Clean stainless-steel splash guards on doors and walls." },
            { id: "dc-bath-inspect-other", text: "Inspect other bathroom areas and clean as needed." }
          ]
        },
        {
          id: "deep-cleaning-storage",
          title: "Cleaning & Storage",
          tasks: [
            { id: "dc-storage-inspect", text: "Inspect storage areas and address any issues as needed." },
            { id: "dc-storage-empty-trash", text: "Empty all trash receptacles and take trash home for disposal." },
            { id: "dc-storage-wash-cloths", text: "Take all cloths and mop heads in the dirty bin home, wash them, and return them to the Hall." },
            { id: "dc-storage-refill-bottles", text: "Refill red and green spray bottles as needed; contact Cleaning Captain for instructions if necessary." },
            { id: "dc-storage-report-supplies", text: "Report other supplies that are running low to the Cleaning Captain." }
          ]
        }
      ]
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
  const createEmptyScheduleEntry = () => ({ date: "", cleaningType: "afterMeeting", note: "" });
  function normalizeSchedule(schedule) {
    if (!Array.isArray(schedule) || schedule.length !== 4) return Array.from({ length: 4 }, createEmptyScheduleEntry);
    return schedule.map((entry) => {
      if (!entry || typeof entry !== "object") return createEmptyScheduleEntry();
      return {
        date: typeof entry.date === "string" ? entry.date : "",
        cleaningType: entry.cleaningType === "deepCleaning" ? "deepCleaning" : "afterMeeting",
        note: typeof entry.note === "string" ? entry.note : ""
      };
    });
  }

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
        schedule: normalizeSchedule(stored.schedule),
        theme: VALID_THEMES.includes(stored.theme) ? stored.theme : DEFAULT_STATE.theme
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
  document.documentElement.dataset.theme = state.theme;
  document.querySelector('meta[name="theme-color"]').content = THEME_COLORS[state.theme];

  const tabs = Array.from(document.querySelectorAll("[data-view]"));
  const primaryViews = Array.from(document.querySelectorAll("#cleaning-view, #schedule-view"));
  const checklistView = document.querySelector("#checklist-view");
  const guideView = document.querySelector("#guide-view");
  const checklistTitle = document.querySelector("#checklist-title");
  const checklistProgress = document.querySelector("#checklist-progress");
  const progressTrack = document.querySelector(".progress-track");
  const progressFill = document.querySelector("#progress-fill");
  const sectionsContainer = document.querySelector("#checklist-sections");
  const resetButton = document.querySelector("#reset-checklist");
  const choiceMessage = document.querySelector("#choice-message");
  const scheduleEntries = document.querySelector("#schedule-entries");
  const appearanceButton = document.querySelector("#appearance-button");
  const appearanceDialog = document.querySelector("#appearance-dialog");
  const themeOptions = Array.from(document.querySelectorAll("[data-theme-choice]"));
  let guideReturn = { type: "primary", id: "cleaning" };

  function showPrimaryView(viewName) {
    activeChecklistId = null;
    checklistView.hidden = true;
    guideView.hidden = true;
    tabs.forEach((tab) => {
      const active = tab.dataset.view === viewName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    primaryViews.forEach((view) => { view.hidden = view.id !== `${viewName}-view`; });
    if (viewName === "schedule") renderSchedule();
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
    guideView.hidden = true;
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

  function showGuide() {
    guideReturn = activeChecklistId ? { type: "checklist", id: activeChecklistId } : { type: "primary", id: "cleaning" };
    primaryViews.forEach((view) => { view.hidden = true; });
    checklistView.hidden = true;
    guideView.hidden = false;
    document.querySelector("#back-from-guide").focus();
  }

  function hasScheduleContent(entry) {
    return Boolean(entry.date || entry.note.trim());
  }

  function sortSchedule() {
    state.schedule.sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      if (hasScheduleContent(a) && !hasScheduleContent(b)) return -1;
      if (!hasScheduleContent(a) && hasScheduleContent(b)) return 1;
      return 0;
    });
  }

  function formatScheduleDate(value) {
    if (!value) return "Open assignment";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Date needs correction";
    return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
  }

  function cleaningTypeLabel(value) {
    return value === "deepCleaning" ? "Deep Cleaning" : "After Meeting Clean";
  }

  function renderSchedule() {
    sortSchedule();
    scheduleEntries.replaceChildren();
    state.schedule.forEach((entry, index) => {
      const card = document.createElement("section");
      card.className = "schedule-card";
      const header = document.createElement("div");
      header.className = "schedule-card-header";
      const title = document.createElement("div");
      title.className = "schedule-card-title";
      const heading = document.createElement("h3");
      heading.textContent = formatScheduleDate(entry.date);
      const summary = document.createElement("p");
      summary.textContent = hasScheduleContent(entry) ? cleaningTypeLabel(entry.cleaningType) : `Assignment slot ${index + 1}`;
      title.append(heading, summary);
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "clear-schedule";
      clearButton.textContent = "Clear";
      clearButton.disabled = !hasScheduleContent(entry);
      clearButton.setAttribute("aria-label", `Clear assignment slot ${index + 1}`);
      clearButton.addEventListener("click", () => {
        if (!window.confirm("Clear this cleaning assignment?")) return;
        state.schedule[index] = createEmptyScheduleEntry();
        sortSchedule();
        saveState();
        renderSchedule();
      });
      header.append(title, clearButton);

      const fields = document.createElement("div");
      fields.className = "schedule-fields";
      const fieldDefinitions = [
        { key: "date", label: "Date", type: "date" },
        { key: "cleaningType", label: "Cleaning Type", type: "select" },
        { key: "note", label: "Optional Note", type: "text" }
      ];
      fieldDefinitions.forEach((definition) => {
        const field = document.createElement("div");
        field.className = "field";
        const label = document.createElement("label");
        const inputId = `schedule-${index}-${definition.key}`;
        label.htmlFor = inputId;
        label.textContent = definition.label;
        let control;
        if (definition.type === "select") {
          control = document.createElement("select");
          [{ value: "afterMeeting", text: "After Meeting Clean" }, { value: "deepCleaning", text: "Deep Cleaning" }].forEach((optionData) => {
            const option = document.createElement("option");
            option.value = optionData.value;
            option.textContent = optionData.text;
            control.append(option);
          });
        } else {
          control = document.createElement("input");
          control.type = definition.type;
          if (definition.key === "note") {
            control.maxLength = 100;
            control.placeholder = "Optional details";
          }
        }
        control.id = inputId;
        control.value = entry[definition.key];
        const eventName = definition.key === "note" ? "input" : "change";
        control.addEventListener(eventName, () => {
          entry[definition.key] = control.value;
          if (definition.key === "date") sortSchedule();
          saveState();
          if (definition.key !== "note") {
            renderSchedule();
          } else {
            clearButton.disabled = !hasScheduleContent(entry);
            summary.textContent = hasScheduleContent(entry) ? cleaningTypeLabel(entry.cleaningType) : `Assignment slot ${index + 1}`;
          }
        });
        field.append(label, control);
        fields.append(field);
      });
      const saveNote = document.createElement("p");
      saveNote.className = "save-note";
      saveNote.textContent = "Saved automatically on this device";
      card.append(header, fields, saveNote);
      scheduleEntries.append(card);
    });
  }

  function updateThemeSelection() {
    themeOptions.forEach((option) => option.setAttribute("aria-checked", String(option.dataset.themeChoice === state.theme)));
  }

  function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) return;
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = THEME_COLORS[theme];
    updateThemeSelection();
    saveState();
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
  document.querySelector('[data-cleaning-type="deep-cleaning"]').addEventListener("click", () => renderChecklist("deepCleaning"));
  document.querySelectorAll("[data-open-guide]").forEach((button) => button.addEventListener("click", showGuide));
  document.querySelector("#back-from-guide").addEventListener("click", () => {
    guideReturn.type === "checklist" ? renderChecklist(guideReturn.id) : showPrimaryView(guideReturn.id);
  });
  document.querySelector("#back-to-cleaning").addEventListener("click", () => showPrimaryView("cleaning"));
  appearanceButton.addEventListener("click", () => {
    updateThemeSelection();
    appearanceDialog.showModal();
  });
  document.querySelector("#close-appearance").addEventListener("click", () => appearanceDialog.close());
  themeOptions.forEach((option) => option.addEventListener("click", () => applyTheme(option.dataset.themeChoice)));
  appearanceDialog.addEventListener("click", (event) => {
    if (event.target === appearanceDialog) appearanceDialog.close();
  });
  resetButton.addEventListener("click", () => {
    if (!activeChecklistId || !window.confirm("Reset every completed task in this checklist?")) return;
    state.completedTaskIds[activeChecklistId] = [];
    saveState();
    renderChecklist(activeChecklistId);
  });
  updateThemeSelection();
  renderSchedule();
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch((error) => console.warn("Offline support could not be started.", error)));
})();
