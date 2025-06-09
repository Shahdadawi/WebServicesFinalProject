document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reportForm");



    function showToast(message, isError = false) {
        const toastEl = document.getElementById("reportToast");
        const toastMsg = document.getElementById("toastMsg");

        toastMsg.textContent = message;

        toastEl.classList.remove("bg-danger", "bg-success");
        toastEl.classList.add(isError ? "bg-danger" : "bg-success");

        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        toast.show();
    }




    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData();

        // Auto-generate report ID
        const reportId = "RPT_" + Math.floor(Math.random() * 100000);
        formData.append("report_id", reportId);

        // Basic Info
        formData.append("reporter_type", document.getElementById("reporterType").value);
        formData.append("anonymous", document.getElementById("anonymous").value);

        // Contact Info
        formData.append("email", document.getElementById("email").value);
        formData.append("phone", document.getElementById("phone").value);
        formData.append("preferred_contact", document.getElementById("preferredContact").value);

        // Date and location input
        formData.append("date", document.getElementById("date").value);
        const country = document.getElementById("country").value;
        const city = document.getElementById("city").value;
        formData.append("country", country);
        formData.append("city", city);

        // Get coordinates from city + country
        const coordinates = await getCoordinates(city, country);
        if (!coordinates) return;

        formData.append("lat", coordinates.lat);
        formData.append("lon", coordinates.lon);

        // Violation details
        formData.append("violation_type", document.getElementById("violationType").value);
        formData.append("description", document.getElementById("description").value);
        formData.append("assigned_to", document.getElementById("assignedTo").value);

        // Evidence file
        const fileInput = document.getElementById("file");
        if (fileInput.files.length > 0) {
            formData.append("file", fileInput.files[0]);
        }




        try {
            const response = await fetch("http://127.0.0.1:8000/reports/with-file", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                showToast(" Report submitted successfully!");
                form.reset();
            } else {
                showToast("Failed to submit report.", true);

            }
        } catch (error) {
            console.error("Submission failed:", error);
            alert(" Failed to submit report.");
        }
    });

    async function getCoordinates(city, country) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + "," + country)}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.length === 0) {
                showToast("Location not found. Please check city/country.");
                return null;
            }
            return {
                lat: data[0].lat,
                lon: data[0].lon,
            };
        } catch (error) {
            console.error("Geocoding failed:", error);
            showToast("Failed to fetch coordinates.");
            return null;
        }
    }
});
