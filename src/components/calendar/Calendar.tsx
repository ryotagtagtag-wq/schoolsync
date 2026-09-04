'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, isPast, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '@/db/schema';

interface CalendarProps {
  assignments: Assignment[];
  onDateClick?: (date: Date, assignments: Assignment[]) => void;
  onNewAssignment?: (date: Date) => void;
}

export function Calendar({ assignments, onDateClick, onNewAssignment }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks = useMemo(() => {
    const weeks: Date[][] = [];
    let week: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      day = addDays(day, 1);
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  }, [calendarStart, calendarEnd]);

  const getAssignmentsForDay = (date: Date) => {
    return assignments.filter(a => isSameDay(new Date(a.dueDate), date));
  };

  const getDayColor = (date: Date) => {
    const dayAssignments = getAssignmentsForDay(date);
    if (dayAssignments.length === 0) return '';
    
    // dueDate を JST 0:00 として解釈
    const hasOverdue = dayAssignments.some(a => a.status !== 'completed' && isPast(new Date(a.dueDate + 'T00:00:00+09:00')));
    const hasToday = dayAssignments.some(a => isToday(new Date(a.dueDate + 'T00:00:00+09:00')));
    const hasCompleted = dayAssignments.some(a => a.status === 'completed');
    const hasInProgress = dayAssignments.some(a => a.status === 'in_progress');

    if (hasOverdue) return 'bg-red-100 text-red-800';
    if (hasToday) return 'bg-blue-100 text-blue-800';
    if (hasInProgress) return 'bg-yellow-100 text-yellow-800';
    if (hasCompleted) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const prevMonth = () => setCurrentMonth(addDays(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addDays(currentMonth, 31));

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'yyyy年 M月', { locale: ja })}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const dayAssignments = getAssignmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const dayColor = getDayColor(day);

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`relative aspect-square p-1 min-h-[80px] ${!isCurrentMonth ? 'text-gray-300' : ''} ${isTodayDate ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => onDateClick?.(day, dayAssignments)}
                >
                  <span className={`text-sm font-medium ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                    {format(day, 'd')}
                  </span>

                  {dayAssignments.length > 0 && (
                    <div className="mt-1 space-y-0.5 max-h-[60px] overflow-y-auto">
                      {dayAssignments.slice(0, 3).map((assignment) => (
                        <Badge
                          key={assignment.id}
                          variant="outline"
                          className={`text-xs truncate ${dayColor}`}
                        >
                          {assignment.title}
                        </Badge>
                      ))}
                      {dayAssignments.length > 3 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{dayAssignments.length - 3} 件
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={() => onNewAssignment?.(new Date())} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            課題を追加
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
