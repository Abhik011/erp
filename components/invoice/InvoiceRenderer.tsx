import Modern from "./templates/ModernTemplate";


export default function InvoiceRenderer({ invoice }: { invoice: any }) {
  switch (invoice.template || "modern") {
    default:
      return <Modern invoice={invoice} />;
  }
}