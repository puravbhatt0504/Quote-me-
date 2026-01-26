import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, SelectedItem, Totals } from '@/types';

// Add type definition for jspdf-autotable extension
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: {
            finalY: number;
        };
    }
}

interface GeneratePdfParams {
    selectedItems: SelectedItem[];
    totals: Totals;
    clientName: string;
    clientAddress: string;
    quotationDate: string;
    quotationTypeText: string;
    additionalNotes: string;
    applyDiscount: boolean;
    discountPercentage: number;
    includeGST: boolean;
    settings: CompanySettings;
}

export function generatePdfQuotation(params: GeneratePdfParams): void {
    const {
        selectedItems,
        totals,
        clientName,
        clientAddress,
        quotationDate,
        quotationTypeText,
        additionalNotes,
        applyDiscount,
        discountPercentage,
        includeGST,
        settings,
    } = params;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let currentY = 15;

    // Helper for centering text
    const centerText = (text: string, y: number, fontSize: number = 10, isBold: boolean = false, color: string = '#000000') => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        if (isBold) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');

        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    // --- Header ---
    centerText(settings.name, currentY, 20, true, '#c2410c'); // Orange-700
    currentY += 7;

    centerText(settings.tagline, currentY, 10, false, '#4b5563'); // Italic-ish
    currentY += 5;

    // Services text wrapped
    doc.setFontSize(9);
    doc.setTextColor('#374151');
    const servicesLines = doc.splitTextToSize(settings.services, pageWidth - 40);
    doc.text(servicesLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += (servicesLines.length * 4) + 2;

    centerText(settings.address, currentY, 9);
    currentY += 5;

    centerText(`Helpline Nos: ${settings.phone} | Email: ${settings.email}`, currentY, 9);
    currentY += 5;

    centerText(`Website: ${settings.website}`, currentY, 9);
    currentY += 5;

    centerText(`An ${settings.certification}`, currentY, 9, true);
    currentY += 10;

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // --- Meta Info (GST & Date) ---
    doc.setFontSize(10);
    doc.setTextColor('#000000');
    doc.setFont('helvetica', 'normal');

    doc.text(`GST No: ${settings.gst}`, margin, currentY);

    const dateStr = new Date(quotationDate).toLocaleDateString('en-GB').replace(/\//g, '.');
    const dateText = `Date: ${dateStr}`;
    const dateWidth = doc.getStringUnitWidth(dateText) * 10 / doc.internal.scaleFactor;
    doc.text(dateText, pageWidth - margin - dateWidth, currentY);
    currentY += 10;

    // --- Client Details ---
    doc.setFont('helvetica', 'bold');
    doc.text('To:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');

    // Handle multi-line address
    const addressLines = doc.splitTextToSize(clientAddress, pageWidth / 2);
    doc.text(addressLines, margin, currentY);
    currentY += (addressLines.length * 5) + 5;

    // --- Quotation Title ---
    centerText(quotationTypeText, currentY, 14, true, '#000000');
    // Underline
    const titleWidth = doc.getStringUnitWidth(quotationTypeText) * 14 / doc.internal.scaleFactor;
    doc.line((pageWidth - titleWidth) / 2, currentY + 1, (pageWidth + titleWidth) / 2, currentY + 1);
    currentY += 10;

    // --- Items Table ---
    const tableHeaders = ['S.N.', 'Description', 'Unit', 'Rate', 'Qty', 'Amount (INR)'];
    const tableData = selectedItems.map((item, index) => {
        // Extract original serial number from item name
        const serialMatch = item.name.match(/^([\d]+(?:\.[\d]+)?)\s+/);
        const serialNumber = serialMatch ? serialMatch[1] : String(index + 1);
        // Strip the serial number from the description
        const displayName = serialMatch ? item.name.replace(/^[\d]+(?:\.[\d]+)?\s+/, '') : item.name;
        // Check if this is a header (quantity 0)
        const isHeader = item.quantity === 0;

        return [
            serialNumber,
            displayName,
            isHeader ? '' : item.unit,
            isHeader ? '' : `Rs. ${item.rate.toLocaleString('en-IN')}`,
            isHeader ? '-' : item.quantity,
            isHeader ? '' : `Rs. ${item.amount.toLocaleString('en-IN')}`
        ];
    });

    // Footer Rows for Totals
    const footerRows = [];

    // Subtotal
    footerRows.push(['', '', '', '', 'Subtotal', `Rs. ${Math.round(totals.subtotal).toLocaleString('en-IN')}`]);

    if (applyDiscount) {
        footerRows.push(['', '', '', '', `Discount (${discountPercentage}%)`, `- Rs. ${Math.round(totals.discount).toLocaleString('en-IN')}`]);
    }

    if (includeGST) {
        footerRows.push(['', '', '', '', 'GST (18%)', `+ Rs. ${Math.round(totals.gst).toLocaleString('en-IN')}`]);
    }

    // Final Total
    const totalRow = ['', '', '', '', 'Grand Total', `Rs. ${Math.round(totals.total).toLocaleString('en-IN')}`];

    autoTable(doc, {
        startY: currentY,
        head: [tableHeaders],
        body: [...tableData, ...footerRows, totalRow],
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, // S.N.
            1: { cellWidth: 'auto' }, // Description gets remaining space
            2: { cellWidth: 20, halign: 'center' }, // Unit
            3: { cellWidth: 25, halign: 'right' }, // Rate
            4: { cellWidth: 15, halign: 'center' }, // Qty
            5: { cellWidth: 30, halign: 'right' }  // Amount
        },
        didParseCell: (data) => {
            // Style header rows specifically if needed
            if (data.section === 'body') {
                const rowIndex = data.row.index;

                // Style section headers (rows with quantity 0)
                if (rowIndex < selectedItems.length && selectedItems[rowIndex].quantity === 0) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [245, 245, 245];
                }

                // If it's one of the footer rows (after selectedItems)
                if (rowIndex >= selectedItems.length) {

                    // Highlight Grand Total row
                    if (rowIndex === selectedItems.length + footerRows.length) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [255, 247, 237]; // Light orange
                    }
                    // Bold the label cell (index 4) for footer rows
                    if (data.column.index === 4) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.halign = 'right';
                    }
                }
            }
        }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // --- Notes & Discount Info ---
    if (additionalNotes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notePrefix = 'Notes: ';
        doc.setFont('helvetica', 'bold');
        doc.text(notePrefix, margin, currentY);
        const prefixWidth = doc.getStringUnitWidth(notePrefix) * 9 / doc.internal.scaleFactor;

        doc.setFont('helvetica', 'normal');
        doc.text(additionalNotes, margin + prefixWidth, currentY);
        currentY += 5;
    }

    if (applyDiscount) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`# ${discountPercentage}% Discount has been applied on all above rates`, margin, currentY);
        currentY += 10;
    } else {
        currentY += 5;
    }

    // --- Terms & Conditions ---
    const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
    };

    checkPageBreak(50);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Terms & Conditions :', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const terms = [
        `1. GST ${includeGST ? 'is included' : 'will be extra'} on above rates as per applicable.`,
        '2. One year validity for any manufacturing defect.',
        '3. Payment 100% against billing.',
        '4. This quotation is valid for 15 days only from the date of quotation.'
        // Note: Payment mode section removed primarily, keeping basic terms
    ];

    terms.forEach((term) => {
        doc.text(term, margin, currentY);
        currentY += 5;
    });

    currentY += 10;

    // --- Signatures ---
    checkPageBreak(40);

    doc.setFontSize(10);
    doc.text('Thanks & Regards', margin, currentY);
    currentY += 15;

    const signatureY = currentY;

    // Left Signature (Company)
    doc.text(`For ${settings.name}`, margin, signatureY);

    // Right Signature (Client)
    const clientSignText = 'For Client :';
    const clientSignWidth = doc.getStringUnitWidth(clientSignText) * 10 / doc.internal.scaleFactor;
    doc.text(clientSignText, pageWidth - margin - clientSignWidth - 20, signatureY);

    currentY += 20;

    doc.setFontSize(9);
    const phone = settings.phone.split(',')[0].trim();
    doc.text(phone, margin, currentY);

    doc.text('Sign.', pageWidth - margin - clientSignWidth - 20, currentY);


    // Save file
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedClientName}_Quotation.pdf`;
    doc.save(filename);
}
