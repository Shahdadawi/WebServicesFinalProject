
const API = "http://localhost:8000/victims";
const user = JSON.parse(localStorage.getItem("user"));
const requester_email = user?.email || "";

async function loadAll() {
    const res = await fetch(`${API}/?requester_email=${requester_email}`);
    const data = await res.json();
    const list = document.getElementById("victimList");
    const dropdowns = ["selectVictim", "riskSelect", "riskVictimSelect"];

    list.innerHTML = "";
    dropdowns.forEach(id => {
        const dd = document.getElementById(id);
        dd.innerHTML = `<option value="">-- Select --</option>`;
    });

    data.forEach(v => {
        const name = v.display_name || v.full_name || "Unknown";
        list.innerHTML += `
        <div class="col-md-4 mb-3">
          <div class="card p-3">
            <h5>${name}</h5>
            <p>ID: ${v.id}</p>
            <button class="btn btn-sm btn-warning" onclick="loadForEdit('${v.id}')">Update</button>
            <button class="btn btn-sm btn-danger" onclick="deleteVictim('${v.id}')">Delete</button>
          </div>
        </div>`;

        dropdowns.forEach(id => {
            document.getElementById(id).innerHTML += `<option value="${v.id}">${name}</option>`;
        });
    });
}

document.getElementById("victimForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("victimId").value;
    console.log("Submitting form for ID:", id);

    const isAnonymous = document.getElementById("anonymous").value === "true";
    const data = {
        type: document.getElementById("type").value,
        anonymous: isAnonymous,
        full_name: isAnonymous ? null : document.getElementById("full_name").value,
        pseudonym_name: document.getElementById("pseudonym_name").value,
        demographics: {
            age: parseInt(document.getElementById("age").value),
            gender: document.getElementById("gender").value
        },
        contact_info: {
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value
        },
        cases_involved: [],
        risk_assessment: {},
        support_services: []
    };

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/${id}` : `${API}/`;
    await fetch(`${url}?requester_email=${requester_email}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    document.getElementById("victimForm").reset();
    document.getElementById("victimId").value = "";
    loadAll();
});

async function deleteVictim(id) {
    await fetch(`${API}/${id}?requester_email=${requester_email}`, { method: "DELETE" });
    loadAll();
}

async function loadForEdit(id) {
    const res = await fetch(`${API}/${id}?requester_email=${requester_email}`, {
        method: "GET"
    });
    const data = await res.json();
    document.getElementById("victimId").value = id;
    console.log("Editing victimId:", document.getElementById("victimId").value);
    document.getElementById("type").value = data.type;
    document.getElementById("anonymous").value = data.anonymous;
    document.getElementById("full_name").value = data.full_name || "";
    document.getElementById("pseudonym_name").value = data.pseudonym_name || "";
    document.getElementById("age").value = data.demographics?.age || "";
    document.getElementById("gender").value = data.demographics?.gender || "";
    document.getElementById("email").value = data.contact_info?.email || "";
    document.getElementById("phone").value = data.contact_info?.phone || "";
}


async function loadDetails(id) {
    if (!id) return;
    const res = await fetch(`${API}/${id}?requester_email=${requester_email}`);
    const data = await res.json();
    const cases = await fetch(`${API}/${id}/cases?requester_email=${requester_email}`).then(r => r.json());
    document.getElementById("details").innerHTML = `
    <div class="p-2 bg-white rounded shadow-sm">
      <p><strong>Name:</strong> ${data.display_name}</p>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>Gender:</strong> ${data.demographics?.gender}</p>
      <p><strong>Email:</strong> ${data.contact_info?.email}</p>
      <p><strong>Cases:</strong> ${cases.cases_involved?.join(", ") || "None"}</p>
    </div>`;
}


async function showRisk(id) {
    if (!id) return;
    const history = await fetch(`${API}/${id}/risk-history?requester_email=${requester_email}`).then(r => r.json());
    const latest = await fetch(`${API}/${id}/risk-latest?requester_email=${requester_email}`).then(r => r.json());
    document.getElementById("riskDetails").innerHTML = `
      <p><strong>Latest Risk:</strong> <span class="badge bg-${riskColor(latest.level)}">${latest.level}</span></p>
      <p><strong>History:</strong> ${history.map(h => `<span class="badge bg-${riskColor(h.level)} me-1">${h.level}</span>`).join(" ")}</p>`;
}

function riskColor(level) {
    if (level === "high") return "danger";
    if (level === "medium") return "warning";
    return "success";
}

async function submitRisk() {
    const victimId = document.getElementById("riskVictimSelect").value;
    const level = document.getElementById("riskLevelSelect").value;
    if (!victimId || !level) return alert("Please select both victim and risk level");
    await fetch(`${API}/${victimId}/risk-level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, requester_email })
    });
    alert("Risk level updated.");
    showRisk(victimId);
}

window.onload = loadAll;

