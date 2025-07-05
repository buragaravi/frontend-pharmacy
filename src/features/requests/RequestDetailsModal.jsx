import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { jwtDecode } from 'jwt-decode';
import RequestStatusBadge from './RequestStatusBadge';
import { Printer, FileText, X, RotateCcw } from 'lucide-react';
import UnifiedReturnDialog from './UnifiedReturnDialog';

// Constants for theming
const THEME = {
  background: 'bg-gradient-to-br from-[#F5F9FD] to-[#E1F1FF]',
  card: 'bg-white/95 backdrop-blur-md border border-[#BCE0FD]/30 shadow-xl',
  border: 'border-[#BCE0FD]/20',
  primaryText: 'text-[#0B3861]',
  secondaryText: 'text-[#64B5F6]',
  mutedText: 'text-gray-600',
  primaryBg: 'bg-[#0B3861]',
  secondaryBg: 'bg-[#64B5F6]',
  hoverBg: 'hover:bg-[#1E88E5]',
  inputFocus: 'focus:ring-2 focus:ring-[#0B3861]/20 focus:border-[#0B3861]'
};

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    color: '#0B3861',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    color: '#0B3861',
    marginBottom: 10,
    fontWeight: 'bold'
  },
  infoBox: {
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 10,
    color: '#64B5F6',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 12,
    color: '#0B3861'
  },
  table: {
    width: '100%',
    marginTop: 10
  },
  tableHeader: {
    backgroundColor: '#F5F9FD',
    padding: 8,
    fontSize: 10,
    color: '#0B3861',
    fontWeight: 'bold'
  },
  tableRow: {
    padding: 8,
    fontSize: 10,
    color: '#0B3861',
    backgroundColor: '#FFFFFF'
  },
  signature: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#0B3861',
    paddingTop: 5,
    alignSelf: 'flex-end'
  },
  signatureText: {
    fontSize: 10,
    color: '#64B5F6'
  }
});

// PDF Document for Download
const RequestPDF = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Request Details</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Lab ID</Text>
            <Text style={styles.infoValue}>{request.labId}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{request.status}</Text>
          </View>
          {request.facultyId?.name && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Faculty</Text>
              <Text style={styles.infoValue}>{request.facultyId.name}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experiments</Text>
        {request.experiments?.map((exp, index) => (
          <View key={exp._id} style={{ marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E1F1FF', paddingBottom: 8 }}>
            <Text style={styles.infoValue}>Experiment {index + 1}: {exp.experimentName}</Text>
            <Text style={styles.infoLabel}>{exp.date} - {exp.session}</Text>
            {/* Chemicals Table */}
            {exp.chemicals && exp.chemicals.length > 0 && (
              <View style={styles.table}>
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#BCE0FD' }}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Chemical</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Quantity</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Unit</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Status</Text>
                </View>
                {exp.chemicals?.map((chemical) => (
                  <View key={chemical._id} style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#F5F9FD' }}>
                    <Text style={[styles.tableRow, { flex: 2 }]}>{chemical.chemicalName}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{chemical.quantity}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{chemical.unit}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{chemical.isAllocated ? 'Allocated' : 'Pending'}</Text>
                  </View>
                ))}
              </View>
            )}
            {/* Glassware Table */}
            {exp.glassware && exp.glassware.length > 0 && (
              <View style={[styles.table, { marginTop: 8 }]}> 
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#BCE0FD' }}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Glassware</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Quantity</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Unit</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Status</Text>
                </View>                {exp.glassware.map((glass) => (
                  <View key={glass._id} style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#F5F9FD' }}>
                    <Text style={[styles.tableRow, { flex: 2 }]}>{glass.name || glass.glasswareName || 'N/A'}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{glass.quantity}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{glass.unit || glass.variant || ''}</Text>
                    <Text style={[styles.tableRow, { flex: 1 }]}>{glass.isAllocated ? 'Allocated' : 'Pending'}</Text>
                  </View>
                ))}
              </View>
            )}
            {/* Equipment Table */}
            {exp.equipment && exp.equipment.length > 0 && (
              <View style={[styles.table, { marginTop: 8 }]}> 
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#BCE0FD' }}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Equipment</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Quantity</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Variant</Text>
                  <Text style={[styles.tableHeader, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Allocated Item IDs</Text>
                </View>
                {exp.equipment.map((eq) => {
                  let allocatedItemIds = '';
                  if (eq.isAllocated && Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                    const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                    if (Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0) {
                      const shown = lastAlloc.itemIds.slice(0, 3);
                      allocatedItemIds = shown.join(', ');
                      if (lastAlloc.itemIds.length > 3) allocatedItemIds += ', ...';
                    }
                  }
                  return (
                    <View key={eq._id} style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#F5F9FD' }}>
                      <Text style={[styles.tableRow, { flex: 2 }]}>{eq.name}</Text>
                      <Text style={[styles.tableRow, { flex: 1 }]}>{eq.quantity}</Text>
                      <Text style={[styles.tableRow, { flex: 1 }]}>{eq.variant}</Text>
                      <Text style={[styles.tableRow, { flex: 1 }]}>{eq.isAllocated ? 'Allocated' : 'Pending'}</Text>
                      <Text style={[styles.tableRow, { flex: 2 }]}>{allocatedItemIds}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={styles.signature}>
        <Text style={styles.signatureText}>Authorized Signature</Text>
      </View>
    </Page>
  </Document>
);

// PrintableContent Component
const PrintableContent = React.forwardRef(({ request }, ref) => {
  if (!request) return null;

  return (
    <div ref={ref} className={`p-6 ${THEME.background}`}>
      <h2 className={`text-2xl font-bold ${THEME.primaryText} mb-4`}>Request Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`${THEME.card} p-4 rounded-lg ${THEME.border}`}>
          <p className={`text-sm font-medium ${THEME.secondaryText}`}>Lab ID</p>
          <p className={`font-medium ${THEME.primaryText}`}>{request.labId}</p>
        </div>
        <div className={`${THEME.card} p-4 rounded-lg ${THEME.border}`}>
          <p className={`text-sm font-medium ${THEME.secondaryText}`}>Status</p>
          <RequestStatusBadge status={request.status} />
        </div>
        {request.facultyId?.name && (
          <div className={`${THEME.card} p-4 rounded-lg ${THEME.border}`}>
            <p className={`text-sm font-medium ${THEME.secondaryText}`}>Faculty</p>
            <p className={`font-medium ${THEME.primaryText}`}>{request.facultyId.name}</p>
          </div>
        )}
      </div>

      <div className={`${THEME.card} p-4 rounded-lg ${THEME.border} mb-6`}>
        <h3 className={`text-lg font-semibold ${THEME.primaryText} mb-3`}>Experiments</h3>
        <div className="space-y-4">
          {request.experiments?.map((exp, index) => (
            <div key={exp._id} className={`p-4 rounded-lg ${THEME.border}`}>
              <p className={`font-medium ${THEME.primaryText} mb-2`}>
                Experiment {index + 1}: {exp.experimentName}
              </p>
              <p className={`text-sm ${THEME.secondaryText} mb-2`}>
                {exp.date} - {exp.session}
              </p>
              {/* Chemicals Table */}
              {exp.chemicals && exp.chemicals.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Chemicals</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Chemical</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Quantity</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Unit</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {exp.chemicals.map((chemical) => (
                          <tr key={chemical._id}>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{chemical.chemicalName}</td>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{chemical.quantity}</td>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{chemical.unit}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${chemical.isAllocated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {chemical.isAllocated ? 'Allocated' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Glassware Table */}
              {exp.glassware && exp.glassware.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Glassware</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Glassware</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Quantity</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Unit</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">                        {exp.glassware.map((glass) => (
                          <tr key={glass._id}>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{glass.name || glass.glasswareName || 'N/A'}</td>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{glass.quantity}</td>
                            <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{glass.unit || glass.variant || ''}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${glass.isAllocated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {glass.isAllocated ? 'Allocated' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Equipment Table */}
              {exp.equipment && exp.equipment.length > 0 && (
                <div className="mt-4">
                  <div className="font-semibold text-xs text-[#0B3861] mb-1">Equipment</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Equipment</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Quantity</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Variant</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Status</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium ${THEME.primaryText}`}>Allocated Item IDs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {exp.equipment.map((eq) => {
                          let allocatedItemIds = '';
                          if (eq.isAllocated && Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                            const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                            if (Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0) {
                              const shown = lastAlloc.itemIds.slice(0, 3);
                              allocatedItemIds = shown.join(', ');
                              if (lastAlloc.itemIds.length > 3) allocatedItemIds += ', ...';
                            }
                          }
                          return (
                            <tr key={eq._id}>
                              <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{eq.name}</td>
                              <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{eq.quantity}</td>
                              <td className={`px-4 py-2 text-sm ${THEME.primaryText}`}>{eq.variant}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eq.isAllocated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {eq.isAllocated ? 'Allocated' : 'Pending'}
                                </span>
                              </td>
                              <td className={`px-4 py-2 text-xs ${THEME.primaryText}`}>{allocatedItemIds}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-right mt-8">
        <p className={`text-sm font-medium ${THEME.secondaryText}`}>Authorized Signature</p>
      </div>
    </div>
  );
});

const RequestDetailsModal = ({ request, open, onClose }) => {
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [userRole, setUserRole] = useState('');
  const componentRef = useRef();

  useEffect(() => {
    if (open && request) {
      setIsPdfReady(true);
    } else {
      setIsPdfReady(false);
    }
  }, [open, request]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.user.role);
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }, []);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Request_${request?.labId || 'Details'}`
  });

  // Check if any items are allocated for return and status is eligible
  const eligibleStatuses = ['fulfilled', 'partially_fulfilled'];
  const hasAllocatedItems = eligibleStatuses.includes(request?.status) && request?.experiments?.some(exp =>
    (exp.chemicals && exp.chemicals.some(chem => chem.isAllocated && chem.allocatedQuantity > 0)) ||
    (exp.glassware && exp.glassware.some(glass => glass.isAllocated && glass.allocatedQuantity > 0)) ||
    (exp.equipment && exp.equipment.some(eq => eq.isAllocated && Array.isArray(eq.itemIds) && eq.itemIds.length > 0))
  );

  // Always show Return Items button if any equipment or glassware is allocated
  const hasAllocatedEquipmentOrGlassware = request?.experiments?.some(exp =>
    (exp.equipment && exp.equipment.some(eq => eq.isAllocated)) ||
    (exp.glassware && exp.glassware.some(glass => glass.isAllocated))
  );

  // Show return button only for faculty
  const isFaculty = userRole === 'faculty';
  const showReturnButton = isFaculty && (hasAllocatedItems || hasAllocatedEquipmentOrGlassware);

  if (!open || !request) return null;

  return (
    <div className="w-full max-w-4xl max-h-[95vh] overflow-hidden relative z-[9999]">
      <div className={`${THEME.card} rounded-xl w-full max-h-[95vh] overflow-hidden relative z-[9999]`}>
        <div className="p-6 overflow-y-auto max-h-[95vh]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/50">
            <h2 className={`text-lg font-semibold ${THEME.primaryText}`}>Request Details</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePrint}
                className={`flex items-center p-2 rounded-lg ${THEME.secondaryText} hover:text-[#1E88E5] hover:bg-gray-100/80 transition-all`}
                title="Print Request"
              >
                <Printer size={18} />
              </button>
              {isPdfReady && (
                <PDFDownloadLink 
                  document={<RequestPDF request={request} />} 
                  fileName={`Request_${request.labId}.pdf`}
                  className={`flex items-center p-2 rounded-lg ${THEME.secondaryText} hover:text-[#1E88E5] hover:bg-gray-100/80 transition-all`}
                  title="Download PDF"
                >
                  {({ loading }) => (
                    loading ? <FileText size={18} className="animate-pulse" /> : <FileText size={18} />
                  )}
                </PDFDownloadLink>
              )}
              {/* Return Items button for faculty only */}
              {showReturnButton && (
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${THEME.primaryBg} text-white font-medium text-sm hover:bg-[#1A365D] transition-all`}
                  onClick={() => setShowReturnDialog(true)}
                  title="Return Items"
                >
                  <RotateCcw size={16} />
                  <span>Return</span>
                </button>
              )}
              <button
                onClick={onClose}
                className={`flex items-center p-2 rounded-lg ${THEME.secondaryText} hover:text-[#1E88E5] hover:bg-gray-100/80 transition-all`}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <PrintableContent ref={componentRef} request={request} />
        </div>
      </div>
      {/* Unified Return Dialog */}
      {showReturnDialog && (
        <UnifiedReturnDialog
          request={request}
          onClose={() => setShowReturnDialog(false)}
          onSuccess={onClose} // Optionally refresh or close modal on success
        />
      )}
    </div>
  );
};

export default RequestDetailsModal;