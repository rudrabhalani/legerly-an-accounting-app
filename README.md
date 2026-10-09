# Ledgerly – An Accounting App
> **Simple accounting for everyone.**  
> A production-quality, offline-first accounting application designed for small shopkeepers, traders, and service businesses in India.

![Ledgerly App Logo](public/logo.svg)

---

## ⚡ Core Promise
A first-time user with no accounting knowledge can record a financial transaction in **under 10 seconds with zero tutorial**.

---

## 🎨 Product & Design Principles

1. **Simple First:** One primary action per screen. Uses plain-language terminology: **"Money In"** and **"Money Out"**, never confusing "Dr/Cr" as primary labels.
2. **Colour Means Meaning:**
   - 🟢 **Emerald Green (`#16A34A`):** Money coming in (receive/credit).
   - 🔴 **Coral Red (`#DC2626`):** Money going out (pay/debit).
   - 🟠 **Amber (`#F59E0B`):** Low stock alert / due soon warnings.
   - 🟣 **Royal Indigo (`#4F46E5`):** Brand primary, transfers, and system navigation.
3. **Light and Airy:** Exclusively designed with a clean light theme (`#F8FAFC` off-white background, `#FFFFFF` rounded card surfaces, `#E2E8F0` subtle borders).
4. **Thumb-Friendly:** Primary actions placed within the bottom 40% of the screen. Minimum tap targets of 48px.
5. **Trustworthy Integer Arithmetic:** All monetary amounts are stored strictly as **integers in Paise** (1 Rupee = 100 paise), eliminating all floating-point rounding errors.
6. **Offline-First:** Instant local persistence with zero network latency, instant search, and complete data ownership.

---

## 📱 Navigation & Key Features

### 1. Home Dashboard
- Business greeting + owner name with flexible date filter (*Today, This Week, This Month, This Year, All Time*).
- **Three Balance Cards:**
  - **Total Balance:** Aggregate of Cash + all Bank accounts.
  - **Cash in Hand:** Physical register cash balance.
  - **Bank Balance:** Expandable dropdown listing SBI, HDFC, ICICI, etc., with one-tap Passbook access.
- **Cash Flow Summary:** Visual bar comparison of Money In vs. Money Out for the selected period.
- **To Receive vs. To Pay:** Instant summary of total customer receivables and supplier payables.
- **Amber Low Stock Alert Strip:** Direct alert when any item dips below minimum threshold.
- **Recent Transactions (Last 10):** Quick timeline with tap-to-inspect.
- **Sticky Bottom Floating Bar:** Large `+ Money In` (Green) and `− Money Out` (Red) buttons, always reachable.

### 2. Money In (Receive Money)
- Massive numeric input with auto-focus.
- Segmented control: `[ 💵 Cash | 🏦 Bank ]`.
- Bank selection chips (SBI, HDFC, ICICI, Axis, PNB, BoB, Kotak, Canara, Union, etc.).
- Payment mode chips: UPI, NEFT/RTGS, IMPS, Cheque, Card.
- Searchable Customer dropdown with inline `+ Add new party`.
- Auto-defaults to today's date and current time.
- Category tags (*Sales, Payment received, Loan, Capital, Other*).
- Micro-celebration animation, receipt share to WhatsApp, and `Save & Add Another`.

### 3. Money Out (Pay Money)
- Consistent red-accented layout for payments.
- Overdraft warning: Prompts confirmation before cash balance can dip below zero.
- Category tags (*Purchase, Rent, Salary, Electricity, Transport, Food, Other expense*).

### 4. Parties & Ledger
- Tabs: `[ All | Customers | Suppliers ]`.
- Dynamic color-coded status badges:
  - 🟢 **You'll get ₹X** (Customer owes you)
  - 🔴 **You'll give ₹X** (You owe supplier)
- **Passbook Ledger View:** Chronological statement showing Date, Description, Debit, Credit, and Running Balance.
- **1-Tap WhatsApp Actions:** Call button, WhatsApp reminder with auto-drafted message, and instant PDF statement download.
- Pre-filled `+ Money In` and `− Money Out` buttons directly inside each party's ledger.

### 5. Bank Accounts & Cash Book Passbook
- Passbook running balance view for every individual bank and physical cash.
- **Account Transfer:** Move money neutrally between Cash and Bank or between Bank accounts (never impacts Profit & Loss).
- **Passbook Reconciliation Calculator:** Compare Ledgerly book balance against actual physical bank statements to detect missing entries.

### 6. Invoices & Billing (Vyapar-Style)
- Create Sale Invoices, Purchase Bills, Quotations, Challans, and Returns.
- Auto-incrementing invoice numbering, item lines with discount % and GST %.
- Instant payment settlement toggle (Cash/Bank) with auto-computed balance due.
- **Professional PDF Generation:** Auto-generates clean tax invoice PDFs using `jspdf` and `jspdf-autotable`.

### 7. Inventory & Stock Management
- Real-time stock counts with purchase cost, sale price, and total inventory valuation.
- Low-stock badge triggered automatically when stock drops below minimum threshold.
- Sales automatically decrement stock; purchases automatically increment stock.
- Manual Stock Adjustment with audit reasons (*Damage, Breakage, Correction, Return*).
- Export inventory to Excel (`.xlsx`).

### 8. Comprehensive Accounting Reports
- **Profit & Loss Statement (P&L):** Accurate operating profit excluding capital transfers.
- **Day Book:** Chronological daily ledger grouping.
- **Aging Analysis:** Receivables and Payables divided into 0–30 days, 31–60 days, 61–90 days, and 90+ days.
- **Simplified Balance Sheet:** Total Assets (Cash + Banks + Receivables + Stock) vs. Liabilities (Payables) & Net Worth.
- **Expense Breakdown:** Categorized expenditure breakdown.
- Export all reports to **PDF** and **Excel (.xlsx)** via SheetJS.

### 9. Multi-Language & Security
- Complete translations for **English**, **हिन्दी (Hindi)**, and **ગુજરાતી (Gujarati)**.
- Secure 4-digit **PIN App Lock** with on-screen numeric keypad.
- Full offline **JSON Backup & Restore** utility.

---

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (Light theme design tokens, tabular numerals)
- **State Management:** Zustand with local offline persistence middleware
- **Icons:** Lucide React
- **PDF Generation:** jsPDF + jsPDF-AutoTable
- **Spreadsheet Export:** SheetJS (`xlsx`)
- **Micro-animations:** Canvas-Confetti
- **Testing:** Vitest (100% test pass on accounting engine)
- **Mobile Container:** Capacitor (`@capacitor/core`, `@capacitor/cli`)

---

## 📁 Project Structure

```
legerly-an-accounting-app/
├── public/
│   ├── favicon.svg              # App favicon
│   ├── icon.svg                 # Vector app icon
│   ├── icon-1024.svg            # 1024x1024 store icon
│   ├── logo.svg                 # Primary logo with wordmark
│   ├── logo-monochrome-dark.svg # Dark monochrome vector
│   └── logo-monochrome-light.svg# Light monochrome vector
├── src/
│   ├── components/
│   │   ├── brand/               # LedgerlyLogo, SplashScreen
│   │   ├── common/              # AmountDisplay, BankChip, EmptyState, ToastSnackbar
│   │   ├── layout/              # TopAppBar, BottomNavigation, HomeStickyBottomBar, QuickAddSheet
│   │   └── modals/              # MoneyInModal, MoneyOutModal, TransferModal, PartyModal,
│   │                            # ItemModal, InvoiceModal, ReconcileModal, SettingsModal,
│   │                            # OnboardingModal, PinLockScreen
│   ├── constants/
│   │   └── designTokens.ts      # Colors, typography, radius, shadows
│   ├── data/
│   │   └── seedData.ts          # Realistic Indian merchant demo data
│   ├── i18n/
│   │   └── translations.ts      # English, Hindi, and Gujarati dictionaries
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main dashboard & balance cards
│   │   ├── PartiesScreen.tsx    # Customer & supplier khata list
│   │   ├── PartyLedgerScreen.tsx# Passbook statement & WhatsApp reminders
│   │   ├── AccountLedgerScreen.tsx# Bank & cash passbooks with reconciliation
│   │   ├── StockScreen.tsx      # Inventory management & adjustments
│   │   └── ReportsScreen.tsx    # P&L, Day Book, Aging, Balance Sheet
│   ├── services/
│   │   ├── pdfService.ts        # Tax invoices & ledger PDF export
│   │   └── excelService.ts      # SheetJS .xlsx export
│   ├── store/
│   │   └── useLedgerlyStore.ts  # Zustand store with offline persistence
│   ├── tests/
│   │   └── accounting.test.ts   # Double-entry & balance calculation unit tests
│   ├── types/
│   │   └── index.ts             # Domain models (all amounts in paise)
│   ├── utils/
│   │   ├── accounting.ts        # Pure accounting computation engine
│   │   └── formatters.ts        # Indian numbering (₹1,25,000.00) & date utilities
│   ├── App.tsx                  # Root application router
│   ├── index.css                # Tailwind directives & base styles
│   └── main.tsx                 # Vite application entry
├── capacitor.config.ts          # Mobile build configuration
├── tailwind.config.js           # Design system configuration
├── vite.config.ts               # Vite configuration
└── PLAY_STORE_LISTING.md        # Play Store / App Store metadata & screenshot plan
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to view the live application.

### 3. Run Accounting Unit Tests
```bash
npm test
```
Runs the Vitest test suite verifying:
- Integer paise arithmetic without floating-point errors.
- Double-entry balance calculation for Cash and Banks.
- Cash-to-bank transfers excluded from P&L.
- Party ledger running balances.
- Stock movements and low-stock detection.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.

---

## 📱 Mobile Release (Android & iOS via Capacitor)

Ledgerly is pre-configured with Capacitor to package directly into native mobile applications:

1. **Add Android Platform:**
   ```bash
   npx cap add android
   npx cap copy
   ```
2. **Open in Android Studio & Generate APK/AAB:**
   ```bash
   npx cap open android
   ```
3. **Add iOS Platform (on macOS):**
   ```bash
   npx cap add ios
   npx cap open ios
   ```

---

## 📄 License
MIT License. Built for Bharat 🇮🇳.
