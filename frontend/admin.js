// ============================================================
// MAHESH BAINOOR PORTFOLIO - ADMIN JAVASCRIPT
// ============================================================

const API_URL = "https://mahesh-portfolio-no22.onrender.com/api";

let authToken = localStorage.getItem("portfolio_admin_token") || null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // Login form
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }

    // Forgot password button
    const forgotButton =
        document.getElementById("forgot-password");

    if (forgotButton) {
        forgotButton.addEventListener(
            "click",
            forgotPassword
        );
    }

    // Add project form
    const projectForm =
        document.getElementById("project-form");

    if (projectForm) {
        projectForm.addEventListener(
            "submit",
            addProject
        );
    }

    // Certificate form
    const certificateForm =
        document.getElementById("certificate-form");

    if (certificateForm) {
        certificateForm.addEventListener(
            "submit",
            uploadCertificate
        );
    }

    // Logout
    const logoutButton =
        document.getElementById("logout-button");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }

    // Check existing login
    if (authToken) {
        showDashboard();
    }
});


// ============================================================
// READ JSON RESPONSE SAFELY
// ============================================================

async function readJsonResponse(response) {

    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    }
    catch (error) {

        console.error(
            "Invalid JSON response:",
            text
        );

        return {
            message: text
        };
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(event) {

    event.preventDefault();

    const usernameElement =
        document.getElementById("username");

    const passwordElement =
        document.getElementById("password");

    const status =
        document.getElementById("login-status");

    const loginButton =
        document.querySelector(
            '#login-form button[type="submit"]'
        );

    if (!usernameElement || !passwordElement) {
        return;
    }

    const username =
        usernameElement.value.trim();

    const password =
        passwordElement.value;

    if (!username || !password) {

        if (status) {
            status.textContent =
                "Please enter username and password.";
        }

        return;
    }

    if (status) {
        status.textContent =
            "Logging in...";
    }

    if (loginButton) {
        loginButton.disabled = true;
    }

    try {

        const body = new URLSearchParams();

        body.set(
            "username",
            username
        );

        body.set(
            "password",
            password
        );

        const response =
            await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: body.toString()
                }
            );

        const data =
            await readJsonResponse(response);

        // ------------------------------------------
        // WRONG USERNAME / PASSWORD
        // ------------------------------------------

        if (response.status === 401) {

            if (status) {
                status.textContent =
                    "Wrong username or password. Please try again.";
            }

            passwordElement.value = "";

            return;
        }

        // ------------------------------------------
        // OTHER ERROR
        // ------------------------------------------

        if (!response.ok) {

            if (status) {
                status.textContent =
                    data.message ||
                    `Login failed. HTTP ${response.status}`;
            }

            return;
        }

        // ------------------------------------------
        // TOKEN MISSING
        // ------------------------------------------

        if (!data.token) {

            if (status) {
                status.textContent =
                    "Login failed: authentication token was not received.";
            }

            return;
        }

        // ------------------------------------------
        // SAVE TOKEN
        // ------------------------------------------

        authToken = data.token;

        localStorage.setItem(
            "portfolio_admin_token",
            authToken
        );

        if (status) {
            status.textContent =
                "Login successful.";
        }

        // Clear login form
        const form =
            document.getElementById("login-form");

        if (form) {
            form.reset();
        }

        // Open dashboard
        showDashboard();

    }
    catch (error) {

        console.error(
            "Login error:",
            error
        );

        if (status) {
            status.textContent =
                "Unable to connect to the backend. Please try again.";
        }
    }
    finally {

        if (loginButton) {
            loginButton.disabled = false;
        }
    }
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

function forgotPassword() {

    const status =
        document.getElementById("login-status");

    if (!status) {
        return;
    }

    status.textContent =
        "Forgot password? Password reset is not configured yet. Please contact the portfolio administrator.";

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    authToken = null;

    localStorage.removeItem(
        "portfolio_admin_token"
    );

    const dashboard =
        document.getElementById("dashboard-section");

    const loginSection =
        document.getElementById("login-section");

    if (dashboard) {
        dashboard.style.display = "none";
    }

    if (loginSection) {
        loginSection.style.display = "block";
    }

    console.log("Logged out.");
}


// ============================================================
// SHOW DASHBOARD
// ============================================================

function showDashboard() {

    const loginSection =
        document.getElementById("login-section");

    const dashboardSection =
        document.getElementById("dashboard-section");

    if (loginSection) {
        loginSection.style.display = "none";
    }

    if (dashboardSection) {
        dashboardSection.style.display = "block";
    }

    loadProjects();
    loadCertificates();
}


// ============================================================
// AUTHENTICATION HEADERS
// ============================================================

function getAuthHeaders() {

    if (!authToken) {
        return {};
    }

    return {
        "Authorization":
            `Bearer ${authToken}`
    };
}


// ============================================================
// LOAD PROJECTS
// ============================================================

async function loadProjects() {

    const container =
        document.getElementById("projects-list");

    if (!container) {
        console.warn(
            "projects-list element not found."
        );

        return;
    }

    container.innerHTML =
        "<p>Loading projects...</p>";

    try {

        const response =
            await fetch(
                `${API_URL}/projects`
            );

        console.log(
            "Projects HTTP status:",
            response.status
        );

        const data =
            await readJsonResponse(response);

        console.log(
            "Projects response:",
            data
        );

        if (!response.ok) {

            container.innerHTML =
                `<p>Unable to load projects. HTTP ${response.status}</p>`;

            return;
        }

        if (!Array.isArray(data)) {

            container.innerHTML =
                "<p>Invalid projects response from server.</p>";

            return;
        }

        // ------------------------------------------
        // NO PROJECTS
        // ------------------------------------------

        if (data.length === 0) {

            container.innerHTML =
                "<p>No projects added yet.</p>";

            return;
        }

        // ------------------------------------------
        // DISPLAY PROJECTS
        // ------------------------------------------

        container.innerHTML = "";

        data.forEach(project => {

            const card =
                document.createElement("div");

            card.className =
                "admin-project-card";

            const image =
                project.image_path ||
                project.image_url ||
                "";

            card.innerHTML = `
                <div class="admin-project-content">

                    ${
                        image
                            ? `
                            <img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(project.name || "Project")}"
                                class="admin-project-image"
                                onerror="this.style.display='none';"
                            >
                            `
                            : ""
                    }

                    <h3>
                        ${escapeHtml(
                            project.name || "Untitled Project"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            project.description || ""
                        )}
                    </p>

                    <p>
                        <strong>Technologies:</strong>
                        ${escapeHtml(
                            project.technologies || ""
                        )}
                    </p>

                    ${
                        project.github_url
                            ? `
                            <p>
                                <a
                                    href="${escapeHtml(project.github_url)}"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    View GitHub
                                </a>
                            </p>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="delete-project-btn"
                        data-project-id="${project.id}">
                        Delete
                    </button>

                </div>
            `;

            const deleteButton =
                card.querySelector(
                    ".delete-project-btn"
                );

            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => deleteProject(project.id)
                );
            }

            container.appendChild(card);
        });

    }
    catch (error) {

        console.error(
            "Load projects error:",
            error
        );

        container.innerHTML =
            "<p>Unable to connect to the backend.</p>";
    }
}


// ============================================================
// ADD PROJECT
// ============================================================

async function addProject(event) {

    event.preventDefault();

    if (!authToken) {

        alert(
            "Your login session has expired. Please login again."
        );

        logout();

        return;
    }

    const form =
        event.target;

    const name =
        document.getElementById("project-name")?.value.trim() ||
        document.getElementById("name")?.value.trim() ||
        "";

    const description =
        document.getElementById("project-description")?.value.trim() ||
        document.getElementById("description")?.value.trim() ||
        "";

    const githubUrl =
        document.getElementById("github-url")?.value.trim() ||
        document.getElementById("github_url")?.value.trim() ||
        "";

    const technologies =
        document.getElementById("technologies")?.value.trim() ||
        "";

    const imageInput =
        document.getElementById("project-image") ||
        document.getElementById("image");

    if (!name || !description) {

        alert(
            "Project name and description are required."
        );

        return;
    }

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent =
            "Adding...";
    }

    try {

        /*
         * URLSearchParams correctly encodes values.
         * This is important for technologies such as C++.
         */

        const body =
            new URLSearchParams();

        body.set(
            "name",
            name
        );

        body.set(
            "description",
            description
        );

        body.set(
            "github_url",
            githubUrl
        );

        body.set(
            "technologies",
            technologies
        );

        /*
         * Your current backend returns image_path.
         *
         * If your backend accepts image_url,
         * send it here.
         */

        let imageUrl = "";

        if (imageInput && imageInput.value) {
            imageUrl =
                imageInput.value.trim();
        }

        body.set(
            "image_url",
            imageUrl
        );

        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    method: "POST",

                    headers: {
                        ...getAuthHeaders(),

                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        body.toString()
                }
            );

        console.log(
            "Add project HTTP status:",
            response.status
        );

        const data =
            await readJsonResponse(response);

        console.log(
            "Add project response:",
            data
        );

        // ------------------------------------------
        // TOKEN EXPIRED
        // ------------------------------------------

        if (response.status === 401) {

            alert(
                "Your login session has expired. Please login again."
            );

            logout();

            return;
        }

        // ------------------------------------------
        // ERROR
        // ------------------------------------------

        if (!response.ok) {

            alert(
                data.message ||
                `Failed to add project. HTTP ${response.status}`
            );

            return;
        }

        // ------------------------------------------
        // SUCCESS
        // ------------------------------------------

        alert(
            "Project added successfully."
        );

        form.reset();

        await loadProjects();

    }
    catch (error) {

        console.error(
            "Add project error:",
            error
        );

        alert(
            "Unable to connect to the backend."
        );

    }
    finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Add Project";
        }
    }
}


// ============================================================
// DELETE PROJECT
// ============================================================

async function deleteProject(id) {

    if (!authToken) {

        alert(
            "Please login again."
        );

        logout();

        return;
    }

    const confirmed =
        confirm(
            "Are you sure you want to delete this project?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/projects/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",

                    headers: {
                        ...getAuthHeaders()
                    }
                }
            );

        const data =
            await readJsonResponse(response);

        console.log(
            "Delete response:",
            data
        );

        if (response.status === 401) {

            alert(
                "Your login session has expired."
            );

            logout();

            return;
        }

        if (!response.ok) {

            alert(
                data.message ||
                `Failed to delete project. HTTP ${response.status}`
            );

            return;
        }

        alert(
            "Project deleted successfully."
        );

        loadProjects();

    }
    catch (error) {

        console.error(
            "Delete project error:",
            error
        );

        alert(
            "Unable to connect to the backend."
        );
    }
}


// ============================================================
// LOAD CERTIFICATES
// ============================================================

async function loadCertificates() {

    const container =
        document.getElementById(
            "certificates-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        "<p>Loading certificates...</p>";

    try {

        const response =
            await fetch(
                `${API_URL}/certificates`
            );

        const data =
            await readJsonResponse(response);

        if (!response.ok) {

            container.innerHTML =
                `<p>Unable to load certificates. HTTP ${response.status}</p>`;

            return;
        }

        if (!Array.isArray(data)) {

            container.innerHTML =
                "<p>Invalid certificates response.</p>";

            return;
        }

        if (data.length === 0) {

            container.innerHTML =
                "<p>No certificates uploaded yet.</p>";

            return;
        }

        container.innerHTML = "";

        data.forEach(certificate => {

            const card =
                document.createElement("div");

            card.className =
                "admin-certificate-card";

            const file =
                certificate.file_path ||
                certificate.pdf_path ||
                certificate.url ||
                "";

            card.innerHTML = `
                <h3>
                    ${escapeHtml(
                        certificate.name ||
                        certificate.title ||
                        "Certificate"
                    )}
                </h3>

                ${
                    file
                        ? `
                        <a
                            href="${escapeHtml(file)}"
                            target="_blank"
                            rel="noopener noreferrer">
                            View Certificate
                        </a>
                        `
                        : ""
                }
            `;

            container.appendChild(card);
        });

    }
    catch (error) {

        console.error(
            "Load certificates error:",
            error
        );

        container.innerHTML =
            "<p>Unable to connect to the backend.</p>";
    }
}


// ============================================================
// UPLOAD CERTIFICATE
// ============================================================

async function uploadCertificate(event) {

    event.preventDefault();

    if (!authToken) {

        alert(
            "Please login again."
        );

        logout();

        return;
    }

    const form =
        event.target;

    const nameInput =
        document.getElementById(
            "certificate-name"
        ) ||
        document.getElementById(
            "certificateName"
        );

    const fileInput =
        document.getElementById(
            "certificate-file"
        ) ||
        document.getElementById(
            "certificate"
        );

    if (!nameInput || !fileInput) {

        alert(
            "Certificate fields were not found."
        );

        return;
    }

    const name =
        nameInput.value.trim();

    if (!name) {

        alert(
            "Please enter certificate name."
        );

        return;
    }

    if (
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        alert(
            "Please select a certificate PDF."
        );

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "name",
        name
    );

    formData.append(
        "certificate",
        fileInput.files[0]
    );

    try {

        const response =
            await fetch(
                `${API_URL}/certificates`,
                {
                    method: "POST",

                    headers: {
                        ...getAuthHeaders()
                    },

                    body: formData
                }
            );

        const data =
            await readJsonResponse(response);

        if (response.status === 401) {

            alert(
                "Your login session has expired."
            );

            logout();

            return;
        }

        if (!response.ok) {

            alert(
                data.message ||
                `Certificate upload failed. HTTP ${response.status}`
            );

            return;
        }

        alert(
            "Certificate uploaded successfully."
        );

        form.reset();

        loadCertificates();

    }
    catch (error) {

        console.error(
            "Certificate upload error:",
            error
        );

        alert(
            "Unable to connect to the backend."
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}