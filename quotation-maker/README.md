# Quotation Maker

A professional web application for generating fire safety equipment quotations. Built with Next.js and Tailwind CSS.

## Features

- **Dynamic Product Selection**: Browse and select items from a categorized product catalog.
- **Real-time Calculations**: Automatic calculation of subtotals, discounts, and GST.
- **AI-Powered Quotation Import** ✨ NEW:
  - Upload PDFs or images of existing quotations
  - Automatic extraction of client details, items, quantities, and prices
  - Preview extracted data before applying
  - Powered by Google Gemini AI
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
- **AI**: Google Gemini API (for quotation import)

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    # Copy the example file
    cp .env.local.example .env.local
    
    # Edit .env.local and add your Gemini API key
    # Get your API key from: https://aistudio.google.com/app/apikey
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using the Quotation Import Feature

1. Click the **"Import Quotation"** button on the main page
2. Upload a PDF or image file containing a quotation (supports JPEG, PNG, WebP, GIF)
3. Wait for the AI to extract the data (this may take a few seconds)
4. Review the extracted data including:
   - Client name and address
   - List of items with quantities and prices
   - Totals and tax amounts
5. Click **"Apply to Quotation"** to populate the form with the extracted data

## Customization

You can update company details, product catalog, and other settings in the source code:
- **Company Settings**: `src/store/QuotationContext.tsx` or `src/data/products.ts`
- **Product Catalog**: `src/data/products.ts`


