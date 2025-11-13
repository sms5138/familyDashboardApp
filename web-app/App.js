import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Calendar, Sun, Award, CheckCircle, Circle, Users } from 'lucide-react';
import { gapi } from 'gapi-script';
import './global.css';

// Google Calendar API Configuration
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'YOUR_API_KEY';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const CALENDAR_IDS = (process.env.REACT_APP_CALENDAR_IDS || 'primary').split(',');
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Weekend'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const FamilyDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Make Bed', points: 1, assignedTo: 'Nolan', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
  ]);
  const [rewards, setRewards] = useState([
    { id: 1, name: 'Ice Cream', cost: 5 },
    { id: 2, name: 'Movie Night', cost: 10 },
  ]);
  const [userPoints, setUserPoints] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingReward, setPendingReward] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [hideParents, setHideParents] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', type: 'Child', points: 0, pin: '' });
  const [newTask, setNewTask] = useState({
    name: '',
    points: 1,
    assignedTo: users[0]?.name || '',
    recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    period: 'Morning'
  });
  const [newReward, setNewReward] = useState({ name: '', cost: 5 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load users, tasks, and rewards from API
  useEffect(() => {
    loadUsers();
    loadTasks();
    loadRewards();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      const result = await response.json();
      if (result.success && result.data.users) {
        setUsers(result.data.users);
        // Initialize user points from loaded users
        const points = result.data.users.reduce((acc, user) => {
          acc[user.name] = user.points;
          return acc;
        }, {});
        setUserPoints(points);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to default users if API fails
      const defaultUsers = [
        { name: 'Nolan', type: 'Child', points: 3 },
        { name: 'Mom', type: 'Parent', points: 0 },
        { name: 'Dad', type: 'Parent', points: 0 }
      ];
      setUsers(defaultUsers);
      setUserPoints(defaultUsers.reduce((acc, user) => {
        acc[user.name] = user.points;
        return acc;
      }, {}));
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tasks`);
      const result = await response.json();
      if (result.success && result.data) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Keep default tasks if API fails
    }
  };

  const loadRewards = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rewards`);
      const result = await response.json();
      if (result.success && result.data) {
        setRewards(result.data);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      // Keep default rewards if API fails
    }
  };

  const saveUsers = async (updatedUsers) => {
    try {
      await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { users: updatedUsers }
        }),
      });
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  const saveTasks = async (updatedTasks) => {
    try {
      await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedTasks
        }),
      });
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const saveRewards = async (updatedRewards) => {
    try {
      await fetch(`${API_URL}/api/rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: updatedRewards
        }),
      });
    } catch (error) {
      console.error('Error saving rewards:', error);
    }
  };

  // Helper function to update user points in both state and persist to API
  const updateUserPoints = async (userName, newPoints) => {
    // Update userPoints state
    setUserPoints(prev => ({
      ...prev,
      [userName]: newPoints
    }));

    // Update users array with new points
    const updatedUsers = users.map(user =>
      user.name === userName
        ? { ...user, points: newPoints }
        : user
    );
    setUsers(updatedUsers);

    // Save to API
    await saveUsers(updatedUsers);
  };

  // Initialize Google API client
  useEffect(() => {
    const initClient = () => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: SCOPES,
        }).then(() => {
          // Listen for sign-in state changes
          const authInstance = gapi.auth2.getAuthInstance();
          authInstance.isSignedIn.listen(updateSigninStatus);

          // Handle initial sign-in state
          updateSigninStatus(authInstance.isSignedIn.get());
        }).catch((error) => {
          console.error('Error initializing Google API client:', error);
          setCalendarError('Failed to initialize Google Calendar. Please check your API credentials.');
          setCalendarLoading(false);
        });
      });
    };

    initClient();
  }, []);

  const updateSigninStatus = (isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      loadCalendarEvents();
    } else {
      setCalendarLoading(false);
      setCalendarError(null);
      setCalendarEvents([]);
    }
  };

  const handleAuthClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signIn().catch((error) => {
      console.error('Error signing in:', error);
      setCalendarError('Failed to sign in to Google Calendar');
    });
  };

  const handleSignoutClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut();
  };

  const loadCalendarEvents = async () => {
    try {
      setCalendarLoading(true);
      setCalendarError(null);

      // Get events for the next 7 days
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      let allEvents = [];

      // Fetch events from each calendar ID
      for (const calendarId of CALENDAR_IDS) {
        try {
          const response = await gapi.client.calendar.events.list({
            calendarId: calendarId.trim(),
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            showDeleted: false,
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = response.result.items || [];
          allEvents = allEvents.concat(events.map(event => ({
            ...event,
            calendarId: calendarId.trim()
          })));
        } catch (error) {
          console.error(`Error fetching events from calendar ${calendarId}:`, error);
        }
      }

      // Sort events by start date and format them
      const formattedEvents = allEvents
        .filter(event => event.start?.dateTime || event.start?.date)
        .sort((a, b) => {
          const aStart = new Date(a.start.dateTime || a.start.date);
          const bStart = new Date(b.start.dateTime || b.start.date);
          return aStart - bStart;
        })
        .map((event, index) => {
          const startDate = new Date(event.start.dateTime || event.start.date);
          const endDate = new Date(event.end.dateTime || event.end.date);

          // Format time (handle all-day events)
          let timeStr;
          if (event.start.dateTime) {
            timeStr = `${startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })} - ${endDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}`;
          } else {
            timeStr = 'All day';
          }

          // Format date
          const dateStr = startDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          });

          // Assign colors based on calendar
          const colors = ['#10b981', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
          const calendarIndex = CALENDAR_IDS.indexOf(event.calendarId);
          const color = event.colorId
            ? `#${event.colorId}`
            : colors[calendarIndex % colors.length];

          return {
            id: event.id,
            title: event.summary || 'Untitled Event',
            time: timeStr,
            date: dateStr,
            color: color,
            calendarId: event.calendarId
          };
        });

      setCalendarEvents(formattedEvents);
      setCalendarLoading(false);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      setCalendarError('Failed to load calendar events');
      setCalendarLoading(false);
    }
  };

  const addTask = async () => {
    if (newTask.name.trim()) {
      const updatedTasks = [...tasks, { ...newTask, id: Date.now(), completed: false }];
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
      setNewTask({
        name: '',
        points: 1,
        assignedTo: users[0]?.name || '',
        recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        period: 'Morning'
      });
      setShowTaskModal(false);
    }
  };

  const addReward = async () => {
    if (newReward.name.trim()) {
      const updatedRewards = [...rewards, { ...newReward, id: Date.now() }];
      setRewards(updatedRewards);
      await saveRewards(updatedRewards);
      setNewReward({ name: '', cost: 5 });
      setShowRewardModal(false);
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const currentPoints = userPoints[task.assignedTo] || 0;
    const newPoints = newCompleted
      ? currentPoints + task.points
      : Math.max(0, currentPoints - task.points);

    // Update task completion status
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    setTasks(updatedTasks);

    // Save tasks to API
    await saveTasks(updatedTasks);

    // Update and save user points
    await updateUserPoints(task.assignedTo, newPoints);
  };

  const redeemReward = async (reward, userName) => {
    // Check if user has enough points
    if (userPoints[userName] < reward.cost) {
      alert(`${userName} needs ${reward.cost - userPoints[userName]} more points!`);
      return;
    }

    // Find the user object
    const userObj = users.find(u => u.name === userName);

    // If user is a child, require PIN verification
    if (userObj && userObj.type === 'Child') {
      setPendingReward({ userName, reward });
      setShowPinModal(true);
    } else {
      // Parent user, no PIN needed
      const newPoints = userPoints[userName] - reward.cost;
      await updateUserPoints(userName, newPoints);
      triggerConfetti();
    }
  };

  const toggleDay = (day) => {
    setNewTask(prev => {
      let newRecurrence;

      if (day === 'Weekend') {
        // If toggling Weekend
        if (prev.recurrence.includes('Weekend')) {
          // Remove Weekend
          newRecurrence = prev.recurrence.filter(d => d !== 'Weekend');
        } else {
          // Add Weekend and remove Sat/Sun if present
          newRecurrence = [...prev.recurrence.filter(d => d !== 'Sat' && d !== 'Sun'), 'Weekend'];
        }
      } else if (day === 'Sat' || day === 'Sun') {
        // If toggling Sat or Sun, remove Weekend if present
        if (prev.recurrence.includes(day)) {
          newRecurrence = prev.recurrence.filter(d => d !== day);
        } else {
          newRecurrence = [...prev.recurrence.filter(d => d !== 'Weekend'), day];
        }
      } else {
        // Normal toggle for weekdays
        newRecurrence = prev.recurrence.includes(day)
          ? prev.recurrence.filter(d => d !== day)
          : [...prev.recurrence, day];
      }

      return { ...prev, recurrence: newRecurrence };
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const addUser = async () => {
    if (newUser.name.trim()) {
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setUserPoints(prev => ({ ...prev, [newUser.name]: newUser.points }));
      await saveUsers(updatedUsers);
      setNewUser({ name: '', type: 'Child', points: 0, pin: '' });
      setShowUserModal(false);
    }
  };

  const editUser = (index) => {
    setEditingUser(index);
    setNewUser(users[index]);
    setShowUserModal(true);
  };

  const saveEditedUser = async () => {
    if (newUser.name.trim() && editingUser !== null) {
      const oldUser = users[editingUser];
      const updatedUsers = [...users];
      updatedUsers[editingUser] = newUser;
      setUsers(updatedUsers);

      // Update userPoints if name changed
      if (oldUser.name !== newUser.name) {
        setUserPoints(prev => {
          const updated = { ...prev };
          delete updated[oldUser.name];
          updated[newUser.name] = newUser.points;
          return updated;
        });

        // Update tasks assigned to old username
        setTasks(tasks.map(task =>
          task.assignedTo === oldUser.name
            ? { ...task, assignedTo: newUser.name }
            : task
        ));
      } else {
        setUserPoints(prev => ({ ...prev, [newUser.name]: newUser.points }));
      }

      await saveUsers(updatedUsers);
      setNewUser({ name: '', type: 'Child', points: 0, pin: '' });
      setEditingUser(null);
      setShowUserModal(false);
    }
  };

  const deleteUser = async (index) => {
    const userToDelete = users[index];
    if (window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
      const updatedUsers = users.filter((_, i) => i !== index);
      setUsers(updatedUsers);

      // Remove from userPoints
      setUserPoints(prev => {
        const updated = { ...prev };
        delete updated[userToDelete.name];
        return updated;
      });

      // Remove tasks assigned to this user
      setTasks(tasks.filter(task => task.assignedTo !== userToDelete.name));

      await saveUsers(updatedUsers);
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setNewUser({ name: '', type: 'Child', points: 0, pin: '' });
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000); // Hide after 4 seconds
  };

  const validatePin = (enteredPin) => {
    // Check if any parent user has this PIN
    return users.some(user => user.type === 'Parent' && user.pin === enteredPin);
  };

  const handlePinSubmit = () => {
    if (validatePin(pinInput)) {
      // PIN is correct, process the reward redemption
      if (pendingReward) {
        const { userName, reward } = pendingReward;
        const user = users.find(u => u.name === userName);

        if (user && user.points >= reward.cost) {
          updateUserPoints(userName, user.points - reward.cost);
          triggerConfetti();
        }
      }

      // Close modal and reset
      setShowPinModal(false);
      setPinInput('');
      setPendingReward(null);
    } else {
      // PIN is incorrect
      alert('Incorrect PIN. Please ask a parent for help.');
      setPinInput('');
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinInput('');
    setPendingReward(null);
  };

  const editReward = (index) => {
    setEditingReward(index);
    setNewReward(rewards[index]);
    setShowRewardModal(true);
  };

  const saveEditedReward = async () => {
    if (newReward.name.trim() && editingReward !== null) {
      const updatedRewards = [...rewards];
      updatedRewards[editingReward] = newReward;
      setRewards(updatedRewards);
      await saveRewards(updatedRewards);
      setNewReward({ name: '', cost: 5 });
      setEditingReward(null);
      setShowRewardModal(false);
    }
  };

  const deleteReward = async (index) => {
    const rewardToDelete = rewards[index];
    if (window.confirm(`Are you sure you want to delete ${rewardToDelete.name}?`)) {
      const updatedRewards = rewards.filter((_, i) => i !== index);
      setRewards(updatedRewards);
      await saveRewards(updatedRewards);
    }
  };

  const closeRewardModal = () => {
    setShowRewardModal(false);
    setEditingReward(null);
    setNewReward({ name: '', cost: 5 });
  };

  const editTask = (index) => {
    setEditingTask(index);
    setNewTask(tasks[index]);
    setShowTaskModal(true);
  };

  const saveEditedTask = async () => {
    if (newTask.name.trim() && editingTask !== null) {
      const updatedTasks = [...tasks];
      updatedTasks[editingTask] = newTask;
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
      setNewTask({
        name: '',
        points: 1,
        assignedTo: users[0]?.name || '',
        recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        period: 'Morning'
      });
      setEditingTask(null);
      setShowTaskModal(false);
    }
  };

  const deleteTask = async (index) => {
    const taskToDelete = tasks[index];
    if (window.confirm(`Are you sure you want to delete "${taskToDelete.name}"?`)) {
      const updatedTasks = tasks.filter((_, i) => i !== index);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setNewTask({
      name: '',
      points: 1,
      assignedTo: users[0]?.name || '',
      recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      period: 'Morning'
    });
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
              <div className="flex gap-2">
                {isSignedIn ? (
                  <>
                    <button
                      onClick={loadCalendarEvents}
                      className="text-slate-400 hover:text-white transition text-sm"
                      disabled={calendarLoading}
                    >
                      {calendarLoading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                      onClick={handleSignoutClick}
                      className="text-slate-400 hover:text-white transition text-sm"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAuthClick}
                    className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Sign In with Google
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {!isSignedIn ? (
                <div className="text-center text-slate-400 py-8">
                  Sign in with Google to view your calendar events
                </div>
              ) : calendarLoading ? (
                <div className="text-center text-slate-400 py-8">
                  Loading calendar events...
                </div>
              ) : calendarError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-2">{calendarError}</div>
                  <button
                    onClick={loadCalendarEvents}
                    className="text-teal-400 hover:text-teal-300 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No upcoming events
                </div>
              ) : (
                calendarEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white/10 p-4 rounded-xl border-l-4"
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="font-semibold text-lg">{event.title}</div>
                    <div className="text-slate-300 text-sm mt-1">{event.time}</div>
                    <div className="text-slate-400 text-xs mt-1">{event.date}</div>
                  </div>
                ))
              )}
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
                      {task.assignedTo} • {task.points} pts • {task.period || task.time || 'Morning'} • {task.recurrence.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold">Points</h2>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-teal-600 hover:bg-teal-700 p-2 rounded-full transition"
              >
                <Users size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3 text-sm">
              <input
                type="checkbox"
                id="hideParents"
                checked={hideParents}
                onChange={(e) => setHideParents(e.target.checked)}
                className="w-4 h-4 accent-teal-600 cursor-pointer"
              />
              <label htmlFor="hideParents" className="text-slate-300 cursor-pointer">
                Hide parents
              </label>
            </div>
            <div className="space-y-3">
              {users.filter(user => !hideParents || user.type !== 'Parent').map(user => (
                <div key={user.name} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <span className="font-semibold text-lg">{user.name}</span>
                      <div className="text-xs text-slate-400">{user.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
                    <Award size={18} className="text-yellow-400" />
                    <span className="font-bold text-yellow-400 text-lg">{userPoints[user.name] || 0}</span>
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
                    {users.filter(user => !hideParents || user.type !== 'Parent').map(user => (
                      <button
                        key={user.name}
                        onClick={() => redeemReward(reward, user.name)}
                        disabled={userPoints[user.name] < reward.cost}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          userPoints[user.name] >= reward.cost
                            ? 'bg-teal-600 hover:bg-teal-700'
                            : 'bg-slate-600 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {user.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Management Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Manage Tasks</h3>
              <button onClick={closeTaskModal}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Existing Tasks List */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Current Tasks</h4>
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg">{task.name}</div>
                      <div className="text-sm text-slate-400">
                        {task.assignedTo} • {task.points} pts • {task.period || task.time || 'Morning'} • {task.recurrence.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTask(index)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(index)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add/Edit Task Form */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold mb-4">
                {editingTask !== null ? 'Edit Task' : 'Add New Task'}
              </h4>

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
                  {users.map(user => (
                    <button
                      key={user.name}
                      onClick={() => setNewTask({...newTask, assignedTo: user.name})}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        newTask.assignedTo === user.name
                          ? 'bg-teal-600'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {user.name}
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
                <label className="text-sm text-slate-400 mb-2 block">Time Period:</label>
                <div className="flex gap-2">
                  {['Morning', 'Evening', 'Night'].map(period => (
                    <button
                      key={period}
                      onClick={() => setNewTask({...newTask, period})}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        newTask.period === period
                          ? 'bg-teal-600'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={editingTask !== null ? saveEditedTask : addTask}
                className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition"
              >
                {editingTask !== null ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Management Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Manage Rewards</h3>
              <button onClick={closeRewardModal}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Existing Rewards List */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Current Rewards</h4>
              <div className="space-y-2">
                {rewards.map((reward, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg">{reward.name}</div>
                      <div className="text-sm text-yellow-400">{reward.cost} points</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editReward(index)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteReward(index)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add/Edit Reward Form */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold mb-4">
                {editingReward !== null ? 'Edit Reward' : 'Add New Reward'}
              </h4>

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
                onClick={editingReward !== null ? saveEditedReward : addReward}
                className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition"
              >
                {editingReward !== null ? 'Save Changes' : 'Add Reward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Manage Users</h3>
              <button onClick={closeUserModal}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Existing Users List */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Current Users</h4>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-lg">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.type} • {user.points} points</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editUser(index)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(index)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add/Edit User Form */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-lg font-semibold mb-4">
                {editingUser !== null ? 'Edit User' : 'Add New User'}
              </h4>

              <input
                type="text"
                placeholder="User name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full bg-white/10 p-3 rounded-lg mb-4 text-white placeholder-slate-400"
              />

              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Type:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewUser({...newUser, type: 'Child'})}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      newUser.type === 'Child'
                        ? 'bg-teal-600'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Child
                  </button>
                  <button
                    onClick={() => setNewUser({...newUser, type: 'Parent'})}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      newUser.type === 'Parent'
                        ? 'bg-teal-600'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Parent
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm text-slate-400 mb-2 block">Initial Points:</label>
                <input
                  type="number"
                  value={newUser.points}
                  onChange={(e) => setNewUser({...newUser, points: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/10 p-3 rounded-lg text-white"
                />
              </div>

              {newUser.type === 'Parent' && (
                <div className="mb-6">
                  <label className="text-sm text-slate-400 mb-2 block">4-Digit PIN:</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={newUser.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNewUser({...newUser, pin: value});
                    }}
                    className="w-full bg-white/10 p-3 rounded-lg text-white placeholder-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">Required for approving child reward redemptions</p>
                </div>
              )}

              <button
                onClick={editingUser !== null ? saveEditedUser : addUser}
                className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition"
              >
                {editingUser !== null ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Parent PIN Required</h3>
              <button onClick={closePinModal}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-slate-300 mb-6">
              {pendingReward && `To redeem "${pendingReward.reward.name}", please ask a parent to enter their PIN.`}
            </p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pinInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setPinInput(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinInput.length === 4) {
                  handlePinSubmit();
                }
              }}
              className="w-full bg-white/10 p-4 rounded-lg text-white text-center text-2xl tracking-widest placeholder-slate-400 mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={closePinModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinInput.length !== 4}
                className="flex-1 bg-teal-600 hover:bg-teal-700 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {[...Array(150)].map((_, i) => {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd', '#00d2d3', '#ff9ff3', '#54a0ff', '#48dbfb', '#1dd1a1'];
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 0.5;
            const animationDuration = 3 + Math.random() * 2;
            const size = 8 + Math.random() * 8;
            const rotation = Math.random() * 360;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: '-10%',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  animation: `confettiFall ${animationDuration}s linear ${animationDelay}s forwards`,
                  transform: `rotate(${rotation}deg)`,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  opacity: 0.9,
                }}
              />
            );
          })}
          <style>{`
            @keyframes confettiFall {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;
