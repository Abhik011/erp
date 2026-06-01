export type Invoice = {
    _id?: string;
    invoiceNumber?: string;
    issueDate?: string;
    dueDate?: string;
    paymentStatus?: string;
    projectDescription?: string;
    projectName?: string;

    agency?: {
        name?: string;
        logo?: string;
        address?: string;
        email?: string;
        phone?: string;
        website?: string;
        upiId?: string;
    };
    paidAmount?: number;
    agencyGSTIN?: string;

    customer?: {
        companyName?: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };

    customerGSTIN?: string;

    items?: {
        name?: string;
        description?: string;
        quantity?: number;
        rate?: number;
    }[];

    discount?: number;

    gstType?: "CGST" | "IGST";
    placeOfSupply?: string;
    hsn?: string;

    milestones?: {
        _id?: string;
        label: string;
        percent: number;
        paid: boolean;
        amount?: number;
        paidAmount?: number;
    }[];

    bankDetails?: {
        accountName?: string;
        accountNumber?: string;
        ifsc?: string;
        bankName?: string;
    };

    notes?: string;


};
