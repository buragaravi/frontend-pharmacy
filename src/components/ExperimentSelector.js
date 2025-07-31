import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';

const ExperimentSelector = ({ onExperimentsSelect, selectedExperiments = [] }) => {
  const [semester, setSemester] = useState('');
  const [selectedExps, setSelectedExps] = useState(selectedExperiments);

  const { data: experiments, isLoading } = useQuery(
    ['experiments', semester],
    async () => {
      if (!semester) return [];
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/requests/experiments?semester=${semester}`);
      return response.data;
    },
    {
      enabled: !!semester,
    }
  );

  const handleExperimentSelect = async (experimentId) => {
    try {
      const response = await axios.get(`https://backend-pharmacy-5541.onrender.com/api/requests/experiments/${experimentId}/suggested-chemicals`);
      const { suggestedChemicals } = response.data;

      const newExperiment = {
        experimentId,
        experimentName: experiments.find(exp => exp._id === experimentId).name,
        date: new Date().toISOString().split('T')[0],
        chemicals: suggestedChemicals.map(chem => ({
          chemicalName: chem.chemicalName,
          quantity: chem.suggestedQuantity,
          unit: chem.unit,
          allocatedQuantity: 0,
          isAllocated: false,
          allocationHistory: []
        }))
      };

      const updatedExperiments = [...selectedExps, newExperiment];
      setSelectedExps(updatedExperiments);
      onExperimentsSelect(updatedExperiments);
    } catch (error) {
      console.error('Error fetching suggested chemicals:', error);
    }
  };

  const handleRemoveExperiment = (experimentId) => {
    const updatedExperiments = selectedExps.filter(exp => exp.experimentId !== experimentId);
    setSelectedExps(updatedExperiments);
    onExperimentsSelect(updatedExperiments);
  };
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="semester">
          Select Semester
        </label>
        <select
          id="semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Loading experiments...</p>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 max-h-[400px] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Available Experiments</h2>
            <ul className="space-y-2">
              {experiments?.map((experiment) => (
                <li key={experiment._id}>
                  <button
                    onClick={() => handleExperimentSelect(experiment._id)}
                    disabled={selectedExps.some(exp => exp.experimentId === experiment._id)}
                    className={`w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors ${
                      selectedExps.some(exp => exp.experimentId === experiment._id)
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{experiment.name}</p>
                        <p className="text-sm text-gray-600">{experiment.subject}</p>
                      </div>
                      <div className="group relative">
                        <span className="p-1 hover:bg-gray-100 rounded-full cursor-help">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </span>
                        <div className="invisible group-hover:visible absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-900 text-white rounded-md shadow-lg right-0">
                          {experiment.description}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-md p-4 max-h-[400px] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Selected Experiments</h2>
            {selectedExps.length === 0 ? (
              <p className="text-gray-500">No experiments selected</p>
            ) : (
              <ul className="space-y-2">
                {selectedExps.map((exp) => (
                  <li key={exp.experimentId} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exp.experimentName}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveExperiment(exp.experimentId)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                      >
                        {exp.chemicals.length} chemicals
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentSelector; 