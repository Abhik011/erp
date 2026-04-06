"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

const COLORS = {
  yellow: "#c9aa1a",
  grayBorder: "#d4cfc8",
  textMain: "#1a1a1a",
  textSub: "#7a7570",
};

const SectionTitle = ({ children }: any) => (
  <h2 style={{
    fontSize: "11px",
    fontWeight: 600,
    color: COLORS.textSub,
    marginBottom: "8px",
    textTransform: "uppercase",
  }}>
    {children}
  </h2>
);

export default function QuoteTemplatePage() {
  const params = useParams();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [agencyFallback, setAgencyFallback] = useState<any>(null);
  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num || 0);
  };
  useEffect(() => {
    if (!params?.id) return;

    apiFetch(`/quotes/${params.id}`)
      .then(res => res.json())
      .then(async (data) => {

        let agencyData = data.agencySnapshot;

        // 🔥 FALLBACK FETCH
        if (!agencyData || !agencyData.name) {
          try {
            const res = await apiFetch("/agencies/default");
            agencyData = await res.json();
          } catch (e) {
            console.log("Agency fallback failed");
          }
        }

        setQuoteData({
          quoteNumber: data.quoteNumber,
          date: data.createdAt,
          validUntil: data.validUntil,

          agency: agencyData || {},
          customer: data.customerSnapshot || {},

          lineItems: (data.items || []).map((i: any, idx: number) => ({
            id: idx,
            service: i.name,
            quantity: i.quantity,
            unitPrice: i.rate,
          })),

          scopeDescription:
            data.scopeDescription ||
            data.notes ||
            "-",

          discountPercent: data.discount || 0,
          notes: data.notes || "",
          gstType: data.gstType,
          cgst: data.cgst || 0,
          sgst: data.sgst || 0,
          igst: data.igst || 0,
        });


      });
  }, [params?.id]);

  if (!quoteData) return <div className="p-6">Loading...</div>;

  const ag = quoteData.agency;
  const cs = quoteData.customer;

  const subtotal = quoteData.lineItems.reduce(
    (t: number, i: any) => t + i.quantity * i.unitPrice,
    0
  );

  const discountAmount = (subtotal * quoteData.discountPercent) / 100;
  const taxable = subtotal - discountAmount;

  const cgst = quoteData.gstType === "IGST" ? 0 : taxable * 0.09;
  const sgst = quoteData.gstType === "IGST" ? 0 : taxable * 0.09;
  const igst = quoteData.gstType === "IGST" ? taxable * 0.18 : 0;

  const finalTotal = taxable + cgst + sgst + igst;

  return (
    <div style={{ padding: "0px 0px" }}>
      <div style={{
        maxWidth: 700,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 12,
        padding: 32,
        border: "1px solid #e5e5e5"
      }}>

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 20,
          borderBottom: "1px solid #ddd"
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#777" }}>Quote #</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{quoteData.quoteNumber}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#777" }}>Date</div>
            <div>{new Date(quoteData.date).toLocaleDateString()}</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#777" }}>Valid until</div>
            <div>
              {quoteData.validUntil
                ? new Date(quoteData.validUntil).toLocaleDateString()
                : "-"}
            </div>
          </div>
        </div>

        {/* AGENCY */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#777", marginBottom: 8 }}>
            AGENCY INFORMATION
          </div>

          <div style={{ fontSize: 12, color: "#3c3c3c", lineHeight: "1.8" }}>
            <div style={{ fontWeight: 600, color: "#3c3c3c" }}>{ag.name}</div>
            <div style={{ color: "#3c3c3c" }}>{ag.address}</div>
            <div style={{ color: "#3c3c3c" }}>{ag.phone}</div>
            <div style={{ color: "#3c3c3c" }}>{ag.email}</div>
            <div style={{ color: "#3c3c3c" }}>{ag.website}</div>
            <div style={{ textTransform: "uppercase" }}>GSTIN {ag.gstin || "—"}</div>
          </div>
        </div>

        {/* CLIENT BOX */}
        <div style={{
          marginTop: 14,
          background: "#f3f3f3",
          padding: 20,
          borderRadius: 10
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#777", marginBottom: 12 }}>
            CLIENT INFORMATION
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#777" }}>Company name</div>
              <div style={{ color: "#3c3c3c", fontSize: 12 }}>{cs.companyName}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#777" }}>Contact person</div>
              <div style={{ color: "#3c3c3c", fontSize: 12 }}>{cs.name}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#777" }}>Email</div>
              <div style={{ color: "#3c3c3c", fontSize: 12 }}>{cs.email}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#777" }}>Phone</div>
              <div style={{ color: "#3c3c3c", fontSize: 12 }}>{cs.phone}</div>
            </div>
          </div>
        </div>

        {quoteData.scopeDescription && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#777",
                marginBottom: 10,
              }}
            >
              PROJECT SCOPE
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#555",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
            >
              {quoteData.scopeDescription}
            </div>
          </div>
        )}

        {/* PROJECT SCOPE */}
        {quoteData.notes && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#777", marginBottom: 10 }}>
              PROJECT SCOPE
            </div>

            <div style={{ fontSize: 14, color: "#555", lineHeight: "1.6" }}>
              {quoteData.notes}
            </div>
          </div>
        )}

        {/* SERVICE TABLE */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#777", marginBottom: 10 }}>
            SERVICE BREAKDOWN
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", }}>
            <thead>
              <tr style={{ background: "#f3f3f3", fontSize: 12, borderBottom: "1px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: 10 }}>SERVICE</th>
                <th style={{ textAlign: "center" }}>QTY</th>
                <th style={{ textAlign: "right" }}>UNIT PRICE</th>
                <th style={{ textAlign: "right" }}>TOTAL </th>
              </tr>
            </thead>

            <tbody>
              {quoteData.lineItems.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee", fontSize: 12, }}>
                  <td style={{ padding: 12 }}>{item.service}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹ {formatINR(item.unitPrice)}</td>
                  <td style={{
                    textAlign: "right",
                    color: "#fbd83a",
                    fontWeight: 600
                  }}>
                    ₹ {formatINR(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL */}
        <div style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{ width: 300, fontSize: 12, }}>

            {/* SUBTOTAL */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: " 0" }}>
              <span>Subtotal</span>
              <span>₹ {formatINR(subtotal)}</span>
            </div>

            {/* DISCOUNT */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: " 0" }}>
              <span>Discount ({quoteData.discountPercent}%)</span>
              <span>- ₹ {formatINR(discountAmount)}</span>
            </div>
            {/* GST */}
            {quoteData.gstType === "IGST" ? (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0" }}>
                <span>IGST (18%)</span>
                <span>₹ {formatINR(igst)}</span>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: " 0" }}>
                  <span>CGST (9%)</span>
                  <span>₹ {formatINR(cgst)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: " 0" }}>
                  <span>SGST (9%)</span>
                  <span>₹ {formatINR(sgst)}</span>
                </div>
              </>
            )}


            {/* TAXABLE */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span>Taxable Amount</span>
              <span>₹ {formatINR(taxable)}</span>
            </div>
            {/* FINAL TOTAL */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              fontWeight: 700,
              fontSize: 13,
              color: "#e8c832",
              borderTop: "1px solid #ddd",
              marginTop: 6
            }}>
              <span>Total</span>
              <span>₹ {formatINR(finalTotal)}</span>
            </div>

          </div>
        </div>

        <div style={{
          marginTop: 5,
          paddingTop: 20,
          borderTop: "1px solid #ddd"
        }}>

          {/* TERMS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#777", marginBottom: 6 }}>
              TERMS & CONDITIONS
            </div>

            <ul style={{ listStyle: "disc", fontSize: 9, color: "#555", lineHeight: "1.6", paddingLeft: 16 }}>
              <li>50% advance payment required to initiate the project.</li>
              <li>Remaining 50% due upon project completion.</li>
              <li>Prices are exclusive of GST unless specified.</li>
              <li>This quotation is valid for 7 days from the date of issue.</li>
              <li>Any additional requirements will be charged separately.</li>
            </ul>
          </div>

          {/* GST + COMPANY INFO */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            fontSize: 11,

          }}>
            {ag.bankDetails && (
              <div style={{ marginTop: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#777", marginBottom: 6 }}>
                  BANK DETAILS
                </div>

                <div style={{ fontSize: 10 }}>
                  <div>Account Name: {ag.bankDetails.accountName}</div>
                  <div>Account No: {ag.bankDetails.accountNumber}</div>
                  <div>IFSC: {ag.bankDetails.ifsc}</div>
                </div>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 50 }}>Authorized Signatory</div>

              <div style={{ borderTop: "1px solid #000", width: 160 }}></div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}