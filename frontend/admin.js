const API_URL = "https://mahesh-portfolio-no22.onrender.com/api";
let authToken = localStorage.getItem("portfolio_admin_token") || null;

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function readJsonResponse(response) {
    return response.text().then(text => {
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            console.error("Invalid JSON response:", text);
            return { message: text };
        }
    });
}

function getAuthHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function showLogin() {
    const loginSection = document.getElementById("login-section");
    const dashboardSection = document.getElementById("dashboard-section");

    if (loginSection) {
        loginSection.hidden = false;
        loginSection.style.display = "flex";
    }

    if (dashboardSection) {
        dashboardSection.hidden = true;
        dashboardSection.style.display = "none";
    }
}

function showDashboard() {
    const loginSection = document.getElementById("login-section");
    const dashboardSection = document.getElementById("dashboard-section");

    if (loginSection) {
        loginSection.hidden = true;
        loginSection.style.display = "none";
    }

    if (dashboardSection) {
        dashboardSection.hidden = false;
        dashboardSection.style.display = "block";
    }

    loadProjects();
    loadCertificates();
}

function logout() {
    authToken = null;
    localStorage.removeItem("portfolio_admin_token");
    showLogin();
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;
    const status = document.getElementById("login-status");
    const button = document.querySelector('#login-form button[type="submit"]');

    if (!username || !password) {
        if (status) status.textContent = "Please enter username and password.";
        return;
    }

    if (button) button.disabled = true;
    if (status) status.textContent = "Logging in...";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username, password }).toString()
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
            if (status) status.textContent = "Wrong username or password. Please try again.";
            const psw = document.getElementById("password");
            if (psw) psw.value = "";
            return;
        }

        if (!response.ok) {
            if (status) status.textContent = data.message || `Login failed. HTTP ${response.status}`;
            return;
        }

        if (!data.token) {
            if (status) status.textContent = "Login failed: authentication token was not received.";
            return;
        }

        authToken = data.token;
        localStorage.setItem("portfolio_admin_token", authToken);
        if (status) status.textContent = "Login successful.";

        const form = document.getElementById("login-form");
        if (form) form.reset();
        showDashboard();
    } catch (error) {
        console.error("Login error:", error);
        if (status) status.textContent = "Unable to connect to the backend. Please try again.";
    } finally {
        if (button) button.disabled = false;
    }
}

function forgotPassword() {
    const status = document.getElementById("login-status");
    if (status) {
        status.textContent = "Forgot password? Password reset is not configured yet. Please contact the portfolio administrator.";
    }
}

async function loadProjects() {
    const container = document.getElementById("admin-projects-list");
    if (!container) return;

    container.innerHTML = "<p class=\"empty-message\">Loading projects...</p>";

    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: { ...getAuthHeaders() }
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
            if (response.status === 401) {
                container.innerHTML = "<p class=\"empty-message\">Your session may have expired. Please log in again if needed.</p>";
                return;
            }

            container.innerHTML = `<p class="empty-message">Unable to load projects. HTTP ${response.status}</p>`;
            return;
        }

        if (!Array.isArray(data)) {
            container.innerHTML = "<p class=\"empty-message\">Invalid projects response from server.</p>";
            return;
        }

        if (data.length === 0) {
            container.innerHTML = "<p class=\"empty-message\">No projects added yet.</p>";
            return;
        }

        container.innerHTML = "";

        data.forEach(project => {
            const card = document.createElement("div");
            card.className = "admin-project-card";

            const image = project.image_path || project.image_url || "";
            const projectName = escapeHtml(project.name || "Untitled Project");
            const projectDescription = escapeHtml(project.description || "");
            const technologies = escapeHtml(project.technologies || "");

            card.innerHTML = `
                <div class="admin-project-content">
                    ${image ? `<img src="${escapeHtml(image)}" alt="${projectName}" class="admin-project-image" onerror="this.style.display='none';">` : ""}
                    <h3>${projectName}</h3>
                    <p>${projectDescription}</p>
                    <p><strong>Technologies:</strong> ${technologies}</p>
                    ${project.github_url ? `<p><a href="${escapeHtml(project.github_url)}" target="_blank" rel="noopener noreferrer">View GitHub</a></p>` : ""}
                    <button type="button" class="delete-project-btn" data-project-id="${project.id}">Delete</button>
                </div>
            `;

            const deleteButton = card.querySelector(".delete-project-btn");
            if (deleteButton) {
                deleteButton.addEventListener("click", () => deleteProject(project.id));
            }

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Load projects error:", error);
        container.innerHTML = "<p class=\"empty-message\">Unable to connect to the backend.</p>";
    }
}

async function addProject(event) {
    event.preventDefault();

    if (!authToken) {
        alert("Your login session has expired. Please login again.");
        logout();
        return;
    }

    const name = document.getElementById("project-name")?.value.trim() || "";
    const description = document.getElementById("project-description")?.value.trim() || "";
    const githubUrl = document.getElementById("project-github")?.value.trim() || "";
    const technologies = document.getElementById("project-technologies")?.value.trim() || "";
    const imageInput = document.getElementById("project-image");
    const submitButton = event.target.querySelector('button[type="submit"]');
    const statusBox = document.getElementById("project-status");

    if (!name || !description) {
        if (statusBox) statusBox.textContent = "Project name and description are required.";
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Adding...";
    }

    try {
        const body = new URLSearchParams();
        body.set("name", name);
        body.set("description", description);
        body.set("github_url", githubUrl);
        body.set("technologies", technologies);
        if (imageInput && imageInput.files && imageInput.files[0]) {
            body.set("image_url", imageInput.files[0].name);
        }

        const response = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body.toString()
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
            alert("Your login session has expired. Please login again.");
            logout();
            return;
        }

        if (!response.ok) {
            alert(data.message || `Failed to add project. HTTP ${response.status}`);
            return;
        }

        alert("Project added successfully.");
        event.target.reset();
        await loadProjects();
    } catch (error) {
        console.error("Add project error:", error);
        alert("Unable to connect to the backend.");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Add Project";
        }
    }
}

async function deleteProject(id) {
    if (!authToken) {
        alert("Please login again.");
        logout();
        return;
    }

    if (!confirm("Are you sure you want to delete this project?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { ...getAuthHeaders() }
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
            alert("Your login session has expired.");
            logout();
            return;
        }

        if (!response.ok) {
            alert(data.message || `Failed to delete project. HTTP ${response.status}`);
            return;
        }

        alert("Project deleted successfully.");
        await loadProjects();
    } catch (error) {
        console.error("Delete project error:", error);
        alert("Unable to connect to the backend.");
    }
}

async function loadCertificates() {
    const container = document.getElementById("admin-certificates-list");
    if (!container) return;

    container.innerHTML = "<p class=\"empty-message\">Loading certificates...</p>";

    try {
        const response = await fetch(`${API_URL}/certificates`, {
            headers: { ...getAuthHeaders() }
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
            if (response.status === 401) {
                container.innerHTML = "<p class=\"empty-message\">Your session may have expired. Please log in again if needed.</p>";
                return;
            }

            container.innerHTML = `<p class="empty-message">Unable to load certificates. HTTP ${response.status}</p>`;
            return;
        }

        if (!Array.isArray(data)) {
            container.innerHTML = "<p class=\"empty-message\">Invalid certificates response.</p>";
            return;
        }

        if (data.length === 0) {
            container.innerHTML = "<p class=\"empty-message\">No certificates uploaded yet.</p>";
            return;
        }

        container.innerHTML = "";

        data.forEach(certificate => {
            const card = document.createElement("div");
            card.className = "admin-certificate-card";

            const file = certificate.file_path || certificate.pdf_path || certificate.url || "";
            const name = escapeHtml(certificate.name || certificate.title || "Certificate");

            card.innerHTML = `
                <h3>${name}</h3>
                ${file ? `<a href="${escapeHtml(file)}" target="_blank" rel="noopener noreferrer">View Certificate</a>` : ""}
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Load certificates error:", error);
        container.innerHTML = "<p class=\"empty-message\">Unable to connect to the backend.</p>";
    }
}

async function uploadCertificate(event) {
    event.preventDefault();

    if (!authToken) {
        alert("Please login again.");
        logout();
        return;
    }

    const nameInput = document.getElementById("certificate-name");
    const fileInput = document.getElementById("certificate-file");
    const submitButton = event.target.querySelector('button[type="submit"]');

    if (!nameInput || !fileInput) {
        alert("Certificate fields were not found.");
        return;
    }

    const name = nameInput.value.trim();
    if (!name) {
        alert("Please enter certificate name.");
        return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a certificate PDF.");
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Uploading...";
    }

    try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("certificate", fileInput.files[0]);

        const response = await fetch(`${API_URL}/certificates`, {
            method: "POST",
            headers: { ...getAuthHeaders() },
            body: formData
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
            alert("Your login session has expired.");
            logout();
            return;
        }

        if (!response.ok) {
            alert(data.message || `Certificate upload failed. HTTP ${response.status}`);
            return;
        }

        alert("Certificate uploaded successfully.");
        event.target.reset();
        await loadCertificates();
    } catch (error) {
        console.error("Certificate upload error:", error);
        alert("Unable to connect to the backend.");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Upload Certificate";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.addEventListener("submit", login);

    const forgotButton = document.getElementById("forgot-password");
    if (forgotButton) forgotButton.addEventListener("click", forgotPassword);

    const projectForm = document.getElementById("project-form");
    if (projectForm) projectForm.addEventListener("submit", addProject);

    const certificateForm = document.getElementById("certificate-form");
    if (certificateForm) certificateForm.addEventListener("submit", uploadCertificate);

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) logoutButton.addEventListener("click", logout);

    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }
});
