const API_URL = "http://localhost:8080/api";
const BACKEND_URL = "http://localhost:8080";


// ==========================================
// LOAD PUBLIC PROJECTS
// ==========================================

async function loadPublicProjects() {

    const container = document.getElementById(
        "public-projects-list"
    );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/projects`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load projects"
            );
        }

        const projects = await response.json();

        container.innerHTML = "";

        if (!Array.isArray(projects) || projects.length === 0) {

            container.innerHTML = `
                <p class="empty-message">
                    Projects will be added soon.
                </p>
            `;

            return;
        }


        // ======================================
        // CREATE PROJECT CARDS
        // ======================================

        projects.forEach(function (project) {

            const card = document.createElement("div");

            card.className = "project-card";


            // ==================================
            // PROJECT IMAGE
            // ==================================

            let projectImage = "";

            if (
                project.image_path &&
                project.image_path.trim()
            ) {

                const imageUrl =
                    `${BACKEND_URL}/${project.image_path}`;

                projectImage = `
                    <div class="project-image">

                        <img
                            src="${escapeAttribute(imageUrl)}"
                            alt="${escapeAttribute(project.name)}"
                            loading="lazy"
                        >

                    </div>
                `;
            }


            // ==================================
            // GITHUB BUTTON
            // ==================================

            let githubButton = "";

            if (
                project.github_url &&
                project.github_url.trim()
            ) {

                githubButton = `
                    <a
                        href="${escapeAttribute(
                            project.github_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="project-github">

                        View on GitHub

                    </a>
                `;
            }


            // ==================================
            // TECHNOLOGIES
            // ==================================

            let technologiesHTML = "";

            if (
                project.technologies &&
                project.technologies.trim()
            ) {

                const technologies =
                    project.technologies.split(",");

                technologiesHTML = `
                    <div class="project-technologies">

                        ${technologies.map(function (technology) {

                            return `
                                <span>
                                    ${escapeHtml(
                                        technology.trim()
                                    )}
                                </span>
                            `;

                        }).join("")}

                    </div>
                `;
            }


            // ==================================
            // PROJECT CARD
            // ==================================

            card.innerHTML = `

                ${projectImage}

                <div class="project-content">

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

                    ${technologiesHTML}

                    ${githubButton}

                </div>

            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Project loading error:",
            error
        );

        container.innerHTML = `
            <p class="error-message">
                Unable to load projects.
            </p>
        `;
    }
}


// ==========================================
// LOAD PUBLIC CERTIFICATES
// ==========================================

async function loadPublicCertificates() {

    const container = document.getElementById(
        "public-certificates-list"
    );

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/certificates`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load certificates"
            );
        }

        const certificates =
            await response.json();

        container.innerHTML = "";


        if (
            !Array.isArray(certificates) ||
            certificates.length === 0
        ) {

            container.innerHTML = `
                <p class="empty-message">
                    Certificates will be added soon.
                </p>
            `;

            return;
        }


        // ======================================
        // CREATE CERTIFICATE CARDS
        // ======================================

        certificates.forEach(
            function (certificate) {

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

                    </div>

                    <div class="certificate-actions">

                        <button
                            class="view-btn"
                            type="button"
                            onclick="
                                viewCertificate(
                                    ${certificate.id}
                                )
                            ">

                            View Certificate

                        </button>

                    </div>

                `;


                container.appendChild(card);

            }
        );


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
// VIEW CERTIFICATE
// ==========================================

function viewCertificate(id) {

    window.open(
        `${API_URL}/certificates/${id}/file`,
        "_blank"
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;
}


// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

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


// ==========================================
// MOBILE HAMBURGER MENU
// ==========================================

function setupMobileMenu() {

    const menuToggle =
        document.getElementById(
            "menu-toggle"
        );

    const navMenu =
        document.getElementById(
            "nav-menu"
        );


    if (
        !menuToggle ||
        !navMenu
    ) {
        return;
    }


    // ======================================
    // OPEN / CLOSE MENU
    // ======================================

    menuToggle.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            const isOpen =
                navMenu.classList.toggle(
                    "active"
                );

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen
                    ? "true"
                    : "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );
        }
    );


    // ======================================
    // CLOSE AFTER NAV LINK
    // ======================================

    const menuLinks =
        navMenu.querySelectorAll(
            ".nav-links a"
        );


    menuLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    navMenu.classList.remove(
                        "active"
                    );

                    menuToggle.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    menuToggle.setAttribute(
                        "aria-label",
                        "Open navigation menu"
                    );
                }
            );

        }
    );


    // ======================================
    // CLOSE OUTSIDE MENU
    // ======================================

    document.addEventListener(
        "click",
        function (event) {

            const clickedInsideMenu =
                navMenu.contains(
                    event.target
                );

            const clickedMenuButton =
                menuToggle.contains(
                    event.target
                );


            if (
                !clickedInsideMenu &&
                !clickedMenuButton
            ) {

                navMenu.classList.remove(
                    "active"
                );

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                menuToggle.setAttribute(
                    "aria-label",
                    "Open navigation menu"
                );
            }
        }
    );
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadPublicProjects();

        loadPublicCertificates();

        setupMobileMenu();

    }
);