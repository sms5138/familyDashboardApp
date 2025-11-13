import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

const USERS = ['John', 'Sarah', 'Mom', 'Dad'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 75, condition: 'Clear', icon: 'sunny' });
  const [location, setLocation] = useState('Loading...');
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openweather: '',
  });
  const [piServerAddress, setPiServerAddress] = useState('192.168.1.100');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  const [newTask, setNewTask] = useState({
    name: '',
    points: 1,
    assignedTo: USERS[0],
    recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    time: '9:00 AM',
  });
  const [newReward, setNewReward] = useState({ name: '', cost: 5 });

  const notificationListener = useRef();
  const responseListener = useRef();

  // Initialize app
  useEffect(() => {
    initializeApp();
    
    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather every 30 minutes
  useEffect(() => {
    if (apiKeys.openweather) {
      fetchWeather();
      const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(weatherTimer);
    }
  }, [apiKeys.openweather, location]);

  // Fetch calendar events every hour
  useEffect(() => {
    fetchCalendarEvents();
    const calendarTimer = setInterval(fetchCalendarEvents, 60 * 60 * 1000);
    return () => clearInterval(calendarTimer);
  }, []);

  // Schedule notifications for tasks
  useEffect(() => {
    if (tasks.length > 0) {
      scheduleTaskNotifications();
    }
  }, [tasks]);

  const initializeApp = async () => {
    try {
      // Request permissions
      await requestPermissions();
      
      // Load data
      await loadData();
      
      // Get location
      await getCurrentLocation();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required for weather updates');
      }

      // Calendar permission
      const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
      if (calendarStatus !== 'granted') {
        Alert.alert('Permission needed', 'Calendar permission is required to sync events');
      }

      // Notification permission
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        Alert.alert('Permission needed', 'Notification permission is required for task reminders');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (address[0]) {
        setLocation(`${address[0].city}, ${address[0].region}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation('Fort Worth, TX');
    }
  };

  const loadData = async () => {
    try {
      const keysData = await AsyncStorage.getItem('apiKeys');
      const currentUserData = await AsyncStorage.getItem('currentUser');
      const piAddressData = await AsyncStorage.getItem('piServerAddress');

      if (keysData) setApiKeys(JSON.parse(keysData));
      if (currentUserData) setCurrentUser(currentUserData);
      else setShowLoginModal(true);
      if (piAddressData) {
        setPiServerAddress(piAddressData);
        // Update storage service with saved address
        const storageService = require('./src/services/storageService').default;
        storageService.setServerAddress(piAddressData);
      }

      // Load data from storage service
      const storageService = require('./src/services/storageService').default;
      const tasksData = await storageService.getTasks();
      const rewardsData = await storageService.getRewards();
      const pointsData = await storageService.getUserPoints();

      if (tasksData && tasksData.length > 0) setTasks(tasksData);
      else setTasks([
        { id: 1, name: 'Make Bed', points: 1, assignedTo: 'John', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
      ]);

      if (rewardsData && rewardsData.length > 0) setRewards(rewardsData);
      else setRewards([{ id: 1, name: 'Ice Cream', cost: 5 }]);

      if (pointsData && Object.keys(pointsData).length > 0) setUserPoints(pointsData);
      else setUserPoints({ John: 3, Sarah: 7, Mom: 12, Dad: 15 });
    } catch (error) {
      console.error('Error loading data:', error);
      // Initialize with defaults on error
      setTasks([
        { id: 1, name: 'Make Bed', points: 1, assignedTo: 'John', completed: false, recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], time: '8:00 AM' },
      ]);
      setRewards([{ id: 1, name: 'Ice Cream', cost: 5 }]);
      setUserPoints({ John: 3, Sarah: 7, Mom: 12, Dad: 15 });
    }
  };

  const saveData = async () => {
    try {
      const storageService = require('./src/services/storageService').default;
      await storageService.saveAllData(tasks, rewards, userPoints);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveApiKeys = async () => {
    try {
      await AsyncStorage.setItem('apiKeys', JSON.stringify(apiKeys));
      await AsyncStorage.setItem('piServerAddress', piServerAddress);
      
      // Update storage service with new address
      const storageService = require('./src/services/storageService').default;
      storageService.setServerAddress(piServerAddress);
      
      setShowSettingsModal(false);
      if (apiKeys.openweather) fetchWeather();
      
      Alert.alert('Settings Saved', 'Your settings have been updated successfully');
    } catch (error) {
      console.error('Error saving API keys:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const testPiConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const storageService = require('./src/services/storageService').default;
      
      // Temporarily update address for testing
      const originalURL = storageService.baseURL;
      storageService.setServerAddress(piServerAddress);
      
      const isConnected = await storageService.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        Alert.alert(
          'Connection Successful! ✅',
          `Successfully connected to Raspberry Pi at ${piServerAddress}`,
          [{ text: 'OK' }]
        );
      } else {
        setConnectionStatus('error');
        storageService.baseURL = originalURL; // Restore original
        Alert.alert(
          'Connection Failed ❌',
          `Cannot connect to Raspberry Pi at ${piServerAddress}\n\nPlease check:\n• Pi is powered on\n• Storage server is running\n• IP address is correct\n• Both devices on same WiFi`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert(
        'Connection Error',
        `Failed to test connection: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const fetchWeather = async () => {
    if (!apiKeys.openweather) return;

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKeys.openweather}&units=imperial`
      );
      const data = await response.json();

      if (data.main && data.weather) {
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: getWeatherIcon(data.weather[0].main),
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') return;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) return;

      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const events = await Calendar.getEventsAsync(
        [calendars[0].id],
        startDate,
        endDate
      );

      const formattedEvents = events.slice(0, 10).map((event, index) => ({
        id: event.id || index,
        title: event.title || 'Untitled Event',
        time: formatEventTime(event.startDate, event.endDate),
        date: formatEventDate(event.startDate),
        color: getRandomColor(),
      }));

      setCalendarEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching calendar:', error);
      // Set sample data on error
      setCalendarEvents([
        { id: 1, title: 'Hockey Lesson', time: '4:15 - 5:15 PM', date: 'Wed Nov 12', color: '#10b981' },
      ]);
    }
  };

  const scheduleTaskNotifications = async () => {
    try {
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule notifications for each task
      for (const task of tasks) {
        if (task.completed) continue;

        const [hours, minutes] = parseTime(task.time);
        
        for (const day of task.recurrence) {
          const dayIndex = DAYS.indexOf(day);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Task Reminder 📋',
              body: `${task.assignedTo}, time to ${task.name}! (${task.points} points)`,
              data: { taskId: task.id },
            },
            trigger: {
              hour: hours,
              minute: minutes,
              weekday: dayIndex + 2, // Sunday = 1, Monday = 2, etc.
              repeats: true,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return [hours, minutes];
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: 'sunny',
      Clouds: 'cloudy',
      Rain: 'rainy',
      Snow: 'snow',
      Thunderstorm: 'thunderstorm',
    };
    return icons[condition] || 'sunny';
  };

  const formatEventTime = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  };

  const formatEventDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getRandomColor = () => {
    const colors = ['#10b981', '#14b8a6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const login = async (user) => {
    await AsyncStorage.setItem('currentUser', user);
    setCurrentUser(user);
    setShowLoginModal(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const addTask = () => {
    if (newTask.name.trim()) {
      const updatedTasks = [...tasks, { ...newTask, id: Date.now(), completed: false }];
      setTasks(updatedTasks);
      setNewTask({
        name: '',
        points: 1,
        assignedTo: USERS[0],
        recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time: '9:00 AM',
      });
      setShowTaskModal(false);
    }
  };

  const addReward = () => {
    if (newReward.name.trim()) {
      const updatedRewards = [...rewards, { ...newReward, id: Date.now() }];
      setRewards(updatedRewards);
      setNewReward({ name: '', cost: 5 });
      setShowRewardModal(false);
    }
  };

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const newCompleted = !task.completed;
        if (newCompleted) {
          setUserPoints((prev) => ({
            ...prev,
            [task.assignedTo]: (prev[task.assignedTo] || 0) + task.points,
          }));
        } else {
          setUserPoints((prev) => ({
            ...prev,
            [task.assignedTo]: Math.max(0, (prev[task.assignedTo] || 0) - task.points),
          }));
        }
        return { ...task, completed: newCompleted };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  const redeemReward = (reward, user) => {
    if (userPoints[user] >= reward.cost) {
      setUserPoints((prev) => ({
        ...prev,
        [user]: prev[user] - reward.cost,
      }));
      Alert.alert('Success! 🎉', `${user} redeemed ${reward.name}!`);
    } else {
      Alert.alert('Not enough points', `${user} needs ${reward.cost - userPoints[user]} more points!`);
    }
  };

  const toggleDay = (day) => {
    setNewTask((prev) => ({
      ...prev,
      recurrence: prev.recurrence.includes(day)
        ? prev.recurrence.filter((d) => d !== day)
        : [...prev.recurrence, day],
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [tasks, rewards, userPoints]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{currentUser?.[0] || 'F'}</Text>
          </View>
          <Text style={styles.userName}>{currentUser || 'Family'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSettingsModal(true)} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLoginModal(true)} style={styles.headerButton}>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Time and Weather Section */}
        <View style={styles.timeWeatherSection}>
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View style={styles.weatherInfo}>
            <Ionicons name={weather.icon} size={40} color="#fbbf24" />
            <Text style={styles.tempText}>{weather.temp}°F</Text>
            <Text style={styles.weatherDesc}>{weather.condition}</Text>
          </View>
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {/* Calendar Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar-outline" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Calendar</Text>
            </View>
            <TouchableOpacity onPress={fetchCalendarEvents} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {calendarEvents.map((event) => (
            <View key={event.id} style={[styles.eventCard, { borderLeftColor: event.color }]}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventTime}>{event.time}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
            </View>
          ))}
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity onPress={() => setShowTaskModal(true)} style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => toggleTask(task.id)}
            >
              <Ionicons
                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={task.completed ? '#10b981' : '#9ca3af'}
              />
              <View style={styles.taskInfo}>
                <Text style={[styles.taskName, task.completed && styles.taskCompleted]}>
                  {task.name}
                </Text>
                <Text style={styles.taskMeta}>
                  {task.assignedTo} • {task.points} pts • {task.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Points Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="trophy-outline" size={24} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Points</Text>
            </View>
          </View>
          {USERS.map((user) => (
            <View key={user} style={styles.pointsCard}>
              <View style={styles.pointsUser}>
                <View style={styles.pointsAvatar}>
                  <Text style={styles.pointsAvatarText}>{user[0]}</Text>
                </View>
                <Text style={styles.userName}>{user}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Ionicons name="trophy" size={16} color="#fbbf24" />
                <Text style={styles.pointsText}>{userPoints[user] || 0}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rewards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <TouchableOpacity onPress={() => setShowRewardModal(true)} style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {rewards.map((reward) => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardCost}>{reward.cost} points</Text>
              </View>
              <View style={styles.redeemButtons}>
                {USERS.map((user) => (
                  <TouchableOpacity
                    key={user}
                    style={[
                      styles.redeemBtn,
                      userPoints[user] < reward.cost && styles.redeemBtnDisabled,
                    ]}
                    onPress={() => redeemReward(reward, user)}
                    disabled={userPoints[user] < reward.cost}
                  >
                    <Text style={styles.redeemBtnText}>{user}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Login Modal */}
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Who are you?</Text>
            <View style={styles.loginButtons}>
              {USERS.map((user) => (
                <TouchableOpacity
                  key={user}
                  style={styles.loginButton}
                  onPress={() => login(user)}
                >
                  <View style={styles.loginAvatar}>
                    <Text style={styles.loginAvatarText}>{user[0]}</Text>
                  </View>
                  <Text style={styles.loginButtonText}>{user}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Settings</Text>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsSectionTitle}>Server Configuration</Text>
              
              <Text style={styles.label}>Raspberry Pi IP Address</Text>
              <View style={styles.ipAddressContainer}>
                <TextInput
                  style={[styles.input, styles.ipInput]}
                  placeholder="192.168.1.100"
                  placeholderTextColor="#64748b"
                  value={piServerAddress}
                  onChangeText={(text) => {
                    setPiServerAddress(text);
                    setConnectionStatus(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity 
                  style={[
                    styles.testButton,
                    testingConnection && styles.testButtonDisabled
                  ]}
                  onPress={testPiConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Ionicons name="hourglass-outline" size={20} color="#fff" />
                  ) : connectionStatus === 'success' ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  ) : connectionStatus === 'error' ? (
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  ) : (
                    <Ionicons name="wifi-outline" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Enter your Raspberry Pi's local IP address. Find it by running 'hostname -I' on your Pi.
              </Text>
              <TouchableOpacity 
                style={styles.testConnectionButton}
                onPress={testPiConnection}
                disabled={testingConnection}
              >
                <Ionicons 
                  name={testingConnection ? "sync-outline" : "pulse-outline"} 
                  size={18} 
                  color="#6366f1" 
                />
                <Text style={styles.testConnectionText}>
                  {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.settingsSectionTitle}>API Keys</Text>

              <Text style={styles.label}>OpenWeather API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter API key"
                placeholderTextColor="#64748b"
                value={apiKeys.openweather}
                onChangeText={(text) => setApiKeys({ ...apiKeys, openweather: text })}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open('https://openweathermap.org/api', '_blank');
                  } else {
                    Alert.alert('API Key', 'Visit https://openweathermap.org/api to get your free API key');
                  }
                }}
              >
                <Text style={styles.linkText}>Get free API key →</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={saveApiKeys}>
                <Text style={styles.submitButtonText}>Save Settings</Text>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <Text style={styles.settingsSectionTitle}>Account</Text>

              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" />
                <Text style={styles.logoutButtonText}>Switch User</Text>
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <Text style={styles.settingsSectionTitle}>About</Text>
              <Text style={styles.aboutText}>Family Dashboard v1.0.0</Text>
              <Text style={styles.aboutText}>Current User: {currentUser || 'None'}</Text>
              <Text style={styles.aboutText}>Storage: Raspberry Pi (Local)</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Task</Text>
                <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Task name"
                placeholderTextColor="#64748b"
                value={newTask.name}
                onChangeText={(text) => setNewTask({ ...newTask, name: text })}
              />

              <Text style={styles.label}>Points</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(newTask.points)}
                onChangeText={(text) => setNewTask({ ...newTask, points: parseInt(text) || 0 })}
              />

              <Text style={styles.label}>Assign to</Text>
              <View style={styles.userButtons}>
                {USERS.map((user) => (
                  <TouchableOpacity
                    key={user}
                    style={[
                      styles.userBtn,
                      newTask.assignedTo === user && styles.userBtnActive,
                    ]}
                    onPress={() => setNewTask({ ...newTask, assignedTo: user })}
                  >
                    <Text
                      style={[
                        styles.userBtnText,
                        newTask.assignedTo === user && styles.userBtnTextActive,
                      ]}
                    >
                      {user}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Repeat on</Text>
              <View style={styles.dayButtons}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayBtn,
                      newTask.recurrence.includes(day) && styles.dayBtnActive,
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        newTask.recurrence.includes(day) && styles.dayBtnTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                placeholder="9:00 AM"
                placeholderTextColor="#64748b"
                value={newTask.time}
                onChangeText={(text) => setNewTask({ ...newTask, time: text })}
              />

              <TouchableOpacity style={styles.submitButton} onPress={addTask}>
                <Text style={styles.submitButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Reward Modal */}
      <Modal visible={showRewardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Reward</Text>
              <TouchableOpacity onPress={() => setShowRewardModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Reward name"
              placeholderTextColor="#64748b"
              value={newReward.name}
              onChangeText={(text) => setNewReward({ ...newReward, name: text })}
            />

            <Text style={styles.label}>Cost (points)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(newReward.cost)}
              onChangeText={(text) => setNewReward({ ...newReward, cost: parseInt(text) || 0 })}
            />

            <TouchableOpacity style={styles.submitButton} onPress={addReward}>
              <Text style={styles.submitButtonText}>Add Reward</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  timeWeatherSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  weatherDesc: {
    fontSize: 18,
    color: '#94a3b8',
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    color: '#64748b',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  pointsUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  rewardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  rewardInfo: {
    marginBottom: 10,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  rewardCost: {
    fontSize: 14,
    color: '#fbbf24',
  },
  redeemButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  redeemBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemBtnDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  userButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  userBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  userBtnActive: {
    backgroundColor: '#6366f1',
  },
  userBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  userBtnTextActive: {
    color: '#fff',
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayBtnActive: {
    backgroundColor: '#10b981',
  },
  dayBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  dayBtnTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  linkText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    marginBottom: 12,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  ipAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ipInput: {
    flex: 1,
    marginBottom: 0,
  },
  testButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginBottom: 12,
  },
  testConnectionText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButtons: {
    gap: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  loginAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});