# FinDash Pro

A modern, responsive web application that provides a role-based finance dashboard. Built with React, Tailwind CSS, and Recharts, this project demonstrates clean UI design, advanced state management, and secure role separation.

## Features

- **Role-Based Access Control**: Secure login and functionality for both Admin and Viewer roles.
- **Admin Dashboard**: Allows admins to oversee the system, manage users, inject transactions, and view platform-wide analytics.
- **Viewer Dashboard**: Provides users with personalized analytics, spending limits, expense matrices, and transaction history.
- **Dynamic Data Visualization**: Integrated Recharts for responsive line trends, pie breakdowns, and composed data analytics.
- **Pure Client Persistence**: Utilizes `localStorage` to simulate database operations, user sessions, and cross-session data persistence.
- **Data Export**: Includes client-side functionality to extract and export transaction ledgers as `.csv` files.

## Technologies Used

- **Frontend**: React 19, Vite, Tailwind CSS 3
- **Visualizations**: Recharts, Framer Motion, Lucide-React
- **Navigation**: React Router Dom
- **State Management**: Custom React Hooks

## Setup and Installation

To run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd finance-dashboard
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Run the Application:**
   ```bash
   npm run dev
   ```
   Simply open the provided localhost link (usually `http://localhost:5173`) in any modern web browser.

## Usage

- **Beginner Onboarding**: On the landing page, click "How to Use FinDash" for a quick modal guide.
- **Viewer Experience**: Log in as a Viewer to create an account, view your personalized dashboard, and analyze your transactions (which can be populated by an Admin).
- **Admin Experience**: Log in as an Admin to create an account, manage viewer profiles, and inject transaction records to test the data visualization.
- **Data Extraction**: Use the "Extract Data" feature within the dashboard to download your transaction ledger as a CSV file.
