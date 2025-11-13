import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Calendar, Sun, Award, CheckCircle, Circle, Users } from 'lucide-react';
import './global.css';

const USERS = ['John', 'Sarah', 'Mom', 'Dad'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FamilyDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Make Bed', points: 1, assignedTo: 'John', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
    { id: 2, name: 'Dishes', points: 2, assignedTo: 'Sarah', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], time: '7:00 PM' },
  ]);
  const [rewards, setRewards] = useState([
    { id: 1, name: 'Ice Cream', cost: 5 },
    { id: 2, name: 'Movie Night', cost: 10 },
  ]);
  const [userPoints, setUserPoints] = useState({
    John: 3,
    Sarah: 7,
    Mom: 12,
    Dad: 15
  });
  const [calendarEvents] = useState([
    { id: 1, title: 'Hockey Lesson', time: '4:15 - 5:15 PM', date: 'Wed Nov 12', color: '#10b981' },
    { id: 2, title: 'PTA Room Reps Meeting', time: '5:30 - 6:30 PM', date: 'Wed Nov 12', color: '#14b8a6' },
    { id: 3, title: 'Hockey Practice', time: '8:15 - 9:15 AM', date: 'Sat Nov 15', color: '#10b981' },
  ]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    points: 1,
    assignedTo: USERS[0],
    recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time: '9:00 AM'
  });
  const [newReward, setNewReward] = useState({ name: '', cost: 5 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addTask = () => {
    if (newTask.name.trim()) {
      setTasks([...tasks, { ...newTask, id: Date.now(), completed: false }]);
      setNewTask({
        name: '',
        points: 1,
        assignedTo: USERS[0],
        recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time: '9:00 AM'
      });
      setShowTaskModal(false);
    }
  };

  const addReward = () => {
    if (newReward.name.trim()) {
      setRewards([...rewards, { ...newReward, id: Date.now() }]);
      setNewReward({ name: '', cost: 5 });
      setShowRewardModal(false);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newCompleted = !task.completed;
        if (newCompleted) {
          setUserPoints(prev => ({
            ...prev,
            [task.assignedTo]: (prev[task.assignedTo] || 0) + task.points
          }));
        } else {
          setUserPoints(prev => ({
            ...prev,
            [task.assignedTo]: Math.max(0, (prev[task.assignedTo] || 0) - task.points)
          }));
        }
        return { ...task, completed: newCompleted };
      }
      return task;
    }));
  };

  const redeemReward = (reward, user) => {
    if (userPoints[user] >= reward.cost) {
      setUserPoints(prev => ({
        ...prev,
        [user]: prev[user] - reward.cost
      }));
      alert(`🎉 ${user} redeemed ${reward.name}!`);
    } else {
      alert(`${user} needs ${reward.cost - userPoints[user]} more points!`);
    }
  };

  const toggleDay = (day) => {
    setNewTask(prev => ({
      ...prev,
      recurrence: prev.recurrence.includes(day)
        ? prev.recurrence.filter(d => d !== day)
        : [...prev.recurrence, day]
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Time and Weather Section */}
        <div className="text-center mb-8 bg-white/5 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
          <div className="text-slate-400 text-lg mb-2">{formatDate(currentTime)}</div>
          <div className="text-8xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            {formatTime(currentTime)}
          </div>
          <div className="flex items-center justify-center gap-4">
            <Sun size={40} className="text-yellow-400" />
            <div className="text-4xl font-semibold">75°F</div>
            <div className="text-xl text-slate-300">Clear</div>
          </div>
          <div className="text-sm text-slate-400 mt-2">North Richland Hills, TX</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Events */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-teal-400" size={24} />
                <h2 className="text-2xl font-bold">Calendar</h2>
              </div>
            </div>
            <div className="space-y-3">
              {calendarEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white/10 p-4 rounded-xl border-l-4"
                  style={{ borderLeftColor: event.color }}
                >
                  <div className="font-semibold text-lg">{event.title}</div>
                  <div className="text-slate-300 text-sm mt-1">{event.time}</div>
                  <div className="text-slate-400 text-xs mt-1">{event.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-teal-600 hover:bg-teal-700 p-2 rounded-full transition"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white/10 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/15 transition"
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed ? (
                    <CheckCircle size={28} className="text-teal-500 flex-shrink-0" />
                  ) : (
                    <Circle size={28} className="text-slate-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold text-lg ${task.completed ? 'line-through text-slate-400' : ''}`}>
                      {task.name}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {task.assignedTo} • {task.points} pts • {task.time} • {task.recurrence.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-bold">Points</h2>
            </div>
            <div className="space-y-3">
              {USERS.map(user => (
                <div key={user} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center font-bold">
                      {user[0]}
                    </div>
                    <span className="font-semibold text-lg">{user}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                    <Award size={18} className="text-yellow-400" />
                    <span className="font-bold text-yellow-400 text-lg">{userPoints[user] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Rewards</h2>
              <button
                onClick={() => setShowRewardModal(true)}
                className="bg-teal-600 hover:bg-teal-700 p-2 rounded-full transition"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {rewards.map(reward => (
                <div key={reward.id} className="bg-white/10 p-4 rounded-xl">
                  <div className="mb-3">
                    <div className="font-semibold text-lg">{reward.name}</div>
                    <div className="text-yellow-400 text-sm">{reward.cost} points</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {USERS.map(user => (
                      <button
                        key={user}
                        onClick={() => redeemReward(reward, user)}
                        disabled={userPoints[user] < reward.cost}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          userPoints[user] >= reward.cost
                            ? 'bg-teal-600 hover:bg-teal-700'
                            : 'bg-slate-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {user}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Add Task</h3>
              <button onClick={() => setShowTaskModal(false)}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Task name"
              value={newTask.name}
              onChange={(e) => setNewTask({...newTask, name: e.target.value})}
              className="w-full bg-white/10 p-3 rounded-lg mb-4 text-white placeholder-slate-400"
            />

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Points:</label>
              <input
                type="number"
                value={newTask.points}
                onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                className="w-full bg-white/10 p-3 rounded-lg text-white"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Assign to:</label>
              <div className="flex flex-wrap gap-2">
                {USERS.map(user => (
                  <button
                    key={user}
                    onClick={() => setNewTask({...newTask, assignedTo: user})}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      newTask.assignedTo === user
                        ? 'bg-teal-600'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {user}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Repeat on:</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-lg font-medium transition ${
                      newTask.recurrence.includes(day)
                        ? 'bg-teal-600'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Time:</label>
              <input
                type="text"
                placeholder="9:00 AM"
                value={newTask.time}
                onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                className="w-full bg-white/10 p-3 rounded-lg text-white placeholder-slate-400"
              />
            </div>

            <button
              onClick={addTask}
              className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Add Reward</h3>
              <button onClick={() => setShowRewardModal(false)}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Reward name"
              value={newReward.name}
              onChange={(e) => setNewReward({...newReward, name: e.target.value})}
              className="w-full bg-white/10 p-3 rounded-lg mb-4 text-white placeholder-slate-400"
            />

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Cost (points):</label>
              <input
                type="number"
                value={newReward.cost}
                onChange={(e) => setNewReward({...newReward, cost: parseInt(e.target.value) || 0})}
                className="w-full bg-white/10 p-3 rounded-lg text-white"
              />
            </div>

            <button
              onClick={addReward}
              className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition"
            >
              Add Reward
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;
