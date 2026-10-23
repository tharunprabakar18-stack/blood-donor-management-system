# LifeDrop - Clean Blood Donor & Medical Inventory Management System

**LifeDrop** is a healthcare blood donor registry, donation tracking, and blood-bank inventory management web application built with vanilla **HTML5**, **CSS3**, and **modern JavaScript**. Styled with a medical aesthetic—featuring clinical white backgrounds (`#FFFFFF`, `#F8FAFC`), vital crimson-red accents (`#DC2626`, `#B91C1C`), blood-group tiles across all 8 ABO/Rh types, donor cards with privacy masking, indicative 56-day rest cycle calculations, and low-stock critical buffers.

---

> [!IMPORTANT]
> **Clinical Simulation & Academic Demonstration Disclaimer**  
> All donor profiles, inventory counts, and eligibility indicators in this application are simulated for software demonstration and academic training purposes only. They do not represent real-time clinical blood-bank supplies or certified medical clearance.

---

## 🩸 Key Features

### 1. **Blood Group Inventory Tiles (8 Types)**
- High-contrast visual tiles for all 8 blood groups: **A+**, **A-**, **B+**, **B-**, **AB+**, **AB-**, **O+**, **O-**.
- Displays current units in cold-chain stock alongside the count of registered donors.
- **Critical Low Buffer Indicator:** Automatically flags any blood group with &le; 5 units with a glowing `CRITICAL LOW` pill and triggers the top medical alert banner.
- **Universal Tags:** Highlights `O-` as the Universal RBC Donor and `AB+` as the Universal RBC Recipient.
- **Interactive Quick Filter:** Clicking any blood group tile automatically filters the donor directory to that group.

### 2. **Donor Registration & Privacy Masking**
- Record voluntary donor details: Full name, verified blood group, age (18–65 restriction), phone number, email address, city/metropolitan area, previous donation date, and health notes.
- Automatically assigns a formatted Donor ID: `DON-2026-XXX`.
- **Contact Privacy Masking:** Phone numbers on the public registry are masked by default (e.g. `+1 (555) ***-9014`) with a toggle option for authorized clinical staff to reveal contacts.

### 3. **Indicative 56-Day Rest Cycle Calculation**
- Implements the standard 56-day whole-blood rest rule between consecutive donations.
- Evaluates donor status dynamically:
  - 🟢 **Eligible to Donate:** 56+ days elapsed since last donation, or first-time donor.
  - 🟡 **Resting Period:** Shows the remaining days and the exact projected calendar date when the donor becomes eligible again.

### 4. **Donation Event Recording & Stock Synchronization**
- Log complete phlebotomy events: Select registered donor, collection date, units drawn (450 mL pints), facility (hospital, blood bank, or campus blood drive), donor hemoglobin (g/dL), and blood pressure vitals.
- **Automatic Stock Updates:**
  - Automatically updates the donor's `lastDonationDate`, resetting their 56-day eligibility countdown.
  - Automatically increments the corresponding blood group's inventory count.
  - Recalculates KPI metrics and low-stock buffers in real-time.

### 5. **Blood Inventory Simulation & Low-Stock Alerts**
- Dedicated stock management table displaying units, stock health meter, and compatibility notes.
- Quick `+ Stock` and `- Transfuse` buttons to simulate real-world inventory consumption and emergency blood-bank drawdowns.

### 6. **Transfusion Compatibility Reference Guide**
- Comprehensive matrix detailing red blood cell (RBC) compatibility: which groups can donate to and receive from specific blood types.

### 7. **Local Storage & CSV Export**
- All donors, inventory changes, and donation event logs persist locally via browser `localStorage`.
- One-click **Export CSV** (`lifedrop-donors-registry-[YYYY-MM-DD].csv`).
- **"Reset Demo Data"** button to restore seed data anytime.

---

## 📁 Project Directory Structure

```text
blood-donor-management-system/
├── index.html       # Semantic HTML5 layout with tiles, modals, and tables
├── style.css        # Clean healthcare white theme, crimson accents, and responsive layout
├── script.js        # Donor registry, 56-day rest calculator, inventory synchronization & CSV export
└── README.md        # Documentation and Windows run guide
```

---

## 🚀 How to Run on Windows

LifeDrop is a client-side web application requiring no external database or npm packages.

### Option 1: Direct File Launch (Instant)
1. Open Windows File Explorer and navigate to:
   ```cmd
   explorer "c:\Users\THARUN\Downloads\tharun projects\blood-donor-management-system"
   ```
2. Double-click **`index.html`** or right-click &rarr; **Open with** &rarr; **Google Chrome** (or **Microsoft Edge**).

### Option 2: Python Local Web Server (Recommended)
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd "c:\Users\THARUN\Downloads\tharun projects\blood-donor-management-system"
   ```
2. Start the lightweight local server on port 8110:
   ```powershell
   python -m http.server 8110
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8110
   ```

---

## 🧪 Verification & Automated Testing
- Validated with automated DOM integrity tests ensuring 100% element ID alignment.
- Verified 56-day eligibility calculation logic for past donors and first-time donors.
- Verified stock incrementing upon recording a donation event.
- Tested responsive views across mobile and desktop breakpoints.
