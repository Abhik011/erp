
import { Invoice } from "../types/invoice";
import { QRCodeCanvas } from "qrcode.react";
export default function ModernTemplate({ invoice }: { invoice: Invoice }) {
    // Sample data - replace with props for dynamic usage
    type Milestone = NonNullable<Invoice["milestones"]>[number];
    const invoiceData = {
        company: {
            name: invoice.agency?.name,
            logo: invoice.agency?.logo,
            address: invoice.agency?.address,
            email: invoice.agency?.email,
            phone: invoice.agency?.phone,
            website: invoice.agency?.website,
            gstin: invoice.agencyGSTIN,
            upiId: invoice.agency?.upiId,
        },

        invoice: {
            number: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            paymentStatus: invoice.paymentStatus?.toLowerCase(),

            description: invoice.projectDescription,
            ProjectName: invoice.projectName,
        },

        billTo: {
            companyName: invoice.customer?.companyName,
            contactPerson: invoice.customer?.name,
            email: invoice.customer?.email,
            phone: invoice.customer?.phone,
            address: invoice.customer?.address,
            gstin: invoice.customerGSTIN,
        },

        gst: {
            placeOfSupply: invoice.placeOfSupply,
            hsnSacCode: invoice.hsn,
            gstType: invoice.gstType,
            cgst: 9,
            sgst: 9,
            igst: 18,
        },

        lineItems: (invoice.items || []).map((i, idx) => ({
            id: idx,
            description: `${i.name || ""}\n${i.description || ""}`,
            quantity: i.quantity ?? 0,
            unit: "",
            rate: i.rate ?? 0,
        })),

        discount: {
            type: "percentage",
            value: invoice.discount || 0,
        },

        milestones: invoice.milestones || [],

        bankDetails: invoice.bankDetails,
        ifscCode: invoice.bankDetails?.ifsc,

        notes: invoice.notes,
    };
    // Calculate amounts
    const calculateLineItemAmount = (item: { quantity: number; rate: number }) => item.quantity * item.rate;
    const subtotal = invoiceData.lineItems.reduce((sum, item) => sum + calculateLineItemAmount(item as { quantity: number; rate: number }), 0);
    const discountAmount =
        invoiceData.discount.type === 'percentage'
            ? (subtotal * invoiceData.discount.value) / 100
            : invoiceData.discount.value;
    const taxableAmount = subtotal - discountAmount;

    let cgst = 0,
        sgst = 0,
        igst = 0;
    if (invoiceData.gst.gstType === 'IGST') {
        igst = (taxableAmount * invoiceData.gst.igst) / 100;
    } else {
        cgst = (taxableAmount * invoiceData.gst.cgst) / 100;
        sgst = (taxableAmount * invoiceData.gst.sgst) / 100;
    }

    const grandTotal = taxableAmount + cgst + sgst + igst;

    // Format currency
    const formatCurrency = (amount: string | number | bigint | undefined) => {
        const numericAmount =
            amount === undefined || amount === null
                ? 0
                : typeof amount === 'string'
                    ? Number(amount)
                    : amount;

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    };

    const formatDate = (dateString: string | number | Date | undefined) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusColor = (status: string | undefined) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'partial':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string | undefined) => {
        switch (status) {
            case 'paid':
                return 'PAID';
            case 'pending':
                return 'PENDING';
            case 'overdue':
                return 'OVERDUE';
            case 'partial':
                return 'PARTIAL';
            default:
                return 'DRAFT';
        }
    };
    const getUPILink = () => {
        const upiId = invoice?.agency?.upiId || "yourupi@upi";

        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
            invoiceData?.company?.name || "Company"
        )}&am=${grandTotal}&cu=INR`;
    };
    const paidMilestones = invoiceData.milestones.filter(
        (m: Milestone) => m.paid
    ).length;
    const totalMilestones = invoiceData.milestones.length;

    const paidAmount = invoice.paidAmount || 0;
    const balanceAmount = grandTotal - paidAmount;
    const progress = (paidAmount / grandTotal) * 100;
    return (
        <div className="bg-white">
            {/* Invoice Container */}
            <div className="bg-white w-full  rounded-xl shadow-lg overflow-hidden">
                {/* A4 Optimized Container */}
                <div className="aspect-[210/297] md:aspect-auto print:shadow-none print:rounded-none">
                    {/* Header Section */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-8">
                            {/* Company Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4 p-4 rounded-sm w-max">
                                    {invoiceData.company.logo ? (
                                        <img
                                            src={invoiceData.company.logo}
                                            alt="Company Logo"
                                            className="w-15 h-10 rounded-lg p-1 object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
                                            <span>
                                                {invoiceData.company.name?.charAt(0) || ""}
                                            </span>
                                        </div>
                                    )}
                                    <h1 className="text-2xl font-bold text-black tracking-tight">
                                        {invoiceData.company.name}
                                    </h1>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>{invoiceData.company.address}</p>
                                    <p>{invoiceData.company.email}</p>
                                    <p>{invoiceData.company.phone}</p>
                                    <p className="text-violet-600 font-medium">{invoiceData.company.website}</p>
                                </div>
                            </div>

                            {/* Invoice Info */}
                            <div className="text-right">
                                <div className="mb-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                                        Invoice
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mb-4">
                                        {invoiceData.invoice.number}
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-end gap-4">
                                            <span className="text-gray-600">Issue Date:</span>
                                            <span className="font-medium text-gray-900">
                                                {formatDate(invoiceData.invoice.issueDate)}
                                            </span>
                                        </div>
                                        <div className="flex justify-end gap-4">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span className="font-medium text-gray-900">
                                                {formatDate(invoiceData.invoice.dueDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status & Summary Bar */}
                        <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-4 flex-1">
                                <div>
                                    <span
                                        className={`inline-flex items-center px-3 py-1  text-xs font-semibold border ${getStatusColor(
                                            invoiceData.invoice.paymentStatus
                                        )}`}
                                    >
                                        {getStatusLabel(invoiceData.invoice.paymentStatus?.toLowerCase())}
                                    </span>
                                </div>
                                <div className="h-6 w-px bg-gray-200"></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-0.5">
                                        Project Name
                                    </p>
                                    <p className="text-sm text-gray-900 mt-2 font-medium">{invoiceData.invoice.ProjectName}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-1">
                                    Balance Amount
                                </p>
                                <p className="text-3xl font-bold text-violet-600">{formatCurrency(balanceAmount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Billing Section */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Bill To */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                    Bill To
                                </p>
                                <div className="space-y-2">
                                    <p className="font-semibold text-gray-900">{invoiceData.billTo.companyName}</p>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>{invoiceData.billTo.contactPerson}</p>
                                        <p>{invoiceData.billTo.email}</p>
                                        <p>{invoiceData.billTo.phone}</p>
                                        <p>{invoiceData.billTo.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* GST Details */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                    GST Details
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Customer GSTIN:</span>
                                        <span className="font-medium text-gray-900 text-right">
                                            {invoiceData.billTo.gstin}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Company GSTIN:</span>
                                        <span className="font-medium text-gray-900 text-right">
                                            {invoiceData.company.gstin}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Place of Supply:</span>
                                        <span className="font-medium text-gray-900 text-right">
                                            {invoiceData.gst.placeOfSupply}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">HSN/SAC Code:</span>
                                        <span className="font-medium text-gray-900 text-right">
                                            {invoiceData.gst.hsnSacCode}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                        <span className="text-gray-600 font-medium">GST Type:</span>
                                        <span className="font-semibold text-violet-600">
                                            {invoiceData.gst.gstType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-8 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-4 flex-1">

                            <div className="h-6 w-px bg-gray-200"></div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-0.5">
                                    Project description
                                </p>

                                <p className="text-sm text-gray-900 mt-2 font-medium">{invoiceData.invoice.description}</p>
                            </div>
                        </div>
                    </div>
                    {/* Line Items Table */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-gray-200">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                                            Qty
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">
                                            Rate
                                        </th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceData.lineItems.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={`border-b border-gray-100 hover:bg-slate-50 transition-colors ${index === invoiceData.lineItems.length - 1 ? '' : ''
                                                }`}
                                        >
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {item.description.split('\n')[0]}
                                                    </p>
                                                    {item.description.split('\n')[1] && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {item.description.split('\n')[1]}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center text-sm text-gray-900">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                                                {formatCurrency(item.rate)}
                                            </td>
                                            <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">
                                                {formatCurrency(calculateLineItemAmount(item))}
                                            </td>
                                        </tr>
                                    ))}
                                    {invoiceData.lineItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-6 text-gray-400">
                                                No items available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Milestones */}
                    <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100">

                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                                Project Milestones
                            </p>
                            <span className="text-xs font-medium text-gray-600">
                                ({paidMilestones}/{totalMilestones} completed)
                            </span>

                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-3">

                            {invoiceData.milestones.map((milestone: Milestone, index: number) => (
                                <div
                                    key={milestone._id || `${milestone.label}-${index}`}
                                    className="bg-white rounded-lg p-3 border border-gray-200 hover:border-violet-300 transition-colors"
                                >
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {milestone.label}
                                    </p>

                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-bold text-gray-900">
                                            {milestone.percent}%

                                            <p className="text-xs text-gray-500">
                                                {formatCurrency(milestone.amount)}
                                            </p>

                                            <p className="text-[11px] text-gray-400">
                                                Paid: {formatCurrency(milestone.paidAmount || 0)}
                                            </p>
                                        </span>


                                        <span
                                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${milestone.paid
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {milestone.paidAmount ? "✓" : "○"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="flex justify-between items-center p-8 mb-6 gap-6">

                        {/* 🔥 LEFT SIDE → PAYMENT */}
                        <div className="w-full h-full md:w-80 md:h-full rounded-xl p-4 bg-gray-50 flex flex-col items-center">

                            <QRCodeCanvas value={getUPILink()} size={120} />

                            <p className="text-xs text-gray-500 mt-2">Scan to Pay</p>

                            <p className="text-sm font-semibold mt-2 text-gray-900">
                                {formatCurrency(balanceAmount)}
                            </p>

                            <p className="text-xs text-gray-400">
                                (Including GST)
                            </p>

                            <p className="text-[11px] text-gray-400 mt-1">
                                UPI: {invoice?.agency?.upiId || "-"}
                            </p>

                        </div>

                        {/* 🔥 RIGHT SIDE → YOUR EXISTING SUMMARY */}
                        <div className="w-full md:w-80">
                            <div className="space-y-3">

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm bg-emerald-50 -mx-3 px-3 py-2 rounded text-emerald-700">
                                        <span className="font-medium">
                                            Discount ({invoiceData.discount.value}%)
                                        </span>
                                        <span className="font-semibold">
                                            -{formatCurrency(discountAmount)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Taxable Amount</span>
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(taxableAmount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Tax Breakdown */}
                                <div className="space-y-2 bg-slate-50 -mx-3 px-3 py-3 rounded">

                                    {invoiceData.gst.gstType === "IGST" ? (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                IGST ({invoiceData.gst.igst}%)
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {formatCurrency(igst)}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    CGST ({invoiceData.gst.cgst}%)
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(cgst)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    SGST ({invoiceData.gst.sgst}%)
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(sgst)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 🔥 NEW: PAYABLE AMOUNT */}
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>Total Tax</span>
                                    <span>
                                        {formatCurrency(
                                            invoiceData.gst.gstType === "IGST"
                                                ? igst
                                                : cgst + sgst
                                        )}
                                    </span>

                                </div>

                                <div className="mt-4 space-y-2 bg-green-50 p-3 rounded">

                                    {/* Paid */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Paid Amount</span>
                                        <span className="font-semibold text-emerald-600">
                                            {formatCurrency(paidAmount)}
                                        </span>
                                    </div>

                                    {/* Balance */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Balance Due</span>
                                        <span className="font-semibold text-red-600">
                                            {formatCurrency(balanceAmount)}
                                        </span>
                                    </div>

                                </div>

                                {/* GRAND TOTAL */}
                                <div className="border-t-2 border-violet-600 pt-3 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                            Grand Total
                                        </span>
                                        <span className="text-3xl font-bold text-violet-600">
                                            {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Bank Details */}
                    <div className="p-8 border-b border-gray-100  bg-gradient-to-r from-slate-50 to-slate-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">
                            Bank Details for Payment
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Account Name</p>
                                <p className="text-sm font-medium uppercase text-gray-900">
                                    {invoiceData.bankDetails?.accountName || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Account Number</p>
                                <p className="text-sm font-medium text-gray-900  font-mono">
                                    {invoiceData.bankDetails?.accountNumber || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">IFSC Code</p>
                                <p className="text-sm font-medium uppercase text-gray-900 font-mono">
                                    {invoiceData.bankDetails?.ifsc || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Bank Name</p>
                                <p className="text-sm font-medium uppercase text-gray-900">
                                    {invoiceData.bankDetails?.bankName || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="p-8 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
                            Notes & Terms
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{invoiceData.notes}</p>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-gray-100">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-600 mb-6">Authorized Signatory</p>
                                <div className="w-32 h-16 border-b-2 border-gray-400 flex items-end"></div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-600 text-center mb-2">
                                    This is a system-generated invoice
                                </p>
                                <p className="text-xs text-gray-500">
                                    Generated on {formatDate(new Date().toISOString().split('T')[0])}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .max-w-4xl {
            max-width: 100%;
          }
          
          .aspect-\\[210\\/297\\] {
            aspect-ratio: auto;
          }
          
          /* Prevent page breaks inside elements */
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          .p-8 {
            page-break-inside: avoid;
          }
          
          /* A4 Optimization */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Ensure proper colors in print */
          .bg-gradient-to-r {
            background: white;
          }
          
          .bg-gradient-to-br {
            background: white;
          }
          
          /* Print optimized shadows */
          .shadow-lg {
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
          
          .rounded-xl {
            border-radius: 0;
          }
          tr {
  page-break-inside: avoid;
}
          /* Hide overflow on print */
          .overflow-x-auto {
            overflow: visible;
          }
        }
      `}</style>
        </div >
    );
}