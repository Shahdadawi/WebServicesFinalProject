const role = localStorage.getItem("role");
const user = JSON.parse(localStorage.getItem("user"));
let allCases = [];


if (!user || !role || (role !== "admin" && role !== "investigator")) {
    window.location.replace("index.html");
}


document.addEventListener("DOMContentLoaded", () => {
    const baseURL = "http://127.0.0.1:8000";

    //  API Fetch Helper
    async function fetchData(endpoint) {
        const res = await fetch(`${baseURL}${endpoint}`);
        return await res.json();
    }

    //  Get coordinates from OpenStreetMap (city + country)
    async function getCoordinates(city, country) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + "," + country)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.length === 0) {
                alert("⚠ Location not found. Please check city/country.");
                return null;
            }
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };
        } catch (error) {
            console.error("Geocoding failed:", error);
            alert("⚠ Failed to fetch coordinates.");
            return null;
        }
    }

    //  Load and display cases
    async function loadCases() {
        const cases = await fetchData("/cases");
        const tbody = document.querySelector("#casesTable tbody");
        const caseSelect = document.getElementById("caseSelect");
        tbody.innerHTML = "";
        caseSelect.innerHTML = "";

        cases.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.title}</td>
                <td>${c.violation_types.join(", ")}</td>
                <td>${c.status}</td>
                <td>${c.location?.city || "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="updateStatus('${c.id}', 'resolved')">Resolve</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCase('${c.id}')">Delete</button>
                </td>`;
            tbody.appendChild(tr);

            const option = document.createElement("option");
            option.value = c.id;
            option.textContent = `${c.title} - ${c.id}`;
            caseSelect.appendChild(option);
            allCases = cases;

            renderCases(cases);
        });

        const viewSelect = document.getElementById("viewCaseSelect");
        viewSelect.innerHTML = "";
        cases.forEach(c => {
            const option = document.createElement("option");
            option.value = c.id;
            option.textContent = `${c.title} – ${c.id}`;
            viewSelect.appendChild(option);
        });

    }

    function applyFilters() {
        const searchKeyword = document.getElementById("searchInput").value.toLowerCase();
        const selectedStatus = document.getElementById("statusFilter").value;
        const cityKeyword = document.getElementById("cityFilter").value.toLowerCase();

        const filtered = allCases.filter(c => {
            const matchViolation = c.violation_types.some(type => type.toLowerCase().includes(searchKeyword));
            const matchStatus = selectedStatus === "" || c.status === selectedStatus;
            const matchCity = cityKeyword === "" || (c.location?.city || "").toLowerCase().includes(cityKeyword);
            return matchViolation && matchStatus && matchCity;
        });

        renderCases(filtered);
    }

    ["searchInput", "statusFilter", "cityFilter"].forEach(id => {
        document.getElementById(id).addEventListener("input", applyFilters);
        document.getElementById(id).addEventListener("change", applyFilters);
    });


    //  Load reports and display in dropdown
    async function loadReports() {
        const data = await fetchData("/reports/all");
        const reports = data.reports || [];

        const select = document.getElementById("reportSelect");
        select.innerHTML = "";

        reports.forEach(report => {
            const opt = document.createElement("option");
            opt.value = report._id;
            opt.textContent = `${report.report_id} – ${report.incident_details.description}`;
            select.appendChild(opt);
        });

        const reportDetailsSelect = document.getElementById("reportDetailsSelect");
        reportDetailsSelect.innerHTML = "";
        reports.forEach(report => {
            const option = document.createElement("option");
            option.value = report._id;
            option.textContent = `${report.report_id} – ${report.incident_details.description}`;
            reportDetailsSelect.appendChild(option);
        });

    }

    // Add new case manually
    document.querySelector("#caseForm").addEventListener("submit", async e => {
        e.preventDefault();

        const country = document.getElementById("country").value;
        const city = document.getElementById("city").value;
        const region = document.getElementById("region").value;

        const coords = await getCoordinates(city, country);
        if (!coords) return;

        const newCase = {
            case_id: "HRM-" + Date.now(),
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            violation_types: [document.getElementById("violation").value],
            status: document.getElementById("status").value,
            priority: document.getElementById("priority").value,
            location: {
                country,
                region,
                city,
                coordinates: {
                    type: "Point",
                    coordinates: [coords.lon, coords.lat]
                }
            },
            date_occurred: new Date().toISOString(),
            date_reported: new Date().toISOString(),
            victims: [],
            perpetrators: [],
            evidence: []
        };

        await fetch(`${baseURL}/cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCase)
        });

        e.target.reset();
        loadCases();
    });

    //  Convert report to case
    document.getElementById("convertForm").addEventListener("submit", async e => {
        e.preventDefault();
        const reportId = document.getElementById("reportSelect").value;
        const report = await fetchData(`/reports/${reportId}`);

        const city = report.incident_details.location.city;
        const country = report.incident_details.location.country;
        const coords = await getCoordinates(city, country);
        if (!coords) return;

        const converted = {
            case_id: "HRM-" + Date.now(),
            title: "Converted from Report",
            description: report.incident_details.description,
            violation_types: report.incident_details.violation_types,
            status: "new",
            priority: "medium",
            location: {
                country: country,
                region: "Auto",
                city: city,
                coordinates: {
                    type: "Point",
                    coordinates: [coords.lon, coords.lat]
                }
            },
            date_occurred: new Date(report.incident_details.date).toISOString(),
            date_reported: new Date().toISOString(),
            victims: [report._id?.$oid || report._id],
            perpetrators: [],
            evidence: (report.evidence || []).map(ev => ({
                ...ev,
                date_captured: ev.date_captured || null
            }))
        };



        console.log("Converted Payload:", converted);



        await fetch(`${baseURL}/cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(converted)
        });


        await fetch(`${baseURL}/reports/${reportId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "under_investigation" })
        });


        e.target.reset();
        loadCases();
    });

    // Update status for existing case
    document.getElementById("statusForm").addEventListener("submit", async e => {
        e.preventDefault();
        const id = document.getElementById("caseSelect").value;
        const newStatus = document.getElementById("newStatus").value;
        await updateStatus(id, newStatus);
    });

    const user = JSON.parse(localStorage.getItem("user"));
    const requester_email = user?.email || "";

    window.updateStatus = async (id, newStatus) => {
        await fetch(`${baseURL}/cases/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status_update: { status: newStatus },
                requester_email: requester_email
            })
        });
        loadCases();
    };


    document.getElementById("viewForm").addEventListener("submit", async e => {
        e.preventDefault();
        const id = document.getElementById("viewCaseSelect").value;
        const data = await fetchData(`/cases/${id}`);
        const infoBox = document.getElementById("caseInfo");
        document.getElementById("caseDetails").classList.remove("d-none");
        infoBox.innerHTML = `
    <strong>Case ID:</strong> ${data.case_id}<br>
    <strong>Title:</strong> ${data.title}<br>
    <strong>Description:</strong> ${data.description}<br>
    <strong>Status:</strong> <span class="badge bg-info">${data.status}</span><br>
    <strong>Priority:</strong> ${data.priority}<br>
    <strong>Violation Types:</strong> ${data.violation_types.join(", ")}<br>
    <strong>Location:</strong> ${data.location.city}, ${data.location.region}, ${data.location.country}<br>
    <strong>Coordinates:</strong> (${data.location.coordinates.coordinates[1]}, ${data.location.coordinates.coordinates[0]})<br>
    <strong>Date Occurred:</strong> ${new Date(data.date_occurred).toLocaleString()}<br>
    <strong>Date Reported:</strong> ${new Date(data.date_reported).toLocaleString()}<br>
    <strong>Victims:</strong> ${data.victims.length > 0 ? data.victims.join(", ") : "None"}<br>
    <strong>Perpetrators:</strong> ${data.perpetrators.length > 0 ? data.perpetrators.map(p => p.name).join(", ") : "None"}<br>
    <strong>Evidence:</strong> <ul>${data.evidence.map(e => `<li>${e.type}: ${e.url}${e.description ? ` – ${e.description}` : ""}</li>`).join("")}</ul>
`;

    });


    document.getElementById("reportDetailsForm").addEventListener("submit", async e => {
        e.preventDefault();
        const reportId = document.getElementById("reportDetailsSelect").value;
        const report = await fetchData(`/reports/${reportId}`);
        const container = document.getElementById("reportDetailsBox");
        const pre = document.getElementById("reportInfo");

        container.classList.remove("d-none");

        pre.innerHTML = `
<strong>Report ID:</strong> ${report.report_id}<br>
<strong>Description:</strong> ${report.incident_details.description}<br>
<strong>Date:</strong> ${new Date(report.incident_details.date).toLocaleString()}<br>
<strong>Location:</strong> ${report.incident_details.location.city}, ${report.incident_details.location.country}<br>
<strong>Coordinates:</strong> (${report.incident_details.location.coordinates.coordinates[1]}, ${report.incident_details.location.coordinates.coordinates[0]})<br>
<strong>Violation Types:</strong> ${report.incident_details.violation_types.join(", ")}<br>
<strong>Status:</strong> ${report.status}<br>
<strong>Anonymous:</strong> ${report.anonymous ? "Yes" : "No"}<br>
<strong>Reporter Type:</strong> ${report.reporter_type}<br>
<strong>Contact Info:</strong> ${report.contact_info.email || "-"} | ${report.contact_info.phone || "-"}<br>
<strong>Evidence:</strong> <ul>${(report.evidence || []).map(e => `<li>${e.type}: ${e.url} (${e.description || ""})</li>`).join("")}</ul>
    `;
    });



    //  Delete case
    window.deleteCase = async id => {
        await fetch(`${baseURL}/cases/${id}`, { method: "DELETE" });
        loadCases();
    };

    function renderCases(cases) {
        const tbody = document.querySelector("#casesTable tbody");
        const caseSelect = document.getElementById("caseSelect");
        const viewSelect = document.getElementById("viewCaseSelect");

        tbody.innerHTML = "";
        caseSelect.innerHTML = "";
        viewSelect.innerHTML = "";

        cases.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${c.title}</td>
            <td>${c.violation_types.join(", ")}</td>
            <td>${c.status}</td>
            <td>${c.location?.city || "N/A"}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="updateStatus('${c.id}', 'resolved')">Resolve</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCase('${c.id}')">Delete</button>
            </td>`;
            tbody.appendChild(tr);

            const option = document.createElement("option");
            option.value = c.id;
            option.textContent = `${c.title} - ${c.id}`;
            caseSelect.appendChild(option);

            const viewOption = document.createElement("option");
            viewOption.value = c.id;
            viewOption.textContent = `${c.title} – ${c.id}`;
            viewSelect.appendChild(viewOption);
        });

        document.getElementById("searchInput").addEventListener("input", function () {
            const keyword = this.value.toLowerCase();

            const filtered = allCases.filter(c =>
                c.violation_types.some(type => type.toLowerCase().includes(keyword))
            );

            renderCases(filtered);
        });

    }




    //  Initial Load
    loadCases();
    loadReports();
});
