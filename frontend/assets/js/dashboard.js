document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");

    document.getElementById("userRole").textContent = `Your role: ${role}`;

    if (role === "admin") {
        document.getElementById("adminLinks").style.display = "block";
    } else if (role === "investigator") {
        document.getElementById("investigatorLinks").style.display = "block";
    } else {
        alert("Access denied.");
        window.location.href = "login.html";
    }
});
