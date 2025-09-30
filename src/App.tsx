import React, { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface Analytics {
  totalVisitors: number;
  pageViews: number;
  sessionStart: number;
  lastVisit: number;
  todosCreated: number;
  todosCompleted: number;
  todosDeleted: number;
  sessionsCount: number;
}

type FilterType = 'all' | 'active' | 'completed';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalVisitors: 0,
    pageViews: 0,
    sessionStart: Date.now(),
    lastVisit: 0,
    todosCreated: 0,
    todosCompleted: 0,
    todosDeleted: 0,
    sessionsCount: 0
  });

  // Load todos and analytics from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt)
      }));
      setTodos(parsedTodos);
    }

    // Analytics initialization
    const savedAnalytics = localStorage.getItem('analytics');
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (savedAnalytics) {
      const parsedAnalytics = JSON.parse(savedAnalytics);
      const isNewVisitor = now - parsedAnalytics.lastVisit > oneDayMs;
      
      setAnalytics({
        ...parsedAnalytics,
        pageViews: parsedAnalytics.pageViews + 1,
        totalVisitors: isNewVisitor ? parsedAnalytics.totalVisitors + 1 : parsedAnalytics.totalVisitors,
        sessionStart: now,
        lastVisit: now,
        sessionsCount: parsedAnalytics.sessionsCount + 1
      });
    } else {
      setAnalytics(prev => ({
        ...prev,
        totalVisitors: 1,
        pageViews: 1,
        lastVisit: now,
        sessionsCount: 1
      }));
    }

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const currentAnalytics = JSON.parse(localStorage.getItem('analytics') || '{}');
      localStorage.setItem('analytics', JSON.stringify(currentAnalytics));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Save analytics to localStorage whenever analytics change
  useEffect(() => {
    localStorage.setItem('analytics', JSON.stringify(analytics));
  }, [analytics]);

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
      setAnalytics(prev => ({
        ...prev,
        todosCreated: prev.todosCreated + 1
      }));
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        if (!todo.completed) {
          setAnalytics(prev => ({
            ...prev,
            todosCompleted: prev.todosCompleted + 1
          }));
        }
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    }));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
    setAnalytics(prev => ({
      ...prev,
      todosDeleted: prev.todosDeleted + 1
    }));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const getSessionDuration = () => {
    const duration = Date.now() - analytics.sessionStart;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getAverageSessionDuration = () => {
    if (analytics.sessionsCount === 0) return '0m 0s';
    const avgDuration = (Date.now() - analytics.sessionStart) / analytics.sessionsCount;
    const minutes = Math.floor(avgDuration / 60000);
    const seconds = Math.floor((avgDuration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const completedTodos = todos.filter(todo => todo.completed).length;
  const activeTodos = todos.filter(todo => !todo.completed).length;

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Analytics Dashboard</h1>
              <button
                onClick={() => setShowAnalytics(false)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Todos
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total Visitors</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{analytics.totalVisitors}</p>
              </div>
              <div className="bg-green-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Page Views</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{analytics.pageViews}</p>
              </div>
              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Current Session</h3>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900">{getSessionDuration()}</p>
              </div>
              <div className="bg-orange-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-sm font-medium text-orange-600">Total Sessions</h3>
                <p className="text-2xl sm:text-3xl font-bold text-orange-900">{analytics.sessionsCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Todo Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Todos Created:</span>
                    <span className="font-semibold">{analytics.todosCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Todos Completed:</span>
                    <span className="font-semibold">{analytics.todosCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Todos Deleted:</span>
                    <span className="font-semibold">{analytics.todosDeleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currently Active:</span>
                    <span className="font-semibold">{activeTodos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Currently Completed:</span>
                    <span className="font-semibold">{completedTodos}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate:</span>
                    <span className="font-semibold">
                      {analytics.todosCreated > 0 
                        ? Math.round((analytics.todosCompleted / analytics.todosCreated) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Todos per Session:</span>
                    <span className="font-semibold">
                      {analytics.sessionsCount > 0 
                        ? Math.round(analytics.todosCreated / analytics.sessionsCount * 10) / 10
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Todo Count:</span>
                    <span className="font-semibold">{todos.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Todo List</h1>
          
          {/* Add Todo Input */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              Add Todo
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'active', 'completed'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium capitalize text-sm sm:text-base transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* Todo Stats */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <span>Total: {todos.length}</span>
            <span>Active: {activeTodos}</span>
            <span>Completed: {completedTodos}</span>
          </div>

          {/* Todo List */}
          <div className="space-y-2 sm:space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === 'all' ? 'No todos yet. Add one above!' : `No ${filter} todos.`}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {todo.completed && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm sm:text-base ${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics Button */}
      <button
        onClick={() => setShowAnalytics(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-purple-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="View Analytics"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      </button>
    </div>
  );
}