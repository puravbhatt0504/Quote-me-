"""
Comprehensive Quotation Analysis Script
Scans all 1600+ quotation files to extract:
- All unique products and their rates
- Rate variations over time
- Different quotation formats/templates
- All categories
"""

import os
import xlrd
import json
from collections import defaultdict
from datetime import datetime
import re

# Path to quotation files
QUOTATION_DIR = r"e:\Projects\quotation maker\for purav"
OUTPUT_FILE = r"e:\Projects\quotation maker\comprehensive_analysis_results.json"
REPORT_FILE = r"e:\Projects\quotation maker\analysis_report.txt"

# Data structures
products = defaultdict(lambda: {
    'rates': [],
    'units': set(),
    'categories': set(),
    'occurrences': 0,
    'files': []
})

quotation_formats = defaultdict(int)
categories_found = set()
company_info_variants = []
terms_conditions = set()
date_patterns = []
errors = []
processed_count = 0
total_files = 0

def extract_date_from_filename(filename):
    """Try to extract date from filename patterns"""
    patterns = [
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
        r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, filename)
        if match:
            return match.group(1)
    return None

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    text = str(text).strip()
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def extract_rate(cell_value):
    """Extract numeric rate from cell value"""
    if isinstance(cell_value, (int, float)):
        return float(cell_value)
    if isinstance(cell_value, str):
        # Remove currency symbols and clean
        cleaned = re.sub(r'[₹Rs.,\s]', '', cell_value)
        try:
            return float(cleaned)
        except:
            return None
    return None

def detect_quotation_type(sheet):
    """Detect the type of quotation from sheet content"""
    text_content = ""
    for row_idx in range(min(15, sheet.nrows)):
        for col_idx in range(min(10, sheet.ncols)):
            try:
                val = sheet.cell_value(row_idx, col_idx)
                if val:
                    text_content += str(val).lower() + " "
            except:
                pass
    
    if 'refilling' in text_content or 'refill' in text_content:
        return 'refilling'
    elif 'new supply' in text_content or 'supply rate' in text_content:
        return 'new-supply'
    elif 'amc' in text_content or 'maintenance' in text_content:
        return 'amc'
    elif 'hpt' in text_content or 'hydro' in text_content:
        return 'hpt'
    elif 'accessories' in text_content:
        return 'accessories'
    else:
        return 'general'

def find_header_row(sheet):
    """Find the row containing table headers"""
    header_keywords = ['s.n', 'sn.', 'sr.', 'description', 'particulars', 'items', 'unit', 'rate', 'qty', 'amount']
    
    for row_idx in range(min(30, sheet.nrows)):
        row_text = ""
        for col_idx in range(min(10, sheet.ncols)):
            try:
                val = str(sheet.cell_value(row_idx, col_idx)).lower()
                row_text += val + " "
            except:
                pass
        
        matches = sum(1 for kw in header_keywords if kw in row_text)
        if matches >= 2:
            return row_idx
    return -1

def find_column_indices(sheet, header_row):
    """Find column indices for description, rate, unit, qty"""
    columns = {'desc': -1, 'rate': -1, 'unit': -1, 'qty': -1, 'amount': -1, 'sn': -1}
    
    for col_idx in range(sheet.ncols):
        try:
            val = str(sheet.cell_value(header_row, col_idx)).lower().strip()
            if any(kw in val for kw in ['description', 'particular', 'item', 'product']):
                columns['desc'] = col_idx
            elif 'rate' in val and 'amount' not in val:
                columns['rate'] = col_idx
            elif 'unit' in val:
                columns['unit'] = col_idx
            elif 'qty' in val or 'quantity' in val:
                columns['qty'] = col_idx
            elif 'amount' in val:
                columns['amount'] = col_idx
            elif any(kw in val for kw in ['s.n', 'sn', 'sr', 'no']):
                columns['sn'] = col_idx
        except:
            pass
    
    return columns

def extract_products_from_sheet(sheet, filename):
    """Extract products and rates from a sheet"""
    extracted = []
    quotation_type = detect_quotation_type(sheet)
    
    header_row = find_header_row(sheet)
    if header_row == -1:
        return extracted, quotation_type
    
    columns = find_column_indices(sheet, header_row)
    
    if columns['desc'] == -1:
        return extracted, quotation_type
    
    current_category = quotation_type
    
    # Extract products from rows after header
    for row_idx in range(header_row + 1, sheet.nrows):
        try:
            # Check if this is a category header row
            first_cell = clean_text(str(sheet.cell_value(row_idx, 0)))
            second_cell = clean_text(str(sheet.cell_value(row_idx, columns['desc']))) if columns['desc'] >= 0 else ""
            
            # Detect category headers
            combined = (first_cell + " " + second_cell).lower()
            if 'refilling' in combined and 'rate' in combined:
                current_category = 'refilling'
                continue
            elif 'supply' in combined and 'rate' in combined:
                current_category = 'new-supply'
                continue
            elif 'accessor' in combined and 'rate' in combined:
                current_category = 'accessories'
                continue
            elif 'hpt' in combined and 'rate' in combined:
                current_category = 'hpt'
                continue
            
            # Get description
            desc_cell = sheet.cell_value(row_idx, columns['desc'])
            description = clean_text(str(desc_cell))
            
            if not description or len(description) < 3:
                continue
            
            # Skip if description looks like a header or footer
            desc_lower = description.lower()
            if any(skip in desc_lower for skip in ['term', 'condition', 'total', 'subtotal', 'discount', 'gst', 'grand total', 'bank', 'payment', 'validity', 'thank', 'regard', 'signature', 'for client']):
                continue
            
            # Get rate
            rate = None
            if columns['rate'] >= 0:
                rate = extract_rate(sheet.cell_value(row_idx, columns['rate']))
            
            if rate is None or rate <= 0:
                continue
            
            # Get unit
            unit = "Each"
            if columns['unit'] >= 0:
                unit_val = clean_text(str(sheet.cell_value(row_idx, columns['unit'])))
                if unit_val and len(unit_val) > 0:
                    unit = unit_val
            
            extracted.append({
                'name': description,
                'rate': rate,
                'unit': unit,
                'category': current_category
            })
            
        except Exception as e:
            continue
    
    return extracted, quotation_type

def process_file(filepath):
    """Process a single Excel file"""
    global processed_count
    
    try:
        workbook = xlrd.open_workbook(filepath, formatting_info=False)
        filename = os.path.basename(filepath)
        
        for sheet_idx in range(workbook.nsheets):
            sheet = workbook.sheet_by_index(sheet_idx)
            
            extracted_products, quotation_type = extract_products_from_sheet(sheet, filename)
            
            quotation_formats[quotation_type] += 1
            
            for product in extracted_products:
                name = product['name']
                rate = product['rate']
                unit = product['unit']
                category = product['category']
                
                products[name]['rates'].append(rate)
                products[name]['units'].add(unit)
                products[name]['categories'].add(category)
                products[name]['occurrences'] += 1
                if len(products[name]['files']) < 3:  # Keep max 3 example files
                    products[name]['files'].append(filename)
                
                categories_found.add(category)
        
        processed_count += 1
        
        if processed_count % 100 == 0:
            print(f"Processed {processed_count} files...")
            
    except Exception as e:
        errors.append(f"{filepath}: {str(e)}")

def analyze_all_files():
    """Scan and analyze all quotation files"""
    global total_files
    
    print("Scanning quotation directory...")
    
    files_to_process = []
    for root, dirs, files in os.walk(QUOTATION_DIR):
        for file in files:
            if file.endswith(('.xls', '.xlsx')):
                files_to_process.append(os.path.join(root, file))
    
    total_files = len(files_to_process)
    print(f"Found {total_files} quotation files to analyze")
    
    for filepath in files_to_process:
        process_file(filepath)
    
    print(f"\nCompleted! Processed {processed_count} files successfully")
    if errors:
        print(f"Encountered errors in {len(errors)} files")

def generate_product_database():
    """Generate final product database with most common rates"""
    final_products = []
    
    for name, data in products.items():
        if not data['rates']:
            continue
        
        # Calculate most common rate (mode) or latest/highest
        rates = data['rates']
        
        # Use the most frequent rate
        rate_counts = defaultdict(int)
        for r in rates:
            rate_counts[r] += 1
        
        most_common_rate = max(rate_counts, key=rate_counts.get)
        
        # Determine primary category
        categories = list(data['categories'])
        primary_category = categories[0] if categories else 'general'
        
        # Determine primary unit
        units = list(data['units'])
        primary_unit = units[0] if units else 'Each'
        
        final_products.append({
            'name': name,
            'rate': most_common_rate,
            'unit': primary_unit,
            'category': primary_category,
            'rate_variations': list(set(rates)),
            'occurrences': data['occurrences'],
            'example_files': data['files']
        })
    
    # Sort by category and then by name
    final_products.sort(key=lambda x: (x['category'], x['name']))
    
    return final_products

def generate_report(final_products):
    """Generate a comprehensive analysis report"""
    report = []
    report.append("=" * 80)
    report.append("COMPREHENSIVE QUOTATION ANALYSIS REPORT")
    report.append("City Fire Services - Quotation Analysis")
    report.append("=" * 80)
    report.append(f"\nAnalysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Total Files Scanned: {total_files}")
    report.append(f"Successfully Processed: {processed_count}")
    report.append(f"Errors Encountered: {len(errors)}")
    
    report.append(f"\n\n{'='*80}")
    report.append("QUOTATION FORMATS DISTRIBUTION")
    report.append("=" * 80)
    for format_type, count in sorted(quotation_formats.items(), key=lambda x: -x[1]):
        report.append(f"  {format_type}: {count} quotations")
    
    report.append(f"\n\n{'='*80}")
    report.append("CATEGORIES FOUND")
    report.append("=" * 80)
    for cat in sorted(categories_found):
        report.append(f"  - {cat}")
    
    report.append(f"\n\n{'='*80}")
    report.append("PRODUCTS BY CATEGORY")
    report.append("=" * 80)
    
    # Group products by category
    by_category = defaultdict(list)
    for product in final_products:
        by_category[product['category']].append(product)
    
    for category in sorted(by_category.keys()):
        cat_products = by_category[category]
        report.append(f"\n\n{category.upper()} ({len(cat_products)} products)")
        report.append("-" * 60)
        
        for p in cat_products:
            rate_info = f"₹{p['rate']}"
            if len(p['rate_variations']) > 1:
                rate_info += f" (variations: {p['rate_variations'][:5]})"
            report.append(f"  • {p['name']}")
            report.append(f"    Rate: {rate_info} | Unit: {p['unit']} | Occurrences: {p['occurrences']}")
    
    report.append(f"\n\n{'='*80}")
    report.append("SUMMARY STATISTICS")
    report.append("=" * 80)
    report.append(f"  Total Unique Products: {len(final_products)}")
    report.append(f"  Total Categories: {len(categories_found)}")
    report.append(f"  Total Quotation Files: {total_files}")
    
    # Products with rate variations
    products_with_variations = [p for p in final_products if len(p['rate_variations']) > 1]
    report.append(f"  Products with Rate Variations: {len(products_with_variations)}")
    
    if errors:
        report.append(f"\n\n{'='*80}")
        report.append("ERRORS (first 20)")
        report.append("=" * 80)
        for err in errors[:20]:
            report.append(f"  {err}")
    
    return "\n".join(report)

def main():
    print("Starting comprehensive quotation analysis...")
    print("This may take a few minutes...\n")
    
    analyze_all_files()
    
    print("\nGenerating product database...")
    final_products = generate_product_database()
    
    print("Generating analysis report...")
    report = generate_report(final_products)
    
    # Save report
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"Report saved to: {REPORT_FILE}")
    
    # Save JSON data
    output_data = {
        'analysis_date': datetime.now().isoformat(),
        'total_files_scanned': total_files,
        'files_processed': processed_count,
        'errors_count': len(errors),
        'quotation_formats': dict(quotation_formats),
        'categories': list(categories_found),
        'products': final_products
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    print(f"JSON data saved to: {OUTPUT_FILE}")
    
    print(f"\n{'='*60}")
    print("ANALYSIS COMPLETE!")
    print(f"{'='*60}")
    print(f"Total Files: {total_files}")
    print(f"Unique Products Found: {len(final_products)}")
    print(f"Categories: {list(categories_found)}")

if __name__ == "__main__":
    main()
