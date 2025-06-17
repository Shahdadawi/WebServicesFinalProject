const role = localStorage.getItem("role");
const user = JSON.parse(localStorage.getItem("user"));


if (!user || !role || (role !== "admin")) {
    window.location.replace("index.html");
}



const baseURL = "http://127.0.0.1:8000";


document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

   
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const requester_email = currentUser?.email;

    const res = await fetch(`${baseURL}/add-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, requester_email })  
    });

    const resultBox = document.getElementById("result");

    if (res.ok) {
        resultBox.textContent = "User added successfully!";
        resultBox.classList.remove("text-danger");
        resultBox.classList.add("text-success");
        document.getElementById("addUserForm").reset();
    } else {
        const data = await res.json();
        resultBox.textContent = ` Error: ${data.detail || "Could not add user."}`;
        resultBox.classList.remove("text-success");
        resultBox.classList.add("text-danger");
    }
});
