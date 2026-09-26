(function () {
  "use strict";

  const STORAGE_KEY = "tkd_custom_templates_v1";

  const state = {
    customTemplates: loadCustom(),
    selectedTemplateId: null,
    selectedCategories: new Set(),
    editingDraft: null,       // the template object currently open in the editor
    editingIsNew: false
  };

  // ---------- storage ----------
  function loadCustom() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Could not read saved templates:", e);
      return [];
    }
  }
  function saveCustom() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customTemplates));
  }

  function getAllTemplates() {
    return window.BUILT_IN_TEMPLATES.concat(state.customTemplates);
  }
  function findTemplate(id) {
    return getAllTemplates().find((t) => t.id === id) || null;
  }

  function slugify(s) {
    return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "set";
  }
  function uniqueId(base) {
    const existing = getAllTemplates().map((t) => t.id);
    let id = base, n = 2;
    while (existing.includes(id)) { id = `${base}-${n}`; n++; }
    return id;
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- DOM refs ----------
  const el = {
    templateList: document.getElementById("template-list"),
    btnNewTemplate: document.getElementById("btn-new-template"),
    importFile: document.getElementById("import-file"),

    stepGenerate: document.getElementById("step-generate"),
    schoolName: document.getElementById("school-name"),
    categoryChecklist: document.getElementById("category-checklist"),
    btnToggleAll: document.getElementById("btn-toggle-all"),
    btnGenDocx: document.getElementById("btn-gen-docx"),
    btnGenPdf: document.getElementById("btn-gen-pdf"),
    status: document.getElementById("status"),

    editorOverlay: document.getElementById("editor-overlay"),
    editorTitle: document.getElementById("editor-title"),
    editorAssociation: document.getElementById("editor-association"),
    editorSeason: document.getElementById("editor-season"),
    editorDoctitle: document.getElementById("editor-doctitle"),
    editorCategories: document.getElementById("editor-categories"),
    btnAddCategory: document.getElementById("btn-add-category"),
    btnEditorClose: document.getElementById("btn-editor-close"),
    btnEditorCancel: document.getElementById("btn-editor-cancel"),
    btnEditorSave: document.getElementById("btn-editor-save"),
    categoryCardTpl: document.getElementById("tpl-category-card"),

    previewOverlay: document.getElementById("preview-overlay"),
    previewBody: document.getElementById("preview-body"),
    btnPreviewClose: document.getElementById("btn-preview-close"),
    btnPreviewClose2: document.getElementById("btn-preview-close-2"),
    btnPreviewDocx: document.getElementById("btn-preview-docx"),
    btnPreviewPdf: document.getElementById("btn-preview-pdf"),
    btnStepPreview: document.getElementById("btn-step-preview"),

    filenameOverlay: document.getElementById("filename-overlay"),
    filenameInput: document.getElementById("filename-input"),
    btnFilenameClose: document.getElementById("btn-filename-close"),
    btnFilenameCancel: document.getElementById("btn-filename-cancel"),
    btnFilenameOk: document.getElementById("btn-filename-ok")
  };

  // ---------- template list ----------
  function renderTemplateList() {
    const all = getAllTemplates();
    el.templateList.innerHTML = "";

    all.forEach((t) => {
      const card = document.createElement("div");
      card.className = "template-card" + (t.id === state.selectedTemplateId ? " is-active" : "");

      const info = document.createElement("div");
      info.className = "template-card__info";
      info.innerHTML =
        `<div class="template-card__name">${t.builtin ? '<span class="badge">Built-in</span>' : ""}${escapeHtml(t.association)} ${escapeHtml(t.season)}</div>` +
        `<div class="template-card__meta">${t.categories.length} category page${t.categories.length === 1 ? "" : "s"}</div>`;

      const actions = document.createElement("div");
      actions.className = "template-card__actions";

      const useBtn = button("Use", "btn btn--small btn--primary", () => selectTemplate(t.id));
      const dupBtn = button("Duplicate", "btn btn--small btn--ghost", () => duplicateTemplate(t.id));
      const previewBtn = button("Preview", "btn btn--small btn--ghost", () => quickPreview(t.id));

      if (t.builtin) {
        // Built-ins are ready to go immediately — offer preview/download
        // right on the card, no need to step through "Use" first.
        actions.appendChild(previewBtn);
        actions.appendChild(button("Download .docx", "btn btn--small btn--ghost", () => quickDownload(t.id, "docx")));
        actions.appendChild(button("Download .pdf", "btn btn--small btn--ghost", () => quickDownload(t.id, "pdf")));
        actions.appendChild(useBtn);
        actions.appendChild(dupBtn);
      } else {
        actions.appendChild(previewBtn);
        actions.appendChild(useBtn);
        actions.appendChild(dupBtn);
        actions.appendChild(button("Edit", "btn btn--small btn--ghost", () => openEditor(t, false)));
        actions.appendChild(button("Export", "btn btn--small btn--ghost", () => exportTemplate(t.id)));
        actions.appendChild(button("Delete", "btn btn--small btn--ghost", () => deleteTemplate(t.id)));
      }

      card.appendChild(info);
      card.appendChild(actions);
      el.templateList.appendChild(card);
    });
  }

  function button(label, className, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = className;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  function selectTemplate(id) {
    const t = findTemplate(id);
    if (!t) return;
    state.selectedTemplateId = id;
    state.selectedCategories = new Set(t.categories.map((_, i) => i));
    renderTemplateList();
    renderCategoryChecklist();
    el.stepGenerate.hidden = false;
    setStatus("");
    el.stepGenerate.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCategoryChecklist() {
    const t = findTemplate(state.selectedTemplateId);
    el.categoryChecklist.innerHTML = "";
    if (!t) return;

    t.categories.forEach((cat, idx) => {
      const label = document.createElement("label");
      label.className = "category-check";
      const chipClass = /girl/i.test(cat.sex) ? "sex-chip--girls" : "sex-chip--boys";
      label.innerHTML =
        `<input type="checkbox" ${state.selectedCategories.has(idx) ? "checked" : ""}>` +
        `<span class="sex-chip ${chipClass}"></span>` +
        `<span>${escapeHtml(cat.ageGroup)} — ${escapeHtml(cat.sex)} <span style="color:var(--muted)">(${cat.weights.length})</span></span>`;
      const checkbox = label.querySelector("input");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) state.selectedCategories.add(idx);
        else state.selectedCategories.delete(idx);
        updateToggleAllLabel();
      });
      el.categoryChecklist.appendChild(label);
    });
    updateToggleAllLabel();
  }

  function updateToggleAllLabel() {
    const t = findTemplate(state.selectedTemplateId);
    if (!t) return;
    el.btnToggleAll.textContent = state.selectedCategories.size >= t.categories.length ? "Clear all" : "Select all";
  }

  el.btnToggleAll.addEventListener("click", () => {
    const t = findTemplate(state.selectedTemplateId);
    if (!t) return;
    if (state.selectedCategories.size >= t.categories.length) {
      state.selectedCategories.clear();
    } else {
      state.selectedCategories = new Set(t.categories.map((_, i) => i));
    }
    renderCategoryChecklist();
  });

  // ---------- duplicate / delete / export / import ----------
  function duplicateTemplate(id) {
    const src = findTemplate(id);
    if (!src) return;
    const draft = JSON.parse(JSON.stringify(src));
    draft.builtin = false;
    draft.id = null;
    draft.association = src.builtin ? src.association : src.association + " (copy)";
    openEditor(draft, true);
  }

  function deleteTemplate(id) {
    const t = findTemplate(id);
    if (!t || t.builtin) return;
    if (!confirm(`Delete "${t.association} ${t.season}"? This can't be undone.`)) return;
    state.customTemplates = state.customTemplates.filter((c) => c.id !== id);
    saveCustom();
    if (state.selectedTemplateId === id) {
      state.selectedTemplateId = null;
      el.stepGenerate.hidden = true;
    }
    renderTemplateList();
  }

  function exportTemplate(id) {
    const t = findTemplate(id);
    if (!t) return;
    const blob = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${slugify(t.association)}-${slugify(t.season)}.json`);
  }

  el.importFile.addEventListener("change", async () => {
    const file = el.importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
        throw new Error("This file doesn't look like a weight-category set (missing 'categories').");
      }
      parsed.builtin = false;
      parsed.id = uniqueId(slugify((parsed.association || "custom") + "-" + (parsed.season || "")));
      state.customTemplates.push(parsed);
      saveCustom();
      renderTemplateList();
      selectTemplate(parsed.id);
      setStatus(`Imported "${parsed.association} ${parsed.season}".`, "success");
    } catch (e) {
      alert("Couldn't import that file: " + e.message);
    } finally {
      el.importFile.value = "";
    }
  });

  // ---------- editor ----------
  el.btnNewTemplate.addEventListener("click", () => {
    openEditor({
      id: null,
      builtin: false,
      association: "",
      season: "",
      documentTitle: "TAEKWONDO KYORUGI AND POOMSAE STUDENTS LIST",
      categories: [{ ageGroup: "", sex: "Boys", weights: [] }]
    }, true);
  });

  function openEditor(draft, isNew) {
    state.editingDraft = draft;
    state.editingIsNew = isNew;
    el.editorTitle.textContent = isNew ? "New weight-category set" : "Edit weight-category set";
    el.editorAssociation.value = draft.association || "";
    el.editorSeason.value = draft.season || "";
    el.editorDoctitle.value = draft.documentTitle || "TAEKWONDO KYORUGI AND POOMSAE STUDENTS LIST";
    el.editorCategories.innerHTML = "";
    (draft.categories.length ? draft.categories : [{ ageGroup: "", sex: "Boys", weights: [] }])
      .forEach((cat) => addCategoryCard(cat));
    el.editorOverlay.hidden = false;
  }

  function closeEditor() {
    el.editorOverlay.hidden = true;
    state.editingDraft = null;
  }

  function addCategoryCard(cat) {
    const frag = el.categoryCardTpl.content.cloneNode(true);
    const card = frag.querySelector(".category-card");
    card.querySelector(".cat-age").value = (cat && cat.ageGroup) || "";
    card.querySelector(".cat-sex").value = (cat && cat.sex) || "Boys";
    card.querySelector(".cat-weights").value = (cat && cat.weights ? cat.weights.join("\n") : "");
    card.querySelector(".cat-remove").addEventListener("click", () => {
      if (el.editorCategories.querySelectorAll(".category-card").length <= 1) {
        alert("A set needs at least one category page.");
        return;
      }
      card.remove();
    });
    el.editorCategories.appendChild(frag);
  }

  el.btnAddCategory.addEventListener("click", () => addCategoryCard(null));
  el.btnEditorClose.addEventListener("click", closeEditor);
  el.btnEditorCancel.addEventListener("click", closeEditor);
  el.editorOverlay.addEventListener("click", (e) => { if (e.target === el.editorOverlay) closeEditor(); });

  el.btnEditorSave.addEventListener("click", () => {
    const association = el.editorAssociation.value.trim() || "Custom";
    const season = el.editorSeason.value.trim() || "";
    const documentTitle = el.editorDoctitle.value.trim() || "TAEKWONDO KYORUGI AND POOMSAE STUDENTS LIST";

    const cards = Array.from(el.editorCategories.querySelectorAll(".category-card"));
    const categories = cards.map((card) => ({
      ageGroup: card.querySelector(".cat-age").value.trim(),
      sex: card.querySelector(".cat-sex").value,
      weights: card.querySelector(".cat-weights").value.split("\n").map((s) => s.trim()).filter(Boolean)
    }));

    const problems = [];
    categories.forEach((c, i) => {
      if (!c.ageGroup) problems.push(`Category #${i + 1} needs an age group label.`);
      if (!c.weights.length) problems.push(`Category #${i + 1} needs at least one weight class.`);
    });
    if (problems.length) { alert(problems.join("\n")); return; }

    let id = state.editingDraft.id;
    if (!id) id = uniqueId(slugify(association + "-" + season));

    const saved = { id, builtin: false, association, season, documentTitle, categories };
    const existingIdx = state.customTemplates.findIndex((c) => c.id === id);
    if (existingIdx >= 0) state.customTemplates[existingIdx] = saved;
    else state.customTemplates.push(saved);
    saveCustom();

    closeEditor();
    renderTemplateList();
    selectTemplate(id);
    setStatus(`Saved "${association} ${season}".`, "success");
  });

  // ---------- quick actions (built-ins: preview/download directly from the list) ----------
  function quickPreview(templateId) {
    const t = findTemplate(templateId);
    if (!t) return;
    openPreview(t, getSchoolName(), t.categories.map((_, i) => i));
  }

  function quickDownload(templateId, kind) {
    const t = findTemplate(templateId);
    if (!t) return;
    runGenerate(kind, t, t.categories.map((_, i) => i), getSchoolName());
  }

  function getSchoolName() {
    return el.schoolName.value.trim();
  }

  // ---------- preview ----------
  function openPreview(template, schoolName, indices) {
    el.previewBody.innerHTML = "";
    if (!indices.length) {
      const p = document.createElement("p");
      p.textContent = "Select at least one category page to preview.";
      el.previewBody.appendChild(p);
    } else {
      indices.forEach((idx, i) => {
        el.previewBody.appendChild(buildPreviewPageEl(template, template.categories[idx], schoolName, i + 1, indices.length));
      });
    }
    state.previewTemplateId = template.id;
    state.previewIndices = indices;
    state.previewSchoolName = schoolName;
    el.previewOverlay.hidden = false;
  }

  function closePreview() {
    el.previewOverlay.hidden = true;
  }

  function buildPreviewPageEl(template, cat, schoolName, pageNum, totalPages) {
    const wrap = document.createElement("div");
    wrap.className = "preview-page";

    const label = document.createElement("div");
    label.className = "preview-page__label";
    label.textContent = `Page ${pageNum} of ${totalPages} — ${cat.ageGroup} — ${cat.sex}`;
    wrap.appendChild(label);

    const sheet = document.createElement("div");
    sheet.className = "preview-sheet";

    const title = document.createElement("h3");
    title.className = "preview-sheet__title";
    title.textContent = template.documentTitle || "STUDENTS LIST";
    sheet.appendChild(title);

    const schoolLine = document.createElement("p");
    schoolLine.className = "preview-sheet__line";
    const schoolLabel = document.createElement("strong");
    schoolLabel.textContent = "Name Of The School :- ";
    schoolLine.appendChild(schoolLabel);
    schoolLine.appendChild(document.createTextNode(schoolName && schoolName.trim() ? schoolName : "……………………………………………"));
    sheet.appendChild(schoolLine);

    const catLine = document.createElement("p");
    catLine.className = "preview-sheet__line";
    const catLabel = document.createElement("strong");
    catLabel.textContent = "Category :- ";
    catLine.appendChild(catLabel);
    const catValue = document.createElement("em");
    catValue.className = "preview-sheet__category";
    catValue.textContent = cat.ageGroup;
    catLine.appendChild(catValue);
    sheet.appendChild(catLine);

    const sexHeading = document.createElement("p");
    sexHeading.className = "preview-sheet__sex";
    sexHeading.textContent = `${cat.sex} Weights List`;
    sheet.appendChild(sexHeading);

    const tableWrap = document.createElement("div");
    tableWrap.className = "preview-table-wrap";
    const table = document.createElement("table");
    table.className = "preview-table";
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Weights (kg)</th><th>Name Of The Students</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    cat.weights.forEach((w) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.textContent = w;
      const td2 = document.createElement("td");
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    sheet.appendChild(tableWrap);

    wrap.appendChild(sheet);
    return wrap;
  }

  el.btnPreviewClose.addEventListener("click", closePreview);
  el.btnPreviewClose2.addEventListener("click", closePreview);
  el.previewOverlay.addEventListener("click", (e) => { if (e.target === el.previewOverlay) closePreview(); });
  el.btnPreviewDocx.addEventListener("click", () => {
    const t = findTemplate(state.previewTemplateId);
    if (t) runGenerate("docx", t, state.previewIndices, state.previewSchoolName);
  });
  el.btnPreviewPdf.addEventListener("click", () => {
    const t = findTemplate(state.previewTemplateId);
    if (t) runGenerate("pdf", t, state.previewIndices, state.previewSchoolName);
  });

  if (el.btnStepPreview) {
    el.btnStepPreview.addEventListener("click", () => {
      const t = findTemplate(state.selectedTemplateId);
      if (!t) return;
      const indices = Array.from(state.selectedCategories.values()).sort((a, b) => a - b);
      openPreview(t, getSchoolName(), indices);
    });
  }

  // ---------- generate / download ----------
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function setStatus(message, kind) {
    el.status.textContent = message;
    el.status.className = "status" + (kind === "error" ? " is-error" : kind === "success" ? " is-success" : "");
  }

  function resolveFileBaseName(t, schoolName) {
    if (schoolName && schoolName.trim()) {
      return [schoolName, t.association, t.season].filter(Boolean).map(slugify).join("-");
    }
    return null;
  }

  function askForFilename(suggestion) {
    return new Promise((resolve) => {
      el.filenameInput.value = suggestion;
      el.filenameOverlay.hidden = false;
      el.filenameInput.focus();
      el.filenameInput.select();

      function cleanup(result) {
        el.filenameOverlay.hidden = true;
        el.btnFilenameOk.removeEventListener("click", onOk);
        el.btnFilenameCancel.removeEventListener("click", onCancel);
        el.btnFilenameClose.removeEventListener("click", onCancel);
        el.filenameInput.removeEventListener("keydown", onKeydown);
        resolve(result);
      }
      function onOk() { cleanup(el.filenameInput.value.trim() || suggestion); }
      function onCancel() { cleanup(null); }
      function onKeydown(e) {
        if (e.key === "Enter") { e.preventDefault(); onOk(); }
        else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      }
      el.btnFilenameOk.addEventListener("click", onOk);
      el.btnFilenameCancel.addEventListener("click", onCancel);
      el.btnFilenameClose.addEventListener("click", onCancel);
      el.filenameInput.addEventListener("keydown", onKeydown);
    });
  }

  async function runGenerate(kind, t, indices, schoolName) {
    if (!t) { setStatus("Choose a weight-category set first.", "error"); return; }
    if (!indices.length) { setStatus("Select at least one category page.", "error"); return; }

    let baseName = resolveFileBaseName(t, schoolName);
    if (!baseName) {
      const suggestion = [t.association, t.season].filter(Boolean).map(slugify).join("-") || "tkd-student-list";
      const typed = await askForFilename(suggestion);
      if (typed === null) { setStatus("Download cancelled.", "error"); return; }
      baseName = slugify(typed) || suggestion;
    }

    setStatus("Generating " + kind.toUpperCase() + "…");
    try {
      const blob = kind === "docx"
        ? await window.generateDocx(t, schoolName, indices)
        : await window.generatePdf(t, schoolName, indices);
      downloadBlob(blob, `${baseName}.${kind}`);
      setStatus(`Downloaded ${indices.length} page${indices.length === 1 ? "" : "s"} as .${kind}.`, "success");
    } catch (e) {
      console.error(e);
      setStatus("Something went wrong generating the " + kind.toUpperCase() + ": " + e.message, "error");
    }
  }

  async function handleGenerate(kind) {
    const t = findTemplate(state.selectedTemplateId);
    if (!t) { setStatus("Choose a weight-category set first.", "error"); return; }
    const indices = Array.from(state.selectedCategories.values()).sort((a, b) => a - b);
    const btn = kind === "docx" ? el.btnGenDocx : el.btnGenPdf;
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Generating…";
    await runGenerate(kind, t, indices, getSchoolName());
    btn.disabled = false;
    btn.textContent = originalLabel;
  }

  el.btnGenDocx.addEventListener("click", () => handleGenerate("docx"));
  el.btnGenPdf.addEventListener("click", () => handleGenerate("pdf"));

  // ---------- init ----------
  renderTemplateList();
})();
