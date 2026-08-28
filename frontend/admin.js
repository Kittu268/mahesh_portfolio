/// ==========================================
// API CONFIGURATION
// ==========================================

const API_URL =
    "https://mahesh-portfolio-no22.onrender.com/api";


// ==========================================
// AUTHENTICATION
// ==========================================

let authToken =
    localStorage.getItem("portfolio_admin_token");

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            login
        );
    }

    const logoutButton =
        document.getElementById("logout-button");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }

    const forgotButton =
        document.getElementById("forgot-password");

    if (forgotButton) {
        forgotButton.addEventListener(
            "click",
            forgotPassword
        );
    }


    // If token exists, show dashboard
    if (authToken) {
        showDashboard();
    }
    else {
        showLogin();
    }

});


// ==========================================
// LOGIN
// ==========================================

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

        console.error(
            "Username or password field not found."
        );

        return;
    }


    const username =
        usernameElement.value.trim();

    const password =
        passwordElement.value;


    if (!username || !password) {

        status.textContent =
            "Please enter username and password.";

        return;
    }


    status.textContent =
        "Logging in...";


    if (loginButton) {
        loginButton.disabled = true;
    }


    try {

        const body =
            new URLSearchParams();

        body.append(
            "username",
            username
        );

        body.append(
            "password",
            password
        );


        console.log(
            "Sending login request..."
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


        console.log(
            "Login HTTP status:",
            response.status
        );


        const responseText =
            await response.text();


        console.log(
            "Login response:",
            responseText
        );


        let data = {};

        try {

            data =
                JSON.parse(responseText);

        }
        catch (jsonError) {

            console.error(
                "Invalid JSON response:",
                jsonError
            );

            status.textContent =
                "Server returned an invalid response.";

            return;
        }


        // ======================================
        // WRONG USERNAME / PASSWORD
        // ======================================

        if (response.status === 401) {

            status.textContent =
                "Wrong username or password. Please try again.";

            passwordElement.value = "";

            return;
        }


        // ======================================
        // OTHER ERROR
        // ======================================

        if (!response.ok) {

            status.textContent =
                data.message ||
                `Login failed. HTTP ${response.status}`;

            return;
        }


        // ======================================
        // SUCCESS
        // ======================================

        if (
            data.status !== "success" ||
            !data.token
        ) {

            status.textContent =
                data.message ||
                "Login failed.";

            return;
        }


        // Save token
        authToken =
            data.token;

        localStorage.setItem(
            "portfolio_admin_token",
            authToken
        );


        status.textContent =
            "Login successful!";


        // Clear form
        document
            .getElementById("login-form")
            .reset();


        // Show dashboard
        showDashboard();

    }
    catch (error) {

        console.error(
            "Login error:",
            error
        );


        status.textContent =
            "Unable to connect to the backend. Please try again.";
    }


    finally {

        if (loginButton) {
            loginButton.disabled = false;
        }

    }

}


// ==========================================
// FORGOT PASSWORD
// ==========================================

function forgotPassword() {

    const status =
        document.getElementById("login-status");

    if (status) {

        status.textContent =
            "Forgot password? Please contact the portfolio administrator to reset the admin password.";

    }
}

// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    const loginSection =
        document.getElementById(
            "login-section"
        );

    const dashboardSection =
        document.getElementById(
            "dashboard-section"
        );


    if (loginSection) {
        loginSection.style.display =
            "block";
    }


    if (dashboardSection) {
        dashboardSection.style.display =
            "none";
    }

}


// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

    const loginSection =
        document.getElementById(
            "login-section"
        );

    const dashboardSection =
        document.getElementById(
            "dashboard-section"
        );


    if (loginSection) {
        loginSection.style.display =
            "none";
    }


    if (dashboardSection) {
        dashboardSection.style.display =
            "block";
    }


    console.log(
        "Admin dashboard opened."
    );

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    authToken = null;

    localStorage.removeItem(
        "portfolio_admin_token"
    );


    showLogin();


    const status =
        document.getElementById(
            "login-status"
        );


    if (status) {

        status.textContent =
            "Logged out successfully.";

    }

}


// ==========================================
// TEST BACKEND
// ==========================================

async function testBackend() {

    try {

        const response =
            await fetch(
                `${API_URL}/health`
            );


        const data =
            await response.json();


        console.log(
            "Backend health:",
            data
        );

    }
    catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

    }

}

// ==========================================
// AUTHORIZATION HEADER
// ==========================================

function authHeaders() {

    return {

        "Authorization":
            `Bearer ${authToken}`

    };
}


// ==========================================
// SAFE RESPONSE READER
// ==========================================

async function readJsonResponse(response) {

    const text =
        await response.text();


    if (!text) {

        return {

            status: "error",

            message:
                `Server returned HTTP ${response.status}`

        };
    }


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid JSON response:",
            text
        );


        return {

            status: "error",

            message:
                `Server returned HTTP ${response.status}`

        };
    }
}


// ==========================================
// LOAD PROJECTS
// ==========================================

async function loadProjects() {

    const container =
        document.getElementById(
            "admin-projects-list"
        );


    if (!container)
        return;


    container.innerHTML =
        "<p>Loading projects...</p>";


    try {

        const response =
            await fetch(
                `${API_URL}/projects`
            );


        const data =
            await readJsonResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to load projects (${response.status})`
            );
        }


        const projects =
            data;


        container.innerHTML = "";


        if (
            !Array.isArray(projects) ||
            projects.length === 0
        ) {

            container.innerHTML =
                "<p>No projects available.</p>";

            return;
        }


        projects.forEach(
            project => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "admin-item";


                // ======================================
                // TECHNOLOGIES
                // ======================================

                let technologyHTML = "";


                if (
                    project.technologies &&
                    project.technologies.trim()
                ) {

                    const technologies =
                        project.technologies
                            .split(",")
                            .map(
                                technology =>
                                    technology.trim()
                            )
                            .filter(
                                technology =>
                                    technology.length > 0
                            );


                    technologyHTML = `

                        <div class="project-technologies">

                            ${technologies
                                .map(
                                    technology => `

                                        <span class="technology-tag">

                                            ${escapeHtml(
                                                technology
                                            )}

                                        </span>

                                    `
                                )
                                .join("")}

                        </div>

                    `;
                }


                // ======================================
                // GITHUB
                // ======================================

                const githubHTML =
                    project.github_url
                        ? `

                            <a
                                href="${escapeAttribute(
                                    project.github_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer">

                                GitHub

                            </a>

                        `
                        : "";


                // ======================================
                // IMAGE
                // ======================================

                const imageHTML =
                    project.image_path
                        ? `

                            <div class="project-image">

                                <img
                                    src="${escapeAttribute(
                                        project.image_path
                                    )}"
                                    alt="${escapeAttribute(
                                        project.name
                                    )}">

                            </div>

                        `
                        : "";


                // ======================================
                // CARD
                // ======================================

                card.innerHTML = `

                    ${imageHTML}

                    <div class="admin-project-content">

                        <h3>
                            ${escapeHtml(
                                project.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                project.description
                            )}
                        </p>

                        ${technologyHTML}

                        ${
                            githubHTML
                                ? `

                                    <div class="project-links">

                                        ${githubHTML}

                                    </div>

                                `
                                : ""
                        }

                    </div>


                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteProject(${project.id})">

                        Delete

                    </button>

                `;


                container.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Project loading error:",
            error
        );


        container.innerHTML = `

            <p class="error-message">

                ${escapeHtml(
                    error.message ||
                    "Unable to load projects."
                )}

            </p>

        `;
    }
}


// ==========================================
// ADD PROJECT
// ==========================================

async function addProject(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "project-name"
        )
        .value
        .trim();


    const description =
        document.getElementById(
            "project-description"
        )
        .value
        .trim();


    const github =
        document.getElementById(
            "project-github"
        )
        .value
        .trim();


    const technologiesInput =
        document.getElementById(
            "project-technologies"
        );


    const technologies =
        technologiesInput
            ? technologiesInput.value.trim()
            : "";


    const imageInput =
        document.getElementById(
            "project-image"
        );


    const imageFile =
        imageInput &&
        imageInput.files.length > 0
            ? imageInput.files[0]
            : null;


    const status =
        document.getElementById(
            "project-status"
        );


    if (!name) {

        status.textContent =
            "Project name is required.";

        return;
    }


    if (!description) {

        status.textContent =
            "Project description is required.";

        return;
    }


    // ======================================
    // IMAGE VALIDATION
    // ======================================

    if (imageFile) {

        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                imageFile.type
            )
        ) {

            status.textContent =
                "Only JPG, PNG and WEBP images are allowed.";

            return;
        }


        const MAX_IMAGE_SIZE =
            5 * 1024 * 1024;


        if (
            imageFile.size >
            MAX_IMAGE_SIZE
        ) {

            status.textContent =
                "Project image is too large. Maximum size is 5 MB.";

            return;
        }
    }


    try {

        // ======================================
        // CLOUDINARY IMAGE
        // ======================================

        let imageUrl = "";


        if (imageFile) {

            status.textContent =
                "Uploading image to Cloudinary...";


            const cloudinaryForm =
                new FormData();


            cloudinaryForm.append(
                "file",
                imageFile
            );


            cloudinaryForm.append(
                "upload_preset",
                "mahesh_portfolio"
            );


            const cloudinaryResponse =
                await fetch(
                    "https://api.cloudinary.com/v1_1/duaaytnsl/image/upload",
                    {
                        method: "POST",
                        body: cloudinaryForm
                    }
                );


            const cloudinaryData =
                await cloudinaryResponse.json();


            if (!cloudinaryResponse.ok) {

                throw new Error(
                    cloudinaryData.error?.message ||
                    "Cloudinary image upload failed."
                );
            }


            imageUrl =
                cloudinaryData.secure_url ||
                cloudinaryData.url ||
                "";


            if (!imageUrl) {

                throw new Error(
                    "Cloudinary did not return an image URL."
                );
            }
        }


        // ======================================
        // SAVE PROJECT
        // ======================================

        status.textContent =
            "Saving project...";


        const body =
            new URLSearchParams();


        body.append(
            "name",
            name
        );


        body.append(
            "description",
            description
        );


        body.append(
            "github_url",
            github
        );


        body.append(
            "technologies",
            technologies
        );


        body.append(
            "image_url",
            imageUrl
        );


        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    method: "POST",

                    headers: {

                        ...authHeaders(),

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body: body
                }
            );


        const data =
            await readJsonResponse(
                response
            );


        if (response.status === 401) {

            status.textContent =
                "Session expired. Please login again.";

            logout();

            return;
        }


        if (!response.ok) {

            status.textContent =
                data.message ||
                `Failed to add project. HTTP ${response.status}`;

            return;
        }


        status.textContent =
            "Project added successfully.";


        document.getElementById(
            "project-form"
        ).reset();


        await loadProjects();


    } catch (error) {

        console.error(
            "Add project error:",
            error
        );


        status.textContent =
            error.message ||
            "Unable to add project.";
    }
}


// ==========================================
// DELETE PROJECT
// ==========================================

async function deleteProject(id) {

    if (
        !confirm(
            "Delete this project?"
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/projects/${id}`,
                {
                    method: "DELETE",

                    headers:
                        authHeaders()
                }
            );


        const data =
            await readJsonResponse(
                response
            );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            alert(
                data.message ||
                `Delete failed. HTTP ${response.status}`
            );

            return;
        }


        await loadProjects();


    } catch (error) {

        console.error(
            "Delete project error:",
            error
        );


        alert(
            "Unable to connect to backend."
        );
    }
}


// ==========================================
// LOAD CERTIFICATES
// ==========================================

async function loadCertificates() {

    const container =
        document.getElementById(
            "admin-certificates-list"
        );


    if (!container)
        return;


    container.innerHTML =
        "<p>Loading certificates...</p>";


    try {

        const response =
            await fetch(
                `${API_URL}/certificates`
            );


        const data =
            await readJsonResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to load certificates (${response.status})`
            );
        }


        const certificates =
            data;


        container.innerHTML = "";


        if (
            !Array.isArray(certificates) ||
            certificates.length === 0
        ) {

            container.innerHTML =
                "<p>No certificates available.</p>";

            return;
        }


        certificates.forEach(
            certificate => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "admin-item";


                card.innerHTML = `

                    <div>

                        <h3>
                            ${escapeHtml(
                                certificate.name
                            )}
                        </h3>

                        <p>
                            Uploaded:
                            ${formatDate(
                                certificate.uploaded_at
                            )}
                        </p>

                    </div>


                    <div class="admin-actions">

                        <button
                            type="button"
                            class="view-btn"
                            onclick="viewCertificate(${certificate.id})">

                            View

                        </button>


                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteCertificate(${certificate.id})">

                            Delete

                        </button>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "Certificate loading error:",
            error
        );


        container.innerHTML = `

            <p class="error-message">

                ${escapeHtml(
                    error.message ||
                    "Unable to load certificates."
                )}

            </p>

        `;
    }
}


// ==========================================
// UPLOAD CERTIFICATE
// ==========================================

async function uploadCertificate(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "certificate-name"
        )
        .value
        .trim();


    const file =
        document.getElementById(
            "certificate-file"
        ).files[0];


    const status =
        document.getElementById(
            "certificate-status"
        );


    if (!name) {

        status.textContent =
            "Certificate name is required.";

        return;
    }


    if (!file) {

        status.textContent =
            "Please select a PDF.";

        return;
    }


    if (
        file.type !==
        "application/pdf"
    ) {

        status.textContent =
            "Only PDF files are allowed.";

        return;
    }


    const MAX_FILE_SIZE =
        10 * 1024 * 1024;


    if (
        file.size >
        MAX_FILE_SIZE
    ) {

        status.textContent =
            "PDF is too large. Maximum size is 10 MB.";

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
        file
    );


    status.textContent =
        "Uploading...";


    try {

        const response =
            await fetch(
                `${API_URL}/certificates`,
                {
                    method: "POST",

                    headers:
                        authHeaders(),

                    body: formData
                }
            );


        const data =
            await readJsonResponse(
                response
            );


        if (response.status === 401) {

            status.textContent =
                "Session expired. Please login again.";

            logout();

            return;
        }


        if (response.status === 413) {

            status.textContent =
                "File is too large for the server.";

            return;
        }


        if (!response.ok) {

            status.textContent =
                data.message ||
                `Upload failed. HTTP ${response.status}`;

            return;
        }


        status.textContent =
            "Certificate uploaded successfully.";


        document.getElementById(
            "certificate-form"
        ).reset();


        await loadCertificates();


    } catch (error) {

        console.error(
            "Certificate upload error:",
            error
        );


        status.textContent =
            "Unable to connect to backend.";
    }
}


// ==========================================
// DELETE CERTIFICATE
// ==========================================

async function deleteCertificate(id) {

    if (
        !confirm(
            "Delete this certificate?"
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/certificates/${id}`,
                {
                    method: "DELETE",

                    headers:
                        authHeaders()
                }
            );


        const data =
            await readJsonResponse(
                response
            );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            alert(
                data.message ||
                `Delete failed. HTTP ${response.status}`
            );

            return;
        }


        await loadCertificates();


    } catch (error) {

        console.error(
            "Delete certificate error:",
            error
        );


        alert(
            "Unable to connect to backend."
        );
    }
}


// ==========================================
// VIEW CERTIFICATE
// ==========================================

function viewCertificate(id) {

    window.open(
        `${API_URL}/certificates/${id}/file`,
        "_blank"
    );
}


// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;
}


function escapeAttribute(value) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(dateString) {

    if (!dateString)
        return "";


    const date =
        new Date(
            dateString.replace(
                " ",
                "T"
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}