import React from 'react';

const CourseStats = ({ stats }) => {
  const { overview, byAcademicYear } = stats;

  const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }) => (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-blue-100 p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <div className={`p-2 sm:p-3 rounded-lg bg-blue-100 text-blue-600 mr-2 sm:mr-3 group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            {value?.toLocaleString() || '0'}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <div className={`text-right ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            <div className="flex items-center text-sm font-medium">
              {trend > 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              ) : trend < 0 ? (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              ) : null}
              {Math.abs(trend)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AcademicYearCard = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-lg border border-blue-100 p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-blue-100 rounded-lg mr-2 sm:mr-3">
          <svg className="w-4 w-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">By Academic Year</h3>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {byAcademicYear?.slice(0, 3).map((year, index) => (
          <div key={year._id} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
            <div className="flex items-center">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${
                index === 0 ? 'bg-blue-600' : 
                index === 1 ? 'bg-blue-500' : 'bg-blue-400'
              }`}></div>
              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-900">AY {year._id}</div>
                <div className="text-xs text-gray-500">{year.batchCount} batches</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm sm:text-base font-bold text-blue-600">{year.courseCount}</div>
              <div className="text-xs text-gray-500">courses</div>
            </div>
          </div>
        ))}
        
        {byAcademicYear?.length === 0 && (
          <div className="text-center py-2 sm:py-4 text-gray-500">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs sm:text-sm">No academic year data</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* All Stats in One Row - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Total Courses"
          value={overview?.totalCourses}
          subtitle="All courses"
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        
        <StatCard
          title="Active Courses"
          value={overview?.activeCourses}
          subtitle={`${((overview?.activeCourses / overview?.totalCourses) * 100 || 0).toFixed(1)}% active`}
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Total Batches"
          value={overview?.totalBatches}
          subtitle="All batches"
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Active Batches"
          value={overview?.activeBatches}
          subtitle={`${((overview?.activeBatches / overview?.totalBatches) * 100 || 0).toFixed(1)}% active`}
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />

        {/* Academic Year Card */}
        <AcademicYearCard />
      </div>
    </div>
  );
};

export default CourseStats;
