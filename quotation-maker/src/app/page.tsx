'use client';

import {
  Header,
  ClientDetails,
  ProductSelector,
  SelectedItems,
  QuotationOptions,
  ActionButtons,
  QuotationImport,
} from '@/components';

export default function Home() {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <Header
          title="Create New Quotation"
          subtitle="Generate professional quotations for your clients"
        />
        <QuotationImport />
      </div>

      <div className="space-y-6">
        <ClientDetails />
        <ProductSelector />
        <SelectedItems />
        <QuotationOptions />
        <ActionButtons />
      </div>
    </>
  );
}

