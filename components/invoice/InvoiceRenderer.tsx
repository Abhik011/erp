// components/invoice/InvoiceRenderer.tsx

import Modern from "./templates/ModernTemplate";
import Classic from "./templates/ClassicTemplate";
import Minimal from "./templates/MinimalTemplate";
import Corporate from "./templates/CorporateTemplate";

export default function InvoiceRenderer({ invoice }) {
  switch (invoice.template || "modern") {
    case "classic":
      return <Classic invoice={invoice} />;
    case "minimal":
      return <Minimal invoice={invoice} />;
    case "corporate":
      return <Corporate invoice={invoice} />;
    default:
      return <Modern invoice={invoice} />;
  }
}