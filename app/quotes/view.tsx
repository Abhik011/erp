import React, { useState, useEffect } from 'react';

// ============================================================================
// DESIGN SYSTEM (Creonox Color Palette)
// ============================================================================
const COLORS = {
  bg: '#f6f6f6',
  sidebarBg: '#e8e4de',
  white: '#ffffff',
  yellow: '#f7e414',
  yellowDark: '#c9aa1a',
  grayDark: '#3a3a3a',
  grayMid: '#6b6b6b',
  grayLight: '#b0aaa0',
  grayBorder: '#d4cfc8',
  textMain: '#1a1a1a',
  textSub: '#7a7570',
};

// ============================================================================
// TRANSLATIONS (Multi-language Support)
// ============================================================================
const LANGUAGES = {
  en: {
    language: 'English',
    quote: 'Project Quote',
    quoteNumber: 'Quote #',
    date: 'Date',
    validUntil: 'Valid until',
    clientInfo: 'Client information',
    clientName: 'Client name',
    contactPerson: 'Contact person',
    email: 'Email',
    phone: 'Phone',
    agencyInfo: 'Agency information',
    agencyName: 'Creonox Technologies',
    agencyAddress: '123 Tech Street, Mumbai, India',
    agencyPhone: '+91 75170 50463',
    agencyEmail: 'hello@creonox.com',
    website: 'www.creonox.com',
    projectScope: 'Project scope',
    scopeDescription: 'Detailed description of the project requirements and deliverables',
    lineItems: 'Service breakdown',
    service: 'Service',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax (GST)',
    discount: 'Discount',
    finalTotal: 'Final total',
    terms: 'Terms & conditions',
    termsContent: 'Payment terms: 50% upfront, 50% upon completion.\nTimeline: Project completion within 4-6 weeks.\nRevisions: Up to 2 rounds of revisions included.',
    notes: 'Additional notes',
    footer: 'Thank you for considering our services. We look forward to working with you!',
    currency: '₹',
    editQuote: 'Edit quote',
    doneEditing: 'Done editing',
    addService: '+ Add service',
    saveQuote: 'Save Quote',
    loadingQuotes: 'Loading quotes...',
    syncWithBackend: 'Sync with backend',
  },
  es: {
    language: 'Español',
    quote: 'Presupuesto del Proyecto',
    quoteNumber: 'Presupuesto #',
    date: 'Fecha',
    validUntil: 'Válido hasta',
    clientInfo: 'Información del cliente',
    clientName: 'Nombre del cliente',
    contactPerson: 'Persona de contacto',
    email: 'Correo',
    phone: 'Teléfono',
    agencyInfo: 'Información de la agencia',
    agencyName: 'Creonox Tecnologías',
    agencyAddress: '123 Calle Tech, Mumbai, India',
    agencyPhone: '+91 75170 50463',
    agencyEmail: 'hola@creonox.com',
    website: 'www.creonox.com',
    projectScope: 'Alcance del proyecto',
    scopeDescription: 'Descripción detallada de los requisitos y entregables del proyecto',
    lineItems: 'Desglose de servicios',
    service: 'Servicio',
    quantity: 'Cantidad',
    unitPrice: 'Precio unitario',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Impuesto (GST)',
    discount: 'Descuento',
    finalTotal: 'Total final',
    terms: 'Términos y condiciones',
    termsContent: 'Términos de pago: 50% por adelantado, 50% al completar.\nTiempo: Finalización del proyecto en 4-6 semanas.\nRevisiones: Se incluyen hasta 2 rondas de revisiones.',
    notes: 'Notas adicionales',
    footer: '¡Gracias por considerar nuestros servicios! ¡Esperamos trabajar con usted!',
    currency: '₹',
    editQuote: 'Editar presupuesto',
    doneEditing: 'Hecho',
    addService: '+ Añadir servicio',
    saveQuote: 'Guardar presupuesto',
    loadingQuotes: 'Cargando presupuestos...',
    syncWithBackend: 'Sincronizar con servidor',
  },
  fr: {
    language: 'Français',
    quote: 'Devis du projet',
    quoteNumber: 'Devis #',
    date: 'Date',
    validUntil: 'Valable jusqu\'au',
    clientInfo: 'Informations sur le client',
    clientName: 'Nom du client',
    contactPerson: 'Personne de contact',
    email: 'Email',
    phone: 'Téléphone',
    agencyInfo: 'Informations sur l\'agence',
    agencyName: 'Creonox Technologíes',
    agencyAddress: '123 Rue Tech, Mumbai, Inde',
    agencyPhone: '+91 75170 50463',
    agencyEmail: 'bonjour@creonox.com',
    website: 'www.creonox.com',
    projectScope: 'Portée du projet',
    scopeDescription: 'Description détaillée des exigences et livrables du projet',
    lineItems: 'Détail des services',
    service: 'Service',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire',
    total: 'Total',
    subtotal: 'Sous-total',
    tax: 'Taxe (GST)',
    discount: 'Remise',
    finalTotal: 'Total final',
    terms: 'Conditions générales',
    termsContent: 'Conditions de paiement : 50% à l\'avance, 50% à l\'achèvement.\nDélai : Réalisation du projet dans 4-6 semaines.\nRévisions : Jusqu\'à 2 tours de révisions inclus.',
    notes: 'Notes supplémentaires',
    footer: 'Merci de considérer nos services. Nous avons hâte de travailler avec vous!',
    currency: '₹',
    editQuote: 'Éditer le devis',
    doneEditing: 'Fait',
    addService: '+ Ajouter un service',
    saveQuote: 'Enregistrer le devis',
    loadingQuotes: 'Chargement des devis...',
    syncWithBackend: 'Synchroniser avec le serveur',
  },
  de: {
    language: 'Deutsch',
    quote: 'Projektangebot',
    quoteNumber: 'Angebot #',
    date: 'Datum',
    validUntil: 'Gültig bis',
    clientInfo: 'Kundeninformation',
    clientName: 'Kundenname',
    contactPerson: 'Ansprechpartner',
    email: 'E-Mail',
    phone: 'Telefon',
    agencyInfo: 'Agenturinformation',
    agencyName: 'Creonox Technologien',
    agencyAddress: 'Techstraße 123, Mumbai, Indien',
    agencyPhone: '+91 75170 50463',
    agencyEmail: 'hallo@creonox.com',
    website: 'www.creonox.com',
    projectScope: 'Projektumfang',
    scopeDescription: 'Detaillierte Beschreibung der Projektanforderungen und Lieferergebnisse',
    lineItems: 'Serviceübersicht',
    service: 'Dienstleistung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    total: 'Gesamt',
    subtotal: 'Zwischensumme',
    tax: 'Steuern (GST)',
    discount: 'Rabatt',
    finalTotal: 'Gesamtbetrag',
    terms: 'Geschäftsbedingungen',
    termsContent: 'Zahlungsbedingungen: 50% Vorauszahlung, 50% nach Abschluss.\nZeitplan: Projektabschluss innerhalb von 4-6 Wochen.\nÜberarbeitungen: Bis zu 2 Revisionsrunden enthalten.',
    notes: 'Zusätzliche Hinweise',
    footer: 'Vielen Dank für die Berücksichtigung unserer Dienstleistungen. Wir freuen uns auf die Zusammenarbeit mit Ihnen!',
    currency: '₹',
    editQuote: 'Angebot bearbeiten',
    doneEditing: 'Fertig',
    addService: '+ Service hinzufügen',
    saveQuote: 'Angebot speichern',
    loadingQuotes: 'Angebote werden geladen...',
    syncWithBackend: 'Mit Server synchronisieren',
  },
};

const DEFAULT_QUOTE_DATA = {
  quoteNumber: 'CRX-2024-001',
  date: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  clientName: 'Acme Corporation',
  contactPerson: 'John Doe',
  email: 'john@acme.com',
  phone: '+91 98765 43210',
  scopeDescription: 'Custom ERP system with modules for inventory, billing, and reporting. Includes user authentication, role-based access, real-time notifications, and comprehensive audit logs.',
  lineItems: [
    { id: 1, service: 'UI/UX Design & Wireframes', quantity: 1, unitPrice: 50000 },
    { id: 2, service: 'Frontend Development (React)', quantity: 1, unitPrice: 150000 },
    { id: 3, service: 'Backend API Development (Node.js)', quantity: 1, unitPrice: 180000 },
    { id: 4, service: 'Database Design & Setup (PostgreSQL)', quantity: 1, unitPrice: 60000 },
    { id: 5, service: 'Testing & QA', quantity: 1, unitPrice: 50000 },
    { id: 6, service: 'Deployment & DevOps', quantity: 1, unitPrice: 40000 },
    { id: 7, service: '2 Months Support & Maintenance', quantity: 1, unitPrice: 30000 },
  ],
  taxRate: 0.18,
  discountPercent: 10,
  notes: 'This quote is valid for 30 days. Final pricing may vary based on scope changes and additional requirements during development.',
};

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

const Input = ({ value, onChange, placeholder, type = 'text', style = {} }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: `1.5px solid ${COLORS.grayBorder}`,
      borderRadius: '6px',
      fontSize: '13px',
      fontFamily: "'DM Sans', sans-serif",
      color: COLORS.textMain,
      outline: 'none',
      transition: 'border-color 0.15s',
      ...style,
    }}
    onFocus={(e) => (e.target.style.borderColor = COLORS.yellow)}
    onBlur={(e) => (e.target.style.borderColor = COLORS.grayBorder)}
  />
);

const Button = ({ children, onClick, variant = 'default', style = {} }) => {
  const variants = {
    default: {
      bg: COLORS.white,
      border: `1.5px solid ${COLORS.grayBorder}`,
      color: COLORS.grayMid,
    },
    primary: {
      bg: COLORS.yellow,
      border: `1.5px solid ${COLORS.yellow}`,
      color: COLORS.textMain,
    },
    success: {
      bg: '#e8f5e9',
      border: `1.5px solid #4caf50`,
      color: '#2e7d32',
    },
  };

  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        backgroundColor: v.bg,
        border: v.border,
        color: v.color,
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.15s',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.grayBorder}`,
      borderRadius: '10px',
      padding: '16px 18px',
      ...style,
    }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2
    style={{
      fontSize: '13px',
      fontWeight: '600',
      color: COLORS.grayMid,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '12px',
      marginTop: '16px',
    }}
  >
    {children}
  </h2>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreonoxQuoteTemplate() {
  const [language, setLanguage] = useState('en');
  const [quoteData, setQuoteData] = useState(DEFAULT_QUOTE_DATA);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://api.creonox.com/quotes');

  const t = LANGUAGES[language];

  // Calculations
  const subtotal = quoteData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * quoteData.taxRate;
  const discountAmount = subtotal * (quoteData.discountPercent / 100);
  const finalTotal = subtotal + taxAmount - discountAmount;

  // Backend Integration
  const saveToBackend = async () => {
    setLoading(true);
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteData,
          language,
          subtotal,
          taxAmount,
          discountAmount,
          finalTotal,
          createdAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('Quote saved successfully!');
        const data = await response.json();
        console.log('Backend response:', data);
      } else {
        alert('Failed to save quote. Check console for details.');
      }
    } catch (error) {
      console.error('Backend error:', error);
      alert('Error connecting to backend. Make sure your API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLineItemChange = (id, field, value) => {
    setQuoteData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: field === 'service' ? value : parseFloat(value) || 0 } : item
      ),
    }));
  };

  const addLineItem = () => {
    const newId = Math.max(...quoteData.lineItems.map((item) => item.id), 0) + 1;
    setQuoteData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: newId, service: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeLineItem = (id) => {
    setQuoteData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif" }}>
        {/* HEADER */}

 

        {/* QUOTE DOCUMENT */}
        <Card style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: `2px solid ${COLORS.grayBorder}` }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, marginBottom: '4px' }}>
                {t.quoteNumber}
              </div>
              {editMode ? (
                <Input value={quoteData.quoteNumber} onChange={(e) => setQuoteData({ ...quoteData, quoteNumber: e.target.value })} />
              ) : (
                <div style={{ fontSize: '18px', fontWeight: '600', color: COLORS.textMain }}>
                  {quoteData.quoteNumber}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, marginBottom: '4px' }}>
                {t.date}
              </div>
              {editMode ? (
                <Input type="date" value={quoteData.date} onChange={(e) => setQuoteData({ ...quoteData, date: e.target.value })} />
              ) : (
                <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.textMain }}>
                  {new Date(quoteData.date).toLocaleDateString()}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, marginBottom: '4px' }}>
                {t.validUntil}
              </div>
              {editMode ? (
                <Input type="date" value={quoteData.validUntil} onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })} />
              ) : (
                <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.textMain }}>
                  {new Date(quoteData.validUntil).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Agency Info */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle>{t.agencyInfo}</SectionTitle>
            <div style={{ fontSize: '13px', lineHeight: '1.8', color: COLORS.textSub }}>
              <div style={{ fontWeight: '600', color: COLORS.textMain, marginBottom: '4px' }}>{t.agencyName}</div>
              <div>{t.agencyAddress}</div>
              <div>{t.agencyPhone}</div>
              <div>{t.agencyEmail}</div>
              <div style={{ marginTop: '4px', color: COLORS.yellow, fontWeight: '600' }}>{t.website}</div>
            </div>
          </div>

          {/* Client Info */}
          <div style={{ background: '#faf9f7', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <SectionTitle>{t.clientInfo}</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, display: 'block', marginBottom: '4px' }}>
                  {t.clientName}
                </label>
                {editMode ? (
                  <Input value={quoteData.clientName} onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })} />
                ) : (
                  <div style={{ fontSize: '13px', color: COLORS.textMain }}>{quoteData.clientName}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, display: 'block', marginBottom: '4px' }}>
                  {t.contactPerson}
                </label>
                {editMode ? (
                  <Input value={quoteData.contactPerson} onChange={(e) => setQuoteData({ ...quoteData, contactPerson: e.target.value })} />
                ) : (
                  <div style={{ fontSize: '13px', color: COLORS.textMain }}>{quoteData.contactPerson}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, display: 'block', marginBottom: '4px' }}>
                  {t.email}
                </label>
                {editMode ? (
                  <Input value={quoteData.email} onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })} />
                ) : (
                  <div style={{ fontSize: '13px', color: COLORS.textMain }}>{quoteData.email}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: COLORS.textSub, display: 'block', marginBottom: '4px' }}>
                  {t.phone}
                </label>
                {editMode ? (
                  <Input value={quoteData.phone} onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })} />
                ) : (
                  <div style={{ fontSize: '13px', color: COLORS.textMain }}>{quoteData.phone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Project Scope */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle>{t.projectScope}</SectionTitle>
            {editMode ? (
              <textarea
                value={quoteData.scopeDescription}
                onChange={(e) => setQuoteData({ ...quoteData, scopeDescription: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: `1.5px solid ${COLORS.grayBorder}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: COLORS.textMain,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            ) : (
              <div style={{ fontSize: '13px', color: COLORS.textSub, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {quoteData.scopeDescription}
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle>{t.lineItems}</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${COLORS.grayBorder}`, background: '#faf9f7' }}>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '11px', fontWeight: '600', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t.service}
                    </th>
                    <th style={{ textAlign: 'center', padding: '10px', fontSize: '11px', fontWeight: '600', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>
                      {t.quantity}
                    </th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '11px', fontWeight: '600', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                      {t.unitPrice}
                    </th>
                    <th style={{ textAlign: 'right', padding: '10px', fontSize: '11px', fontWeight: '600', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                      {t.total}
                    </th>
                    {editMode && <th style={{ width: '40px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {quoteData.lineItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.grayBorder}` }}>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: COLORS.textMain }}>
                        {editMode ? (
                          <Input
                            value={item.service}
                            onChange={(e) => handleLineItemChange(item.id, 'service', e.target.value)}
                          />
                        ) : (
                          item.service
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: COLORS.textMain, textAlign: 'center' }}>
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, 'quantity', e.target.value)}
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', color: COLORS.textMain, textAlign: 'right' }}>
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(item.id, 'unitPrice', e.target.value)}
                          />
                        ) : (
                          `${t.currency} ${(item.unitPrice).toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: COLORS.yellow, textAlign: 'right' }}>
                        {`${t.currency} ${(item.quantity * item.unitPrice).toLocaleString('en-IN')}`}
                      </td>
                      {editMode && (
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => removeLineItem(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#c0392b',
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: '600',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.target.style.color = '#a02a21')}
                            onMouseLeave={(e) => (e.target.style.color = '#c0392b')}
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editMode && (
              <Button
                variant="default"
                onClick={addLineItem}
                style={{ marginTop: '12px', width: '100%', background: '#faf9f7' }}
              >
                {t.addService}
              </Button>
            )}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.grayBorder}`, fontSize: '12px' }}>
                <span style={{ color: COLORS.textSub }}>{t.subtotal}:</span>
                <span style={{ color: COLORS.textMain, fontWeight: '500' }}>
                  {t.currency} {subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.grayBorder}`, fontSize: '12px' }}>
                <span style={{ color: COLORS.textSub }}>
                  {t.tax} ({(quoteData.taxRate * 100).toFixed(0)}%):
                </span>
                <span style={{ color: COLORS.textMain, fontWeight: '500' }}>
                  {t.currency} {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.grayBorder}`, fontSize: '12px' }}>
                <span style={{ color: COLORS.textSub }}>
                  {t.discount} ({quoteData.discountPercent}%):
                </span>
                {editMode ? (
                  <Input
                    type="number"
                    value={quoteData.discountPercent}
                    onChange={(e) => setQuoteData({ ...quoteData, discountPercent: parseFloat(e.target.value) || 0 })}
                    style={{ width: '80px' }}
                  />
                ) : (
                  <span style={{ color: '#2e7d32', fontWeight: '500' }}>
                    -{t.currency} {discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: '16px', fontWeight: '700', color: COLORS.yellow }}>
                <span>{t.finalTotal}:</span>
                <span>{t.currency} {finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div style={{ background: '#faf9f7', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <SectionTitle>{t.terms}</SectionTitle>
            {editMode ? (
              <textarea
                value={quoteData.termsContent || ''}
                onChange={(e) => setQuoteData({ ...quoteData, termsContent: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: `1.5px solid ${COLORS.grayBorder}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: COLORS.textMain,
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{ fontSize: '12px', color: COLORS.textSub, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {quoteData.termsContent}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <SectionTitle>{t.notes}</SectionTitle>
            {editMode ? (
              <textarea
                value={quoteData.notes || ''}
                onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: `1.5px solid ${COLORS.grayBorder}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: COLORS.textMain,
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{ fontSize: '12px', color: COLORS.textSub, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {quoteData.notes}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ paddingTop: '16px', borderTop: `1px solid ${COLORS.grayBorder}`, textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '12px', color: COLORS.textSub, fontStyle: 'italic' }}>
              {t.footer}
            </p>
          </div>
        </Card>

        {/* FOOTER ACTION */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: COLORS.textSub }}>
            💡 Use Ctrl+P to print or save as PDF | 📡 Backend URL configured above for API integration
          </p>
        </div>
      </div>
    </div>
  );
}