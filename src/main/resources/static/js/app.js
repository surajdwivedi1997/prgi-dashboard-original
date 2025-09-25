const ModuleLabels = {
  NEW_REGISTRATION: "New Registration",
  NEW_EDITION: "New Edition",
  REVISED_REGISTRATION: "Revised Registration",
  OWNERSHIP: "Ownership Transfer",
  DISCONTINUATION_OF_PUBLICATION: "Discontinuation of Publication",
  NEWSPRINT_DECLARATION_AUTHENTICATION: "Newsprint Declaration Authentication"
};

const StatusLabels = {
  NEW_APPLICATION: "New Applications (Response awaited from Specified Authority within 60 days window)",
  APPLICATION_RECEIVED_FROM_SA: "Applications received from Specified Authority with/without comments after 60 days",
  DEFICIENT_AWAITING_PUBLISHER: "Deficient – Applications Response awaited from publishers",
  UNDER_PROCESS_AT_PRGI: "Under Process at PRGI (Above ASO Level)",
  APPLICATION_REJECTED: "Applications Rejected",
  REGISTRATION_GRANTED: "Registration Granted"
};

const StatusOrder = [
  "NEW_APPLICATION",
  "APPLICATION_RECEIVED_FROM_SA",
  "DEFICIENT_AWAITING_PUBLISHER",
  "UNDER_PROCESS_AT_PRGI",
  "APPLICATION_REJECTED",
  "REGISTRATION_GRANTED"
];

const ModuleOrder = Object.keys(ModuleLabels);

// 🔹 Hardcoded defaults
const DefaultSummary = {
  "New Registration": {
    [StatusLabels.NEW_APPLICATION]: "-",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "42",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "-",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "235",
    [StatusLabels.APPLICATION_REJECTED]: "24+61 (Partial Reject)",
    [StatusLabels.REGISTRATION_GRANTED]: "270"
  },
  "New Edition": {
    [StatusLabels.NEW_APPLICATION]: "68",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "7",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "1",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "61",
    [StatusLabels.APPLICATION_REJECTED]: "0+2 (Partial Reject)",
    [StatusLabels.REGISTRATION_GRANTED]: "12"
  },
  "Revised Registration": {
    [StatusLabels.NEW_APPLICATION]: "50",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "34",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "17",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "67",
    [StatusLabels.APPLICATION_REJECTED]: "1+14 (Partial Reject)",
    [StatusLabels.REGISTRATION_GRANTED]: "103"
  },
  "Ownership Transfer": {
    [StatusLabels.NEW_APPLICATION]: "25",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "5",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "13",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "21",
    [StatusLabels.APPLICATION_REJECTED]: "0",
    [StatusLabels.REGISTRATION_GRANTED]: "0"
  },
  "Discontinuation of Publication": {
    [StatusLabels.NEW_APPLICATION]: "0",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "0",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "0",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "3",
    [StatusLabels.APPLICATION_REJECTED]: "0",
    [StatusLabels.REGISTRATION_GRANTED]: "0"
  },
  "Newsprint Declaration Authentication": {
    [StatusLabels.NEW_APPLICATION]: "0",
    [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: "9",
    [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: "1",
    [StatusLabels.UNDER_PROCESS_AT_PRGI]: "0",
    [StatusLabels.APPLICATION_REJECTED]: "0",
    [StatusLabels.REGISTRATION_GRANTED]: "5"
  }
};

// 🔹 Current summary
let CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));

// Build modules/cards
function buildShell() {
  const container = document.getElementById("modules");
  container.innerHTML = "";
  ModuleOrder.forEach(m => {
    const section = document.createElement("section");
    section.className = `module ${m}`;
    section.innerHTML = `
      <h2>
        <span>${ModuleLabels[m]}</span>
        <span class="toggle-icon">+</span>
      </h2>
      <div class="grid" id="grid-${m}"></div>
    `;
    container.appendChild(section);

    const grid = section.querySelector(".grid");
    StatusOrder.forEach(s => {
      const id = `${m}_${s}`;
      const card = document.createElement("div");
      card.className = `card ${s}`;
      card.id = `card-${id}`;
      card.innerHTML = `
        <div class="status">${StatusLabels[s]}</div>
        <div class="count" id="count-${id}">${CurrentSummary[ModuleLabels[m]][StatusLabels[s]]}</div>
      `;
      grid.appendChild(card);
    });
  });
}

// Update card
function updateCardValue(moduleName, label, newValue) {
  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    const status = card.querySelector(".status");
    const count = card.querySelector(".count");
    if (status && status.textContent.trim() === label && count && card.id.includes(moduleName.replace(/\s+/g, "_").toUpperCase())) {
      count.textContent = newValue ?? "-";
    }
  });
}

// Load summary
function loadSummary() {
  const rangeSelect = document.getElementById("rangeSelect").value;
  if (!rangeSelect) {
    CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));
    buildShell();
    return Promise.resolve();
  }

  return fetch("/api/applications/summary?range=" + encodeURIComponent(rangeSelect))
    .then(r => r.json())
    .then(summary => {
      console.log("Full API Response:", summary);
      console.log("Ownership Transfer from API:", summary["Ownership Transfer"]);

      // reset to defaults
      CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));

      // normalize helper
      const normalize = str => str?.toLowerCase().replace(/\s+/g, " ").trim();

      // merge API data
      ModuleOrder.forEach(mKey => {
        const moduleName = ModuleLabels[mKey];
        const apiObj = summary[moduleName];
        if (apiObj) {
          StatusOrder.forEach(s => {
            const label = StatusLabels[s];
            let apiValue = CurrentSummary[moduleName][label]; // keep hardcoded if missing

            // exact match
            if (apiObj[label] !== undefined) {
              apiValue = apiObj[label];
            } else {
              // normalized match
              const apiKeys = Object.keys(apiObj);
              const foundKey = apiKeys.find(k => normalize(k) === normalize(label));
              if (foundKey) {
                apiValue = apiObj[foundKey];
              }
            }

            CurrentSummary[moduleName][label] = apiValue;
          });
        }
      });

      // update UI
      ModuleOrder.forEach(mKey => {
        const moduleName = ModuleLabels[mKey];
        StatusOrder.forEach(s => {
          updateCardValue(moduleName, StatusLabels[s], CurrentSummary[moduleName][StatusLabels[s]]);
        });
      });

      enableTileClicks();
    })
    .catch(err => {
      console.error("summary error:", err);
      CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));
      buildShell();
    });
}

// Enable popup clicks
function enableTileClicks() {
  const newAppCard = document.getElementById("card-NEW_REGISTRATION_NEW_APPLICATION");
  if (newAppCard) {
    newAppCard.onclick = () => fetchAndShow("/api/new-registration/new-applications", "New Applications");
  }

  const deficientCard = document.getElementById("card-NEW_REGISTRATION_DEFICIENT_AWAITING_PUBLISHER");
  if (deficientCard) {
    deficientCard.onclick = () => fetchAndShow("/api/new-registration/deficient", "Deficient Applications");
  }
}

// Popup fetch
function fetchAndShow(url, title) {
  const modal = document.getElementById("dataModal");
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML =
    "<div class='spinner-container'><div class='spinner'></div></div>";
  modal.style.display = "block";
  document.body.style.overflow = "hidden";

  fetch(url)
    .then(r => r.json())
    .then(data => {
      document.getElementById("modalBody").innerHTML = buildTable(data);
      const modalExcelBtn = document.getElementById("modalExcelBtn");
      if (modalExcelBtn) {
        modalExcelBtn.style.display = "inline-block";
        modalExcelBtn.onclick = () => exportModalTableToExcel(title);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      document.getElementById("modalBody").innerHTML =
        "<p style='color:red; text-align:center;'>Failed to load data.</p>";
    });
}

// Build table
function buildTable(data) {
  if (!data || data.length === 0) return "<p>No records found.</p>";
  let cols = Object.keys(data[0]);
  let html = "<div class='table-wrapper'><table id='modalTable'><thead><tr>";
  cols.forEach(c => (html += `<th>${c}</th>`));
  html += "</tr></thead><tbody>";
  data.forEach(row => {
    html += "<tr>";
    cols.forEach(c => (html += `<td>${row[c] ?? ""}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table></div>";
  return html;
}

// Export modal table
function exportModalTableToExcel(title) {
  const table = document.getElementById("modalTable");
  if (!table) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}.xlsx`);
}

// Export summary
function exportToExcel() {
  let wb = XLSX.utils.book_new();
  let header = [
    "S.No.",
    "Nature of Application",
    StatusLabels.NEW_APPLICATION,
    StatusLabels.APPLICATION_RECEIVED_FROM_SA,
    StatusLabels.DEFICIENT_AWAITING_PUBLISHER,
    StatusLabels.UNDER_PROCESS_AT_PRGI,
    StatusLabels.APPLICATION_REJECTED,
    StatusLabels.REGISTRATION_GRANTED
  ];
  let rows = [];
  let serial = 1;
  ModuleOrder.forEach(mKey => {
    const moduleName = ModuleLabels[mKey];
    const summary = CurrentSummary[moduleName];
    rows.push({
      "S.No.": serial++,
      "Nature of Application": moduleName,
      [StatusLabels.NEW_APPLICATION]: summary[StatusLabels.NEW_APPLICATION],
      [StatusLabels.APPLICATION_RECEIVED_FROM_SA]: summary[StatusLabels.APPLICATION_RECEIVED_FROM_SA],
      [StatusLabels.DEFICIENT_AWAITING_PUBLISHER]: summary[StatusLabels.DEFICIENT_AWAITING_PUBLISHER],
      [StatusLabels.UNDER_PROCESS_AT_PRGI]: summary[StatusLabels.UNDER_PROCESS_AT_PRGI],
      [StatusLabels.APPLICATION_REJECTED]: summary[StatusLabels.APPLICATION_REJECTED],
      [StatusLabels.REGISTRATION_GRANTED]: summary[StatusLabels.REGISTRATION_GRANTED]
    });
  });
  let totalRow = { "S.No.": "", "Nature of Application": "Total" };
  header.slice(2).forEach(label => {
    let sum = 0, numeric = true;
    ModuleOrder.forEach(mKey => {
      let val = CurrentSummary[ModuleLabels[mKey]][label];
      if (!isNaN(val)) sum += Number(val);
      else numeric = false;
    });
    totalRow[label] = numeric ? sum : "";
  });
  rows.push(totalRow);
  let ws = XLSX.utils.json_to_sheet(rows, { header });
  XLSX.utils.book_append_sheet(wb, ws, "Application Summary");
  XLSX.writeFile(wb, "Application_Summary.xlsx");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  buildShell();
  const applyBtn = document.getElementById("btnApply");
  const excelBtn = document.getElementById("btnExcel");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      loadSummary().then(() => {
        const rangeSelect = document.getElementById("rangeSelect").value;
        excelBtn.style.display = rangeSelect ? "inline-block" : "none";
      });
    });
  }
  if (excelBtn) {
    excelBtn.addEventListener("click", exportToExcel);
  }
});
