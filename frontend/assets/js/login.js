console.log(" login.js loaded");


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

        console.log("Raw response:", res);

        const data = await res.json();
        console.log(" Parsed response:", data);

        if (!res.ok) {
            document.getElementById("error").textContent = data.detail || "Login failed.";
            return;
        }

        localStorage.setItem("role", data.role);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.role === "admin" || data.role === "investigator") {
            window.location.href = "dashboard.html";

        } else {
            alert("Access denied.");
        }

    } catch (err) {
        console.error(" Login error:", err);
        document.getElementById("error").textContent = "Something went wrong. Try again.";
    }
});
