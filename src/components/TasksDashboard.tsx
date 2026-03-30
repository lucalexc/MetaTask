import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, Plus, Calendar as CalendarIcon, 
  ListTodo, Clock, Repeat, Target, X, Flag, Timer, Sun, CalendarDays, Coffee, Ban, ChevronLeft, ChevronRight, Kanban, GripVertical, Inbox, Loader2, Play, Pause, Trash2, Tag, Minus, Filter
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, getDay, addMonths, subMonths, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/src/components/ui/button';
import { WeeklyCalendar } from './WeeklyCalendar';
import ConfirmDialog from './ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Types ---
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  due_date?: string;
  created_at: string;
  updated_at: string;
  elapsed_time?: number;
  is_running?: boolean;
  last_started_at?: string;
  estimated_time?: number;
  project_id?: string;
  tag_id?: string;
  category_id?: string;
  // UI only fields for now (not in DB schema)
  priority?: string;
  time?: string;
  recurrence?: string;
  custom_recurrence_base?: string;
  custom_recurrence_interval?: string | number;
  custom_recurrence_unit?: string;
  custom_recurrence_end_type?: string;
  custom_recurrence_end_date?: string | null;
};

export type TaskTag = {
  id: string;
  user_id: string;
  name: string;
  color?: string;
};

// --- Subcomponents ---

const TaskCard: React.FC<{ 
  task: Task; 
  project?: { id: string, name: string, color: string };
  categories?: Category[];
  view?: 'list' | 'kanban' | 'calendar';
  onToggle: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onOpenTimeModal: (task: Task) => void;
  onOpenRecurrenceModal: (task: Task) => void;
  onToggleTimer: (task: Task) => void;
  onOpenHistory: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  isDragging?: boolean;
}> = ({ 
  task, 
  project,
  view = 'list',
  onToggle, 
  onDelete,
  onOpenTimeModal, 
  onOpenRecurrenceModal,
  onToggleTimer,
  onOpenHistory,
  onEdit,
  onDragStart,
  isDragging,
  categories = []
}) => {
  const [currentElapsed, setCurrentElapsed] = useState(task.elapsed_time || 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (task.status === 'completed') {
      setCurrentElapsed(task.elapsed_time || 0);
      return;
    }

    if (task.is_running && task.last_started_at) {
      const start = new Date(task.last_started_at).getTime();
      if (!isNaN(start)) {
        // Calculate initial diff
        const now = new Date().getTime();
        const diffSeconds = Math.floor((now - start) / 1000);
        setCurrentElapsed((task.elapsed_time || 0) + diffSeconds);

        interval = setInterval(() => {
          const currentNow = new Date().getTime();
          const currentDiff = Math.floor((currentNow - start) / 1000);
          setCurrentElapsed((task.elapsed_time || 0) + currentDiff);
        }, 1000);
      } else {
        setCurrentElapsed(task.elapsed_time || 0);
      }
    } else {
      setCurrentElapsed(task.elapsed_time || 0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.is_running, task.last_started_at, task.elapsed_time, task.status]);

  const formatTime = (totalSeconds: number) => {
    const validSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const seconds = validSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOvertime = task.estimated_time ? currentElapsed > task.estimated_time * 60 : false;
  const isOverdue = task.status === 'pending' && task.due_date && isBefore(startOfDay(parseISO(task.due_date)), startOfDay(new Date()));

  if (view === 'kanban') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => onEdit(task)}
        draggable={true}
        onDragStart={(e) => onDragStart && onDragStart(e, task)}
        className={cn(
          "flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all ease-out duration-200 group",
          isDragging && "opacity-50 border-dashed"
        )}
      >
        {/* Top line: Checkbox + Title */}
        <div className="flex items-start gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(task.id, task.status); }}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
              task.status === 'completed' 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "text-[14px] leading-[22px] font-bold text-[#202020] line-clamp-2 transition-all ease-out duration-200",
              task.status === 'completed' && "text-[#808080] line-through"
            )}>
              {task.title}
            </h4>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {project && (
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-1"
                  style={{ borderColor: `${project.color}30`, color: project.color, backgroundColor: `${project.color}10` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.name}
                </span>
              )}
              {task.category_id && categories?.find(c => c.id === task.category_id) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-1 bg-slate-50 text-slate-700 border-slate-200">
                  {categories?.find(c => c.id === task.category_id)?.name}
                </span>
              )}
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 bg-red-50 text-red-600 border-red-100">
                  ATRASADA
                </span>
              )}
              {(task.time || (task.recurrence && task.recurrence !== 'none') || isOverdue) && (
                <div className={cn("flex items-center gap-2 text-[13px]", isOverdue ? "text-red-500" : "text-[#808080]")}>
                  {task.due_date && isOverdue && (
                    <span className="flex items-center gap-1">
                      {format(parseISO(task.due_date), "dd/MM")}
                    </span>
                  )}
                  {task.time && (
                    <span className="flex items-center gap-1 hover:text-[#202020] transition-colors ease-out duration-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenTimeModal(task); }}>
                      <Clock className="w-3 h-3" />
                      {task.time}
                    </span>
                  )}
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span className="flex items-center gap-1 hover:text-[#202020] transition-colors ease-out duration-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenRecurrenceModal(task); }}>
                      <Repeat className="w-3 h-3" />
                      {task.recurrence === 'daily' ? 'Diário' : 
                       task.recurrence === 'weekly' ? 'Semanal' : 
                       task.recurrence === 'monthly' ? 'Mensal' : 'Repetir'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault();
              onDelete(task.id);
            }}
            className="p-2 text-[#808080] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ease-out duration-200 shrink-0 opacity-0 group-hover:opacity-100"
            title="Excluir tarefa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom line: Timer pill + History icon */}
        <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Priority Flag */}
            <div 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="flex items-center justify-center p-1.5 rounded-lg bg-gray-50 border border-gray-100" 
              title={`Prioridade ${task.priority || 'P4'}`}
            >
              <Flag className={cn("w-3.5 h-3.5", 
                task.priority === 'P1' ? "text-red-500" : 
                task.priority === 'P2' ? "text-orange-500" : 
                task.priority === 'P3' ? "text-[#1f60c2]" : 
                "text-[#808080]"
              )} fill={task.priority && task.priority !== 'P4' ? "currentColor" : "none"} />
            </div>
            
            {(task.estimated_time || currentElapsed > 0 || task.is_running) && (
              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleTimer(task); }}
                  className="hover:bg-gray-200 p-1 rounded transition-colors ease-out duration-200"
                >
                  {task.is_running ? (
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-slate-400 hover:text-[#1f60c2]" />
                  )}
                </button>
                <span className={cn(
                  "text-xs font-mono font-medium",
                  isOvertime ? "text-red-600" : "text-slate-500"
                )}>
                  {formatTime(currentElapsed)}
                  {task.estimated_time ? ` / ${task.estimated_time}:00` : ''}
                </span>
              </div>
            )}
          </div>
          
          {(task.estimated_time || currentElapsed > 0 || task.is_running) && (
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenHistory(task); }}
              className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors ease-out duration-200 text-slate-400 hover:text-[#202020]"
              title="Ver Histórico"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onEdit(task)}
      className="flex items-center gap-3 py-2 border-b border-gray-100 bg-white group hover:bg-gray-50 transition-colors ease-out duration-200 cursor-pointer"
    >
      <div className="opacity-0 group-hover:opacity-100 cursor-grab text-gray-300 transition-opacity ease-out duration-200">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(task.id, task.status); }}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
          task.status === 'completed' 
            ? "bg-emerald-500 border-emerald-500 text-white" 
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "text-[14px] leading-[22px] font-bold text-[#202020] truncate transition-all ease-out duration-200",
            task.status === 'completed' && "text-[#808080] line-through"
          )}>
            {task.title}
          </h4>
          {project && (
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-1"
              style={{ borderColor: `${project.color}30`, color: project.color, backgroundColor: `${project.color}10` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
              {project.name}
            </span>
          )}
          {task.category_id && categories?.find(c => c.id === task.category_id) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium flex items-center gap-1 bg-slate-50 text-slate-700 border-slate-200">
              {categories?.find(c => c.id === task.category_id)?.name}
            </span>
          )}
          {isOverdue && (
            <span className="text-xs px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 bg-red-50 text-red-600 border-red-100">
              ATRASADA
            </span>
          )}
        </div>
        
        {(task.time || (task.recurrence && task.recurrence !== 'none') || isOverdue) && (
          <div className={cn("flex items-center gap-2 mt-0.5 text-[13px]", isOverdue ? "text-red-500" : "text-[#808080]")}>
            {task.due_date && isOverdue && (
              <span className="flex items-center gap-1">
                {format(parseISO(task.due_date), "dd/MM")}
              </span>
            )}
            {task.time && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-[#202020] transition-colors ease-out duration-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenTimeModal(task); }}>
                <Clock className="w-3 h-3" />
                {task.time}
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-[#202020] transition-colors ease-out duration-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenRecurrenceModal(task); }}>
                <Repeat className="w-3 h-3" />
                {task.recurrence === 'daily' ? 'Diário' : 
                 task.recurrence === 'weekly' ? 'Semanal' : 
                 task.recurrence === 'monthly' ? 'Mensal' : 'Repetir'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Timer Controls & Priority */}
      <div className="flex items-center gap-3 mr-2">
        {/* Priority Flag */}
        <div 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          className="flex items-center justify-center p-1.5 rounded-lg bg-gray-50 border border-gray-100" 
          title={`Prioridade ${task.priority || 'P4'}`}
        >
          <Flag className={cn("w-3.5 h-3.5", 
            task.priority === 'P1' ? "text-red-500" : 
            task.priority === 'P2' ? "text-orange-500" : 
            task.priority === 'P3' ? "text-[#1f60c2]" : 
            "text-[#808080]"
          )} fill={task.priority && task.priority !== 'P4' ? "currentColor" : "none"} />
        </div>

        {(task.estimated_time || currentElapsed > 0 || task.is_running) && (
          <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleTimer(task); }}
              className="hover:bg-gray-200 p-1 rounded transition-colors ease-out duration-200"
            >
              {task.is_running ? (
                <Pause className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Play className="w-3.5 h-3.5 text-slate-400 hover:text-[#1f60c2]" />
              )}
            </button>
            <span className={cn(
              "text-xs font-mono font-medium",
              isOvertime ? "text-red-600" : "text-slate-500"
            )}>
              {formatTime(currentElapsed)}
              {task.estimated_time ? ` / ${task.estimated_time}:00` : ''}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenHistory(task); }}
              className="hover:bg-gray-200 p-1 rounded transition-colors ease-out duration-200"
              title="Ver Histórico"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 hover:text-[#202020]" />
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          e.preventDefault();
          onDelete(task.id);
        }}
        className="p-2 text-[#808080] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ease-out duration-200 opacity-0 group-hover:opacity-100"
        title="Excluir tarefa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const formatDurationInput = (mins: number): string => {
  if (!mins || mins < 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const parseDurationInput = (text: string): number => {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return 0;
  
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  let totalMinutes = 0;
  let hasHoursOrMinutes = false;
  
  const hoursMatch = trimmed.match(/(\d+)\s*h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1], 10) * 60;
    hasHoursOrMinutes = true;
  }

  const minutesMatch = trimmed.match(/(\d+)\s*m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1], 10);
    hasHoursOrMinutes = true;
  }

  if (hoursMatch && !minutesMatch) {
    const remaining = trimmed.replace(hoursMatch[0], '').trim();
    if (/^\d+$/.test(remaining)) {
      totalMinutes += parseInt(remaining, 10);
      hasHoursOrMinutes = true;
    }
  }

  if (!hasHoursOrMinutes) {
    const numbersOnly = trimmed.replace(/\D/g, '');
    if (numbersOnly) {
      return parseInt(numbersOnly, 10);
    }
  }

  return totalMinutes;
};

const TaskModal = ({ isOpen, onClose, onSave, projects, categories, taskToEdit }: { isOpen: boolean; onClose: () => void; onSave: (task: any) => void; projects: {id: string, name: string, color: string}[]; categories: Category[]; taskToEdit?: Task | null }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false);
  const [priority, setPriority] = useState('P4');
  const [duration, setDuration] = useState<number>(30);
  const [durationInput, setDurationInput] = useState<string>('30m');
  const [time, setTime] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom'>('none');
  const [isCustomRecurrenceModalOpen, setIsCustomRecurrenceModalOpen] = useState(false);
  const [customRecurrenceBase, setCustomRecurrenceBase] = useState<'scheduled' | 'completion'>('scheduled');
  const [customRecurrenceInterval, setCustomRecurrenceInterval] = useState('1');
  const [customRecurrenceUnit, setCustomRecurrenceUnit] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [customRecurrenceEndType, setCustomRecurrenceEndType] = useState<'never' | 'date'>('never');
  const [customRecurrenceEndDate, setCustomRecurrenceEndDate] = useState<Date | null>(null);
  const [taskDate, setTaskDate] = useState<Date>(new Date());
  const [projectId, setProjectId] = useState<string>('none');
  const [categoryId, setCategoryId] = useState<string>('none');

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority || 'P4');
        const initialDuration = taskToEdit.estimated_time || 30;
        setDuration(initialDuration);
        setDurationInput(formatDurationInput(initialDuration));
        setTime(taskToEdit.time || '');
        setRecurrenceType((taskToEdit.recurrence as any) || 'none');
        setTaskDate(taskToEdit.due_date ? new Date(taskToEdit.due_date) : new Date());
        setProjectId(taskToEdit.project_id || 'none');
        setCategoryId(taskToEdit.category_id || 'none');
      } else {
        setTitle('');
        setDescription('');
        setPriority('P4');
        setDuration(30);
        setDurationInput('30m');
        setTime('');
        setRecurrenceType('none');
        setTaskDate(new Date());
        setProjectId('none');
        setCategoryId('none');
      }
    }
  }, [isOpen, taskToEdit]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    let formattedTime = value;
    if (value.length >= 3) {
      formattedTime = `${value.slice(0, 2)}:${value.slice(2)}`;
    }

    // Validate hours and minutes
    if (formattedTime.length >= 2) {
      const hours = parseInt(formattedTime.slice(0, 2));
      if (hours > 23) {
        formattedTime = `23${formattedTime.slice(2)}`;
      }
    }
    if (formattedTime.length === 5) {
      const minutes = parseInt(formattedTime.slice(3, 5));
      if (minutes > 59) {
        formattedTime = `${formattedTime.slice(0, 3)}59`;
      }
    }

    setTime(formattedTime);
  };

  if (!isOpen) return null;

  const isSaveDisabled = !title.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gray-200 rounded-xl w-full max-w-lg shadow-xl overflow-visible flex flex-col relative"
        >
          <div className="p-6 flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Qual é a sua próxima tarefa?" 
              className="w-full text-[26px] leading-[35px] font-bold text-[#202020] placeholder-[#808080] focus:outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <textarea 
              placeholder="Descrição da tarefa..." 
              className="w-full text-[13px] leading-[18px] text-[#202020] placeholder-[#808080] focus:outline-none resize-none min-h-[60px]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-2 relative">
              {/* Date Button & Popover */}
              <div className="relative">
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      onClick={() => {
                        setIsTimePickerOpen(false);
                        setIsRecurrencePickerOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors ease-out duration-200",
                        isDatePickerOpen ? "border-[#1f60c2] text-[#1f60c2] bg-[#dceaff]" : "border-gray-200 text-[#808080] hover:bg-gray-50"
                      )}
                    >
                      <CalendarIcon className={cn("w-4 h-4", isDatePickerOpen ? "text-[#1f60c2]" : "text-[#808080]")} />
                      {isSameDay(taskDate, new Date()) ? 'Hoje' : format(taskDate, 'dd/MM')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="left" 
                    align="start" 
                    sideOffset={16} 
                    avoidCollisions={true}
                    className="w-72 p-0 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] overflow-hidden"
                  >
                    <div className="p-2 space-y-1 border-b border-gray-100">
                      <button onClick={() => { setTaskDate(addDays(new Date(), 1)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#202020] hover:bg-gray-100 rounded-lg text-left transition-colors ease-out duration-200"><Sun className="w-4 h-4 text-orange-500" /> Amanhã</button>
                      <button onClick={() => { setTaskDate(addDays(new Date(), 7)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#202020] hover:bg-gray-100 rounded-lg text-left transition-colors ease-out duration-200"><CalendarDays className="w-4 h-4 text-[#1f60c2]" /> Próxima semana</button>
                      <button onClick={() => { setTaskDate(addDays(new Date(), 5)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#202020] hover:bg-gray-100 rounded-lg text-left transition-colors ease-out duration-200"><Coffee className="w-4 h-4 text-purple-500" /> Próximo fim de semana</button>
                      <button onClick={() => { setTaskDate(new Date()); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#202020] hover:bg-gray-100 rounded-lg text-left transition-colors ease-out duration-200"><Ban className="w-4 h-4 text-[#808080]" /> Sem vencimento</button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-[14px] text-[#202020]">Março 2026</span>
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-gray-100 rounded text-[#808080] hover:text-[#202020] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded text-[#808080] hover:text-[#202020] transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2 text-[#808080] font-bold uppercase tracking-wider">
                        <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
                        {Array.from({length: 31}).map((_, i) => {
                          const newDate = new Date(2026, 2, i + 1);
                          return (
                            <button 
                              key={i} 
                              onClick={() => { setTaskDate(newDate); setIsDatePickerOpen(false); }}
                              className={cn("w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors ease-out duration-200", isSameDay(newDate, taskDate) && "bg-[#1f60c2] text-white hover:bg-[#1a50a3]")}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Input */}
              <div className="relative flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all ease-out duration-200 focus-within:ring-4 focus-within:ring-[#dceaff] focus-within:border-[#1f60c2]",
                  time ? "border-[#1f60c2] text-[#1f60c2] bg-[#dceaff]" : "border-gray-200 text-[#808080] bg-white hover:bg-gray-50"
                )}>
                  <Clock className={cn("w-4 h-4", time ? "text-[#1f60c2]" : "text-[#808080]")} />
                  <input
                    type="text"
                    placeholder="00:00"
                    maxLength={5}
                    value={time}
                    onChange={handleTimeChange}
                    className="w-11 bg-transparent focus:outline-none text-left justify-start placeholder-[#808080] text-[#202020]"
                  />
                </div>
              </div>

              {/* Recurrence Button & Popover */}
              <div className="relative">
                <Popover open={isRecurrencePickerOpen} onOpenChange={setIsRecurrencePickerOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      onClick={() => {
                        setIsDatePickerOpen(false);
                        setIsTimePickerOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors ease-out duration-200",
                        isRecurrencePickerOpen || recurrenceType !== 'none' ? "border-[#1f60c2] text-[#1f60c2] bg-[#dceaff]" : "border-gray-200 text-[#808080] hover:bg-gray-50"
                      )}
                    >
                      <Repeat className={cn("w-4 h-4", isRecurrencePickerOpen || recurrenceType !== 'none' ? "text-[#1f60c2]" : "text-[#808080]")} />
                      {recurrenceType === 'daily' ? 'Todo dia' : 
                       recurrenceType === 'weekly' ? `Toda semana (${format(taskDate, 'EEEE', { locale: ptBR })})` : 
                       recurrenceType === 'weekdays' ? 'Todo dia útil' :
                       recurrenceType === 'monthly' ? `Todo mês (dia ${format(taskDate, 'd')})` :
                       recurrenceType === 'yearly' ? `Todo ano (${format(taskDate, 'd \'de\' MMMM', { locale: ptBR })})` :
                       recurrenceType === 'custom' ? 'Personalizado' :
                       'Repetir'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="bottom" 
                    align="start" 
                    sideOffset={8} 
                    avoidCollisions={true}
                    className="w-64 p-1 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] flex flex-col gap-0.5 max-h-72 overflow-y-auto"
                  >
                    <button onClick={() => { setRecurrenceType('daily'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'daily' && "bg-[#dceaff] text-[#1f60c2]")}>Todo dia</button>
                    <button onClick={() => { setRecurrenceType('weekly'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'weekly' && "bg-[#dceaff] text-[#1f60c2]")}>Toda semana ({format(taskDate, 'EEEE', { locale: ptBR })})</button>
                    <button onClick={() => { setRecurrenceType('weekdays'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'weekdays' && "bg-[#dceaff] text-[#1f60c2]")}>Todo dia útil (Seg - Sex)</button>
                    <button onClick={() => { setRecurrenceType('monthly'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'monthly' && "bg-[#dceaff] text-[#1f60c2]")}>Todo mês (dia {format(taskDate, 'd')})</button>
                    <button onClick={() => { setRecurrenceType('yearly'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'yearly' && "bg-[#dceaff] text-[#1f60c2]")}>Todo ano ({format(taskDate, 'd \'de\' MMMM', { locale: ptBR })})</button>
                    <button onClick={() => { setIsRecurrencePickerOpen(false); setIsCustomRecurrenceModalOpen(true); }} className={cn("w-full text-left px-4 py-1.5 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors ease-out duration-200 capitalize", recurrenceType === 'custom' && "bg-[#dceaff] text-[#1f60c2]")}>Personalizar...</button>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={() => { setRecurrenceType('none'); setIsRecurrencePickerOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors ease-out duration-200 font-medium">Limpar</button>
                  </PopoverContent>
                </Popover>
              </div>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-auto h-9 border-gray-200 bg-transparent hover:bg-gray-50 focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] border rounded-lg px-3 transition-all ease-out duration-200">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#808080]">
                    <Flag className={cn("w-4 h-4", priority === 'P1' ? "text-red-500" : priority === 'P2' ? "text-orange-500" : priority === 'P3' ? "text-[#1f60c2]" : "text-[#808080]")} fill={priority !== 'P4' ? "currentColor" : "none"} />
                    {priority}
                  </div>
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="P1"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-red-500" fill="currentColor"/> Urgente</div></SelectItem>
                  <SelectItem value="P2"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-orange-500" fill="currentColor"/> Alta</div></SelectItem>
                  <SelectItem value="P3"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-[#1f60c2]" fill="currentColor"/> Média</div></SelectItem>
                  <SelectItem value="P4"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-[#808080]" fill="none"/> Baixa</div></SelectItem>
                </SelectContent>
              </Select>

              {projects.length > 0 && (
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-auto h-9 border-gray-200 bg-transparent hover:bg-gray-50 focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] border rounded-lg px-3 transition-all ease-out duration-200">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#808080]">
                      <Target className="w-4 h-4 text-[#808080]" />
                      {projectId === 'none' ? 'Projeto' : projects.find(p => p.id === projectId)?.name}
                    </div>
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false} className="z-[110] top-full mt-1 lg:mt-2 max-h-56 overflow-y-auto custom-scrollbar bg-white border border-slate-200 shadow-lg rounded-md">
                    <SelectItem hideCheck value="none" className="py-1.5 px-3 text-sm text-slate-700 hover:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-600 data-[state=checked]:font-medium">Nenhum projeto</SelectItem>
                    {projects.map(p => (
                      <SelectItem hideCheck key={p.id} value={p.id} className="py-1.5 px-3 text-sm text-slate-700 hover:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-600 data-[state=checked]:font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-1">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-auto h-9 border-gray-200 bg-transparent hover:bg-gray-50 focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] border rounded-lg px-3 transition-all ease-out duration-200">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
                      {categoryId === 'none' ? (
                        'Categoria'
                      ) : (
                        <span>
                          {categories?.find((c: Category) => c.id === categoryId)?.name}
                        </span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent side="bottom" avoidCollisions={false} className="z-[110] top-full mt-1 lg:mt-2 max-h-56 overflow-y-auto custom-scrollbar bg-white border border-slate-200 shadow-lg rounded-md">
                    <SelectItem hideCheck value="none" className="py-1.5 px-3 text-sm text-slate-700 hover:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-600 data-[state=checked]:font-medium">Nenhuma categoria</SelectItem>
                    {categories?.map((c: Category) => (
                      <SelectItem hideCheck key={c.id} value={c.id} className="py-1.5 px-3 text-sm text-slate-700 hover:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-600 data-[state=checked]:font-medium">
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center h-9 rounded-md border border-slate-200 bg-white text-[13px] font-medium text-slate-700 transition-colors ease-out duration-200 focus-within:ring-4 focus-within:ring-[#dceaff] focus-within:border-[#1f60c2] overflow-hidden">
                <div className="pl-2.5 pr-1 flex items-center justify-center text-slate-400">
                  <Timer className="w-4 h-4" />
                </div>
                <button 
                  onClick={() => {
                    const newDuration = Math.max(0, duration - 5);
                    setDuration(newDuration);
                    setDurationInput(formatDurationInput(newDuration));
                  }}
                  className="h-full px-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input 
                  type="text" 
                  value={durationInput} 
                  onChange={e => setDurationInput(e.target.value)} 
                  onBlur={() => {
                    const parsed = parseDurationInput(durationInput);
                    setDuration(parsed);
                    setDurationInput(formatDurationInput(parsed));
                  }}
                  className="w-14 bg-transparent focus:outline-none text-center text-slate-700 placeholder-slate-400" 
                  placeholder="30m" 
                />
                <button 
                  onClick={() => {
                    const newDuration = duration + 5;
                    setDuration(newDuration);
                    setDurationInput(formatDurationInput(newDuration));
                  }}
                  className="h-full px-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#808080] ml-1">Isso ativará o temporizador de foco da tarefa.</p>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
            <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-[#808080] hover:text-[#202020] hover:bg-gray-200 rounded-lg transition-colors ease-out duration-200">Cancelar</button>
            <button 
              disabled={isSaveDisabled}
              onClick={() => {
                if (isSaveDisabled) return;
                onSave({ 
                  id: taskToEdit?.id, 
                  title, 
                  description, 
                  priority, 
                  estimated_time: duration || 30, 
                  time: time || undefined, 
                  recurrence: recurrenceType, 
                  date: taskDate, 
                  project_id: projectId === 'none' ? null : projectId, 
                  category_id: categoryId === 'none' ? null : categoryId,
                  recurrenceType,
                  customRecurrenceBase,
                  customRecurrenceInterval,
                  customRecurrenceUnit,
                  customRecurrenceEndType,
                  customRecurrenceEndDate
                });
                setTitle(''); setDescription(''); setTime(''); setRecurrenceType('none'); setPriority('P4'); setDuration(30); setDurationInput('30m'); setProjectId('none'); setCategoryId('none');
                setIsDatePickerOpen(false); setIsTimePickerOpen(false); setIsRecurrencePickerOpen(false);
                onClose();
              }}
              className="px-4 py-2 text-[13px] font-bold bg-[#1f60c2] text-white hover:bg-[#1a50a3] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all ease-out duration-200 shadow-sm"
            >
              Salvar Tarefa
            </button>
          </div>
        </motion.div>
      </div>

      {/* Custom Recurrence Modal */}
      <AnimatePresence>
        {isCustomRecurrenceModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-[14px] leading-[22px] font-bold text-[#202020]">Repetição personalizada</h2>
                <button onClick={() => setIsCustomRecurrenceModalOpen(false)} className="text-[#808080] hover:text-[#202020] transition-colors ease-out duration-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Com base na */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-[#202020]">Com base na:</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="customRecurrenceBase" 
                        value="scheduled" 
                        checked={customRecurrenceBase === 'scheduled'} 
                        onChange={() => setCustomRecurrenceBase('scheduled')}
                        className="w-4 h-4 text-[#1f60c2] border-gray-300 focus:ring-[#1f60c2]"
                      />
                      <span className="text-[13px] text-[#202020]">Data agendada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="customRecurrenceBase" 
                        value="completion" 
                        checked={customRecurrenceBase === 'completion'} 
                        onChange={() => setCustomRecurrenceBase('completion')}
                        className="w-4 h-4 text-[#1f60c2] border-gray-300 focus:ring-[#1f60c2]"
                      />
                      <span className="text-[13px] text-[#202020]">Data de conclusão</span>
                    </label>
                  </div>
                </div>

                {/* Cada */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-[#202020]">Cada:</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={customRecurrenceInterval} 
                      onChange={(e) => setCustomRecurrenceInterval(e.target.value)}
                      className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                    />
                    <select 
                      value={customRecurrenceUnit}
                      onChange={(e) => setCustomRecurrenceUnit(e.target.value as any)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                    >
                      <option value="day">Dia(s)</option>
                      <option value="week">Semana(s)</option>
                      <option value="month">Mês(es)</option>
                      <option value="year">Ano(s)</option>
                    </select>
                  </div>
                </div>

                {/* Termina em */}
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-[#202020]">Termina em:</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="customRecurrenceEndType" 
                        value="never" 
                        checked={customRecurrenceEndType === 'never'} 
                        onChange={() => setCustomRecurrenceEndType('never')}
                        className="w-4 h-4 text-[#1f60c2] border-gray-300 focus:ring-[#1f60c2]"
                      />
                      <span className="text-[13px] text-[#202020]">Nunca</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="customRecurrenceEndType" 
                          value="date" 
                          checked={customRecurrenceEndType === 'date'} 
                          onChange={() => setCustomRecurrenceEndType('date')}
                          className="w-4 h-4 text-[#1f60c2] border-gray-300 focus:ring-[#1f60c2]"
                        />
                        <span className="text-[13px] text-[#202020]">No vencimento (incluído)</span>
                      </label>
                      {customRecurrenceEndType === 'date' && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] font-medium text-[#808080] hover:bg-gray-50 transition-colors ease-out duration-200">
                              <CalendarIcon className="w-4 h-4" />
                              {customRecurrenceEndDate ? format(customRecurrenceEndDate, 'dd/MM/yyyy') : 'Selecionar'}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 z-[120]" align="start">
                            <div className="p-4 bg-white rounded-xl shadow-xl border border-gray-200">
                              <input 
                                type="date" 
                                value={customRecurrenceEndDate ? format(customRecurrenceEndDate, 'yyyy-MM-dd') : ''}
                                onChange={(e) => setCustomRecurrenceEndDate(e.target.value ? new Date(e.target.value) : null)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-[#202020] focus:outline-none focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all duration-200"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => setIsCustomRecurrenceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-[13px] text-[#808080] hover:text-[#202020] hover:bg-gray-200 transition-colors ease-out duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setRecurrenceType('custom');
                    setIsCustomRecurrenceModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg text-[13px] text-white font-bold bg-[#1f60c2] hover:bg-[#1a50a3] transition-all ease-out duration-200 flex items-center gap-2"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TimeModal = ({ isOpen, onClose, task, onSave }: { isOpen: boolean; onClose: () => void; task: Task | null; onSave: (taskId: string, time: string) => void }) => {
  const [time, setTime] = useState(task?.time || '');

  useEffect(() => {
    if (isOpen && task) {
      setTime(task.time || '');
    }
  }, [isOpen, task]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    let formattedTime = value;
    if (value.length >= 3) {
      formattedTime = `${value.slice(0, 2)}:${value.slice(2)}`;
    }

    // Validate hours and minutes
    if (formattedTime.length >= 2) {
      const hours = parseInt(formattedTime.slice(0, 2));
      if (hours > 23) {
        formattedTime = `23${formattedTime.slice(2)}`;
      }
    }
    if (formattedTime.length === 5) {
      const minutes = parseInt(formattedTime.slice(3, 5));
      if (minutes > 59) {
        formattedTime = `${formattedTime.slice(0, 3)}59`;
      }
    }

    setTime(formattedTime);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-[16px] text-[#202020]">Definir Horário</h3>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] transition-colors ease-out duration-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <label className="block text-[13px] font-medium text-[#808080] mb-2">Horário</label>
          <input 
            type="text" 
            placeholder="00:00"
            maxLength={5}
            value={time}
            onChange={handleTimeChange}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] outline-none transition-all ease-out duration-200 text-[#202020]"
          />
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
          <Button variant="ghost" className="text-[13px] font-medium text-[#808080] hover:text-[#202020] hover:bg-gray-200 transition-colors ease-out duration-200" onClick={onClose}>Cancelar</Button>
          <Button className="text-[13px] font-bold bg-[#1f60c2] text-white hover:bg-[#1a50a3] transition-all ease-out duration-200 shadow-sm" onClick={() => {
            if (task) onSave(task.id, time);
            onClose();
          }}>Salvar</Button>
        </div>
      </motion.div>
    </div>
  );
};

const RecurrenceModal = ({ isOpen, onClose, task, onSave }: { isOpen: boolean; onClose: () => void; task: Task | null; onSave: (taskId: string, recurrence: string) => void }) => {
  const [recurrence, setRecurrence] = useState(task?.recurrence || 'none');

  useEffect(() => {
    if (isOpen && task) {
      setRecurrence(task.recurrence || 'none');
    }
  }, [isOpen, task]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-[16px] text-[#202020]">Repetir Tarefa</h3>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] transition-colors ease-out duration-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <label className="block text-[13px] font-medium text-[#808080] mb-2">Frequência</label>
          <Select value={recurrence} onValueChange={setRecurrence}>
            <SelectTrigger className="border-gray-200 focus:ring-4 focus:ring-[#dceaff] focus:border-[#1f60c2] transition-all ease-out duration-200 text-[#202020]">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent className="z-[110]">
              <SelectItem value="none">Não repetir</SelectItem>
              <SelectItem value="daily">Diariamente</SelectItem>
              <SelectItem value="weekly">Semanalmente</SelectItem>
              <SelectItem value="monthly">Mensalmente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
          <Button variant="ghost" className="text-[13px] font-medium text-[#808080] hover:text-[#202020] hover:bg-gray-200 transition-colors ease-out duration-200" onClick={onClose}>Cancelar</Button>
          <Button className="text-[13px] font-bold bg-[#1f60c2] text-white hover:bg-[#1a50a3] transition-all ease-out duration-200 shadow-sm" onClick={() => {
            if (task) onSave(task.id, recurrence);
            onClose();
          }}>Salvar</Button>
        </div>
      </motion.div>
    </div>
  );
};

const TaskHistoryModal = ({ isOpen, onClose, task }: { isOpen: boolean; onClose: () => void; task: Task | null }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentElapsed, setCurrentElapsed] = useState(task?.elapsed_time || 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (task?.is_running && task?.last_started_at) {
      const start = new Date(task.last_started_at).getTime();
      if (!isNaN(start)) {
        const now = new Date().getTime();
        const diffSeconds = Math.floor((now - start) / 1000);
        setCurrentElapsed((task.elapsed_time || 0) + diffSeconds);

        interval = setInterval(() => {
          const currentNow = new Date().getTime();
          const currentDiff = Math.floor((currentNow - start) / 1000);
          setCurrentElapsed((task.elapsed_time || 0) + currentDiff);
        }, 1000);
      } else {
        setCurrentElapsed(task.elapsed_time || 0);
      }
    } else {
      setCurrentElapsed(task?.elapsed_time || 0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task]);

  useEffect(() => {
    if (isOpen && task) {
      fetchLogs();
    }
  }, [isOpen, task]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_time_logs')
        .select('*')
        .eq('task_id', task?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching task logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | undefined | null) => {
    if (seconds === undefined || seconds === null) return 'Em andamento';
    const validSeconds = Math.max(0, seconds);
    const h = Math.floor(validSeconds / 3600);
    const m = Math.floor((validSeconds % 3600) / 60);
    const s = validSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-gray-200"
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#808080]" />
            <h3 className="font-bold text-[16px] text-[#202020]">Histórico de Tempo</h3>
          </div>
          <button onClick={onClose} className="text-[#808080] hover:text-[#202020] p-1 rounded-md hover:bg-gray-200 transition-colors ease-out duration-200"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium text-[#202020] truncate text-[14px]">{task?.title}</h4>
          <p className="text-[13px] text-[#808080] mt-1">
            Tempo total: {formatDuration(currentElapsed)}
            {task?.estimated_time ? ` / ${task.estimated_time}m estimado` : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#1f60c2]" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[#808080] text-[13px]">
              <p>Nenhum registro de tempo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div>
                    <p className="text-[13px] font-medium text-[#202020]">
                      {format(new Date(log.started_at), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                    <p className="text-[11px] text-[#808080] mt-0.5">
                      {format(new Date(log.started_at), "HH:mm")} 
                      {log.ended_at ? ` - ${format(new Date(log.ended_at), "HH:mm")}` : ' - Agora'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[13px] font-mono font-medium",
                      !log.ended_at ? "text-[#1f60c2]" : "text-[#202020]"
                    )}>
                      {formatDuration(!log.ended_at && task?.last_started_at ? Math.max(0, currentElapsed - (task?.elapsed_time || 0)) : log.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Component ---

export default function TasksDashboard({ isCreateModalOpen, setIsCreateModalOpen }: { isCreateModalOpen: boolean, setIsCreateModalOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekDirection, setWeekDirection] = useState(0);

  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    setCurrentWeekStart((prev) => {
      if (start.getTime() !== prev.getTime()) {
        setWeekDirection(start > prev ? 1 : -1);
        return start;
      }
      return prev;
    });
  }, [selectedDate]);

  const handlePrevWeek = () => {
    setWeekDirection(-1);
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekDirection(1);
    setCurrentWeekStart(prev => addDays(prev, 7));
  };
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<{ id: string, name: string, color: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'pending' | 'in_progress' | 'completed' | null>(null);

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // If no categories exist, seed default ones
      if (!data || data.length === 0) {
        console.log('No categories found, seeding defaults...');
        const defaultCategories = [
          { name: 'Saúde', icon: 'Heart', color: '#ff4d4f', user_id: user.id },
          { name: 'Trabalho', icon: 'Briefcase', color: '#1890ff', user_id: user.id },
          { name: 'Aprendizado', icon: 'Book', color: '#722ed1', user_id: user.id },
          { name: 'Pessoal', icon: 'User', color: '#52c41a', user_id: user.id },
          { name: 'Finanças', icon: 'DollarSign', color: '#faad14', user_id: user.id }
        ];

        const { data: seededData, error: seedError } = await supabase
          .from('categories')
          .insert(defaultCategories)
          .select();

        if (seedError) {
          console.error('Error seeding categories:', seedError);
          return [];
        }
        console.log('Categories seeded successfully:', seededData);
        return seededData as Category[];
      }

      console.log('Categories fetched:', data);
      return data as Category[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, color')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const isCompletingRecurring = newStatus === 'completed' && task.recurrence && task.recurrence !== 'none';
    
    let completedDateIso = '';
    if (isCompletingRecurring) {
      const originalDueDate = task.due_date ? new Date(task.due_date) : new Date();
      const completedDate = new Date(selectedDate);
      completedDate.setHours(originalDueDate.getHours(), originalDueDate.getMinutes(), originalDueDate.getSeconds(), originalDueDate.getMilliseconds());
      completedDateIso = completedDate.toISOString();
    }

    // Auto-pause logic
    let newIsRunning = task.is_running;
    let newElapsed = task.elapsed_time || 0;
    let timerStoppedNow = false;
    let diffSeconds = 0;

    if (newStatus === 'completed' && task.is_running) {
      newIsRunning = false;
      timerStoppedNow = true;
      const now = new Date();
      const start = task.last_started_at ? new Date(task.last_started_at) : now;
      diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
      newElapsed += diffSeconds;
    }

    // Optimistic update
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: newStatus,
          is_running: newIsRunning,
          elapsed_time: newElapsed,
          // If completing a recurring task, remove recurrence from this instance
          ...(isCompletingRecurring ? { recurrence: 'none', due_date: completedDateIso } : {})
        };
      }
      return t;
    }));

    try {
      const updatePayload: any = { 
        status: newStatus,
        is_running: newIsRunning,
        elapsed_time: newElapsed
      };
      if (isCompletingRecurring) {
        updatePayload.recurrence = 'none';
        // Update the due_date of the completed instance to the currently selected date
        // so it shows up in the completed list for the day it was actually done.
        updatePayload.due_date = completedDateIso;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      // Invalidate queries for InsightsDashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Update time log if timer was stopped
      if (timerStoppedNow) {
        const now = new Date();
        const { error: logError } = await supabase.from('task_time_logs')
          .update({ ended_at: now.toISOString(), duration: diffSeconds })
          .eq('task_id', id)
          .is('ended_at', null);
        if (logError) console.error('Error updating log:', logError);
      }

      // If completing a recurring task, create the next instance
      if (isCompletingRecurring && user) {
        // The next occurrence should be based on the day it was completed (selectedDate)
        // but preserve the time from the original due_date
        const originalDueDate = task.due_date ? new Date(task.due_date) : new Date();
        let nextDate = new Date(selectedDate);
        nextDate.setHours(originalDueDate.getHours(), originalDueDate.getMinutes(), originalDueDate.getSeconds(), originalDueDate.getMilliseconds());
        
        if (task.recurrence === 'daily') {
          nextDate = addDays(nextDate, 1);
        } else if (task.recurrence === 'weekly') {
          nextDate = addDays(nextDate, 7);
        } else if (task.recurrence === 'monthly') {
          nextDate = addMonths(nextDate, 1);
        }

        const newTask = {
          user_id: user.id,
          title: task.title,
          description: task.description,
          due_date: nextDate.toISOString(),
          status: 'pending',
          estimated_time: task.estimated_time,
          time: task.time,
          recurrence: task.recurrence,
          elapsed_time: 0,
          is_running: false,
          project_id: task.project_id
        };

        const { data: newInstance, error: insertError } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newInstance) {
          setTasks(prev => [...prev, newInstance]);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic update
    setTasks(tasks.filter(t => t.id !== id));
    setTaskToDelete(null);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate queries for InsightsDashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const openTimeModal = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsTimeModalOpen(true);
  };

  const openRecurrenceModal = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsRecurrenceModalOpen(true);
  };

  const handleOpenHistory = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsHistoryModalOpen(true);
  };

  const handleSaveTime = async (taskId: string, time: string) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, time } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ time })
        .eq('id', taskId);

      if (error) throw error;

      // Invalidate queries for InsightsDashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating task time:', error);
      fetchTasks();
    }
  };

  const handleSaveRecurrence = async (taskId: string, recurrence: string) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, recurrence } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ recurrence })
        .eq('id', taskId);

      if (error) throw error;

      // Invalidate queries for InsightsDashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating task recurrence:', error);
      fetchTasks();
    }
  };

  const handleToggleTimer = async (task: Task) => {
    if (!user) return;

    if (task.is_running) {
      // Pause
      const now = new Date();
      const start = task.last_started_at ? new Date(task.last_started_at) : now;
      const diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
      const newElapsed = (task.elapsed_time || 0) + diffSeconds;

      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_running: false, elapsed_time: newElapsed } : t));

      try {
        // Update task
        const { error: taskError } = await supabase.from('tasks').update({ is_running: false, elapsed_time: newElapsed }).eq('id', task.id);
        if (taskError) throw taskError;
        
        // Invalidate queries for InsightsDashboard
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        
        // Update log
        const { error: logError } = await supabase.from('task_time_logs')
          .update({ ended_at: now.toISOString(), duration: diffSeconds })
          .eq('task_id', task.id)
          .is('ended_at', null);
        if (logError) throw logError;
      } catch (error) {
        console.error('Error pausing timer:', error);
        fetchTasks();
      }
    } else {
      // Play
      const now = new Date().toISOString();
      
      // Optimistic update
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_running: true, last_started_at: now } : t));

      try {
        // Update task
        const { error: taskError } = await supabase.from('tasks').update({ is_running: true, last_started_at: now }).eq('id', task.id);
        if (taskError) throw taskError;
        
        // Invalidate queries for InsightsDashboard
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        
        // Insert log
        const { error: logError } = await supabase.from('task_time_logs').insert([{
          task_id: task.id,
          user_id: user.id,
          started_at: now
        }]);
        if (logError) throw logError;
      } catch (error) {
        console.error('Error starting timer:', error);
        fetchTasks();
      }
    }
  };

  const handleSaveNewTask = async (taskData: any) => {
    if (!user) return;

    const taskPayload = {
      user_id: user.id,
      title: taskData.title || 'Nova Tarefa',
      description: taskData.description,
      due_date: taskData.date ? taskData.date.toISOString() : null,
      estimated_time: taskData.estimated_time,
      time: taskData.time,
      recurrence: taskData.recurrence,
      // custom_recurrence_base: taskData.customRecurrenceBase,
      // custom_recurrence_interval: taskData.customRecurrenceInterval,
      // custom_recurrence_unit: taskData.customRecurrenceUnit,
      // custom_recurrence_end_type: taskData.customRecurrenceEndType,
      // custom_recurrence_end_date: taskData.customRecurrenceEndDate ? taskData.customRecurrenceEndDate.toISOString() : null,
      project_id: taskData.project_id || null,
      category_id: taskData.category_id || null,
      priority: taskData.priority || 'P4'
    };

    try {
      if (taskData.id) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskPayload)
          .eq('id', taskData.id)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setTasks(tasks.map(t => t.id === data.id ? data : t));
          // Invalidate queries for InsightsDashboard
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          if (data.category_id) queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      } else {
        // Create new task
        const newTask = {
          ...taskPayload,
          status: 'pending',
          elapsed_time: 0,
          is_running: false,
        };
        const { data, error } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setTasks([data, ...tasks]);
          // Invalidate queries for InsightsDashboard
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          if (data.category_id) queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, column: 'pending' | 'in_progress' | 'completed') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: 'pending' | 'in_progress' | 'completed') => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || !user) return;

    // Determine current column of the dragged task
    let currentColumn: 'pending' | 'in_progress' | 'completed' = 'pending';
    if (draggedTask.status === 'completed') {
      currentColumn = 'completed';
    } else if (draggedTask.is_running) {
      currentColumn = 'in_progress';
    }

    if (currentColumn === targetColumn) {
      setDraggedTask(null);
      return;
    }

    // Determine new status and is_running
    let newStatus = draggedTask.status;
    let newIsRunning = draggedTask.is_running;
    let newLastStartedAt = draggedTask.last_started_at;
    let newElapsed = draggedTask.elapsed_time || 0;

    if (targetColumn === 'completed') {
      newStatus = 'completed';
      if (newIsRunning) {
        // Stop timer
        newIsRunning = false;
        const now = new Date();
        const start = draggedTask.last_started_at ? new Date(draggedTask.last_started_at) : now;
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
        newElapsed += diffSeconds;
      }
    } else if (targetColumn === 'in_progress') {
      newStatus = 'pending';
      if (!newIsRunning) {
        // Start timer
        newIsRunning = true;
        newLastStartedAt = new Date().toISOString();
      }
    } else if (targetColumn === 'pending') {
      newStatus = 'pending';
      if (newIsRunning) {
        // Stop timer
        newIsRunning = false;
        const now = new Date();
        const start = draggedTask.last_started_at ? new Date(draggedTask.last_started_at) : now;
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
        newElapsed += diffSeconds;
      }
    }

    // Optimistic update
    setTasks(tasks.map(t => 
      t.id === draggedTask.id 
        ? { ...t, status: newStatus, is_running: newIsRunning, last_started_at: newLastStartedAt, elapsed_time: newElapsed } 
        : t
    ));

    try {
      // Update task in DB
      const { error: taskError } = await supabase.from('tasks').update({ 
        status: newStatus, 
        is_running: newIsRunning, 
        last_started_at: newLastStartedAt, 
        elapsed_time: newElapsed 
      }).eq('id', draggedTask.id);
      
      if (taskError) throw taskError;

      // Invalidate queries for InsightsDashboard
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Handle time logs if timer state changed
      if (draggedTask.is_running && !newIsRunning) {
        // Timer stopped
        const now = new Date();
        const start = draggedTask.last_started_at ? new Date(draggedTask.last_started_at) : now;
        const diffSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
        
        const { error: logError } = await supabase.from('task_time_logs')
          .update({ ended_at: now.toISOString(), duration: diffSeconds })
          .eq('task_id', draggedTask.id)
          .is('ended_at', null);
        if (logError) console.error('Error updating log:', logError);
      } else if (!draggedTask.is_running && newIsRunning) {
        // Timer started
        const { error: logError } = await supabase.from('task_time_logs').insert([{
          task_id: draggedTask.id,
          user_id: user.id,
          started_at: newLastStartedAt
        }]);
        if (logError) console.error('Error creating log:', logError);
      }

    } catch (error) {
      console.error('Error updating task status via drag and drop:', error);
      // Revert optimistic update by refetching
      fetchTasks();
    } finally {
      setDraggedTask(null);
    }
  };

  // Derived Data
  const projectFilteredTasks = tasks.filter(t => {
    if (selectedProject) {
      return t.project_id === selectedProject;
    }
    return true;
  });

  const isTodaySelected = isSameDay(selectedDate, new Date());

  const filteredTasks = projectFilteredTasks.filter(t => {
    if (!t.due_date) {
      return isTodaySelected; // Show tasks without due date on today
    }
    
    const dueDate = parseISO(t.due_date);
    
    if (isSameDay(dueDate, selectedDate)) {
      return true;
    }

    // Overdue tasks logic: if today is selected, include pending tasks from the past
    if (isTodaySelected && t.status === 'pending' && isBefore(startOfDay(dueDate), startOfDay(new Date()))) {
      if (!t.recurrence || t.recurrence === 'none') {
        return true;
      }
    }

    if (t.recurrence && t.recurrence !== 'none' && selectedDate > dueDate) {
      if (t.recurrence === 'daily') {
        return true;
      }
      if (t.recurrence === 'weekly') {
        return getDay(selectedDate) === getDay(dueDate);
      }
      if (t.recurrence === 'monthly') {
        return selectedDate.getDate() === dueDate.getDate();
      }
    }

    return false;
  });
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  // Calendar Logic for Month View
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday...
  // Adjust if week starts on Monday
  const emptyDaysBefore = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  return (
    <div className="w-full flex flex-col bg-[#FCFAF8]">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 md:pt-10 pb-12 flex flex-col gap-8">
        
        {/* Header */}
          <header className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-[26px] leading-[35px] font-bold text-[#202020] capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {/* Toggle Group */}
                <div className="flex items-center bg-gray-100 p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setView('list')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-[13px] font-medium transition-all ease-out duration-200",
                      view === 'list' ? "bg-white text-[#202020] shadow-sm" : "text-[#808080] hover:text-[#202020]"
                    )}
                  >
                    <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                    Lista
                  </button>
                  <button
                    onClick={() => setView('kanban')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-[13px] font-medium transition-all ease-out duration-200",
                      view === 'kanban' ? "bg-white text-[#202020] shadow-sm" : "text-[#808080] hover:text-[#202020]"
                    )}
                  >
                    <Kanban className="w-3.5 h-3.5 mr-1.5" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setView('calendar')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-[13px] font-medium transition-all ease-out duration-200",
                      view === 'calendar' ? "bg-white text-[#202020] shadow-sm" : "text-[#808080] hover:text-[#202020]"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    Calendário
                  </button>
                </div>
              </div>
            </div>

            {/* Project Filters (Dropdown) */}
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ease-out duration-200 border",
                        selectedProject === null 
                          ? "bg-white text-[#808080] border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          : "bg-[#202020] text-white border-[#202020]"
                      )}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {selectedProject === null ? "Filtros" : projects.find(p => p.id === selectedProject)?.name}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 rounded-xl shadow-lg border border-gray-100 bg-white" align="start">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelectedProject(null)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left",
                          selectedProject === null 
                            ? "bg-gray-100 text-[#202020]" 
                            : "text-[#808080] hover:bg-gray-50 hover:text-[#202020]"
                        )}
                      >
                        Todas as Tarefas
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      {projects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => setSelectedProject(project.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left",
                            selectedProject === project.id 
                              ? "bg-gray-100 text-[#202020]" 
                              : "text-[#808080] hover:bg-gray-50 hover:text-[#202020]"
                          )}
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </header>

          {view === 'list' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 w-full"
            >
              {/* Horizontal Days Strip */}
              <WeeklyCalendar 
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                currentWeekStart={currentWeekStart}
                weekDirection={weekDirection}
                handlePrevWeek={handlePrevWeek}
                handleNextWeek={handleNextWeek}
              />

              {/* Active Missions Area */}
              <div className="w-full">
                <div className="space-y-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#808080]">
                      <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#1f60c2]" />
                      <p className="text-[13px]">Carregando tarefas...</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {pendingTasks.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8 text-[13px] text-[#808080]"
                        >
                          Nenhuma tarefa pendente. Aproveite o descanso!
                        </motion.div>
                      ) : (
                        pendingTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            project={projects.find(p => p.id === task.project_id)}
                            categories={categories}
                            onToggle={handleToggleTask} 
                            onDelete={setTaskToDelete}
                            onOpenTimeModal={openTimeModal}
                            onOpenRecurrenceModal={openRecurrenceModal}
                            onToggleTimer={handleToggleTimer}
                            onOpenHistory={handleOpenHistory}
                            onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Completed Missions Area */}
              {completedTasks.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-[11px] font-semibold text-[#808080] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluídas
                  </h3>
                  <div className="space-y-0 opacity-60">
                    {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        project={projects.find(p => p.id === task.project_id)}
                        categories={categories}
                        onToggle={handleToggleTask} 
                        onDelete={setTaskToDelete}
                        onOpenTimeModal={openTimeModal}
                        onOpenRecurrenceModal={openRecurrenceModal}
                        onToggleTimer={handleToggleTimer}
                        onOpenHistory={handleOpenHistory}
                        onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'kanban' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"
            >
              {/* To Do Column */}
              <div 
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors ease-out duration-200",
                  dragOverColumn === 'pending' ? "bg-[#dceaff] border-[#1f60c2] border-dashed" : "bg-gray-50/50 border-gray-200"
                )}
                onDragOver={(e) => handleDragOver(e, 'pending')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'pending')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-[14px] leading-[22px] font-semibold text-[#202020]">A Fazer</span>
                  <span className="text-[11px] font-medium text-[#808080]">{projectFilteredTasks.filter(t => t.status === 'pending' && !t.is_running).length}</span>
                </div>
                <div className="space-y-3">
                  {projectFilteredTasks.filter(t => t.status === 'pending' && !t.is_running).map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} categories={categories} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div 
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors ease-out duration-200",
                  dragOverColumn === 'in_progress' ? "bg-[#dceaff] border-[#1f60c2] border-dashed" : "bg-gray-50/50 border-gray-200"
                )}
                onDragOver={(e) => handleDragOver(e, 'in_progress')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'in_progress')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-[14px] leading-[22px] font-semibold text-[#202020]">Em Progresso</span>
                  <span className="text-[11px] font-medium text-[#808080]">{projectFilteredTasks.filter(t => t.status === 'pending' && t.is_running).length}</span>
                </div>
                <div className="space-y-3">
                  {projectFilteredTasks.filter(t => t.status === 'pending' && t.is_running).map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} categories={categories} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div 
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors ease-out duration-200",
                  dragOverColumn === 'completed' ? "bg-[#dceaff] border-[#1f60c2] border-dashed" : "bg-gray-50/50 border-gray-200"
                )}
                onDragOver={(e) => handleDragOver(e, 'completed')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'completed')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-[14px] leading-[22px] font-semibold text-[#202020]">Concluído</span>
                  <span className="text-[11px] font-medium text-[#808080]">{projectFilteredTasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="space-y-3 opacity-60">
                  {projectFilteredTasks.filter(t => t.status === 'completed').map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} categories={categories} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-[18px] leading-[24px] font-bold text-[#202020] capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-lg transition-colors ease-out duration-200">
                    <ChevronLeft className="w-5 h-5 text-[#808080]" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-lg transition-colors ease-out duration-200">
                    <ChevronRight className="w-5 h-5 text-[#808080]" />
                  </button>
                </div>
              </div>

              {/* Calendar Header */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="p-4 text-center text-[11px] font-bold text-[#808080] uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {Array.from({ length: emptyDaysBefore }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b border-gray-100 bg-gray-50/50" />
                ))}
                
                {monthDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayTasks = projectFilteredTasks.filter(t => {
                    if (!t.due_date) return false;
                    const dueDate = parseISO(t.due_date);
                    if (isSameDay(dueDate, day)) return true;
                    
                    if (t.recurrence && t.recurrence !== 'none' && day > dueDate) {
                      if (t.recurrence === 'daily') return true;
                      if (t.recurrence === 'weekly') return getDay(day) === getDay(dueDate);
                      if (t.recurrence === 'monthly') return day.getDate() === dueDate.getDate();
                    }
                    return false;
                  });
                  
                  return (
                    <div 
                      key={day.toISOString()} 
                      onClick={() => {
                        setSelectedDate(day);
                        setView('list');
                      }}
                      className={cn(
                        "border-r border-b border-gray-100 p-2 cursor-pointer transition-colors ease-out duration-200 hover:bg-gray-50 relative group",
                        isSelected && "bg-[#dceaff]/30"
                      )}
                    >
                      <span className={cn(
                        "text-[12px] font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2",
                        isToday ? "bg-[#1f60c2] text-white shadow-sm" : "text-[#202020]",
                        isSelected && !isToday && "bg-gray-200"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {dayTasks.length > 0 && (
                        <div className="flex flex-col gap-1 px-1">
                          {dayTasks.slice(0, 3).map(t => (
                            <div key={t.id} className="text-[10px] truncate bg-[#dceaff] text-[#1f60c2] px-1.5 py-0.5 rounded">
                              {t.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-[10px] text-[#808080] font-medium px-1">
                              +{dayTasks.length - 3} mais
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

        </div>

        {/* Modals */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <TaskModal 
              isOpen={isCreateModalOpen}
              onClose={() => {
                setIsCreateModalOpen(false);
                setSelectedTaskForModal(null);
              }}
              onSave={handleSaveNewTask}
              projects={projects}
              categories={categories}
              taskToEdit={selectedTaskForModal}
            />
          )}
          {isTimeModalOpen && (
            <TimeModal 
              isOpen={isTimeModalOpen} 
              onClose={() => setIsTimeModalOpen(false)} 
              task={selectedTaskForModal} 
              onSave={handleSaveTime}
            />
          )}
          {isRecurrenceModalOpen && (
            <RecurrenceModal 
              isOpen={isRecurrenceModalOpen} 
              onClose={() => setIsRecurrenceModalOpen(false)} 
              task={selectedTaskForModal} 
              onSave={handleSaveRecurrence}
            />
          )}
          {isHistoryModalOpen && (
            <TaskHistoryModal
              isOpen={isHistoryModalOpen}
              onClose={() => setIsHistoryModalOpen(false)}
              task={selectedTaskForModal}
            />
          )}
          {taskToDelete && (
            <ConfirmDialog
              isOpen={!!taskToDelete}
              onClose={() => setTaskToDelete(null)}
              onConfirm={() => handleDeleteTask(taskToDelete)}
              title="Excluir Tarefa"
              description="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
              confirmText="Excluir"
            />
          )}
        </AnimatePresence>
    </div>
  );
}
