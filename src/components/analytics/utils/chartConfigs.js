import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './UsagePatternCalendar.css'; // Custom styles
import { generateLabColors, chemicalCategoryColors, statusColors } from './colorPalette';

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#0B3861',
        font: {
          size: 12,
          weight: 500
        },
        padding: 16
      }
    },
    title: {
      display: true,
      color: '#0B3861',
      font: {
        size: 14,
        weight: 600
      },
      padding: {
        top: 10,
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(11, 56, 97, 0.8)',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: '#BCE0FD',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 4,
      titleFont: {
        size: 13,
        weight: 600
      },
      bodyFont: {
        size: 12
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: '#BCE0FD',
        drawBorder: false
      },
      ticks: {
        color: '#64B5F6',
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: '#BCE0FD',
        drawBorder: false
      },
      ticks: {
        color: '#64B5F6',
        font: {
          size: 11
        }
      }
    }
  }
};

export const lineChartOptions = {
  ...defaultChartOptions,
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 2
    },
    point: {
      radius: 3,
      hoverRadius: 5,
      backgroundColor: '#FFFFFF',
      borderWidth: 2
    }
  }
};

export const barChartOptions = {
  ...defaultChartOptions,
  elements: {
    bar: {
      borderWidth: 1,
      borderRadius: 4
    }
  }
};

export const pieChartOptions = {
  ...defaultChartOptions,
  cutout: '60%',
  elements: {
    arc: {
      borderWidth: 1,
      borderColor: '#FFFFFF'
    }
  }
};

export const getGradient = (ctx, chartArea, startColor, endColor) => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
};

const UsagePatternCalendar = ({ usageData, year }) => {
  // Transform data for heatmap
  const heatmapData = usageData.map(entry => ({
    date: entry.date,
    count: entry.usageCount,
    quantity: entry.totalQuantity
  }));

  // Custom color scale based on usage
  const colorScale = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#c6e48b';
    if (count <= 5) return '#7bc96f';
    if (count <= 10) return '#239a3b';
    return '#196127';
  };

  return (
    <div className="calendar-container">
      <h3>Usage Patterns {year}</h3>
      <CalendarHeatmap
        startDate={new Date(`${year}-01-01`)}
        endDate={new Date(`${year}-12-31`)}
        values={heatmapData}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          return `color-scale-${colorScale(value.count)}`;
        }}
        tooltipDataAttrs={(value) => ({
          'data-tip': value.date 
            ? `${value.date}: ${value.count} uses (${value.quantity} units)`
            : 'No data'
        })}
        showWeekdayLabels
      />
      <div className="calendar-legend">
        <span>Less</span>
        <span className="color-block" style={{backgroundColor: '#ebedf0'}}></span>
        <span className="color-block" style={{backgroundColor: '#c6e48b'}}></span>
        <span className="color-block" style={{backgroundColor: '#7bc96f'}}></span>
        <span className="color-block" style={{backgroundColor: '#239a3b'}}></span>
        <span className="color-block" style={{backgroundColor: '#196127'}}></span>
        <span>More</span>
      </div>
    </div>
  );
};

export default UsagePatternCalendar;