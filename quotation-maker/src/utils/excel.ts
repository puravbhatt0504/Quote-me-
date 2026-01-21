import ExcelJS from 'exceljs';
import { SelectedItem, CompanySettings, Totals } from '@/types';

export function formatDate(date: string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

export function formatCurrency(amount: number): string {
    return `₹ ${Math.round(amount).toLocaleString('en-IN')}`;
}

interface GenerateExcelParams {
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

export async function generateExcelQuotation(params: GenerateExcelParams): Promise<void> {
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(quotationTypeText.substring(0, 31));

    // Set column widths
    worksheet.columns = [
        { width: 8 },   // S.N.
        { width: 45 },  // Description
        { width: 10 },  // Unit
        { width: 15 },  // Rate
        { width: 8 },   // Qty
        { width: 18 }   // Amount
    ];

    let rowNum = 1;

    // Company Header
    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    const companyCell = worksheet.getCell(`A${rowNum}`);
    companyCell.value = settings.name;
    companyCell.font = { bold: true, size: 16, color: { argb: 'FFC2410C' } };
    companyCell.alignment = { horizontal: 'center' };
    rowNum++;

    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = settings.tagline;
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${rowNum}`).font = { italic: true };
    rowNum++;

    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = settings.services;
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center', wrapText: true };
    worksheet.getCell(`A${rowNum}`).font = { size: 9 };
    rowNum++;

    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = settings.address;
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${rowNum}`).font = { size: 9 };
    rowNum++;

    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = `Helpline Nos: ${settings.phone} | Email: ${settings.email} | Website: ${settings.website}`;
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${rowNum}`).font = { size: 9 };
    rowNum++;

    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = `An ${settings.certification}`;
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 9 };
    rowNum++;

    // GST and Date row
    worksheet.getCell(`A${rowNum}`).value = `GST No:- ${settings.gst}`;
    worksheet.getCell(`E${rowNum}`).value = formatDate(quotationDate);
    rowNum++;

    rowNum++; // Empty row

    // Client details
    worksheet.getCell(`A${rowNum}`).value = 'To';
    rowNum++;
    worksheet.getCell(`A${rowNum}`).value = clientName;
    worksheet.getCell(`A${rowNum}`).font = { bold: true };
    rowNum++;
    if (clientAddress) {
        worksheet.getCell(`A${rowNum}`).value = clientAddress;
        rowNum++;
    }

    rowNum++; // Empty row

    // Quotation title
    worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
    worksheet.getCell(`A${rowNum}`).value = quotationTypeText;
    worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center' };
    rowNum++;

    rowNum++; // Empty row

    // Table header
    const headerRow = worksheet.getRow(rowNum);
    headerRow.values = ['S.N.', 'Description', 'Unit', 'Rate', 'Qty', 'Amount(INR)'];
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    rowNum++;

    // Items
    selectedItems.forEach((item, index) => {
        const itemRow = worksheet.getRow(rowNum);
        itemRow.values = [
            index + 1,
            item.name,
            item.unit,
            item.rate,
            item.quantity,
            item.amount
        ];
        itemRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        rowNum++;
    });

    // Subtotal row
    const subtotalRow = worksheet.getRow(rowNum);
    subtotalRow.values = ['', '', '', '', 'Subtotal', Math.round(totals.subtotal)];
    subtotalRow.font = { bold: true };
    rowNum++;

    // Discount row if applicable
    if (applyDiscount) {
        const discountRow = worksheet.getRow(rowNum);
        discountRow.values = ['', '', '', '', `Discount (${discountPercentage}%)`, -Math.round(totals.discount)];
        rowNum++;
    }

    // GST row if applicable
    if (includeGST) {
        const gstRow = worksheet.getRow(rowNum);
        gstRow.values = ['', '', '', '', 'GST (18%)', Math.round(totals.gst)];
        rowNum++;
    }

    // Total row
    const totalRow = worksheet.getRow(rowNum);
    totalRow.values = ['', '', '', '', 'Total', Math.round(totals.total)];
    totalRow.font = { bold: true, size: 12 };
    totalRow.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF7ED' }
    };
    rowNum++;

    rowNum++; // Empty row

    // Notes if any
    if (additionalNotes) {
        worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
        worksheet.getCell(`A${rowNum}`).value = `Notes: ${additionalNotes}`;
        rowNum++;
    }

    // Discount note
    if (applyDiscount) {
        worksheet.mergeCells(`A${rowNum}:F${rowNum}`);
        worksheet.getCell(`A${rowNum}`).value = `#${discountPercentage}% Discount has been applied on all above rates`;
        rowNum++;
    }

    rowNum++; // Empty row

    // Terms & Conditions
    worksheet.getCell(`A${rowNum}`).value = 'Terms & Conditions :-';
    worksheet.getCell(`A${rowNum}`).font = { bold: true };
    rowNum++;

    worksheet.getCell(`A${rowNum}`).value = '1';
    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = `GST ${includeGST ? 'is included' : 'will be extra'} on above rates as per applicable. One year validity for any manufacturing defect. Payment 100% against billing. Quotation is valid for 15 days.`;
    worksheet.getCell(`B${rowNum}`).alignment = { wrapText: true };
    rowNum++;

    worksheet.getCell(`A${rowNum}`).value = '2';
    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = 'Mode of Payment :- Through Cheque / NEFT / RTGS / DD.';
    rowNum++;

    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = `Bank Name : ${settings.bankName}`;
    rowNum++;

    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = `Add. - ${settings.bankBranch}`;
    rowNum++;

    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = `A/C No. : ${settings.accountNumber}`;
    rowNum++;

    worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
    worksheet.getCell(`B${rowNum}`).value = `IFSC Code : ${settings.ifscCode}`;
    rowNum++;

    rowNum++; // Empty row

    worksheet.getCell(`A${rowNum}`).value = 'Thanks & Regards';
    rowNum += 2;

    // Signature section
    worksheet.getCell(`A${rowNum}`).value = `For ${settings.name}`;
    worksheet.getCell(`E${rowNum}`).value = 'For Client :-';
    rowNum++;

    worksheet.getCell(`A${rowNum}`).value = settings.phone.split(',')[0];
    worksheet.getCell(`E${rowNum}`).value = 'Sign.';

    // Generate filename
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = formatDate(quotationDate).replace(/\./g, '-');
    const filename = `${sanitizedClientName}_Quotation_${dateStr}.xlsx`;

    // Write and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
