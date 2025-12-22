import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    startDate: string | null;
    endDate: string | null;
    onChange: (start: string | null, end: string | null) => void;
    className?: string;
}

export const DatePickerPanel: React.FC<DatePickerPanelProps> = ({
    isOpen,
    onClose,
    startDate,
    endDate,
    onChange,
    className,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!isOpen) return null;

    // Helper to format YYYY-MM-DD using local time
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Helper to get day of week for first day (0 = Sunday)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(clickedDate);

        if (!startDate || (startDate && endDate)) {
            // Start new range
            onChange(dateStr, null);
        } else {
            // Check if clicked date is before start date
            if (new Date(dateStr) < new Date(startDate)) {
                onChange(dateStr, null);
            } else if (dateStr === startDate) {
                return;
            } else {
                onChange(startDate, dateStr);
                // Optional: Close on selection complete?
                // onClose(); 
            }
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);

            let isSelected = false;
            let isInRange = false;
            const isStartDate = startDate === dateStr;
            const isEndDate = endDate === dateStr;

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (date >= start && date <= end) {
                    isInRange = true;
                }
            }

            if (isStartDate || isEndDate) isSelected = true;

            let classes = "w-10 h-10 flex items-center justify-center text-sm rounded-full cursor-pointer hover:bg-gray-100 transition-colors relative z-10";
            if (isSelected) {
                classes = "w-10 h-10 flex items-center justify-center text-sm rounded-full bg-amber-600 text-white hover:bg-amber-700 z-20";
            } else if (isInRange) {
                classes = "w-10 h-10 flex items-center justify-center text-sm bg-gray-100 hover:bg-gray-200";
                // Rounded edges for range
                if (day === 1 || (firstDay + day - 1) % 7 === 0) classes += " rounded-l-full";
                if (day === daysInMonth || (firstDay + day - 1) % 7 === 6) classes += " rounded-r-full";
            }

            // Fix for "connected" range look
            // We really want the background to be separate from the circle if strictly following some designs, 
            // but for now let's keep it simple.
            // Actually, for a nice range effect, the background should be on a parent or pseudo element if the day is selected AND in range.

            // Let's refine the styling logic for a cleaner range look
            // We wrap the button in a div that handles the background for the range

            let wrapperClasses = "p-[1px]";
            if (isInRange && !isSelected) {
                // Middle of range
            }
            if (isInRange && isStartDate && endDate) {
                wrapperClasses += " bg-gradient-to-r from-transparent to-gray-100 rounded-l-full";
                // Make the "to" part 50%
            }

            // Simplifying:
            // If it's the start date and end date exists, we want a gray background extending to the right.
            // If it's the end date and start date exists, we want a gray background extending to the left.

            const isStartWithRange = isStartDate && endDate;
            const isEndWithRange = isEndDate && startDate;
            const isMiddle = isInRange && !isStartDate && !isEndDate;

            days.push(
                <div key={day} className="relative p-0.5 w-full h-full flex items-center justify-center">
                    {/* Range Backgrounds */}
                    {isMiddle && <div className="absolute inset-0 bg-gray-100" />}
                    {isStartWithRange && <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-gray-100" />}
                    {isEndWithRange && <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gray-100" />}

                    <button
                        onClick={(e) => { e.stopPropagation(); handleDateClick(day); }}
                        className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected ? 'bg-amber-600 text-white shadow-md scale-105' : 'text-gray-700 hover:bg-gray-100 hover:text-black'}
                    ${isMiddle ? '!bg-gray-100 !w-full !rounded-none hover:bg-gray-200' : ''}
                  `}
                    >
                        {day}
                    </button>
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    return (
        <div
            className={`bg-white rounded-3xl shadow-xl border border-gray-100 p-8 z-[60] animate-in fade-in slide-in-from-top-4 duration-200 ${className ?? "absolute top-16 left-0 right-0 mx-auto w-full max-w-[850px]"}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xl font-bold text-gray-800">
                    {stateStr(startDate, endDate)}
                </h2>

                <div className="flex items-center gap-4 bg-gray-50 rounded-full p-1 px-2 border border-gray-100">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full transition-all shadow-sm">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="font-semibold text-sm w-32 text-center select-none">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full transition-all shadow-sm">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-6">
                <div className="grid grid-cols-7 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {renderCalendar()}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                    <button
                        onClick={() => { onChange(null, null); }}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        Clear Dates
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-all shadow-lg shadow-gray-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

function stateStr(start: string | null, end: string | null) {
    if (start && end) return `${formatBtnDate(start)} - ${formatBtnDate(end)}`;
    if (start) return `${formatBtnDate(start)} - Select checkout`;
    return "Select dates";
}

function formatBtnDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
