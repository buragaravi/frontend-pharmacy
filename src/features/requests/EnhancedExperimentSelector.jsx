// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import { TestTube, ChevronRight } from 'lucide-react';
// import EnhancedCourseSelector from '../../components/EnhancedCourseSelector';
// import SubjectSelector from '../../components/SubjectSelector';

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: 'https://backend-pharmacy-5541.onrender.com/api',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add request interceptor to add token to all requests
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// const EnhancedExperimentSelector = ({ 
//   onExperimentSelect, 
//   className = "",
//   preSelectedCourse = null,  // Course from batch selection
//   disabled = false
// }) => {
//   const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse);
//   const [selectedSubject, setSelectedSubject] = useState(null);
//   const [selectedExperiment, setSelectedExperiment] = useState('');

//   // Update course when preSelectedCourse changes
//   React.useEffect(() => {
//     if (preSelectedCourse && preSelectedCourse !== selectedCourse) {
//       setSelectedCourse(preSelectedCourse);
//       setSelectedSubject(null);
//       setSelectedExperiment('');
//       onExperimentSelect && onExperimentSelect(null);
//     }
//   }, [preSelectedCourse]);

//   // Fetch experiments for the selected subject
//   const { data: experiments = [], isLoading: experimentsLoading, error: experimentsError } = useQuery({
//     queryKey: ['experiments-by-subject', selectedSubject?._id],
//     queryFn: async () => {
//       if (!selectedSubject) return [];
//       const response = await api.get(`/experiments/subject/${selectedSubject._id}`);
//       return response.data || [];
//     },
//     enabled: !!selectedSubject,
//   });

//   const handleCourseSelect = (course) => {
//     setSelectedCourse(course);
//     setSelectedSubject(null);
//     setSelectedExperiment('');
//     onExperimentSelect && onExperimentSelect(null);
//   };

//   const handleSubjectSelect = (subject) => {
//     setSelectedSubject(subject);
//     setSelectedExperiment('');
//     onExperimentSelect && onExperimentSelect(null);
//   };

//   const handleExperimentChange = (e) => {
//     const experimentId = e.target.value;
//     const experiment = experiments.find(exp => exp._id === experimentId);
//     setSelectedExperiment(experimentId);
    
//     if (experiment) {
//       // Enhanced experiment data for request creation
//       onExperimentSelect && onExperimentSelect({
//         experimentId: experiment._id,
//         experimentName: experiment.name,
//         description: experiment.description,
//         subjectId: selectedSubject._id,
//         subjectName: selectedSubject.name,
//         subjectCode: selectedSubject.code,
//         courseName: selectedCourse.courseName,
//         courseCode: selectedCourse.courseCode,
//         defaultChemicals: experiment.defaultChemicals || []
//       });
//     } else {
//       onExperimentSelect && onExperimentSelect(null);
//     }
//   };

//   return (
//     <div className={`space-y-4 ${className}`}>
//       {/* Progress Indicator */}
//       <div className="flex items-center space-x-2 text-xs text-slate-500 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-3 rounded-lg border border-slate-200">
//         <div className="flex items-center space-x-1">
//           <span className="text-xs">📚</span>
//           <span className={selectedCourse ? 'text-sky-600 font-medium' : 'text-slate-400'}>Course</span>
//         </div>
//         <ChevronRight className="h-3 w-3" />
//         <div className="flex items-center space-x-1">
//           <span className="text-xs">📖</span>
//           <span className={selectedSubject ? 'text-emerald-600 font-medium' : 'text-slate-400'}>Subject</span>
//         </div>
//         <ChevronRight className="h-3 w-3" />
//         <div className="flex items-center space-x-1">
//           <span className="text-xs">🧪</span>
//           <span className={selectedExperiment ? 'text-violet-600 font-medium' : 'text-slate-400'}>Experiment</span>
//         </div>
//       </div>

//       {/* Responsive Grid Layout for Course, Subject, Experiment */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {/* Course Selection - Only show if not pre-selected */}
//         {!preSelectedCourse && (
//           <div className="space-y-2">
//             <label className="block text-xs font-medium text-slate-600">
//               Course *
//             </label>
//             <EnhancedCourseSelector
//               selectedCourse={selectedCourse}
//               onCourseSelect={handleCourseSelect}
//               placeholder="Choose your course"
//               disabled={disabled}
//             />
//           </div>
//         )}

//         {/* Course Info Display - Show when pre-selected */}
//         {preSelectedCourse && (
//           <div className="space-y-2">
//             <label className="block text-xs font-medium text-slate-600">
//               Selected Course
//             </label>
//             <div className="w-full px-3 py-2.5 border border-green-200 rounded-lg bg-green-50 text-sm">
//               <div className="font-medium text-green-800">{preSelectedCourse.courseName}</div>
//               <div className="text-xs text-green-600">{preSelectedCourse.courseCode}</div>
//             </div>
//           </div>
//         )}

//         {/* Subject Selection */}
//         <div className="space-y-2">
//           <label className="block text-xs font-medium text-slate-600">
//             Subject *
//           </label>
//           <SubjectSelector
//             selectedCourse={selectedCourse}
//             selectedSubject={selectedSubject}
//             onSubjectSelect={handleSubjectSelect}
//             placeholder="Choose your subject"
//             disabled={disabled || !selectedCourse}
//           />
//         </div>

//         {/* Experiment Selection */}
//         <div className="space-y-2">
//           <label className="block text-xs font-medium text-slate-600 flex items-center space-x-1">
//             <TestTube className="h-3 w-3" />
//             <span>Experiment *</span>
//           </label>

//       {/* Course Selection */}
//       <EnhancedCourseSelector
//         selectedCourse={selectedCourse}
//         onCourseSelect={handleCourseSelect}
//         placeholder="Choose your course"
//       />

//       {/* Subject Selection */}
//       <SubjectSelector
//         selectedCourse={selectedCourse}
//         selectedSubject={selectedSubject}
//         onSubjectSelect={handleSubjectSelect}
//         placeholder="Choose your subject"
//       />

//       {/* Experiment Selection */}
//       <div className="space-y-2">
//         <label className="block text-xs font-medium text-slate-600 flex items-center space-x-1">
//           <TestTube className="h-3 w-3" />
//           <span>Experiment *</span>
//         </label>
        
//         {!selectedSubject ? (
//           <div className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-400 text-sm">
//             Please select a subject first
//           </div>
//         ) : experimentsError ? (
//           <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
//             <div className="flex items-center space-x-2">
//               <span>⚠️</span>
//               <span>Error loading experiments: {experimentsError.message}</span>
//             </div>
//           </div>
//         ) : (
//           <select
//             value={selectedExperiment}
//             onChange={handleExperimentChange}
//             disabled={!selectedSubject || experimentsLoading}
//             className={`w-full px-3 py-2.5 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300 text-sm transition-all duration-200 ${
//               !selectedSubject || experimentsLoading ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-sky-300'
//             }`}
//           >
//             <option value="">
//               {experimentsLoading ? 'Loading experiments...' : 
//                experiments.length === 0 ? 'No experiments available' : 
//                'Choose your experiment'}
//             </option>
//             {experiments.map((experiment) => (
//               <option key={experiment._id} value={experiment._id}>
//                 {experiment.name}
//               </option>
//             ))}
//           )}

//           {/* Experiment Selection - Close the grid div here */}
//         </div>

//         {/* No experiments message */}
//         {selectedSubject && experiments.length === 0 && !experimentsLoading && (
//           <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 mt-4">
//             <div className="flex items-center space-x-2">
//               <span>ℹ️</span>
//               <span>
//                 No experiments found for {selectedSubject.name}.
//                 Please add experiments to this subject first.
//               </span>
//             </div>
//           </div>
//         )}

//         {/* Selected Experiment Summary */}
//         {selectedExperiment && (
//           <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border border-violet-200 mt-4">
//             <h4 className="text-sm font-medium text-violet-800 mb-2">✅ Selected Experiment</h4>
//             {(() => {
//               const experiment = experiments.find(exp => exp._id === selectedExperiment);
//               return experiment ? (
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
//                   <div>
//                     <span className="font-medium text-violet-700">Course:</span>
//                     <div className="text-violet-800">{selectedCourse?.courseName}</div>
//                   </div>
//                   <div>
//                     <span className="font-medium text-violet-700">Subject:</span>
//                     <div className="text-violet-800">{selectedSubject?.name}</div>
//                   </div>
//                   <div>
//                     <span className="font-medium text-violet-700">Experiment:</span>
//                     <div className="text-violet-800">{experiment.name}</div>
//                   </div>
//                 </div>
//               ) : null;
//             })()}
//           </div>
//         )}
//       </div>
//     );
// };

// export default EnhancedExperimentSelector;
