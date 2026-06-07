# Fixtur Deployment & Local Initialization Guide
This document details the precise operational steps required to initialize, configure, and boot the **Fixtur** multi-sport management and live-streaming ecosystem locally.

---

## 1. Prerequisites & System Requirements
Ensure your local environment matches or exceeds the following version constraints before starting initialization:
* **Runtime Environment:** Node.js `v20.x` or higher (LTS recommended)
* **Package Manager:** npm `v10.x` or higher
* **Database Host:** A live relational database instance (PostgreSQL / Supabase instance)

---

## 2. Step-by-Step Project Initialization

### Step 2.1: Clone & Dependency Extraction
Navigate to your local project workspace directory and run the dependency installer:
```bash
# Install core dependencies, Prisma client, and styling definitions
npm install