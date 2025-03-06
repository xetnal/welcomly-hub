
import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { format } from 'date-fns';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CommentSection from './CommentSection';
import { useDrag } from 'react-dnd';
import DeleteTaskModal from './DeleteTaskModal';
import EditTaskModal from './EditTaskModal';

interface TaskCardProps {
  task: Task;
  index: number;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string, updatedTask: Partial<Task>) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  onDeleteTask,
  onEditTask
}) => {
  const [showComments, setShowComments] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.05,
          ease: [0.22, 1, 0.36, 1]
        }}
        className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm p-4 mb-3 ${isDragging ? 'opacity-50' : ''}`}
        ref={drag}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
          <h3 className="font-medium break-words">{task.title}</h3>
          <div className="flex gap-2 items-center sm:flex-shrink-0">
            <PriorityBadge priority={task.priority} />
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted dark:hover:bg-gray-700 text-muted-foreground dark:text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <div className="space-y-1">
                  <button 
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted dark:hover:bg-gray-700"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Edit Task
                  </button>
                  <button className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted dark:hover:bg-gray-700">
                    Move to Another Stage
                  </button>
                  <button 
                    className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted dark:hover:bg-gray-700 text-red-500"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Task
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 break-words">{task.description}</p>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-muted-foreground dark:text-gray-400 mb-2 gap-2">
          <span>Updated {format(task.updated, 'MMM d')}</span>
          {task.assignee && (
            <span className="bg-muted dark:bg-gray-700 px-2 py-1 rounded truncate max-w-full sm:max-w-[120px]">{task.assignee}</span>
          )}
        </div>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-xs text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          <span>{task.comments.length} comments</span>
        </button>
        
        {showComments && (
          <div className="mt-3 pt-3 border-t dark:border-gray-700">
            <CommentSection task={task} />
          </div>
        )}
      </motion.div>

      <DeleteTaskModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        taskId={task.id}
        taskTitle={task.title}
        onDeleteTask={onDeleteTask || (() => {})}
      />

      <EditTaskModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onEditTask={onEditTask || (() => {})}
      />
    </>
  );
};

export default TaskCard;
