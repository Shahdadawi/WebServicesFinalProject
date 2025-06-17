console.log("login.js loaded");

const baseURL = "http://127.0.0.1:8000";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("Submitting login for:", email);

    try {
        const res = await fetch(`${baseURL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log("DATA FROM LOGIN API:", data);

        if (!res.ok) {
            console.log("Login failed response:", data);
            document.getElementById("error").textContent = data.detail || "Login failed.";
            return;
        }

        // Check if data contains both role and user
        if (data.role && data.user) {
            localStorage.setItem("role", data.role.toLowerCase());
            localStorage.setItem("user", JSON.stringify(data.user));
            console.log("Logged in as:", data.role);

            if (data.role === "admin" || data.role === "investigator") {
                window.location.href = "dashboard.html";
            } else {
                alert("Access denied. You are not allowed here.");
            }
        } else {
            console.error("Missing role or user in API response.");
            document.getElementById("error").textContent = "Invalid server response.";
        }

    } catch (err) {
        console.error("Login error:", err);
        document.getElementById("error").textContent = "Something went wrong. Try again.";
    }
});
