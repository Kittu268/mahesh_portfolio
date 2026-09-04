#                               mahesh_portfolio
#             C++ Backend
#                   │
#                SQLite
#                   │
#       ┌───────────┴───────────┐
#       │                       │
#   Admin Dashboard        Public Portfolio
#   /admin.html             /index.html
#        │                       │
#   Add/Delete              View only
#   Projects                Projects
#  Certificates            Certificates
# HOW ADMIN PAGE WORKS BY UPLOADING THE CERTIFICATE
#           ```text
#       Admin uploads certificate
#               ↓
#           SQLite + uploads/
#               ↓
#           Public portfolio
#               ↓
#      Certificate appears automatically
#        ```
#        ```text
#       Admin uploads PROJECTS
#               ↓
#       SQLite + uploads/
#               ↓
#       Public portfolio
#               ↓
#    PROJECTS appears automatically
#  ```
#   That's the right architecture for the portfolio you're building.
# 
#
#
#
#                 ┌─────────────────┐
#                 │     Browser     │
#                 │ HTML/CSS/JS     │
#                 └────────┬────────┘
#                          │ HTTP
#                          ▼
#                 ┌─────────────────┐
#                 │   C++ Server    │
#                 │                 │
#                 │ /api/projects   │
#                 │ /api/certs      │
#                 │ /api/contact    │
#                 └────────┬────────┘
#                          │
#                 ┌────────▼────────┐
#                 │     SQLite      │
#                 │   portfolio.db  │
#                 └─────────────────┘










