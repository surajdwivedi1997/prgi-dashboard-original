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
const DefaultSummary = {};
ModuleOrder.forEach(m => {
  DefaultSummary[ModuleLabels[m]] = {};
  StatusOrder.forEach(s => {
    DefaultSummary[ModuleLabels[m]][StatusLabels[s]] = "-";
  });
});

// 🔹 Current summary
let CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));

// Build modules and cards
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
        <div class="count" id="count-${id}">${DefaultSummary[ModuleLabels[m]][StatusLabels[s]]}</div>
      `;
      grid.appendChild(card);
    });
  });
}

// Update card value
function updateCardValue(moduleName, label, newValue) {
  const modules = document.querySelectorAll(".module");
  modules.forEach(module => {
    const h2 = module.querySelector("h2");
    if (h2 && h2.textContent.includes(moduleName)) {
      const cards = module.querySelectorAll(".card");
      cards.forEach(card => {
        const status = card.querySelector(".status");
        const count = card.querySelector(".count");
        if (status && status.textContent.trim() === label && count) {
          count.textContent = newValue;
        }
      });
    }
  });
}

// Load summary
function loadSummary() {
  const rangeSelect = document.getElementById("rangeSelect").value;
  if (!rangeSelect) {
    // Reset values to "-"
    CurrentSummary = JSON.parse(JSON.stringify(DefaultSummary));
    buildShell();
    return Promise.resolve();
  }

  return fetch("/api/applications/summary?range=" + encodeURIComponent(rangeSelect))
      .then(r => r.json())
      .then(summary => {
        if (summary["New Registration"]) {
          const newReg = summary["New Registration"];
          updateCardValue("New Registration", StatusLabels.NEW_APPLICATION, newReg[StatusLabels.NEW_APPLICATION]);
          updateCardValue("New Registration", StatusLabels.DEFICIENT_AWAITING_PUBLISHER, newReg[StatusLabels.DEFICIENT_AWAITING_PUBLISHER]);
        }
        CurrentSummary = summary;
        enableTileClicks(); // ✅ enable clicks only after data loads
      })
      .catch(err => console.error("summary error:", err));
}

// Enable tile clicks only if data is loaded
function enableTileClicks() {
  const rangeSelect = document.getElementById("rangeSelect").value;
  if (!rangeSelect) return; // No clicks if not selected

  const newAppCard = document.getElementById("card-NEW_REGISTRATION_NEW_APPLICATION");
  if (newAppCard) {
    newAppCard.onclick = () => {
      fetchAndShow("/api/new-registration/new-applications", "New Applications");
    };
  }

  const deficientCard = document.getElementById("card-NEW_REGISTRATION_DEFICIENT_AWAITING_PUBLISHER");
  if (deficientCard) {
    deficientCard.onclick = () => {
      fetchAndShow("/api/new-registration/deficient", "Deficient Applications");
    };
  }
}

// Fetch + show popup
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
      })
      .catch(err => {
        console.error("Error:", err);
        document.getElementById("modalBody").innerHTML =
            "<p style='color:red; text-align:center;'>Failed to load data.</p>";
      });
}

function buildTable(data) {
  if (!data || data.length === 0) return "<p>No records found.</p>";

  let cols = Object.keys(data[0]);
  let html = "<div class='table-wrapper'><table><thead><tr>";
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

// Excel export
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
    let sum = 0;
    let numeric = true;
    ModuleOrder.forEach(mKey => {
      let val = CurrentSummary[ModuleLabels[mKey]][label];
      if (!isNaN(val)) {
        sum += Number(val);
      } else {
        numeric = false;
      }
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
        if (rangeSelect) {
          excelBtn.style.display = "inline-block";
        } else {
          excelBtn.style.display = "none";
        }
      });
    });
  }

  if (excelBtn) {
    excelBtn.addEventListener("click", exportToExcel);
  }
});
