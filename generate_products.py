"""
Generate optimized product database for Next.js app
Filters and cleans the extracted data to create a usable product list
"""

import json

# Load the comprehensive analysis results
with open(r"e:\Projects\quotation maker\comprehensive_analysis_results.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

products = data['products']

# Filter products by category and clean up - focus on commonly used products
# Products with at least 5 occurrences OR specifically identified product types

# Category mapping - clean up categories
category_mapping = {
    'refilling': 'refilling',
    'new-supply': 'new-supply',
    'accessories': 'accessories',
    'hpt': 'hpt',
    'amc': 'amc',
    'general': 'general'
}

# Identify core refilling products (fire extinguisher refills)
refilling_keywords = ['refilling', 'refill', 'abc', 'co2', 'dcp', 'w/co2', 'water', 'foam', 'modular', 'mechanical foam']

# Identify new supply products  
new_supply_keywords = ['fire extinghisher', 'fire extinguisher', 'new', 'supply', 'clean agent']

# Identify accessories
accessory_keywords = ['branch', 'hose', 'nozzle', 'valve', 'blanket', 'axe', 'suit', 'helmet', 'shoes', 'belt', 'bucket', 'cabinet', 'box', 'detector', 'alarm', 'panel', 'sprinkler', 'pump', 'tank']

# HPT keywords
hpt_keywords = ['hpt', 'hydro', 'testing', 'pressure test']

def categorize_product(product):
    """Properly categorize a product based on its name and existing category"""
    name_lower = product['name'].lower()
    existing_category = product['category']
    
    # Check for refilling products - look for refilling patterns
    if 'refill' in name_lower or ('fire extinguisher' in name_lower and 'refil' in name_lower):
        return 'refilling'
    
    # Fire extinguisher pipes are refill accessories
    if 'fire extinguisher' in name_lower and 'pipe' in name_lower:
        return 'refilling'
    
    # Check for new supply (new fire extinguishers)
    if ('fire extinghisher' in name_lower or 'fire extinguisher' in name_lower) and ('make :' in name_lower or 'make:' in name_lower):
        return 'new-supply'
    
    # Keep existing category if it seems reasonable
    if existing_category in ['refilling', 'new-supply', 'accessories', 'hpt']:
        return existing_category
    
    # Default categorization based on keywords
    if any(kw in name_lower for kw in ['refil', 'abc', 'co2', 'dcp', 'w/co2']):
        if 'kg' in name_lower and 'extinghisher' not in name_lower and 'extinguisher' not in name_lower:
            return 'refilling'
    
    return existing_category

# Process and clean products
cleaned_products = []
seen_names = set()
product_id = 1

for p in products:
    # Skip products with very low occurrences (likely errors)
    if p['occurrences'] < 3:
        continue
    
    # Skip products that look like errors or fragments
    name = p['name'].strip()
    if len(name) < 5:
        continue
    if name.isdigit():
        continue
    if name.startswith('Make :') or name.startswith('Make:'):
        continue
    
    # Normalize name to avoid duplicates
    name_normalized = name.lower().strip()
    if name_normalized in seen_names:
        continue
    seen_names.add(name_normalized)
    
    # Categorize
    category = categorize_product(p)
    
    # Use the most common rate
    rate = p['rate']
    
    # Clean unit
    unit = p['unit'] if p['unit'] else 'Each'
    if unit in ['1.0', '2.0', '3.0']:
        unit = 'Each'
    
    cleaned_products.append({
        'id': product_id,
        'name': name,
        'rate': rate,
        'unit': unit,
        'category': category,
        'occurrences': p['occurrences']
    })
    product_id += 1

# Sort by category and then by occurrences (most used first)
cleaned_products.sort(key=lambda x: (x['category'], -x['occurrences']))

# Generate TypeScript code for products.ts
ts_code = '''import { Product, CompanySettings } from '@/types';

// Product data extracted from 2693 actual quotation files
// Last updated: January 2026

export const defaultProducts: Product[] = [
'''

for p in cleaned_products:
    ts_code += f'''    {{ id: {p['id']}, name: "{p['name'].replace('"', '\\"')}", category: '{p['category']}', unit: '{p['unit'].replace("'", "\\'")}', rate: {int(p['rate'])} }},
'''

ts_code += '''];

export const defaultCompanySettings: CompanySettings = {
    name: 'City Fire Services',
    tagline: 'Your Safety is Our Concern',
    services: 'Fire Extinguishers, Fire Hydrant System, Fire Alarm System, Fire Suppression System, Sprinkler System, Fire Safety Equipment & Accessories',
    address: 'B-19, Sector-6, Noida, U.P. - 201301',
    phone: '9810021457, 9711038940',
    email: 'cityfire41@gmail.com',
    website: 'www.cityfireservices.in',
    gst: '09AHYPS6997B1ZM',
    certification: 'ISO 9001:2015 Certified Company',
    bankName: 'HDFC Bank',
    bankBranch: 'Sector-18, Noida',
    accountNumber: '50200033968315',
    ifscCode: 'HDFC0000255',
};

export const quotationTypes = [
    { value: 'refilling', label: 'Fire Extinguishers Refilling Quotation' },
    { value: 'new-supply', label: 'Fire Extinguishers New Supply Quotation' },
    { value: 'accessories', label: 'Fire Safety Accessories Quotation' },
    { value: 'hpt', label: 'HPT (Hydro Pressure Testing) Quotation' },
    { value: 'amc', label: 'Annual Maintenance Contract (AMC)' },
    { value: 'general', label: 'Fire Fighting Equipment Quotation' },
];

export const categoryNames: Record<string, string> = {
    'all': 'All Products',
    'refilling': 'Refilling Services',
    'new-supply': 'New Supply',
    'accessories': 'Accessories',
    'hpt': 'HPT Rates',
    'amc': 'AMC Services',
    'general': 'General Items',
};
'''

# Save TypeScript file
with open(r"e:\Projects\quotation maker\quotation-maker\src\data\products.ts", 'w', encoding='utf-8') as f:
    f.write(ts_code)

print(f"Generated products.ts with {len(cleaned_products)} products")
print(f"\nProducts by category:")
category_counts = {}
for p in cleaned_products:
    cat = p['category']
    category_counts[cat] = category_counts.get(cat, 0) + 1

for cat, count in sorted(category_counts.items()):
    print(f"  {cat}: {count}")
