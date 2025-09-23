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

// 🔹 Current summary (updated after API call)
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

// Update card value helper
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

// Load summary (only 1st & 3rd tiles of New Registration from DB)
function loadSummary() {
  return fetch("/api/applications/summary")
      .then(r => r.json())
      .then(summary => {
        if (summary["New Registration"]) {
          const newReg = summary["New Registration"];
          updateCardValue("New Registration", StatusLabels.NEW_APPLICATION, newReg[StatusLabels.NEW_APPLICATION]);
          updateCardValue("New Registration", StatusLabels.DEFICIENT_AWAITING_PUBLISHER, newReg[StatusLabels.DEFICIENT_AWAITING_PUBLISHER]);
        }
        // Save the latest summary globally
        CurrentSummary = summary;
      })
      .catch(err => console.error("summary error:", err));
}

// 🔹 Excel export
function exportToExcel() {
  let wb = XLSX.utils.book_new();

  // Define header
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

  // Total row
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

  // Collapse/Expand for mobile
  const modules = document.querySelectorAll(".module");
  modules.forEach(module => {
    const header = module.querySelector("h2");
    const toggleIcon = module.querySelector(".toggle-icon");
    if (header) {
      header.addEventListener("click", () => {
        if (window.innerWidth < 768) {
          module.classList.toggle("open");
          if (toggleIcon) toggleIcon.classList.toggle("open");
        }
      });
    }
  });

  const applyBtn = document.getElementById("btnApply");
  const excelBtn = document.getElementById("btnExcel");

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      loadSummary().then(() => {
        excelBtn.style.display = "inline-block";
      });
    });
  }

  if (excelBtn) {
    excelBtn.addEventListener("click", exportToExcel);
  }
});