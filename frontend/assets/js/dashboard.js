const role = localStorage.getItem("role");
const user = JSON.parse(localStorage.getItem("user"));


if (!user || !role || (role !== "admin" && role !== "investigator")) {
    window.location.replace("index.html");
}


document.addEventListener("DOMContentLoaded", () => {
    const roleElement = document.getElementById("userRole");
    if (roleElement) {
        roleElement.textContent = `Your role: ${role}`;
    }

    if (role === "admin") {
        const adminSection = document.getElementById("adminLinks");
        if (adminSection) adminSection.style.display = "block";
    } else if (role === "investigator") {
        const invSection = document.getElementById("investigatorLinks");
        if (invSection) invSection.style.display = "block";
    } else {
        alert("Access denied.");
        window.location.href = "login.html";
    }
});
