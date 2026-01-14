# elite24-crm

Production-ready CRM MVP built for real operations: **lead management + task automation + user system**, running on **Node.js + PostgreSQL**, deployed on **Render**.

This repo exists as a proof asset: **rapid MVP delivery (4–6 weeks)** with a scalable backend foundation and clean deployment workflow.

---

## What it does

- **Lead management**: capture, update, and track leads through your pipeline
- **Task automation**: assign and manage operational tasks tied to leads/customers
- **User system**: authentication + user access workflow (roles/permissions as applicable)
- **Cloud deployment**: production deployment on Render with PostgreSQL

> Next planned layer: **observability + cost optimization** to showcase AI Ops thinking.

---

## Tech stack

- **Backend:** Node.js (API service)
- **Database:** PostgreSQL
- **Frontend:** React (Vite)
- **Hosting:** Render (web service + Postgres)

> If your repo uses Prisma, keep it. If not, remove Prisma references below.

---

## Repo structure (adjust if different)

A common layout:

- `/server` — Node API + DB layer
- `/client` — React UI (Vite)
- `/docs` — architecture notes (optional)

---

## Local setup

### Prerequisites
- Node.js 18+ (recommended)
- PostgreSQL 14+ (local or hosted)
- npm / pnpm / yarn (your choice)

### 1) Clone + install
```bash
git clone https://github.com/JMORAF87/elite24-crm.git
cd elite24-crm
# If monorepo:
# npm install
# If split:
# cd server && npm install
# cd ../client && npm install
