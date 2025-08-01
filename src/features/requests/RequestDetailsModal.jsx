import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { FaInfoCircle, FaSpinner, FaFlask } from 'react-icons/fa';
import RequestStatusBadge from './RequestStatusBadge';
import CourseInfoBadge from './CourseInfoBadge';
import { Printer, FileText, X, RotateCcw, Shield, Calendar, Clock, AlertTriangle, Settings } from 'lucide-react';
import UnifiedReturnDialog from './UnifiedReturnDialog';
import { adminApproveRequest } from '../../utils/requestApi';
import AdminOverrideDialog from '../../components/ui/AdminOverrideDialog';
import { 
  setAdminOverride, 
  getItemEditPermissions,
  updateItemDisabledStatus,
  adminEditRequest
} from '../../utils/allocationApi';
import { formatDate } from '../../utils/dateValidation';

// Date validation utility
const canAllocateRemaining = (experimentDate) => {
  const expDate = new Date(experimentDate);
  const currentDate = new Date();
  const daysDiff = Math.ceil((currentDate - expDate) / (1000 * 60 * 60 * 24));
  return daysDiff <= 2; // Allow allocation within 2 days after experiment
};

// Helper function to check if request has remaining quantities
const hasRemainingQuantities = (request) => {
  if (!request?.experiments) return false;
  
  return request.experiments.some(exp => {
    const hasRemainingChemicals = exp.chemicals?.some(chem => 
      !chem.isDisabled && (chem.allocatedQuantity || 0) < chem.quantity
    );
    const hasRemainingGlassware = exp.glassware?.some(glass => 
      !glass.isDisabled && (glass.allocatedQuantity || 0) < glass.quantity
    );
    const hasRemainingEquipment = exp.equipment?.some(equip => 
      !equip.isDisabled && (equip.allocatedQuantity || 0) < equip.quantity
    );
    
    return hasRemainingChemicals || hasRemainingGlassware || hasRemainingEquipment;
  });
};

// Helper function to check if any experiment is within allocation window
const hasValidAllocationWindow = (request) => {
  if (!request?.experiments) return false;
  return request.experiments.some(exp => canAllocateRemaining(exp.date));
};

// Constants for theming - Browser Compatible Version
const THEME = {
  // ✅ Compatible backgrounds - using standard Tailwind classes
  background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  card: 'bg-white border border-blue-200 shadow-xl',
  border: 'border-blue-200',
  primaryText: 'text-blue-900',
  secondaryText: 'text-blue-600',
  mutedText: 'text-gray-600',
  
  // ✅ Simple, compatible gradients
  primaryBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
  secondaryBg: 'bg-gradient-to-r from-blue-400 to-blue-500',
  hoverBg: 'hover:from-blue-600 hover:to-blue-700',
  
  // ✅ Standard focus/hover effects
  inputFocus: 'focus:ring-2 focus:ring-blue-300 focus:border-blue-400',
  modalOverlay: 'bg-black bg-opacity-50',
  accent: 'text-purple-600',
  
  // ✅ Compatible status colors
  success: 'bg-gradient-to-r from-green-500 to-green-600',
  danger: 'bg-gradient-to-r from-red-500 to-red-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  
  // ✅ Simple hover effects
  cardHover: 'hover:shadow-2xl transition-shadow duration-300',
  buttonShadow: 'shadow-lg',
  glassEffect: 'bg-white border border-gray-200'
};

// PDF Styles - Updated for vibrant blue theme
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#FAFBFF'
  },
  header: {
    fontSize: 20,
    marginBottom: 25,
    color: '#1E3A8A',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1E3A8A',
    marginBottom: 12,
    fontWeight: 'bold'
  },
  infoBox: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 4
  },
  infoLabel: {
    fontSize: 10,
    color: '#3B82F6',
    marginBottom: 3,
    fontWeight: 'bold'
  },
  infoValue: {
    fontSize: 12,
    color: '#1E3A8A'
  },
  table: {
    width: '100%',
    marginTop: 12,
    borderRadius: 4,
    overflow: 'hidden'
  },
  tableHeader: {
    backgroundColor: '#E6F3FF',
    padding: 10,
    fontSize: 10,
    color: '#1E3A8A',
    fontWeight: 'bold'
  },
  tableRow: {
    padding: 10,
    fontSize: 10,
    color: '#1E3A8A',
    backgroundColor: '#FFFFFF'
  },
  signature: {
    marginTop: 40,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    paddingTop: 8,
    alignSelf: 'flex-end'
  },
  signatureText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: 'bold'
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
        {/* Course and Batch Information */}
        {(request.courseId || request.batchId) && (
          <View style={styles.row}>
            {request.courseId && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>
                  {request.courseId.courseCode} - {request.courseId.courseName}
                </Text>
              </View>
            )}
            {request.courseId?.batches && request.batchId && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Batch</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const batch = request.courseId.batches.find(b => b._id.toString() === request.batchId.toString());
                    return batch ? `${batch.batchCode}${batch.batchName ? ' - ' + batch.batchName : ''}${batch.academicYear ? ' (AY ' + batch.academicYear + ')' : ''}` : 'Unknown Batch';
                  })()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experiments</Text>
        {request.experiments?.map((exp, index) => (
          <View key={exp._id} style={{ marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E1F1FF', paddingBottom: 8 }}>
            <Text style={styles.infoValue}>Experiment {index + 1}: {exp.experimentName}</Text>
            <Text style={styles.infoLabel}>
              {exp.date.split('T')[0]} | Course: {exp.courseId?.courseName} ({exp.courseId?.courseCode}) | Batch: {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchName} ({exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchCode}) - {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.academicYear}
            </Text>
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
const PrintableContent = React.forwardRef(({ request, userRole }, ref) => {
  if (!request) return null;

  return (
    <div ref={ref} className={`p-4 sm:p-6 ${THEME.background}`}>
      <h2 className={`text-lg sm:text-xl font-bold ${THEME.primaryText} mb-4`}>Request Details</h2>

      {/* First Row: Lab ID, Status, Faculty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.cardHover}`}>
          <p className={`text-xs font-semibold ${THEME.secondaryText} mb-1`}>Lab ID</p>
          <p className={`font-bold ${THEME.primaryText} text-sm sm:text-base`}>{request.labId}</p>
        </div>
        <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.cardHover}`}>
          <p className={`text-xs font-semibold ${THEME.secondaryText} mb-1`}>Status</p>
          <RequestStatusBadge status={request.status} />
        </div>
        {request.facultyId?.name && (
          <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.cardHover} ${!request.facultyId?.name ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <p className={`text-xs font-semibold ${THEME.secondaryText} mb-1`}>Faculty</p>
            <p className={`font-bold ${THEME.primaryText} text-sm sm:text-base`}>{request.facultyId.name}</p>
          </div>
        )}
      </div>

      {/* Second Row: Approval History and Edit History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {/* Approval History */}
        {request.approvalHistory && request.approvalHistory.length > 0 && (
          <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.cardHover}`}>
            <h3 className={`text-sm font-bold ${THEME.primaryText} mb-3 flex items-center`}>
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-2"></div>
              Approval History
            </h3>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {request.approvalHistory.slice(-2).map((approval, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50/80 rounded-lg">
                  <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${approval.action === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <span className={`font-medium text-xs ${approval.action === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                        {approval.action === 'approve' ? 'Approved' : 'Rejected'}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        by {approval.approvedBy?.name || 'Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(approval.date).toLocaleString()}
                    </p>
                    {approval.reason && (
                      <p className="text-xs text-gray-700 mt-1 italic truncate">
                        "{approval.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {request.approvalHistory.length > 2 && (
                <p className="text-xs text-gray-500 text-center">
                  +{request.approvalHistory.length - 2} more entries
                </p>
              )}
            </div>
          </div>
        )}

        {/* Admin Edit History */}
        {request.adminEdits?.hasEdits && (
          <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.cardHover}`}>
            <h3 className={`text-sm font-bold ${THEME.primaryText} mb-3 flex items-center`}>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-2"></div>
              Edit History
            </h3>
            <div className="bg-blue-50/80 p-2 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-500"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 mb-0.5">
                    <span className="font-medium text-xs text-blue-700">Modified</span>
                    <span className="text-xs text-gray-500 truncate">
                      by {request.adminEdits.lastEditedBy || 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {new Date(request.adminEdits.lastEditedAt).toLocaleString()}
                  </p>
                  {request.adminEdits.editSummary && (
                    <p className="text-xs text-gray-700 mt-1 italic truncate">
                      "{request.adminEdits.editSummary}"
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-2 p-2 bg-yellow-50/80 rounded-lg border-l-2 border-yellow-400">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Request modified. Items with original quantities show changes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Course and Batch Information */}
      {(request.courseId || request.batchId) && (
        <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} mb-4 ${THEME.cardHover}`}>
          <h3 className={`text-sm font-bold ${THEME.primaryText} mb-3`}>Course & Batch Details</h3>
          <CourseInfoBadge request={request} className="flex-wrap" />
        </div>
      )}

      <div className={`${THEME.card} p-3 sm:p-4 rounded-xl ${THEME.border} mb-4 ${THEME.cardHover}`}>
        <h3 className={`text-sm font-bold ${THEME.primaryText} mb-3`}>Experiments</h3>
        <div className="space-y-4">
          {request.experiments?.map((exp, index) => (
            <div key={exp._id} className={`p-3 sm:p-4 rounded-xl ${THEME.border} ${THEME.glassEffect} ${THEME.cardHover}`}>
              {/* Simple Experiment Header for Print */}
              <div className="mb-4">
                <p className={`font-bold ${THEME.primaryText} mb-2 text-sm sm:text-base`}>
                  Experiment {index + 1}: {exp.experimentName}
                </p>
                <div className="text-xs space-y-1">
                  <p className={`${THEME.secondaryText} font-medium`}>
                    Course: {exp.courseId?.courseName} ({exp.courseId?.courseCode})
                  </p>
                  <p className={`${THEME.secondaryText} font-medium`}>
                    Batch: {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchName} 
                    ({exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.batchCode}) - 
                    {exp.courseId?.batches?.find(batch => batch._id === exp.batchId)?.academicYear}
                  </p>
                  <p className={`${THEME.secondaryText} font-medium`}>
                    Date: {new Date(exp.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {exp.chemicals && exp.chemicals.length > 0 && (
                <div className="mt-4">
                  <div className="font-bold text-sm text-[#1E3A8A] mb-2 flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-2"></div>
                    Chemicals
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-blue-100/60 shadow-md">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Chemical</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Quantity & Unit</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {exp.chemicals.map((chemical) => {          
                          return (
                            <tr key={chemical._id} className={`${chemical.isDisabled ? 'bg-rose-50/80' : 'bg-white/90'} hover:bg-blue-50/50 transition-colors duration-200`}>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm ${THEME.primaryText} ${chemical.isDisabled ? 'text-rose-600 line-through' : ''} font-medium`}>
                                {chemical.chemicalName}
                                {chemical.isDisabled && (
                                  <div className="text-xs text-rose-500 mt-0.5 font-normal">
                                    Disabled: {chemical.disabledReason || 'No reason provided'}
                                  </div>
                                )}
                                {chemical.originalQuantity && chemical.originalQuantity !== chemical.quantity && (
                                  <div className="text-xs text-blue-600 mt-0.5 font-medium">
                                    Original: {chemical.originalQuantity} {chemical.unit}
                                  </div>
                                )}
                              </td>
                            <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold ${chemical.isDisabled ? 'text-rose-600' : THEME.primaryText}`}>
                              {chemical.quantity} {chemical.unit}
                              {chemical.allocatedQuantity && chemical.allocatedQuantity > 0 && (
                                <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                  ({chemical.allocatedQuantity} allocated)
                                </div>
                              )}
                            </td>
                              <td className="px-3 sm:px-4 py-2">
                                {chemical.isDisabled ? (
                                  <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 shadow-sm">
                                    Disabled
                                  </span>
                                ) : (
                                  (() => {
                                    const allocatedQty = chemical.allocatedQuantity || 0;
                                    const totalQty = chemical.quantity;
                                    const isFullyAllocated = allocatedQty >= totalQty;
                                    const isPartiallyAllocated = allocatedQty > 0 && allocatedQty < totalQty;
                                    
                                    if (isFullyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800">
                                          Fully Allocated
                                        </span>
                                      );
                                    } else if (isPartiallyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800">
                                          Partially Allocated
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800">
                                          Pending
                                        </span>
                                      );
                                    }
                                  })()
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Glassware Table */}
              {exp.glassware && exp.glassware.length > 0 && (
                <div className="mt-4">
                  <div className="font-bold text-sm text-[#1E3A8A] mb-2 flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full mr-2"></div>
                    Glassware
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-blue-100/60 shadow-md">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Glassware</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Quantity & Unit</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {exp.glassware.map((glass) => {          
                          return (
                            <tr key={glass._id} className={`${glass.isDisabled ? 'bg-rose-50/80' : 'bg-white/90'} hover:bg-blue-50/50 transition-colors duration-200`}>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm ${THEME.primaryText} ${glass.isDisabled ? 'text-rose-600 line-through' : ''} font-medium`}>
                                {glass.name || glass.glasswareName || 'N/A'}
                                {glass.isDisabled && (
                                  <div className="text-xs text-rose-500 mt-0.5 font-normal">
                                    Disabled: {glass.disabledReason || 'No reason provided'}
                                  </div>
                                )}
                                {glass.originalQuantity && glass.originalQuantity !== glass.quantity && (
                                  <div className="text-xs text-blue-600 mt-0.5 font-medium">
                                    Original: {glass.originalQuantity} {glass.unit || glass.variant || ''}
                                  </div>
                                )}
                              </td>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold ${glass.isDisabled ? 'text-rose-600' : THEME.primaryText}`}>
                                {glass.quantity} {glass.unit || glass.variant || ''}
                                {glass.allocatedQuantity && glass.allocatedQuantity > 0 && (
                                  <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                    ({glass.allocatedQuantity} allocated)
                                  </div>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-2">
                                {glass.isDisabled ? (
                                  <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 shadow-sm">
                                    Disabled
                                  </span>
                                ) : (
                                  (() => {
                                    const allocatedQty = glass.allocatedQuantity || 0;
                                    const totalQty = glass.quantity;
                                    const isFullyAllocated = allocatedQty >= totalQty;
                                    const isPartiallyAllocated = allocatedQty > 0 && allocatedQty < totalQty;
                                    
                                    if (isFullyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800">
                                          Fully Allocated
                                        </span>
                                      );
                                    } else if (isPartiallyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800">
                                          Partially Allocated
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800">
                                          Pending
                                        </span>
                                      );
                                    }
                                  })()
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Equipment Table */}
              {exp.equipment && exp.equipment.length > 0 && (
                <div className="mt-4">
                  <div className="font-bold text-sm text-[#1E3A8A] mb-2 flex items-center">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-2"></div>
                    Equipment
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-blue-100/60 shadow-md">
                    <table className="min-w-full">
                      <thead className={`${THEME.background}`}>
                        <tr>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Equipment</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Quantity</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Variant</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Status</th>
                          <th className={`px-3 sm:px-4 py-2 text-left text-xs font-bold ${THEME.primaryText} uppercase tracking-wider`}>Allocated Item IDs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50">
                        {exp.equipment.map((eq) => {
                          let allocatedItemIds = '';
                          if (eq.isAllocated && Array.isArray(eq.allocationHistory) && eq.allocationHistory.length > 0) {
                            const lastAlloc = eq.allocationHistory[eq.allocationHistory.length - 1];
                            if (Array.isArray(lastAlloc.itemIds) && lastAlloc.itemIds.length > 0) {
                              const shown = lastAlloc.itemIds.slice(0, 2);
                              allocatedItemIds = shown.join(', ');
                              if (lastAlloc.itemIds.length > 2) allocatedItemIds += ', ...';
                            }
                          }
                          return (
                            <tr key={eq._id} className={`${eq.isDisabled ? 'bg-rose-50/80' : 'bg-white/90'} hover:bg-blue-50/50 transition-colors duration-200`}>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm ${THEME.primaryText} ${eq.isDisabled ? 'text-rose-600 line-through' : ''} font-medium`}>
                                {eq.name}
                                {eq.isDisabled && (
                                  <div className="text-xs text-rose-500 mt-0.5 font-normal">
                                    Disabled: {eq.disabledReason || 'No reason provided'}
                                  </div>
                                )}
                                {eq.originalQuantity && eq.originalQuantity !== eq.quantity && (
                                  <div className="text-xs text-blue-600 mt-0.5 font-medium">
                                    Original: {eq.originalQuantity}
                                  </div>
                                )}
                              </td>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold ${eq.isDisabled ? 'text-rose-600' : THEME.primaryText}`}>
                                {eq.quantity}
                                {eq.allocatedQuantity && eq.allocatedQuantity > 0 && (
                                  <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                    ({eq.allocatedQuantity} allocated)
                                  </div>
                                )}
                              </td>
                              <td className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium ${eq.isDisabled ? 'text-rose-600' : THEME.mutedText}`}>
                                {eq.variant}
                              </td>
                              <td className="px-3 sm:px-4 py-2">
                                {eq.isDisabled ? (
                                  <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full bg-gradient-to-r from-rose-100 to-rose-200 text-rose-800 shadow-sm">
                                    Disabled
                                  </span>
                                ) : (
                                  (() => {
                                    const allocatedQty = eq.allocatedQuantity || 0;
                                    const totalQty = eq.quantity;
                                    const isFullyAllocated = allocatedQty >= totalQty;
                                    const isPartiallyAllocated = allocatedQty > 0 && allocatedQty < totalQty;
                                    
                                    if (isFullyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800">
                                          Fully Allocated
                                        </span>
                                      );
                                    } else if (isPartiallyAllocated) {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800">
                                          Partially Allocated
                                        </span>
                                      );
                                    } else {
                                      return (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full shadow-sm bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800">
                                          Pending
                                        </span>
                                      );
                                    }
                                  })()
                                )}
                              </td>
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

const RequestDetailsModal = ({ request, open, onClose, onRequestUpdate }) => {
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItems, setEditingItems] = useState([]); // For bulk editing
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [isSettingOverride, setIsSettingOverride] = useState(false);
  const [isAllocatingRemaining, setIsAllocatingRemaining] = useState(false);
  const [showAllocationConfirm, setShowAllocationConfirm] = useState(false);
  const [remainingItemsToAllocate, setRemainingItemsToAllocate] = useState([]);
  
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

  // Function to handle admin override
  const handleAdminOverride = async (overrideData) => {
    if (!selectedExperiment) return;
    
    setIsSettingOverride(true);
    try {
      await setAdminOverride(request._id, selectedExperiment._id, overrideData);
      
      toast.success(
        overrideData.enable 
          ? 'Admin override enabled successfully'
          : 'Admin override disabled successfully'
      );
      
      // Close dialog
      setShowAdminOverride(false);
      setSelectedExperiment(null);
      
      // Notify parent to refresh
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } catch (error) {
      console.error('Error setting admin override:', error);
      toast.error(`Failed to ${overrideData.enable ? 'enable' : 'disable'} override: ${error.message}`);
    } finally {
      setIsSettingOverride(false);
    }
  };

  // Function to prepare allocation confirmation
  const prepareAllocationConfirmation = () => {
    if (!request?._id) return;
    
    const remainingItems = [];
    
    request.experiments.forEach(exp => {
      // Only process experiments within allocation window
      if (!canAllocateRemaining(exp.date)) return;
      
      // Process chemicals
      exp.chemicals?.forEach(chem => {
        const remainingQty = chem.quantity - (chem.allocatedQuantity || 0);
        if (!chem.isDisabled && remainingQty > 0) {
          remainingItems.push({
            type: 'Chemical',
            name: chem.chemicalName,
            remainingQuantity: remainingQty,
            unit: chem.unit,
            experimentName: exp.experimentName
          });
        }
      });
      
      // Process glassware
      exp.glassware?.forEach(glass => {
        const remainingQty = glass.quantity - (glass.allocatedQuantity || 0);
        if (!glass.isDisabled && remainingQty > 0) {
          remainingItems.push({
            type: 'Glassware',
            name: glass.name || glass.glasswareName || 'N/A',
            remainingQuantity: remainingQty,
            unit: glass.unit || glass.variant || '',
            experimentName: exp.experimentName
          });
        }
      });
      
      // Process equipment
      exp.equipment?.forEach(equip => {
        const remainingQty = equip.quantity - (equip.allocatedQuantity || 0);
        if (!equip.isDisabled && remainingQty > 0) {
          remainingItems.push({
            type: 'Equipment',
            name: equip.name,
            remainingQuantity: remainingQty,
            unit: equip.variant || '',
            experimentName: exp.experimentName
          });
        }
      });
    });
    
    setRemainingItemsToAllocate(remainingItems);
    setShowAllocationConfirm(true);
  };

  // Function to handle allocate remaining
  const handleAllocateRemaining = async () => {
    if (!request?._id) return;
    
    setIsAllocatingRemaining(true);
    try {
      // Prepare remaining allocations for chemicals, glassware, equipment
      const remainingAllocations = {
        chemicals: [],
        glassware: [],
        equipment: []
      };
      
      request.experiments.forEach(exp => {
        // Only process experiments within allocation window
        if (!canAllocateRemaining(exp.date)) return;
        
        // Process chemicals
        exp.chemicals?.forEach(chem => {
          const remainingQty = chem.quantity - (chem.allocatedQuantity || 0);
          if (!chem.isDisabled && remainingQty > 0) {
            remainingAllocations.chemicals.push({
              experimentId: exp._id,
              chemicalId: chem._id,
              chemicalName: chem.chemicalName,
              quantity: remainingQty,
              unit: chem.unit
            });
          }
        });
        
        // Process glassware
        exp.glassware?.forEach(glass => {
          const remainingQty = glass.quantity - (glass.allocatedQuantity || 0);
          if (!glass.isDisabled && remainingQty > 0) {
            remainingAllocations.glassware.push({
              experimentId: exp._id,
              glasswareId: glass.glasswareId || glass._id,
              quantity: remainingQty
            });
          }
        });
        
        // Process equipment
        exp.equipment?.forEach(equip => {
          const remainingQty = equip.quantity - (equip.allocatedQuantity || 0);
          if (!equip.isDisabled && remainingQty > 0) {
            remainingAllocations.equipment.push({
              experimentId: exp._id,
              name: equip.name,
              variant: equip.variant,
              quantity: remainingQty
            });
          }
        });
      });
      
      // Check if there are any remaining items to allocate
      const totalRemaining = remainingAllocations.chemicals.length + 
                           remainingAllocations.glassware.length + 
                           remainingAllocations.equipment.length;
      
      if (totalRemaining === 0) {
        toast.info('No remaining items to allocate within the allowed time window');
        return;
      }
      
      // Call the unified allocation endpoint
      const response = await fetch(`https://backend-jits.onrender.com/api/requests/${request._id}/allocate-unified`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          equipment: remainingAllocations.equipment,
          glassware: remainingAllocations.glassware,
          // Chemicals will be automatically processed by the backend for remaining quantities
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully allocated remaining items! ${totalRemaining} items processed.`);
        
        // Refresh the request data
        if (onRequestUpdate) {
          onRequestUpdate();
        }
      } else {
        const errorData = await response.json();
        toast.error(`Allocation failed: ${errorData.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Error allocating remaining items:', error);
      toast.error('Failed to allocate remaining items');
    } finally {
      setIsAllocatingRemaining(false);
    }
  };

  // NEW: Function to open admin override dialog
  const openAdminOverrideDialog = (experiment) => {
    setSelectedExperiment(experiment);
    setShowAdminOverride(true);
  };

  // Admin approval functions
  const handleAdminApproval = async (action) => {
    if (action === 'approve') {
      setIsApproving(true);
    } else {
      setIsRejecting(true);
    }

    try {
      const data = await adminApproveRequest(request._id, action, approvalReason);
      
      // Show success message
      toast.success(`Request ${action}d successfully!`);
      
      // Reset form
      setApprovalReason('');
      
      // Notify parent component to refresh data
      if (onRequestUpdate) {
        onRequestUpdate();
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast.error(`Failed to ${action} request: ${error.message}`);
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };

  // Admin edit functions
  const handleEditRequest = () => {
    // Initialize edit data for all items in all experiments
    const allItems = [];
    request.experiments?.forEach(exp => {
      exp.chemicals?.forEach(chemical => {
        allItems.push({
          experimentId: exp._id, // Use the experiment object's _id, not the reference experimentId
          experimentName: exp.experimentName,
          itemType: 'chemicals',
          itemId: chemical._id,
          itemName: chemical.chemicalName,
          quantity: chemical.quantity, // Current quantity for editing
          originalQuantity: chemical.originalQuantity || chemical.quantity, // True original quantity
          currentQuantity: chemical.quantity, // Current quantity (for comparison)
          unit: chemical.unit,
          isDisabled: chemical.isDisabled || false,
          originalDisabled: chemical.isDisabled || false,
          disabledReason: chemical.disabledReason || '',
          originalDisabledReason: chemical.disabledReason || '',
          hasChanges: false
        });
      });
      exp.glassware?.forEach(glass => {
        allItems.push({
          experimentId: exp._id, // Use the experiment object's _id, not the reference experimentId
          experimentName: exp.experimentName,
          itemType: 'glassware',
          itemId: glass._id,
          itemName: glass.name || glass.glasswareName || 'N/A',
          quantity: glass.quantity,
          originalQuantity: glass.originalQuantity || glass.quantity,
          currentQuantity: glass.quantity,
          unit: glass.unit || glass.variant || '',
          isDisabled: glass.isDisabled || false,
          originalDisabled: glass.isDisabled || false,
          disabledReason: glass.disabledReason || '',
          originalDisabledReason: glass.disabledReason || '',
          hasChanges: false
        });
      });
      exp.equipment?.forEach(equipment => {
        allItems.push({
          experimentId: exp._id, // Use the experiment object's _id, not the reference experimentId
          experimentName: exp.experimentName,
          itemType: 'equipment',
          itemId: equipment._id,
          itemName: equipment.name,
          quantity: equipment.quantity,
          originalQuantity: equipment.originalQuantity || equipment.quantity,
          currentQuantity: equipment.quantity,
          unit: equipment.variant,
          isDisabled: equipment.isDisabled || false,
          originalDisabled: equipment.isDisabled || false,
          disabledReason: equipment.disabledReason || '',
          originalDisabledReason: equipment.disabledReason || '',
          hasChanges: false
        });
      });
    });
    
    setEditingItems(allItems);
    setEditFormData({ editReason: '' });
    setShowAdminEdit(true);
  };

  const handleSaveBulkEdit = async () => {
    try {
      setIsSavingEdit(true);
      let successCount = 0;
      
      const edits = editingItems
        .filter(item => item.hasChanges)
        .map(item => {
          const edit = {
            experimentId: item.experimentId, // Use item.experimentId instead of item.originalExperimentId
            itemType: item.itemType,
            itemId: item.itemId // Use item.itemId instead of item._id
          };
          
          if (item.quantity !== item.originalQuantity) {
            edit.newQuantity = item.quantity;
          }
          
          if (item.isDisabled !== item.originalIsDisabled) {
            edit.disableItem = item.isDisabled;
          }
          
          if (item.isDisabled && item.disabledReason !== item.originalDisabledReason) {
            edit.disableReason = item.disabledReason;
          }
          
          return edit;
        });

      console.log('Sending edits:', edits);
      console.log('Request ID:', request._id);

      if (edits.length === 0) {
        toast.info('No changes to save');
        setShowAdminEdit(false);
        return;
      }

      const payload = {
        edits,
        reason: editFormData.editReason || 'Request modified by admin'
      };
      
      console.log('Full payload:', payload);

      try {
        // Try using the API function first
        const response = await adminEditRequest(request._id, payload);
        console.log('Bulk edit successful');
        successCount = edits.length;
        
        toast.success(`Request updated successfully! ${edits.length} items modified.`);
        setShowAdminEdit(false);
        setEditingItems([]);
        
        if (onRequestUpdate) {
          onRequestUpdate();
        }
      } catch (error) {
        console.log('Bulk edit failed, trying individual edits for backward compatibility...');
        
        let individualSuccessCount = 0;
        const errors = [];
        
        for (const edit of edits) {
          try {
            const singlePayload = {
              experimentId: edit.experimentId,
              itemType: edit.itemType,
              itemId: edit.itemId,
              reason: editFormData.editReason || 'Request modified by admin'
            };
            
            if (edit.newQuantity !== undefined) singlePayload.newQuantity = edit.newQuantity;
            if (edit.disableItem !== undefined) singlePayload.disableItem = edit.disableItem;
            if (edit.disableReason !== undefined) singlePayload.disableReason = edit.disableReason;
            
            console.log('Sending individual edit:', singlePayload);
            
            const singleResponse = await adminEditRequest(request._id, singlePayload);
            individualSuccessCount++;
          } catch (singleError) {
            errors.push(`Item ${edit.itemId}: ${singleError.message}`);
          }
        }
        
        if (individualSuccessCount > 0) {
          let message = `Successfully updated ${individualSuccessCount} of ${edits.length} items.`;
          if (errors.length > 0) {
            message += ` Some errors occurred: ${errors.slice(0, 3).join(', ')}`;
            if (errors.length > 3) message += ` and ${errors.length - 3} more...`;
          }
          toast.success(message);
          setShowAdminEdit(false);
          setEditingItems([]);
          
          if (onRequestUpdate) {
            onRequestUpdate();
          }
        } else {
          throw new Error(`All edits failed. Errors: ${errors.slice(0, 3).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error saving bulk edit:', error);
      toast.error(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const updateEditingItem = (index, field, value) => {
    setEditingItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      // Update the field
      item[field] = value;
      
      // Check if item has changes by comparing with current values (not original)
      let hasQuantityChange = false;
      let hasDisabledChange = false;
      let hasReasonChange = false;
      
      // Check quantity change (compare with current quantity, not original)
      if (parseFloat(item.quantity) !== parseFloat(item.currentQuantity)) {
        hasQuantityChange = true;
      }
      
      // Check disabled status change
      if (item.isDisabled !== item.originalDisabled) {
        hasDisabledChange = true;
      }
      
      // Check disabled reason change (only matters if currently disabled)
      if (item.isDisabled && item.disabledReason !== item.originalDisabledReason) {
        hasReasonChange = true;
      }
      
      // Item has changes if any field changed
      item.hasChanges = hasQuantityChange || hasDisabledChange || hasReasonChange;
      
      updated[index] = item;
      return updated;
    });
  };
  
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
    <div 
      className={`fixed inset-0 ${THEME.modalOverlay} flex items-center justify-center z-[999999] p-2 sm:p-4`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
    >
      <div className={`${THEME.card} rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden relative z-[999999] ${THEME.buttonShadow}`}>
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-blue-100/50">
            <h2 className={`text-xl sm:text-2xl font-bold ${THEME.primaryText} mb-4 sm:mb-0`}>Request Details</h2>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {/* Universal Edit Button for Admin */}
              {userRole === 'admin' && (request.status === 'pending' || request.status === 'approved' || request.status === 'partially_fulfilled' || request.status === 'fulfilled') && (
                <button
                  onClick={handleEditRequest}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${THEME.primaryBg} ${THEME.hoverBg} text-white font-semibold text-sm transition-all duration-300 ${THEME.buttonShadow} hover:scale-105`}
                  title="Edit Request"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Request</span>
                </button>
              )}
              <button 
                onClick={handlePrint}
                className={`flex items-center p-2.5 rounded-xl ${THEME.secondaryText} hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:shadow-lg transition-all duration-300`}
                title="Print Request"
              >
                <Printer size={18} />
              </button>
              {isPdfReady && (
                <PDFDownloadLink 
                  document={<RequestPDF request={request} />} 
                  fileName={`Request_${request.labId}.pdf`}
                  className={`flex items-center p-2.5 rounded-xl ${THEME.secondaryText} hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:shadow-lg transition-all duration-300`}
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${THEME.primaryBg} ${THEME.hoverBg} text-white font-semibold text-sm transition-all duration-300 ${THEME.buttonShadow} hover:scale-105`}
                  onClick={() => setShowReturnDialog(true)}
                  title="Return Items"
                >
                  <RotateCcw size={16} />
                  <span>Return</span>
                </button>
              )}
              <button
                onClick={onClose}
                className={`flex items-center p-2.5 rounded-xl ${THEME.secondaryText} hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 hover:shadow-lg transition-all duration-300`}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <PrintableContent ref={componentRef} request={request} userRole={userRole} />

        
          {/* Admin Approval Section */}
          {userRole === 'admin' && request.status === 'pending' && (
            <div className={`${THEME.card} p-6 sm:p-8 rounded-2xl ${THEME.border} mt-8 ${THEME.cardHover}`}>
              <h3 className={`text-xl font-bold ${THEME.primaryText} mb-6 flex items-center`}>
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-3"></div>
                Admin Approval
              </h3>
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold ${THEME.secondaryText} mb-3`}>
                    Reason (Optional)
                  </label>
                  <textarea
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Enter reason for approval/rejection (optional)"
                    className={`w-full px-4 py-3 border border-blue-200 rounded-xl ${THEME.inputFocus} resize-none bg-white/90 placeholder-gray-400`}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {approvalReason.length}/500 characters
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => handleAdminApproval('approve')}
                    disabled={isApproving || isRejecting}
                    className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl ${THEME.success} text-white font-bold text-sm hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105`}
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Approving...
                      </>
                    ) : (
                      'Approve Request'
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleAdminApproval('reject')}
                    disabled={isApproving || isRejecting}
                    className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl ${THEME.danger} text-white font-bold text-sm hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105`}
                  >
                    {isRejecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Rejecting...
                      </>
                    ) : (
                      'Reject Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Admin Edit Dialog */}
      {showAdminEdit && editingItems.length > 0 && (
        <div className={`fixed inset-0 ${THEME.modalOverlay} flex items-center justify-center z-[999999] p-2 sm:p-4`}>
          <div className={`${THEME.card} rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden ${THEME.buttonShadow}`}>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-blue-100/50">
                <h3 className={`text-xl sm:text-2xl font-bold ${THEME.primaryText} mb-4 sm:mb-0 flex items-center`}>
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mr-3"></div>
                  Edit Request - All Items
                </h3>
                <button
                  onClick={() => setShowAdminEdit(false)}
                  className="text-gray-500 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 p-2 rounded-xl transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>
             
              <div className="mb-6">
                <label className={`block text-sm font-semibold ${THEME.secondaryText} mb-3`}>
                  Edit Reason (Optional)
                </label>
                <textarea
                  value={editFormData.editReason || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, editReason: e.target.value }))}
                  placeholder="Enter reason for these edits"
                  className={`w-full px-4 py-3 border border-blue-200 rounded-xl ${THEME.inputFocus} resize-none bg-white/90 placeholder-gray-400`}
                  rows={2}
                />
              </div>
              
              <div className="overflow-y-auto max-h-[60vh] border border-blue-100 rounded-xl shadow-inner">
                <table className="min-w-full">
                  <thead className={`${THEME.background} sticky top-0`}>
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Experiment</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Item</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Current Qty</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">New Qty</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Unit</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Disable</th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Disable Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/95 divide-y divide-blue-50">
                    {editingItems.map((item, index) => (
                      <tr key={`${item.experimentId}-${item.itemType}-${item.itemId}`} className={`${item.hasChanges ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400' : 'hover:bg-blue-50/50'} transition-all duration-200`}>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium">{item.experimentName}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 capitalize font-medium">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            item.itemType === 'chemicals' ? 'bg-blue-100 text-blue-800' :
                            item.itemType === 'glassware' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {item.itemType.slice(0, -1)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium">{item.itemName}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm">
                          <div className="text-gray-900 font-semibold">{item.currentQuantity}</div>
                          {item.originalQuantity && item.originalQuantity !== item.currentQuantity && (
                            <div className="text-xs text-blue-600 font-medium">
                              Original: {item.originalQuantity}
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateEditingItem(index, 'quantity', e.target.value)}
                            className="w-24 px-3 py-2 border border-blue-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300"
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 font-medium">{item.unit}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <input
                            type="checkbox"
                            checked={item.isDisabled}
                            onChange={(e) => updateEditingItem(index, 'isDisabled', e.target.checked)}
                            className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {item.isDisabled && (
                            <input
                              type="text"
                              value={item.disabledReason}
                              onChange={(e) => updateEditingItem(index, 'disabledReason', e.target.value)}
                              placeholder="Reason..."
                              className="w-36 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-blue-100/50 space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600 font-medium">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-bold">
                    {editingItems.filter(item => item.hasChanges).length} items will be modified
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setShowAdminEdit(false)}
                    className="px-6 py-3 border border-blue-200 text-gray-700 rounded-xl hover:bg-blue-50 font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBulkEdit}
                    disabled={isSavingEdit || editingItems.filter(item => item.hasChanges).length === 0}
                    className={`px-6 py-3 ${THEME.primaryBg} ${THEME.hoverBg} text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all duration-300 ${THEME.buttonShadow} hover:scale-105`}
                  >
                    {isSavingEdit ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                      'Save All Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Return Dialog */}
      {showReturnDialog && (
        <UnifiedReturnDialog
          request={request}
          onClose={() => setShowReturnDialog(false)}
          onSuccess={onClose} // Optionally refresh or close modal on success
        />
      )}

      {/* Admin Override Dialog */}
      {showAdminOverride && selectedExperiment && (
        <AdminOverrideDialog
          experiment={selectedExperiment}
          isOpen={showAdminOverride}
          onClose={() => {
            setShowAdminOverride(false);
            setSelectedExperiment(null);
          }}
          onSave={handleAdminOverride}
        />
      )}

      {/* Allocation Confirmation Dialog */}
      {showAllocationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                Confirm Remaining Items Allocation
              </h3>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      The following items will be allocated from available stock:
                    </p>
                  </div>
                </div>
              </div>
              
              {remainingItemsToAllocate.length > 0 ? (
                <div className="space-y-2">
                  {remainingItemsToAllocate.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <div className="text-sm text-gray-600">
                          {item.type} • {item.experimentName}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-purple-600">
                          {item.remainingQuantity} {item.unit}
                        </span>
                        <div className="text-xs text-gray-500">remaining</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No remaining items found within the allocation window.
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setShowAllocationConfirm(false)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAllocationConfirm(false);
                  handleAllocateRemaining();
                }}
                disabled={remainingItemsToAllocate.length === 0}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAllocatingRemaining ? (
                  <div className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    <span>Allocating...</span>
                  </div>
                ) : (
                  `Allocate ${remainingItemsToAllocate.length} Items`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailsModal;