const API_URL = "https://mahesh-portfolio-no22.onrender.com/api";


// ==========================================
// PROJECTS
// ==========================================

async function loadProjects() {

    const container =
        document.getElementById("projects-list");

    if (!container) return;

    try {

        const response =
            await fetch(`${API_URL}/projects`);

        const projects =
            await response.json();

        container.innerHTML = "";

        if (projects.length === 0) {

            container.innerHTML = `
                <p class="empty-message">
                    No projects added yet.
                </p>
            `;

            return;
        }

        projects.forEach(project => {

            const card =
                document.createElement("div");

            card.className = "project-card";

            card.innerHTML = `
                <div>
                    <h3>
                        ${escapeHtml(project.name)}
                    </h3>

                    <p>
                        ${escapeHtml(project.description)}
                    </p>

                    ${
                        project.github_url
                        ? `
                        <a
                            href="${escapeAttribute(project.github_url)}"
                            target="_blank"
                            rel="noopener noreferrer">
                            View on GitHub
                        </a>
                        `
                        : ""
                    }
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteProject(${project.id})">
                    Delete
                </button>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error("Project loading error:", error);

        container.innerHTML = `
            <p class="error-message">
                Unable to load projects.
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
        document.getElementById("project-name").value.trim();

    const description =
        document.getElementById("project-description").value.trim();

    const github =
        document.getElementById("project-github").value.trim();

    const status =
        document.getElementById("project-status");


    if (!name || !description) {

        status.textContent =
            "Project name and description are required.";

        return;
    }


    const formData =
        new URLSearchParams();

    formData.append("name", name);
    formData.append("description", description);
    formData.append("github_url", github);


    status.textContent =
        "Adding project...";


    try {

        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            status.textContent =
                result.message ||
                "Unable to add project.";

            return;
        }


        status.textContent =
            "Project added successfully!";


        document.getElementById("project-form").reset();

        await loadProjects();

    } catch (error) {

        console.error("Project upload error:", error);

        status.textContent =
            "Unable to connect to C++ backend.";
    }
}


// ==========================================
// DELETE PROJECT
// ==========================================

async function deleteProject(id) {

    if (!confirm("Delete this project?"))
        return;


    try {

        const response =
            await fetch(
                `${API_URL}/projects/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Delete failed."
            );

            return;
        }


        await loadProjects();

    } catch (error) {

        console.error("Delete project error:", error);

        alert(
            "Unable to connect to C++ backend."
        );
    }
}


// ==========================================
// CERTIFICATES
// ==========================================

async function loadCertificates() {

    const container =
        document.getElementById("certificates-list");

    if (!container) return;

    try {

        const response =
            await fetch(`${API_URL}/certificates`);

        const certificates =
            await response.json();

        container.innerHTML = "";

        if (certificates.length === 0) {

            container.innerHTML = `
                <p class="empty-message">
                    No certificates uploaded yet.
                </p>
            `;

            return;
        }


        certificates.forEach(certificate => {

            const card =
                document.createElement("div");

            card.className =
                "certificate-card";

            card.innerHTML = `
                <div class="certificate-info">

                    <div class="certificate-icon">
                        PDF
                    </div>

                    <div>
                        <h3>
                            ${escapeHtml(certificate.name)}
                        </h3>

                        <p>
                            Uploaded:
                            ${formatDate(certificate.uploaded_at)}
                        </p>
                    </div>

                </div>

                <div class="certificate-actions">

                    <button
                        class="view-btn"
                        onclick="viewCertificate(${certificate.id})">
                        View
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteCertificate(${certificate.id})">
                        Delete
                    </button>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Certificate loading error:",
            error
        );

        container.innerHTML = `
            <p class="error-message">
                Unable to load certificates.
            </p>
        `;
    }
}


// ==========================================
// UPLOAD CERTIFICATE
// ==========================================

async function uploadCertificate(event) {

    event.preventDefault();

    const nameInput =
        document.getElementById("certificate-name");

    const fileInput =
        document.getElementById("certificate-file");

    const status =
        document.getElementById("upload-status");


    const name =
        nameInput.value.trim();

    const file =
        fileInput.files[0];


    if (!name) {

        status.textContent =
            "Please enter certificate name.";

        return;
    }


    if (!file) {

        status.textContent =
            "Please select a PDF file.";

        return;
    }


    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        status.textContent =
            "Only PDF files are allowed.";

        return;
    }


    const formData =
        new FormData();

    formData.append("name", name);
    formData.append("certificate", file);


    status.textContent =
        "Uploading...";


    try {

        const response =
            await fetch(
                `${API_URL}/certificates`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            status.textContent =
                result.message ||
                "Upload failed.";

            return;
        }


        status.textContent =
            "Certificate uploaded successfully!";

        nameInput.value = "";
        fileInput.value = "";

        await loadCertificates();

    } catch (error) {

        console.error("Upload error:", error);

        status.textContent =
            "Unable to connect to C++ backend.";
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
// DELETE CERTIFICATE
// ==========================================

async function deleteCertificate(id) {

    if (!confirm(
        "Are you sure you want to delete this certificate?"
    ))
        return;


    try {

        const response =
            await fetch(
                `${API_URL}/certificates/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.message ||
                "Delete failed."
            );

            return;
        }


        await loadCertificates();

    } catch (error) {

        console.error("Delete error:", error);

        alert(
            "Unable to connect to C++ backend."
        );
    }
}


// ==========================================
// HELPERS
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


function escapeAttribute(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


function formatDate(dateString) {

    if (!dateString)
        return "";

    const date =
        new Date(
            dateString.replace(" ", "T")
        );

    if (Number.isNaN(date.getTime()))
        return dateString;

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProjects();
        loadCertificates();


        const projectForm =
            document.getElementById(
                "project-form"
            );

        if (projectForm) {

            projectForm.addEventListener(
                "submit",
                addProject
            );
        }


        const certificateForm =
            document.getElementById(
                "certificate-form"
            );

        if (certificateForm) {

            certificateForm.addEventListener(
                "submit",
                uploadCertificate
            );
        }

    }
);