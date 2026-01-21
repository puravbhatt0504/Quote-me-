'use client';

import {
  Header,
  ClientDetails,
  ProductSelector,
  SelectedItems,
  QuotationOptions,
  ActionButtons,
} from '@/components';

export default function Home() {
  return (
    <>
      <Header
        title="Create New Quotation"
        subtitle="Generate professional quotations for your clients"
      />

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
