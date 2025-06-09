
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("reportForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    // Auto-generate report ID
    const reportId = "RPT_" + Math.floor(Math.random() * 100000);
    formData.append("report_id", reportId);

    // Get city and country values
    const city = formData.get("city");
    const country = formData.get("country");

    // Get coordinates automatically
    const coordinates = await getCoordinates(city, country);
    if (!coordinates) return;
    formData.append("lat", coordinates.lat);
    formData.append("lon", coordinates.lon);

    try {
      const response = await fetch("http://127.0.0.1:8000/reports/with-file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        alert("Report submitted successfully!");
        form.reset();
      } else {
        alert("Error: " + result.detail);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit report.");
    }
  });

  async function getCoordinates(city, country) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + "," + country)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.length === 0) {
        alert("Location not found. Please check city/country.");
        return null;
      }
      return {
        lat: data[0].lat,
        lon: data[0].lon,
      };
    } catch (error) {
      console.error("Geocoding failed:", error);
      return null;
    }
  }
});
