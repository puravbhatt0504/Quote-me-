# Quotation Maker

A professional web application for generating fire safety equipment quotations. Built with Next.js and Tailwind CSS.

## Features

- **Dynamic Product Selection**: Browse and select items from a categorized product catalog.
- **Real-time Calculations**: Automatic calculation of subtotals, discounts, and GST.
- **Customizable Options**:
  - Adjustable discount percentage.
  - Optional GST inclusion.
  - Custom remarks/notes.
- **Preview & Export**:
  - Live preview of the quotation with company branding.
  - **Excel Export**: Download professional invoices in Excel format.
- **Responsive Design**: Optimized for both desktop and tablet use.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **State Management**: React Context API
- **Icons**: Lucide React
- **Export**: ExcelJS

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

You can update company details, product catalog, and other settings in the source code:
- **Company Settings**: `src/store/QuotationContext.tsx` or `src/data/products.ts`
- **Product Catalog**: `src/data/products.ts`

