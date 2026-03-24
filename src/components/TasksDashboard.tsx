import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, Plus, Calendar as CalendarIcon, 
  ListTodo, Clock, Repeat, Target, X, Flag, Timer, Sun, CalendarDays, Coffee, Ban, ChevronLeft, ChevronRight, Kanban, GripVertical, Inbox, Loader2, Play, Pause, Trash2, Tag
} from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, getDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/src/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Types ---
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
  // UI only fields for now (not in DB schema)
  priority?: string;
  time?: string;
  recurrence?: string;
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
  isDragging
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
          "flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-200 transition-all group",
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
                : "border-slate-300 hover:border-slate-400"
            )}
          >
            {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "text-sm font-medium text-slate-700 line-clamp-2 transition-all",
              task.status === 'completed' && "text-slate-400 line-through"
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
              {(task.time || (task.recurrence && task.recurrence !== 'none')) && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  {task.time && (
                    <span className="flex items-center gap-1 hover:text-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenTimeModal(task); }}>
                      <Clock className="w-3 h-3" />
                      {task.time}
                    </span>
                  )}
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span className="flex items-center gap-1 hover:text-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenRecurrenceModal(task); }}>
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
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0"
            title="Excluir tarefa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom line: Timer pill + History icon */}
        <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Priority Flag */}
            <div 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="flex items-center justify-center p-1.5 rounded-md bg-slate-50 border border-slate-100" 
              title={`Prioridade ${task.priority || 'P4'}`}
            >
              <Flag className={cn("w-3.5 h-3.5", 
                task.priority === 'P1' ? "text-red-500" : 
                task.priority === 'P2' ? "text-orange-500" : 
                task.priority === 'P3' ? "text-blue-500" : 
                "text-slate-400"
              )} fill={task.priority && task.priority !== 'P4' ? "currentColor" : "none"} />
            </div>
            
            {(task.estimated_time || currentElapsed > 0 || task.is_running) && (
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleTimer(task); }}
                  className="hover:bg-slate-200 p-1 rounded transition-colors"
                >
                  {task.is_running ? (
                    <Pause className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-slate-500 hover:text-blue-500" />
                  )}
                </button>
                <span className={cn(
                  "text-[10px] font-mono font-medium",
                  isOvertime ? "text-red-500" : "text-slate-600"
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
              className="hover:bg-slate-100 p-1.5 rounded-md transition-colors text-slate-400 hover:text-slate-600"
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
      className="flex items-center gap-3 py-2 border-b border-slate-100 bg-white group hover:bg-slate-50/50 transition-colors cursor-pointer"
    >
      <div className="opacity-0 group-hover:opacity-100 cursor-grab text-slate-300 transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(task.id, task.status); }}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
          task.status === 'completed' 
            ? "bg-emerald-500 border-emerald-500 text-white" 
            : "border-slate-300 hover:border-slate-400"
        )}
      >
        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "text-sm text-slate-800 truncate transition-all",
            task.status === 'completed' && "text-slate-400 line-through"
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
        </div>
        
        {(task.time || (task.recurrence && task.recurrence !== 'none')) && (
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            {task.time && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenTimeModal(task); }}>
                <Clock className="w-3 h-3" />
                {task.time}
              </span>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="flex items-center gap-1 cursor-pointer hover:text-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenRecurrenceModal(task); }}>
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
          className="flex items-center justify-center p-1.5 rounded-md bg-slate-50 border border-slate-100" 
          title={`Prioridade ${task.priority || 'P4'}`}
        >
          <Flag className={cn("w-3.5 h-3.5", 
            task.priority === 'P1' ? "text-red-500" : 
            task.priority === 'P2' ? "text-orange-500" : 
            task.priority === 'P3' ? "text-blue-500" : 
            "text-slate-400"
          )} fill={task.priority && task.priority !== 'P4' ? "currentColor" : "none"} />
        </div>

        {(task.estimated_time || currentElapsed > 0 || task.is_running) && (
          <div className="flex items-center gap-2 bg-slate-100/50 px-2 py-1 rounded-md">
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleTimer(task); }}
              className="hover:bg-slate-200 p-1 rounded transition-colors"
            >
              {task.is_running ? (
                <Pause className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Play className="w-3.5 h-3.5 text-slate-500 hover:text-blue-500" />
              )}
            </button>
            <span className={cn(
              "text-xs font-mono font-medium",
              isOvertime ? "text-red-500" : "text-slate-600"
            )}>
              {formatTime(currentElapsed)}
              {task.estimated_time ? ` / ${task.estimated_time}:00` : ''}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenHistory(task); }}
              className="hover:bg-slate-200 p-1 rounded transition-colors"
              title="Ver Histórico"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
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
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
        title="Excluir tarefa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const TaskModal = ({ isOpen, onClose, onSave, projects, taskToEdit }: { isOpen: boolean; onClose: () => void; onSave: (task: any) => void; projects: {id: string, name: string, color: string}[]; taskToEdit?: Task | null }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false);
  const [priority, setPriority] = useState('P4');
  const [duration, setDuration] = useState('30');
  const [time, setTime] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [taskDate, setTaskDate] = useState<Date>(new Date());
  const [projectId, setProjectId] = useState<string>('none');
  const [tagId, setTagId] = useState<string>('none');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const { data: tags = [] } = useQuery({
    queryKey: ['task_tags', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('task_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data as TaskTag[];
    },
    enabled: !!user,
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not logged in');
      const { data, error } = await supabase
        .from('task_tags')
        .insert([{ user_id: user.id, name, color: '#3b82f6' }])
        .select()
        .single();
      if (error) throw error;
      return data as TaskTag;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['task_tags'] });
      setTagId(newTag.id);
      setIsCreatingTag(false);
      setNewTagName('');
    }
  });

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTagMutation.mutate(newTagName.trim());
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority || 'P4');
        setDuration(taskToEdit.estimated_time ? taskToEdit.estimated_time.toString() : '30');
        setTime(taskToEdit.time || '');
        setRecurrence((taskToEdit.recurrence as any) || 'none');
        setTaskDate(taskToEdit.due_date ? new Date(taskToEdit.due_date) : new Date());
        setProjectId(taskToEdit.project_id || 'none');
        setTagId(taskToEdit.tag_id || 'none');
      } else {
        setTitle('');
        setDescription('');
        setPriority('P4');
        setDuration('30');
        setTime('');
        setRecurrence('none');
        setTaskDate(new Date());
        setProjectId('none');
        setTagId('none');
      }
    }
  }, [isOpen, taskToEdit]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 2) {
      let hours = parseInt(value.substring(0, 2), 10);
      if (hours > 23) hours = 23;
      
      let minutesStr = value.substring(2, 4);
      if (minutesStr.length === 2) {
        let minutes = parseInt(minutesStr, 10);
        if (minutes > 59) minutes = 59;
        minutesStr = minutes.toString().padStart(2, '0');
      }
      
      value = hours.toString().padStart(2, '0') + ':' + minutesStr;
    } else if (value.length === 2) {
      let hours = parseInt(value, 10);
      if (hours > 23) hours = 23;
      value = hours.toString().padStart(2, '0');
    }
    
    setTime(value);
  };

  if (!isOpen) return null;

  const isSaveDisabled = !title.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-visible flex flex-col relative"
        >
          <div className="p-6 flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Qual é a sua próxima tarefa?" 
              className="w-full text-xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <textarea 
              placeholder="Descrição da tarefa..." 
              className="w-full text-sm text-slate-600 focus:outline-none resize-none min-h-[60px]"
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
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                        isDatePickerOpen ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <CalendarIcon className={cn("w-4 h-4", isDatePickerOpen ? "text-blue-500" : "text-slate-400")} />
                      {isSameDay(taskDate, new Date()) ? 'Hoje' : format(taskDate, 'dd/MM')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="left" 
                    align="start" 
                    sideOffset={16} 
                    avoidCollisions={true}
                    className="w-72 p-0 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] overflow-hidden"
                  >
                    <div className="p-2 space-y-1 border-b border-slate-100">
                      <button onClick={() => { setTaskDate(addDays(new Date(), 1)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-left"><Sun className="w-4 h-4 text-orange-500" /> Amanhã</button>
                      <button onClick={() => { setTaskDate(addDays(new Date(), 7)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-left"><CalendarDays className="w-4 h-4 text-blue-500" /> Próxima semana</button>
                      <button onClick={() => { setTaskDate(addDays(new Date(), 5)); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-left"><Coffee className="w-4 h-4 text-purple-500" /> Próximo fim de semana</button>
                      <button onClick={() => { setTaskDate(new Date()); setIsDatePickerOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-left"><Ban className="w-4 h-4 text-slate-400" /> Sem vencimento</button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-bold text-sm">Março 2026</span>
                        <div className="flex gap-1">
                          <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                          <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-400 font-medium">
                        <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {Array.from({length: 31}).map((_, i) => {
                          const newDate = new Date(2026, 2, i + 1);
                          return (
                            <button 
                              key={i} 
                              onClick={() => { setTaskDate(newDate); setIsDatePickerOpen(false); }}
                              className={cn("w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100", isSameDay(newDate, taskDate) && "bg-blue-600 text-white hover:bg-blue-700")}
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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
                  time ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                )}>
                  <Clock className={cn("w-4 h-4", time ? "text-blue-500" : "text-slate-400")} />
                  <input
                    type="text"
                    placeholder="00:00"
                    maxLength={5}
                    value={time}
                    onChange={handleTimeChange}
                    className="w-10 bg-transparent focus:outline-none text-center placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Recurrence Button & Popover */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsRecurrencePickerOpen(!isRecurrencePickerOpen);
                    setIsDatePickerOpen(false);
                    setIsTimePickerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                    isRecurrencePickerOpen || recurrence !== 'none' ? "border-blue-500 text-blue-600 bg-blue-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Repeat className={cn("w-4 h-4", isRecurrencePickerOpen || recurrence !== 'none' ? "text-blue-500" : "text-slate-400")} />
                  {recurrence === 'daily' ? 'Diário' : recurrence === 'weekly' ? 'Semanal' : recurrence === 'monthly' ? 'Mensal' : 'Repetir'}
                </button>
                <AnimatePresence>
                  {isRecurrencePickerOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] p-2 space-y-1"
                    >
                      <button onClick={() => { setRecurrence('none'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100", recurrence === 'none' && "bg-blue-50 text-blue-700")}>Não repete</button>
                      <button onClick={() => { setRecurrence('daily'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100", recurrence === 'daily' && "bg-blue-50 text-blue-700")}>Diariamente</button>
                      <button onClick={() => { setRecurrence('weekly'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100", recurrence === 'weekly' && "bg-blue-50 text-blue-700")}>Semanalmente</button>
                      <button onClick={() => { setRecurrence('monthly'); setIsRecurrencePickerOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-100", recurrence === 'monthly' && "bg-blue-50 text-blue-700")}>Mensalmente</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-auto h-9 border-slate-200 bg-transparent hover:bg-slate-50 focus:ring-0 focus:ring-offset-0 border rounded-lg px-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Flag className={cn("w-4 h-4", priority === 'P1' ? "text-red-500" : priority === 'P2' ? "text-orange-500" : priority === 'P3' ? "text-blue-500" : "text-slate-400")} fill={priority !== 'P4' ? "currentColor" : "none"} />
                    {priority}
                  </div>
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="P1"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-red-500" fill="currentColor"/> Urgente</div></SelectItem>
                  <SelectItem value="P2"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-orange-500" fill="currentColor"/> Alta</div></SelectItem>
                  <SelectItem value="P3"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-blue-500" fill="currentColor"/> Média</div></SelectItem>
                  <SelectItem value="P4"><div className="flex items-center gap-2"><Flag className="w-4 h-4 text-slate-400" fill="none"/> Baixa</div></SelectItem>
                </SelectContent>
              </Select>

              {projects.length > 0 && (
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-auto h-9 border-slate-200 bg-transparent hover:bg-slate-50 focus:ring-0 focus:ring-offset-0 border rounded-lg px-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Target className="w-4 h-4 text-slate-400" />
                      {projectId === 'none' ? 'Projeto' : projects.find(p => p.id === projectId)?.name}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
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
                <Select value={tagId} onValueChange={setTagId}>
                  <SelectTrigger className="w-auto h-9 border-slate-200 bg-transparent hover:bg-slate-50 focus:ring-0 focus:ring-offset-0 border rounded-lg px-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Tag className="w-4 h-4 text-slate-400" />
                      {tagId === 'none' ? 'Categoria' : tags.find((t: TaskTag) => t.id === tagId)?.name}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    <SelectItem value="none">Nenhuma categoria</SelectItem>
                    {tags.map((t: TaskTag) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#3b82f6' }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {isCreatingTag ? (
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 h-9">
                    <input 
                      type="text" 
                      value={newTagName} 
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="Nome da tag"
                      className="w-24 text-sm bg-transparent focus:outline-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreateTag();
                        if (e.key === 'Escape') setIsCreatingTag(false);
                      }}
                    />
                    <button onClick={handleCreateTag} className="text-blue-600 hover:text-blue-700 p-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsCreatingTag(false)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCreatingTag(true)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Timer className="w-4 h-4 text-slate-400" />
                <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-12 bg-transparent focus:outline-none text-center" placeholder="30" />
                min
              </div>
            </div>
            <p className="text-xs text-slate-400 ml-1">Isso ativará o temporizador de foco da tarefa.</p>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
            <button 
              disabled={isSaveDisabled}
              onClick={() => {
                if (isSaveDisabled) return;
                onSave({ id: taskToEdit?.id, title, description, priority, estimated_time: parseInt(duration) || 30, time: time || undefined, recurrence, date: taskDate, project_id: projectId === 'none' ? null : projectId, tag_id: tagId === 'none' ? null : tagId });
                setTitle(''); setDescription(''); setTime(''); setRecurrence('none'); setPriority('P4'); setDuration('30'); setProjectId('none'); setTagId('none');
                setIsDatePickerOpen(false); setIsTimePickerOpen(false); setIsRecurrencePickerOpen(false);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              Salvar Tarefa
            </button>
          </div>
        </motion.div>
      </div>
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

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Definir Horário</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Horário</label>
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Repetir Tarefa</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Frequência</label>
          <Select value={recurrence} onValueChange={setRecurrence}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não repetir</SelectItem>
              <SelectItem value="daily">Diariamente</SelectItem>
              <SelectItem value="weekly">Semanalmente</SelectItem>
              <SelectItem value="monthly">Mensalmente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-lg text-slate-800">Histórico de Tempo</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4 border-b border-slate-100">
          <h4 className="font-medium text-slate-900 truncate">{task?.title}</h4>
          <p className="text-sm text-slate-500 mt-1">
            Tempo total: {formatDuration(currentElapsed)}
            {task?.estimated_time ? ` / ${task.estimated_time}m estimado` : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Nenhum registro de tempo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {format(new Date(log.started_at), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(log.started_at), "HH:mm")} 
                      {log.ended_at ? ` - ${format(new Date(log.ended_at), "HH:mm")}` : ' - Agora'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-mono font-medium",
                      !log.ended_at ? "text-blue-600" : "text-slate-700"
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

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Tarefa</h3>
          <p className="text-sm text-slate-500">
            Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="p-4 bg-slate-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>Excluir</Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Component ---

export default function TasksDashboard({ isCreateModalOpen, setIsCreateModalOpen }: { isCreateModalOpen: boolean, setIsCreateModalOpen: (v: boolean) => void }) {
  const { user } = useAuth();
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
      project_id: taskData.project_id || null,
      tag_id: taskData.tag_id || null,
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

  const filteredTasks = projectFilteredTasks.filter(t => {
    if (!t.due_date) {
      return isSameDay(new Date(), selectedDate); // Show tasks without due date on today
    }
    
    const dueDate = parseISO(t.due_date);
    
    if (isSameDay(dueDate, selectedDate)) {
      return true;
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
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <div className="max-w-4xl mx-auto w-full pt-6 md:pt-10 px-4 md:px-8 flex-1 overflow-y-auto pb-12">
        
        {/* Header */}
          <header className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {/* Toggle Group */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setView('list')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      view === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                    Lista
                  </button>
                  <button
                    onClick={() => setView('kanban')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      view === 'kanban' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Kanban className="w-3.5 h-3.5 mr-1.5" />
                    Kanban
                  </button>
                  <button
                    onClick={() => setView('calendar')}
                    className={cn(
                      "flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      view === 'calendar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    Calendário
                  </button>
                </div>
              </div>
            </div>

            {/* Project Filters (Pills) */}
            {projects.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedProject(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                    selectedProject === null 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  Todas
                </button>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex items-center gap-1.5",
                      selectedProject === project.id 
                        ? "bg-slate-800 text-white border-slate-800" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </header>

          {view === 'list' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Horizontal Days Strip */}
              <div className="flex items-center bg-white py-3 px-2 border-b border-slate-100">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 flex flex-col overflow-hidden px-2">
                  {/* Static Labels */}
                  <div className="flex justify-around mb-2">
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(day => (
                      <div key={day} className="w-10 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Animated Numbers */}
                  <div className="relative h-10">
                    <AnimatePresence mode="popLayout" custom={weekDirection}>
                      <motion.div
                        key={currentWeekStart.toISOString()}
                        custom={weekDirection}
                        variants={{
                          initial: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
                          animate: { x: 0, opacity: 1 },
                          exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 })
                        }}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-0 flex justify-around"
                      >
                        {eachDayOfInterval({ start: currentWeekStart, end: addDays(currentWeekStart, 6) }).map(day => {
                          const isSelected = isSameDay(day, selectedDate);
                          const isToday = isSameDay(day, new Date());
                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => setSelectedDate(day)}
                              className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-lg transition-all",
                                isSelected 
                                  ? "bg-blue-50 text-blue-600 font-bold shadow-sm" 
                                  : "hover:bg-slate-50 text-slate-600"
                              )}
                            >
                              <span className={cn(
                                "text-sm",
                                isToday && !isSelected && "text-blue-600 font-bold"
                              )}>
                                {format(day, 'd')}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Active Missions Area */}
              <div>
                <div className="space-y-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-sm">Carregando tarefas...</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {pendingTasks.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8 text-sm text-slate-500"
                        >
                          Nenhuma tarefa pendente. Aproveite o descanso!
                        </motion.div>
                      ) : (
                        pendingTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            project={projects.find(p => p.id === task.project_id)}
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
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluídas
                  </h3>
                  <div className="space-y-0 opacity-60">
                    {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        project={projects.find(p => p.id === task.project_id)}
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
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors",
                  dragOverColumn === 'pending' ? "bg-blue-50/50 border-blue-200 border-dashed" : "bg-slate-50/50 border-slate-100"
                )}
                onDragOver={(e) => handleDragOver(e, 'pending')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'pending')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">A Fazer</span>
                  <span className="text-xs font-medium text-slate-500">{projectFilteredTasks.filter(t => t.status === 'pending' && !t.is_running).length}</span>
                </div>
                <div className="space-y-3">
                  {projectFilteredTasks.filter(t => t.status === 'pending' && !t.is_running).map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div 
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors",
                  dragOverColumn === 'in_progress' ? "bg-blue-50/50 border-blue-200 border-dashed" : "bg-slate-50/50 border-slate-100"
                )}
                onDragOver={(e) => handleDragOver(e, 'in_progress')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'in_progress')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Em Progresso</span>
                  <span className="text-xs font-medium text-slate-500">{projectFilteredTasks.filter(t => t.status === 'pending' && t.is_running).length}</span>
                </div>
                <div className="space-y-3">
                  {projectFilteredTasks.filter(t => t.status === 'pending' && t.is_running).map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div 
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border transition-colors",
                  dragOverColumn === 'completed' ? "bg-blue-50/50 border-blue-200 border-dashed" : "bg-slate-50/50 border-slate-100"
                )}
                onDragOver={(e) => handleDragOver(e, 'completed')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'completed')}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Concluído</span>
                  <span className="text-xs font-medium text-slate-500">{projectFilteredTasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div className="space-y-3 opacity-60">
                  {projectFilteredTasks.filter(t => t.status === 'completed').map(task => (
                    <TaskCard key={task.id} task={task} project={projects.find(p => p.id === task.project_id)} view="kanban" onToggle={handleToggleTask} onDelete={setTaskToDelete} onOpenTimeModal={openTimeModal} onOpenRecurrenceModal={openRecurrenceModal} onToggleTimer={handleToggleTimer} onOpenHistory={handleOpenHistory} onEdit={(task) => { setSelectedTaskForModal(task); setIsCreateModalOpen(true); }} onDragStart={handleDragStart} isDragging={draggedTask?.id === task.id} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Calendar Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {Array.from({ length: emptyDaysBefore }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b border-slate-100 bg-slate-50/50" />
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
                        "border-r border-b border-slate-100 p-2 cursor-pointer transition-colors hover:bg-slate-50 relative group",
                        isSelected && "bg-blue-50/30"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2",
                        isToday ? "bg-blue-600 text-white shadow-sm" : "text-slate-700",
                        isSelected && !isToday && "bg-slate-200"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {dayTasks.length > 0 && (
                        <div className="flex flex-col gap-1 px-1">
                          {dayTasks.slice(0, 3).map(t => (
                            <div key={t.id} className="text-[10px] truncate bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              {t.title}
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-[10px] text-slate-500 font-medium px-1">
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
            <ConfirmDeleteModal
              isOpen={!!taskToDelete}
              onClose={() => setTaskToDelete(null)}
              onConfirm={() => handleDeleteTask(taskToDelete)}
            />
          )}
        </AnimatePresence>
    </main>
  );
}
