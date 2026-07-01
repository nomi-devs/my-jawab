// src/components/dashboard/overview/UserGrowthGraph.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';

const UserGrowthGraph = ({ data, formatNumber }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Responsive chart dimensions based on container size
  const getResponsiveDimensions = useMemo(() => {
    const isMobile = containerWidth < 640; // sm breakpoint
    const isTablet = containerWidth >= 640 && containerWidth < 1024; // lg breakpoint

    return {
      padding: {
        top: isMobile ? 16 : 20,
        right: isMobile ? 4 : 8,
        bottom: isMobile ? 28 : 32,
        left: isMobile ? 32 : 40,
      },
      chartHeight: isMobile ? 150 : isTablet ? 180 : 200,
      fontSize: {
        xAxis: isMobile ? '8px' : '9px',
        yAxis: isMobile ? '8px' : '9px',
        tooltip: isMobile ? '10px' : '12px',
      },
    };
  }, [containerWidth]);

  const padding = getResponsiveDimensions.padding;
  const chartHeight = getResponsiveDimensions.chartHeight;
  const svgHeight = chartHeight + padding.top + padding.bottom;

  // Calculate evenly spaced Y-axis values using "nice numbers"
  const calculateYAxisValues = (maxValue) => {
    if (maxValue <= 0) return [0, 1, 2, 3, 4];

    // Add 10% padding to max value for better visualization
    const paddedMax = maxValue * 1.1;

    // Calculate magnitude (power of 10)
    const magnitude = paddedMax > 0 ? Math.pow(10, Math.floor(Math.log10(paddedMax))) : 1;
    const normalized = paddedMax / magnitude;

    // Choose nice step value
    let niceStep;
    if (normalized <= 1) niceStep = 1;
    else if (normalized <= 2) niceStep = 2;
    else if (normalized <= 5) niceStep = 5;
    else niceStep = 10;

    const step = niceStep * magnitude;
    const maxNiceValue = Math.ceil(paddedMax / step) * step;

    // Generate 5 evenly spaced values (0 to maxNiceValue)
    const numSteps = 4; // 4 intervals = 5 labels
    const values = [];
    for (let i = 0; i <= numSteps; i++) {
      const value = (i / numSteps) * maxNiceValue;
      // Round to avoid floating point issues
      values.push(Math.round(value * 100) / 100);
    }

    return values;
  };

  // Process data for the graph - cumulative line + optional new users line
  const graphData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        points: [],
        maxCumulative: 0,
        maxValue: 0,
        chartWidth: 0,
        yAxisValues: [0, 1, 2, 3, 4],
      };
    }

    // Use container width or fallback to a reasonable default
    const effectiveWidth = containerWidth > 0 ? containerWidth : 600;
    const chartWidth = effectiveWidth - padding.left - padding.right;

    // Extract series
    const cumulativeSeries = data.map((d, index) => {
      // Prefer explicit cumulative field if provided
      if (d.cumulative !== undefined && d.cumulative !== null) return d.cumulative;

      // If no cumulative is provided, build it from per-period value/count
      const baseValue =
        d.value !== undefined && d.value !== null
          ? d.value
          : d.count !== undefined && d.count !== null
            ? d.count
            : 0;

      if (index === 0) return baseValue;

      const prev =
        data[index - 1].cumulative !== undefined && data[index - 1].cumulative !== null
          ? data[index - 1].cumulative
          : cumulativeSeries[index - 1] || 0;

      return prev + baseValue;
    });
    const newSeries = data.map((d) =>
      d.value !== undefined && d.value !== null
        ? d.value
        : d.count !== undefined && d.count !== null
          ? d.count
          : 0,
    );

    const maxCumulative = Math.max(...cumulativeSeries, 1);
    const maxNew = Math.max(...newSeries, 0);

    // Use the larger of cumulative / new as the axis max so both fit accurately
    const rawMaxValue = Math.max(maxCumulative, maxNew || 0);
    const yAxisValues = calculateYAxisValues(rawMaxValue);
    const maxValue = yAxisValues[yAxisValues.length - 1]; // Use the top Y-axis value

    const points = data.map((item, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2;

      // Cumulative series (total users)
      const cumulative = cumulativeSeries[index] || 0;
      const y = maxValue > 0 ? chartHeight - (cumulative / maxValue) * chartHeight : chartHeight;

      // New users series (per period)
      const newValue = newSeries[index] || 0;
      const yNew = maxValue > 0 ? chartHeight - (newValue / maxValue) * chartHeight : chartHeight;

      // Store both the processed values and original item data
      return {
        x,
        y,
        cumulative,
        yNew,
        value: newValue,
        ...item,
      };
    });

    return { points, maxCumulative, maxValue, chartWidth, yAxisValues };
  }, [data, containerWidth, chartHeight, padding.left, padding.right]);

  // Generate path for the line
  const linePath = useMemo(() => {
    if (graphData.points.length === 0) return '';

    let path = `M ${graphData.points[0].x + padding.left} ${graphData.points[0].y + padding.top}`;

    for (let i = 1; i < graphData.points.length; i++) {
      const point = graphData.points[i];
      path += ` L ${point.x + padding.left} ${point.y + padding.top}`;
    }

    return path;
  }, [graphData.points, padding.left, padding.top]);

  // Generate path for the "new users" line (per-period growth)
  const newLinePath = useMemo(() => {
    if (graphData.points.length === 0) return '';

    let path = `M ${graphData.points[0].x + padding.left} ${graphData.points[0].yNew + padding.top}`;

    for (let i = 1; i < graphData.points.length; i++) {
      const point = graphData.points[i];
      path += ` L ${point.x + padding.left} ${point.yNew + padding.top}`;
    }

    return path;
  }, [graphData.points, padding.left, padding.top]);

  // Generate area path (for gradient fill under the line)
  const areaPath = useMemo(() => {
    if (graphData.points.length === 0) return '';

    let path = `M ${graphData.points[0].x + padding.left} ${chartHeight + padding.top}`;
    path += ` L ${graphData.points[0].x + padding.left} ${graphData.points[0].y + padding.top}`;

    for (let i = 1; i < graphData.points.length; i++) {
      const point = graphData.points[i];
      path += ` L ${point.x + padding.left} ${point.y + padding.top}`;
    }

    const lastPoint = graphData.points[graphData.points.length - 1];
    path += ` L ${lastPoint.x + padding.left} ${chartHeight + padding.top}`;
    path += ' Z';

    return path;
  }, [graphData.points, chartHeight, padding.left, padding.top]);

  const svgWidth = graphData.chartWidth + padding.left + padding.right;

  if (!data || data.length === 0) {
    return (
      <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center">
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: `${svgHeight}px`,
        height: 'auto',
        width: '100%',
      }}
    >
      {/* Info icon explaining how to read the graph */}
      <button
        type="button"
        className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
        aria-label="About this graph"
      >
        <span className="text-xs font-semibold">i</span>
      </button>

      {showInfo && (
        <div className="absolute top-9 right-2 z-20 max-w-xs rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-gray-800">
          <p className="font-semibold mb-1">User growth graph</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>
              <span className="font-semibold">Purple area &amp; line</span>: total users over time
              (cumulative).
            </li>
            <li>
              <span className="font-semibold">Blue dashed line</span>: new users added in each
              period.
            </li>
            <li>
              <span className="font-semibold">X‑axis</span>: time (days/weeks/months depending on
              filter).
            </li>
            <li>
              <span className="font-semibold">Y‑axis</span>: number of users.
            </li>
          </ul>
        </div>
      )}

      {/* SVG Chart - Fully responsive */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto block"
        style={{
          minHeight: `${svgHeight}px`,
          maxHeight: '100%',
          display: 'block',
        }}
      >
        {/* Grid lines */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(147, 51, 234)" />
            <stop offset="100%" stopColor="rgb(168, 85, 247)" />
          </linearGradient>
        </defs>

        {/* Grid horizontal lines - evenly spaced and aligned with Y-axis labels */}
        {graphData.yAxisValues.map((value, i) => {
          // Calculate Y position: 0 is at bottom, maxValue is at top
          // Ensure we don't divide by zero
          const y =
            graphData.maxValue > 0
              ? padding.top + chartHeight - (value / graphData.maxValue) * chartHeight
              : padding.top + chartHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={svgWidth - padding.right}
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.1"
              className="text-gray-400 dark:text-gray-600"
            />
          );
        })}

        {/* Hover guideline for better readability */}
        {hoveredIndex !== null && graphData.points[hoveredIndex] && (
          <line
            x1={graphData.points[hoveredIndex].x + padding.left}
            y1={padding.top}
            x2={graphData.points[hoveredIndex].x + padding.left}
            y2={padding.top + chartHeight}
            stroke="currentColor"
            strokeWidth="0.75"
            strokeOpacity="0.15"
            className="text-purple-500 dark:text-purple-300 pointer-events-none"
          />
        )}

        {/* Area under the line */}
        <path d={areaPath} fill="url(#areaGradient)" opacity="0.6" />

        {/* Cumulative growth line (total users over time) */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />

        {/* New users line (per-period growth) */}
        <path
          d={newLinePath}
          fill="none"
          stroke="rgb(59, 130, 246)" // blue-500
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 3"
          opacity="0.9"
        />

        {/* Data points - interactive hover areas */}
        {graphData.points.map((point, index) => {
          const isMobile = containerWidth < 640;
          const pointRadius = hoveredIndex === index ? (isMobile ? 3.5 : 4) : isMobile ? 2 : 2.5;
          const strokeWidth = hoveredIndex === index ? (isMobile ? 1.5 : 2) : isMobile ? 1 : 1.5;

          return (
            <g key={`point-${index}`}>
              {/* Invisible larger hit area for easier hovering */}
              <circle
                cx={point.x + padding.left}
                cy={point.y + padding.top}
                r={8}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visible data point */}
              <circle
                cx={point.x + padding.left}
                cy={point.y + padding.top}
                r={pointRadius}
                fill="rgb(147, 51, 234)"
                stroke="white"
                strokeWidth={strokeWidth}
                className="transition-all duration-200 cursor-pointer pointer-events-none"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            </g>
          );
        })}
      </svg>

      {/* X-axis labels - responsive and properly positioned */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: `${padding.bottom}px`,
          paddingLeft: `${padding.left}px`,
          paddingRight: `${padding.right}px`,
          pointerEvents: 'none',
        }}
      >
        <div className="relative w-full h-full">
          {data.map((item, index) => {
            if (!item.label) return null;

            // If caller didn't specify showLabel, automatically pick a reasonable density
            const autoStep = data.length <= 6 ? 1 : Math.ceil(data.length / 6); // target ~6 labels max
            const autoShow = index === 0 || index === data.length - 1 || index % autoStep === 0;

            const shouldShowLabel = item.showLabel !== undefined ? item.showLabel : autoShow;

            if (!shouldShowLabel) return null;

            // Calculate position based on actual data point position in SVG coordinates
            const dataPointX = graphData.points[index]?.x || 0;
            // Convert SVG x position to percentage of chart width (excluding padding)
            const percentagePosition =
              data.length > 1 && graphData.chartWidth > 0
                ? (dataPointX / graphData.chartWidth) * 100
                : 50;

            return (
              <span
                key={`label-${index}`}
                className="absolute text-gray-400 dark:text-gray-500 transition-colors font-medium"
                style={{
                  fontSize: getResponsiveDimensions.fontSize.xAxis,
                  left: `${percentagePosition}%`,
                  transform: 'translateX(-50%)',
                  top: containerWidth < 640 ? '2px' : '4px',
                  whiteSpace: 'nowrap',
                  maxWidth: containerWidth < 640 ? '45px' : '70px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                }}
                title={item.label} // Show full label on hover
              >
                {item.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Y-axis labels (left side) - evenly spaced and aligned with grid lines */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: `${padding.left}px`,
          paddingTop: `${padding.top}px`,
          paddingBottom: `${padding.bottom}px`,
          paddingLeft: containerWidth < 640 ? '2px' : '4px',
          pointerEvents: 'none',
        }}
      >
        {graphData.yAxisValues
          .slice()
          .reverse()
          .map((value, i) => {
            // Calculate Y position to match grid line position exactly
            // Ensure we don't divide by zero
            const yGridPosition =
              graphData.maxValue > 0
                ? padding.top + chartHeight - (value / graphData.maxValue) * chartHeight
                : padding.top + chartHeight;

            return (
              <span
                key={`y-label-${i}`}
                className="absolute text-gray-400 dark:text-gray-500 transition-colors font-medium text-right"
                style={{
                  fontSize: getResponsiveDimensions.fontSize.yAxis,
                  top: `${yGridPosition}px`,
                  transform: 'translateY(-50%)',
                  width: '100%',
                  lineHeight: '1',
                }}
              >
                {formatNumber(Math.round(value))}
              </span>
            );
          })}
      </div>

      {/* Legend */}
      <div className="mt-1 flex items-center justify-end gap-3 px-3 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded-sm bg-gradient-to-r from-purple-600 to-purple-400" />
          <span className="whitespace-nowrap">Total users (cumulative)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 border-t border-dashed border-blue-500" />
          <span className="whitespace-nowrap">New users per period</span>
        </div>
      </div>

      {/* Tooltip - Responsive positioning with proper data binding */}
      {hoveredIndex !== null &&
        data[hoveredIndex] &&
        graphData.points[hoveredIndex] &&
        (() => {
          const point = graphData.points[hoveredIndex];
          const item = data[hoveredIndex];

          // Get actual values - prioritize point data (which has the correct values), then item data
          // The point object contains the processed cumulative and value from the original data
          const cumulativeValue =
            point.cumulative !== undefined && point.cumulative !== null
              ? point.cumulative
              : item.cumulative !== undefined && item.cumulative !== null
                ? item.cumulative
                : 0;
          const newValue =
            point.value !== undefined && point.value !== null
              ? point.value
              : item.value !== undefined && item.value !== null
                ? item.value
                : 0;

          // Calculate tooltip position relative to the data point in SVG coordinates
          const pointXInSvg = point.x + padding.left;
          const pointYInSvg = point.y + padding.top;

          // Convert SVG coordinates to container percentage
          const containerWidthValue = containerWidth || svgWidth;
          const tooltipLeftPercent = (pointXInSvg / svgWidth) * 100;

          // Position tooltip above the point, with smart boundary detection
          let tooltipTopPercent = ((pointYInSvg - 70) / svgHeight) * 100;
          if (tooltipTopPercent < 5) {
            // If too close to top, position below
            tooltipTopPercent = ((pointYInSvg + 20) / svgHeight) * 100;
          }

          // Ensure tooltip doesn't go off screen horizontally
          const tooltipWidth = containerWidth < 640 ? 140 : 180;
          const tooltipLeftPercentAdjusted = Math.max(
            5,
            Math.min(tooltipLeftPercent, 95 - (tooltipWidth / containerWidthValue) * 100),
          );

          return (
            <div
              className="absolute bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl z-20 pointer-events-none"
              style={{
                fontSize: getResponsiveDimensions.fontSize.tooltip,
                padding: containerWidth < 640 ? '8px 12px' : '12px 16px',
                left: `${tooltipLeftPercentAdjusted}%`,
                top: `${Math.max(5, Math.min(tooltipTopPercent, 90))}%`,
                transform: 'translateX(-50%)',
                maxWidth: `${tooltipWidth}px`,
              }}
            >
              <div className="font-semibold mb-1 truncate">{item.label || item.date}</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></div>
                  <span className="truncate">
                    Cumulative: <strong>{formatNumber(cumulativeValue)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0"></div>
                  <span className="truncate">
                    New: <strong>{formatNumber(newValue)}</strong>
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          );
        })()}
    </div>
  );
};

export default UserGrowthGraph;
