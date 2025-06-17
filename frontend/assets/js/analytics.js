const role = localStorage.getItem("role");
const user = JSON.parse(localStorage.getItem("user"));


if (!user || !role || (role !== "admin" && role !== "investigator")) {
    window.location.replace("index.html");
}




document.addEventListener("DOMContentLoaded", async () => {
    const baseURL = "http://127.0.0.1:8000/analytics";

    async function fetchData(endpoint) {
        const res = await fetch(`${baseURL}${endpoint}`);
        return await res.json();
    }

    // Violations by Location (bar)
    const locations = await fetchData("/by-location");
    if (Object.keys(locations).length > 0) {
        new Chart(document.getElementById("locationChart"), {
            type: "bar",
            data: {
                labels: Object.keys(locations),
                datasets: [{
                    label: "Reports",
                    data: Object.values(locations),
                    backgroundColor: "rgba(54, 162, 235, 0.7)"
                }]
            }
        });
    }

    // Reports Over Time (line)
    const timeline = await fetchData("/by-date");
    if (Object.keys(timeline).length > 0) {
        new Chart(document.getElementById("dateChart"), {
            type: "line",
            data: {
                labels: Object.keys(timeline),
                datasets: [{
                    label: "Monthly Reports",
                    data: Object.values(timeline),
                    fill: false,
                    borderColor: "rgba(75, 192, 192, 1)",
                    tension: 0.3
                }]
            }
        });
    }

    // Violation Types (pie)
    const summary = await fetchData("/summary");
    if (summary.violations && Object.keys(summary.violations).length > 0) {
        new Chart(document.getElementById("typeChart"), {
            type: "pie",
            data: {
                labels: Object.keys(summary.violations),
                datasets: [{
                    label: "Violation Count",
                    data: Object.values(summary.violations),
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
                }]
            }
        });
    }

    // Map with Geo Data
    const geo = await fetchData("/geodata");
    const map = L.map('incidentMap').setView([31.95, 35.93], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    geo.forEach(entry => {
        const { city, lat, lon } = entry;
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<strong>${city}</strong>`);
    });
});
