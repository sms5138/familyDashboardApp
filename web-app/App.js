import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, Calendar, Sun, Award, CheckCircle, Circle, Users, Settings, Power, Cloud, Droplets, Zap, CloudSnow } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import './global.css';

// API URL for backend communication
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Default values - will be overridden by apiDetails.json
let GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'NotFound';
let GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'NotFound.apps.googleusercontent.com';
let CALENDAR_IDS = (process.env.REACT_APP_CALENDAR_IDS || 'primary,amandap.sawyer@gmail.com').split(',');
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Weekend'];

const FamilyDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([
  ]);
  const [rewards, setRewards] = useState([
  ]);
  const [userPoints, setUserPoints] = useState({});
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pendingReward, setPendingReward] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPinVerifyModal, setShowPinVerifyModal] = useState(false);
  const [pinVerifyInput, setPinVerifyInput] = useState('');
  const [pendingUserEdit, setPendingUserEdit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [hideParents, setHideParents] = useState(true);
  const [selectedPeriods, setSelectedPeriods] = useState(['Morning', 'Afternoon', 'Evening']);
  const [newUser, setNewUser] = useState({ name: '', type: 'Child', points: 0, pin: '' });

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [accentColor, setAccentColor] = useState('teal');
  const [colorCycleEnabled, setColorCycleEnabled] = useState(false);
  const [colorCycleIntervalMinutes, setColorCycleIntervalMinutes] = useState(60);
  const [screensaverEnabled, setScreensaverEnabled] = useState(false);
  const [screensaverTimeout, setScreensaverTimeout] = useState(5);
  const [screensaverDuration, setScreensaverDuration] = useState(10);
  const [screensaverActive, setScreensaverActive] = useState(false);
  const [screensaverImages, setScreensaverImages] = useState([]);
  const [showScreensaverPreview, setShowScreensaverPreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [showHockeyAnimation, setShowHockeyAnimation] = useState(false);
  const [clockCorner, setClockCorner] = useState('bottom-left');
  const [newTask, setNewTask] = useState({
    name: '',
    points: 1,
    assignedTo: users[0]?.name || '',
    recurrence: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    period: 'Morning'
  });
  const [newReward, setNewReward] = useState({ name: '', cost: 5 });

  // API configuration state
  const [googleApiKey, setGoogleApiKey] = useState(GOOGLE_API_KEY);
  const [googleClientId, setGoogleClientId] = useState(GOOGLE_CLIENT_ID);
  const [calendarIds, setCalendarIds] = useState(CALENDAR_IDS);

  // Weather configuration state
  const [weatherLocation, setWeatherLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    location: 'New York, NY'
  });
  const [temperatureUnit, setTemperatureUnit] = useState('fahrenheit');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  // Experience/UX settings state
  const [experienceSettings, setExperienceSettings] = useState({
    modules: {
      calendar: { displayLimit: 5 },
      tasks: { displayLimit: 5 },
      rewards: { displayLimit: 4 },
      users: { displayLimit: 5 }
    }
  });

  // Weather state
  const [weather, setWeather] = useState({
    temperature: null,
    condition: 'Loading...',
    location: null,
    error: null,
    weatherCode: null,
    tempHigh: null,
    tempLow: null
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load API configuration and all settings
  useEffect(() => {
    const loadInitialConfig = async () => {
      await loadApiDetails();
      await loadExperienceSettings();
    };
    loadInitialConfig();
  }, []);

  // Load users, tasks, rewards, and settings from API
  useEffect(() => {
    loadUsers();
    loadTasks();
    loadRewards();
    loadPhotos();
    loadThemeSettings();
    loadScreensaverSettings();
  }, []);

  // Auto theme mode based on time of day
  useEffect(() => {
    if (themeMode === 'auto') {
      const checkTime = () => {
        const hour = new Date().getHours();
        // Light mode between 6 AM and 6 PM
        const shouldBeLightMode = hour >= 6 && hour < 18;
        setThemeMode(shouldBeLightMode ? 'light' : 'dark');
      };

      checkTime();
      const interval = setInterval(checkTime, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [themeMode]);

  // Color Cycle - change color based on interval
  useEffect(() => {
    if (colorCycleEnabled) {
      const colors = Object.keys(accentColors);
      const usedColorsToday = JSON.parse(localStorage.getItem('usedColorsToday') || '[]');
      const lastColorChange = parseInt(localStorage.getItem('lastColorChange') || '0');

      const checkColorChange = () => {
        const now = Date.now();
        const intervalMs = colorCycleIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds

        // Check if we need to reset daily used colors
        const lastResetDate = localStorage.getItem('colorResetDate');
        const today = new Date().toDateString();
        if (lastResetDate !== today) {
          localStorage.setItem('usedColorsToday', JSON.stringify([]));
          localStorage.setItem('colorResetDate', today);
        }

        // Change color if the interval has passed
        if (now - lastColorChange >= intervalMs) {
          const currentUsedColors = JSON.parse(localStorage.getItem('usedColorsToday') || '[]');
          const availableColors = colors.filter(c => !currentUsedColors.includes(c));

          // If all colors used, reset
          const nextColors = availableColors.length > 0 ? availableColors : colors;
          const nextColor = nextColors[Math.floor(Math.random() * nextColors.length)];

          setAccentColor(nextColor);
          localStorage.setItem('accentColor', nextColor);
          localStorage.setItem('lastColorChange', now.toString());

          const updatedUsedColors = [...currentUsedColors, nextColor];
          localStorage.setItem('usedColorsToday', JSON.stringify(updatedUsedColors));

          // Save to API
          saveThemeSettings({
            themeMode,
            accentColor: nextColor,
            colorCycleEnabled: true,
            colorCycleIntervalMinutes,
            lastColorChangeDate: now.toString(),
            lastColorChangeHour: new Date().getHours()
          });
        }
      };

      checkColorChange();
      const interval = setInterval(checkColorChange, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [colorCycleEnabled, colorCycleIntervalMinutes]);

  // Screensaver functionality
  useEffect(() => {
    if (!screensaverEnabled) return;

    const checkInactivity = () => {
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;
      const timeoutMs = screensaverTimeout * 60 * 1000;

      if (inactiveTime >= timeoutMs && !screensaverActive) {
        setScreensaverActive(true);
      }
    };

    const resetActivity = () => {
      setLastActivityTime(Date.now());
      if (screensaverActive) {
        setScreensaverActive(false);
      }
    };

    // Check for inactivity every 10 seconds
    const interval = setInterval(checkInactivity, 10000);

    // Listen for user activity
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('click', resetActivity);
    window.addEventListener('touchstart', resetActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
    };
  }, [screensaverEnabled, screensaverTimeout, lastActivityTime, screensaverActive]);

  // Load weather data on location or temperature unit change and refresh every 10 minutes
  useEffect(() => {
    console.log('Weather useEffect triggered with:', { weatherLocation, temperatureUnit });
    // Only load if we have valid coordinates
    if (weatherLocation.latitude && weatherLocation.longitude) {
      console.log('Valid location detected, loading weather...');
      loadWeather();
      const interval = setInterval(() => {
        console.log('Refreshing weather (10 min interval)');
        loadWeather();
      }, 10 * 60 * 1000); // Refresh every 10 minutes
      return () => clearInterval(interval);
    } else {
      console.warn('Invalid or missing location coordinates:', weatherLocation);
    }
  }, [weatherLocation, temperatureUnit]);

  // Screensaver image rotation
  useEffect(() => {
    if ((screensaverActive || showScreensaverPreview) && screensaverImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % screensaverImages.length);
      }, screensaverDuration * 1000);

      return () => clearInterval(interval);
    }
  }, [screensaverActive, showScreensaverPreview, screensaverImages, screensaverDuration]);

  // Rotate clock position on image change
  useEffect(() => {
    if (screensaverActive || showScreensaverPreview) {
      const corners = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
      setClockCorner(corners[currentImageIndex % corners.length]);
    }
  }, [currentImageIndex, screensaverActive, showScreensaverPreview]);

  // Google OAuth login configuration
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('Token Response:', tokenResponse);
      console.log('Access Token:', tokenResponse.access_token);
      console.log('Token Type:', tokenResponse.token_type);
      console.log('Expires In:', tokenResponse.expires_in);
      setAccessToken(tokenResponse.access_token);
      setIsSignedIn(true);
      localStorage.setItem('google_access_token', tokenResponse.access_token);
      console.log('Token stored in localStorage');
    },
    onError: (error) => {
      console.error('=== LOGIN FAILED ===');
      console.error('Error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));
      setCalendarError('Failed to sign in to Google Calendar');
    },
    scope: SCOPES,
    flow: 'implicit',
    onNonOAuthError: (error) => {
      console.error('=== NON-OAUTH ERROR ===');
      console.error('Error:', error);
    }
  });

  // Load API configuration from server
  const loadApiDetails = async () => {
    try {
      console.log('Loading API details from:', `${API_URL}/api/api-details`);
      const response = await fetch(`${API_URL}/api/api-details`);
      const result = await response.json();
      console.log('API Details response:', result);

      if (result.success && result.data) {
        if (result.data.googleCalendar) {
          const config = result.data.googleCalendar;
          setGoogleApiKey(config.apiKey);
          setGoogleClientId(config.clientId);
          setCalendarIds(config.calendarIds.split(',').map(id => id.trim()));
          // Update module-level variables
          GOOGLE_API_KEY = config.apiKey;
          GOOGLE_CLIENT_ID = config.clientId;
          CALENDAR_IDS = config.calendarIds.split(',').map(id => id.trim());
        }
        if (result.data.weather) {
          console.log('Setting weather location from API:', result.data.weather);
          setWeatherLocation(result.data.weather);
          if (result.data.weather.temperatureUnit) {
            console.log('Setting temperature unit:', result.data.weather.temperatureUnit);
            setTemperatureUnit(result.data.weather.temperatureUnit);
          }
        }
      }
    } catch (error) {
      console.error('Error loading API details:', error);
      // Falls back to environment variables or defaults
    }
  };

  // Load experience/UX settings
  const loadExperienceSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/experience`);
      const result = await response.json();
      if (result.success && result.data) {
        setExperienceSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading experience settings:', error);
      // Falls back to default values
    }
  };

  // Save experience/UX settings
  const saveExperienceSettings = async (settings) => {
    try {
      await fetch(`${API_URL}/api/experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Error saving experience settings:', error);
    }
  };

  // Search for locations by postal code using Nominatim API
  const searchByPostalCode = async (query) => {
    if (!query || query.length < 3) {
      setCitySuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const results = await response.json();
      setCitySuggestions(results);
      setShowCitySuggestions(true);
    } catch (error) {
      console.error('Error searching by postal code:', error);
      setCitySuggestions([]);
    }
  };

  // Convert WMO weather code to description
  const getWeatherDescription = (code) => {
    if (code === null) return 'Unknown';

    // Clear sky
    if (code === 0) return 'Clear sky';

    // Mainly clear, partly cloudy, overcast
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';

    // Fog and depositing rime fog
    if (code === 45) return 'Fog';
    if (code === 48) return 'Depositing rime fog';

    // Drizzle
    if (code === 51) return 'Light drizzle';
    if (code === 53) return 'Moderate drizzle';
    if (code === 55) return 'Dense drizzle';

    // Freezing Drizzle
    if (code === 56) return 'Light freezing drizzle';
    if (code === 57) return 'Dense freezing drizzle';

    // Rain
    if (code === 61) return 'Slight rain';
    if (code === 63) return 'Moderate rain';
    if (code === 65) return 'Heavy rain';

    // Freezing Rain
    if (code === 66) return 'Light freezing rain';
    if (code === 67) return 'Heavy freezing rain';

    // Snow
    if (code === 71) return 'Slight snow';
    if (code === 73) return 'Moderate snow';
    if (code === 75) return 'Heavy snow';
    if (code === 77) return 'Snow grains';

    // Rain and snow / mixed
    if (code === 80) return 'Slight rain showers';
    if (code === 81) return 'Moderate rain showers';
    if (code === 82) return 'Violent rain showers';
    if (code === 85) return 'Slight snow showers';
    if (code === 86) return 'Heavy snow showers';

    // Thunderstorm
    if (code === 80) return 'Thunderstorm with slight hail';
    if (code === 81) return 'Thunderstorm with moderate hail';
    if (code === 82) return 'Thunderstorm with heavy hail';

    return 'Clear';
  };

  // Get weather icon based on WMO weather code
  // WMO Weather interpretation codes: https://www.open-meteo.com/en/docs
  const getWeatherIcon = (code) => {
    if (code === null) return <Sun size={40} className="text-yellow-400" />;

    // Clear sky
    if (code === 0) return <Sun size={40} className="text-yellow-400" />;

    // Mainly clear, partly cloudy, overcast
    if ([1, 2, 3].includes(code)) {
      return (
        <div className="relative">
          <Sun size={40} className="text-yellow-400" />
          <Cloud size={24} className="text-slate-400 absolute top-2 left-6" />
        </div>
      );
    }

    // Fog and depositing rime fog
    if ([45, 48].includes(code)) {
      return <Cloud size={40} className="text-slate-400" />;
    }

    // Drizzle
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return (
        <div className="relative">
          <Cloud size={40} className="text-slate-400" />
          <Droplets size={20} className="text-blue-400 absolute -bottom-2 left-4" />
        </div>
      );
    }

    // Rain
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return (
        <div className="relative">
          <Cloud size={40} className="text-slate-500" />
          <Droplets size={24} className="text-blue-500 absolute -bottom-1 left-3" />
        </div>
      );
    }

    // Thunderstorm
    if ([80, 81, 82, 85, 86].includes(code)) {
      return (
        <div className="relative">
          <Cloud size={40} className="text-slate-600" />
          <Zap size={20} className="text-yellow-300 absolute top-2 left-8" />
        </div>
      );
    }

    // Snow
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return (
        <div className="relative">
          <Cloud size={40} className="text-slate-300" />
          <CloudSnow size={20} className="text-blue-300 absolute -bottom-1 left-4" />
        </div>
      );
    }

    // Default to sun
    return <Sun size={40} className="text-yellow-400" />;
  };

  // Select a location from suggestions
  const selectLocation = (location) => {
    // Extract city and state/region from display_name
    // Format is usually: "City, County, State, Country" or similar
    const parts = location.display_name.split(',').map(p => p.trim());

    let city = '';
    let region = '';

    // Skip postal codes (typically numeric or alphanumeric at start)
    // Find city (first non-postal-code part that has letters)
    for (let i = 0; i < parts.length; i++) {
      if (!/^\d+$/.test(parts[i]) && parts[i].length > 2) {
        city = parts[i];
        break;
      }
    }

    // Find state/region (2-3 letter code, or second-to-last part if it's a name)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      // Match US state abbreviations (2 letters) or full state names
      if (/^[A-Z]{2}$/.test(part) || (part.length > 3 && part.match(/^[A-Z][a-z]+$/) && part !== city)) {
        region = part;
        break;
      }
    }

    const displayName = region && city ? `${city}, ${region}` : city || parts[0];
    setWeatherLocation({
      location: displayName,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon)
    });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  // Fetch weather data from Open-Meteo API (free, no API key required)
  const loadWeather = async () => {
    try {
      const { latitude, longitude } = weatherLocation;
      console.log('loadWeather called with:', { latitude, longitude, temperatureUnit });

      if (!latitude || !longitude || latitude === undefined || longitude === undefined) {
        console.warn('Weather location not set, skipping weather load', { latitude, longitude });
        return;
      }

      // Ensure coordinates are numbers
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates:', { latitude, longitude, lat, lon });
        return;
      }

      const unit = temperatureUnit === 'celsius' ? 'celsius' : 'fahrenheit';
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=${unit}`;
      console.log('Fetching weather from:', url);

      const response = await fetch(url);
      console.log('Weather API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Weather API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Weather API response:', result);

      if (result.current && result.daily) {
        setWeather({
          temperature: Math.round(result.current.temperature_2m),
          condition: getWeatherDescription(result.current.weather_code),
          location: weatherLocation.location,
          error: null,
          weatherCode: result.current.weather_code,
          tempHigh: Math.round(result.daily.temperature_2m_max[0]),
          tempLow: Math.round(result.daily.temperature_2m_min[0])
        });
        console.log('Weather updated successfully');
      } else {
        console.warn('No current weather data in response');
      }
    } catch (error) {
      console.error('Error loading weather:', error);
      setWeather(prev => ({
        ...prev,
        error: 'Unable to load weather',
        condition: 'N/A'
      }));
    }
  };

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
        const loadedTasks = result.data;

        // Check if we need to reset tasks for a new day
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('lastTaskReset');

        if (lastReset !== today) {
          // Reset all tasks to incomplete for the new day
          const resetTasks = loadedTasks.map(task => ({
            ...task,
            completed: false
          }));

          // Save the reset tasks
          await saveTasks(resetTasks);
          setTasks(resetTasks);

          // Update last reset date
          localStorage.setItem('lastTaskReset', today);
        } else {
          setTasks(loadedTasks);
        }
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

  const loadPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/photos`);
      const result = await response.json();
      if (result.success && result.data) {
        const photoUrls = result.data.map(photo => `${API_URL}${photo}`);
        setScreensaverImages(photoUrls);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handlePhotoUpload = async (files) => {
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const response = await fetch(`${API_URL}/api/photos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: `${Date.now()}-${file.name}`,
              data: e.target.result
            })
          });

          const result = await response.json();
          if (result.success) {
            // Reload photos
            await loadPhotos();
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const deletePhoto = async (photoUrl) => {
    try {
      const filename = photoUrl.split('/').pop();
      const response = await fetch(`${API_URL}/api/photos/${filename}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        await loadPhotos();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Theme settings functions
  const loadThemeSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/theme`);
      const result = await response.json();
      if (result.success && result.data) {
        setThemeMode(result.data.themeMode || 'dark');
        setAccentColor(result.data.accentColor || 'teal');
        setColorCycleEnabled(result.data.colorCycleEnabled || false);
        setColorCycleIntervalMinutes(result.data.colorCycleIntervalMinutes || 60);
        // Store in state for color cycling logic
        if (result.data.lastColorChangeDate) {
          localStorage.setItem('lastColorChangeDate', result.data.lastColorChangeDate);
        }
        if (result.data.lastColorChangeHour !== null) {
          localStorage.setItem('lastColorChangeHour', result.data.lastColorChangeHour.toString());
        }
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  const saveThemeSettings = async (settings) => {
    try {
      await fetch(`${API_URL}/api/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  // Screensaver settings functions
  const loadScreensaverSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/screensaver`);
      const result = await response.json();
      if (result.success && result.data) {
        setScreensaverEnabled(result.data.enabled || false);
        setScreensaverTimeout(result.data.delayMinutes || 5);
        setScreensaverDuration(result.data.imageIntervalMinutes || 10);
      }
    } catch (error) {
      console.error('Error loading screensaver settings:', error);
    }
  };

  const saveScreensaverSettings = async (settings) => {
    try {
      await fetch(`${API_URL}/api/screensaver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Error saving screensaver settings:', error);
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

  // Check for stored access token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      setAccessToken(storedToken);
      setIsSignedIn(true);
    } else {
      setCalendarLoading(false);
    }
  }, []);

  // Load calendar events when access token, API config, or experience settings change
  useEffect(() => {
    if (accessToken) {
      loadCalendarEvents();
    } else {
      setCalendarLoading(false);
      setCalendarError(null);
      setCalendarEvents([]);
    }
  }, [accessToken, calendarIds, googleApiKey, experienceSettings]);

  const handleSignoutClick = () => {
    setAccessToken(null);
    setIsSignedIn(false);
    localStorage.removeItem('google_access_token');
    setCalendarEvents([]);
  };

  const loadCalendarEvents = async () => {
    try {
      console.log('=== LOADING CALENDAR EVENTS ===');
      console.log('Access Token:', accessToken ? '✓ Present' : '✗ Missing');
      console.log('Calendar IDs:', calendarIds);

      setCalendarLoading(true);
      setCalendarError(null);

      // Get events for the next 7 days
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      console.log('Date range:', now.toISOString(), 'to', endDate.toISOString());

      let allEvents = [];
      const calendarColors = experienceSettings.modules.calendar.calendarColors || {}; // Get colors from experience settings

      // Fetch events from each calendar ID using REST API
      for (const calendarId of calendarIds) {
        try {
          console.log(`Fetching events for calendar: ${calendarId}`);

          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId.trim())}/events?` +
            `timeMin=${encodeURIComponent(now.toISOString())}&` +
            `timeMax=${encodeURIComponent(endDate.toISOString())}&` +
            `showDeleted=false&singleEvents=true&orderBy=startTime&key=${googleApiKey}`;

          console.log('Calendar API URL:', url.substring(0, 100) + '...');

          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Calendar API Error:`, errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const events = data.items || [];
          console.log(`Found ${events.length} events for ${calendarId}`);

          allEvents = allEvents.concat(events.map(event => ({
            ...event,
            calendarId: calendarId.trim(),
            calendarColor: calendarColors[calendarId.trim()] || '#14b8a6' // Use color from experience settings or default to teal
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

          // Assign colors from experience settings
          const color = event.calendarColor || '#14b8a6'; // Default teal if no color found

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

  // Helper function to get current day abbreviation
  const getCurrentDay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  };

  // Helper function to check if a task should be shown today
  const isTaskForToday = (task) => {
    const today = getCurrentDay();

    // Check if task has Weekend and today is Sat or Sun
    if (task.recurrence.includes('Weekend') && (today === 'Sat' || today === 'Sun')) {
      return true;
    }

    // Check if today is in the recurrence array
    return task.recurrence.includes(today);
  };

  // Compute filtered tasks based on current filters
  const filteredTasks = tasks
    .filter(isTaskForToday)
    .filter(task => selectedPeriods.includes(task.period || task.time || 'Morning'));

  // Compute displayed users based on hideParents filter
  const displayedUsers = users.filter(user => !hideParents || user.type !== 'Parent');

  // Helper function to toggle period filter
  const togglePeriod = (period) => {
    setSelectedPeriods(prev => {
      if (prev.includes(period)) {
        // Remove period if already selected
        return prev.filter(p => p !== period);
      } else {
        // Add period if not selected
        return [...prev, period];
      }
    });
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

    // Trigger hockey celebration when task is completed
    if (newCompleted) {
      setShowHockeyAnimation(true);
      setTimeout(() => setShowHockeyAnimation(false), 4500);
    }
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
    const userToEdit = users[index];

    // If user is a parent with a PIN, require verification
    if (userToEdit.type === 'Parent' && userToEdit.pin) {
      setPendingUserEdit(index);
      setShowPinVerifyModal(true);
    } else {
      // No PIN protection needed for children or parents without PIN
      setEditingUser(index);
      setNewUser(userToEdit);
      setShowUserModal(true);
    }
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

  const handlePinVerification = () => {
    if (pendingUserEdit !== null) {
      const userToEdit = users[pendingUserEdit];

      // Verify the entered PIN matches the user's PIN
      if (pinVerifyInput === userToEdit.pin) {
        // PIN is correct, allow editing
        setEditingUser(pendingUserEdit);
        setNewUser(userToEdit);
        setShowUserModal(true);

        // Close verification modal and reset
        setShowPinVerifyModal(false);
        setPinVerifyInput('');
        setPendingUserEdit(null);
      } else {
        // PIN is incorrect
        alert('Incorrect PIN. Cannot edit this user.');
        setPinVerifyInput('');
      }
    }
  };

  const closePinVerifyModal = () => {
    setShowPinVerifyModal(false);
    setPinVerifyInput('');
    setPendingUserEdit(null);
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

  // Accent color classes mapping
  const accentColors = {
    teal: { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', text: 'text-teal-400', gradient: 'from-teal-400 to-cyan-400' },
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-400', gradient: 'from-blue-400 to-cyan-400' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-purple-400', gradient: 'from-purple-400 to-pink-400' },
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-green-400', gradient: 'from-green-400 to-emerald-400' },
    orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-orange-400', gradient: 'from-orange-400 to-yellow-400' },
    pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', text: 'text-pink-400', gradient: 'from-pink-400 to-rose-400' },
    red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', text: 'text-red-400', gradient: 'from-red-400 to-orange-400' },
  };

  const currentAccent = accentColors[accentColor] || accentColors.teal;

  // If settings page is open, show settings page
  if (showSettings) {
    return (
      <div className={`min-h-screen w-full ${themeMode === 'light' ? 'bg-gradient-to-br from-slate-100 via-gray-100 to-slate-100 text-gray-900' : 'bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white'} p-4 md:p-6 overflow-x-hidden`}>
        <div className="max-w-4xl mx-auto">
          {/* Settings Header */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className={currentAccent.text} size={32} />
                <h1 className="text-3xl font-bold">Settings</h1>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className={`${currentAccent.bg} ${currentAccent.hover} p-2 rounded-full transition`}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Theme Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl mb-6`}>
            <h2 className="text-2xl font-bold mb-6">Theme</h2>

            {/* Theme Mode */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>Display Mode:</label>
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'auto'].map(mode => (
                  <button
                    key={mode}
                    onClick={async () => {
                      setThemeMode(mode);
                      await saveThemeSettings({
                        themeMode: mode,
                        accentColor,
                        colorCycleEnabled,
                        colorCycleIntervalMinutes,
                        lastColorChangeDate: localStorage.getItem('lastColorChangeDate'),
                        lastColorChangeHour: localStorage.getItem('lastColorChangeHour') ? parseInt(localStorage.getItem('lastColorChangeHour')) : null
                      });
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      themeMode === mode
                        ? `${currentAccent.bg} text-white`
                        : themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>Accent Color:</label>
              <div className="grid grid-cols-4 gap-3">
                {Object.keys(accentColors).map(color => (
                  <button
                    key={color}
                    onClick={async () => {
                      setAccentColor(color);
                      setColorCycleEnabled(false);
                      await saveThemeSettings({
                        themeMode,
                        accentColor: color,
                        colorCycleEnabled: false,
                        colorCycleIntervalMinutes,
                        lastColorChangeDate: localStorage.getItem('lastColorChangeDate'),
                        lastColorChangeHour: localStorage.getItem('lastColorChangeHour') ? parseInt(localStorage.getItem('lastColorChangeHour')) : null
                      });
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      accentColor === color && !colorCycleEnabled
                        ? `${accentColors[color].bg} text-white`
                        : themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Cycle */}
            <div>
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>Color Cycle:</label>
              <button
                onClick={async () => {
                  const newValue = !colorCycleEnabled;
                  setColorCycleEnabled(newValue);
                  const now = Date.now();
                  if (newValue) {
                    localStorage.setItem('lastColorChange', now.toString());
                  }
                  await saveThemeSettings({
                    themeMode,
                    accentColor,
                    colorCycleEnabled: newValue,
                    colorCycleIntervalMinutes,
                    lastColorChangeDate: newValue ? now.toString() : localStorage.getItem('lastColorChangeDate'),
                    lastColorChangeHour: localStorage.getItem('lastColorChangeHour') ? parseInt(localStorage.getItem('lastColorChangeHour')) : null
                  });
                }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                  colorCycleEnabled
                    ? `${currentAccent.bg} text-white`
                    : themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {colorCycleEnabled ? 'Color Cycle: ON' : 'Color Cycle: OFF'}
              </button>
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'} mt-2`}>
                When enabled, accent color rotates to unused colors
              </p>

              {/* Color Cycle Interval - only show when color cycle is enabled */}
              {colorCycleEnabled && (
                <div className="mt-4">
                  <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                    Change color every (minutes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={colorCycleIntervalMinutes}
                    onChange={async (e) => {
                      const value = parseInt(e.target.value) || 1;
                      setColorCycleIntervalMinutes(value);
                      await saveThemeSettings({
                        themeMode,
                        accentColor,
                        colorCycleEnabled,
                        colorCycleIntervalMinutes: value,
                        lastColorChangeDate: localStorage.getItem('lastColorChangeDate'),
                        lastColorChangeHour: localStorage.getItem('lastColorChangeHour') ? parseInt(localStorage.getItem('lastColorChangeHour')) : null
                      });
                    }}
                    className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg`}
                  />
                  <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'} mt-1`}>
                    Default: 60 minutes (1 hour)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Screensaver Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6">Screensaver</h2>

            {/* Enable Screensaver */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} font-semibold`}>Enable Screensaver:</label>
                <button
                  onClick={async () => {
                    const newValue = !screensaverEnabled;
                    setScreensaverEnabled(newValue);
                    await saveScreensaverSettings({
                      enabled: newValue,
                      delayMinutes: screensaverTimeout,
                      imageIntervalMinutes: screensaverDuration
                    });
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    screensaverEnabled
                      ? `${currentAccent.bg} text-white`
                      : themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {screensaverEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Screensaver Timeout */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Activate after (minutes):
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={screensaverTimeout}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 1;
                  setScreensaverTimeout(value);
                  await saveScreensaverSettings({
                    enabled: screensaverEnabled,
                    delayMinutes: value,
                    imageIntervalMinutes: screensaverDuration
                  });
                }}
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg`}
              />
            </div>

            {/* Image Duration */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Image display duration (seconds):
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={screensaverDuration}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 10;
                  setScreensaverDuration(value);
                  await saveScreensaverSettings({
                    enabled: screensaverEnabled,
                    delayMinutes: screensaverTimeout,
                    imageIntervalMinutes: value
                  });
                }}
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg`}
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Upload Photos:
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handlePhotoUpload(Array.from(e.target.files));
                    e.target.value = ''; // Reset input
                  }
                }}
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg`}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'} mt-2`}>
                Photos will be saved to web-app/data/photos
              </p>
            </div>

            {/* Uploaded Images List */}
            {screensaverImages.length > 0 && (
              <div className="mb-6">
                <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                  Uploaded Images ({screensaverImages.length}):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {screensaverImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Screensaver ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deletePhoto(img)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Button */}
            <button
              onClick={() => {
                setCurrentImageIndex(0);
                setShowScreensaverPreview(true);
              }}
              disabled={screensaverImages.length === 0}
              className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed text-white`}
            >
              Preview Screensaver
            </button>
          </div>

          {/* API Details Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl mb-6`}>
            <h2 className="text-2xl font-bold mb-6">API Configuration</h2>
            <p className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-6`}>
              Configure Google Calendar API credentials.
            </p>

            {/* Google API Key */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Google API Key:
              </label>
              <input
                type="text"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="Enter your Google API Key"
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg mb-2`}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'}`}>
                Found in Google Cloud Console
              </p>
            </div>

            {/* Google Client ID */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Google Client ID:
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="Enter your Google Client ID"
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg mb-2`}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'}`}>
                OAuth 2.0 Client ID from Google Cloud Console
              </p>
            </div>

            {/* Calendar IDs */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Calendar IDs (comma-separated):
              </label>
              <input
                type="text"
                value={calendarIds.join(', ')}
                onChange={(e) => setCalendarIds(e.target.value.split(',').map(id => id.trim()))}
                placeholder="e.g., primary, email@gmail.com"
                className={`w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} p-3 rounded-lg mb-2`}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'}`}>
                Use 'primary' for your main calendar or add additional calendar IDs separated by commas
              </p>
            </div>

            {/* Save API Details Button */}
            <button
              onClick={async () => {
                await saveExperienceSettings(experienceSettings);
                // Also save API details
                const apiDetails = {
                  googleCalendar: {
                    apiKey: googleApiKey,
                    clientId: googleClientId,
                    calendarIds: calendarIds.join(',')
                  }
                };
                try {
                  await fetch(`${API_URL}/api/api-details`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(apiDetails),
                  });
                  // Update module-level variables
                  GOOGLE_API_KEY = googleApiKey;
                  GOOGLE_CLIENT_ID = googleClientId;
                  CALENDAR_IDS = calendarIds;
                  alert('API configuration saved successfully!');
                } catch (error) {
                  console.error('Error saving API details:', error);
                  alert('Error saving API configuration');
                }
              }}
              className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition text-white`}
            >
              Save API Configuration
            </button>
          </div>

          {/* Weather Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl mb-6`}>
            <h2 className="text-2xl font-bold mb-6">Weather Configuration</h2>
            <p className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-6`}>
              Search by postal code to automatically set location and coordinates, or manually enter latitude and longitude.
            </p>

            <div className="mb-4 relative">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Postal Code Search
              </label>
              <input
                type="text"
                placeholder="e.g., 76182 or 10001"
                onChange={(e) => searchByPostalCode(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                className={`w-full px-4 py-2 rounded-lg border ${themeMode === 'light' ? 'bg-white/50 border-gray-300 text-gray-900' : 'bg-white/5 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />

              {/* Location Suggestions Dropdown */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border z-50 ${themeMode === 'light' ? 'bg-white/90 border-gray-300' : 'bg-slate-900/90 border-white/20'} shadow-lg`}>
                  {citySuggestions.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(location)}
                      className={`w-full text-left px-4 py-3 hover:${themeMode === 'light' ? 'bg-gray-100' : 'bg-white/10'} transition ${index < citySuggestions.length - 1 ? `border-b ${themeMode === 'light' ? 'border-gray-300' : 'border-white/20'}` : ''} ${themeMode === 'light' ? 'text-gray-900' : 'text-white'}`}
                    >
                      <div className="font-semibold">{location.display_name.split(',').slice(0, 2).join(',').trim()}</div>
                      <div className={`text-xs ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
                        {location.lat}, {location.lon}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Temperature Unit Toggle */}
            <div className="mb-4">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Temperature Unit
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTemperatureUnit('fahrenheit')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    temperatureUnit === 'fahrenheit'
                      ? `${currentAccent.bg} ${currentAccent.hover} text-white`
                      : themeMode === 'light'
                        ? 'bg-white/50 hover:bg-white/70 text-gray-900'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  °F
                </button>
                <button
                  onClick={() => setTemperatureUnit('celsius')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    temperatureUnit === 'celsius'
                      ? `${currentAccent.bg} ${currentAccent.hover} text-white`
                      : themeMode === 'light'
                        ? 'bg-white/50 hover:bg-white/70 text-gray-900'
                        : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  °C
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                Current Location
              </label>
              <div className={`w-full px-4 py-2 rounded-lg border ${themeMode === 'light' ? 'bg-white/30 border-gray-300 text-gray-900' : 'bg-white/5 border-white/20 text-white'}`}>
                {weatherLocation.location}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={weatherLocation.latitude}
                  onChange={(e) => setWeatherLocation({ ...weatherLocation, latitude: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-2 rounded-lg border ${themeMode === 'light' ? 'bg-white/50 border-gray-300 text-gray-900' : 'bg-white/5 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              <div>
                <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-2 block font-semibold`}>
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={weatherLocation.longitude}
                  onChange={(e) => setWeatherLocation({ ...weatherLocation, longitude: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-2 rounded-lg border ${themeMode === 'light' ? 'bg-white/50 border-gray-300 text-gray-900' : 'bg-white/5 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
            </div>

            <button
              onClick={async () => {
                const apiDetailsResponse = await fetch(`${API_URL}/api/api-details`);
                const apiDetailsResult = await apiDetailsResponse.json();
                const updatedApiDetails = {
                  ...apiDetailsResult.data,
                  weather: {
                    ...weatherLocation,
                    temperatureUnit
                  }
                };
                await fetch(`${API_URL}/api/api-details`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedApiDetails)
                });

                // Fetch weather with the current weatherLocation and temperatureUnit
                try {
                  const unit = temperatureUnit === 'celsius' ? 'celsius' : 'fahrenheit';
                  const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${weatherLocation.latitude}&longitude=${weatherLocation.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=${unit}`
                  );
                  const weatherResult = await weatherResponse.json();
                  if (weatherResult.current && weatherResult.daily) {
                    setWeather({
                      temperature: Math.round(weatherResult.current.temperature_2m),
                      condition: getWeatherDescription(weatherResult.current.weather_code),
                      location: weatherLocation.location,
                      error: null,
                      weatherCode: weatherResult.current.weather_code,
                      tempHigh: Math.round(weatherResult.daily.temperature_2m_max[0]),
                      tempLow: Math.round(weatherResult.daily.temperature_2m_min[0])
                    });
                  }
                } catch (error) {
                  console.error('Error loading weather:', error);
                }
              }}
              className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition text-white`}
            >
              Save Weather Configuration
            </button>
          </div>

          {/* Experience/UX Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6">Display Limits</h2>
            <p className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-6`}>
              Set the maximum number of items to display in each module before scrolling is enabled.
            </p>

            {/* Calendar Display Limit */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Calendar Events: {experienceSettings.modules.calendar.displayLimit} items
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={experienceSettings.modules.calendar.displayLimit}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 5;
                  const updated = {
                    ...experienceSettings,
                    modules: {
                      ...experienceSettings.modules,
                      calendar: { ...experienceSettings.modules.calendar, displayLimit: value }
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className="w-full"
              />
            </div>

            {/* Tasks Display Limit */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Tasks: {experienceSettings.modules.tasks.displayLimit} items
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={experienceSettings.modules.tasks.displayLimit}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 5;
                  const updated = {
                    ...experienceSettings,
                    modules: {
                      ...experienceSettings.modules,
                      tasks: { ...experienceSettings.modules.tasks, displayLimit: value }
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className="w-full"
              />
            </div>

            {/* Rewards Display Limit */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Rewards: {experienceSettings.modules.rewards.displayLimit} items
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={experienceSettings.modules.rewards.displayLimit}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 4;
                  const updated = {
                    ...experienceSettings,
                    modules: {
                      ...experienceSettings.modules,
                      rewards: { ...experienceSettings.modules.rewards, displayLimit: value }
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className="w-full"
              />
            </div>

            {/* Users Display Limit */}
            <div>
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Users: {experienceSettings.modules.users.displayLimit} items
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={experienceSettings.modules.users.displayLimit}
                onChange={async (e) => {
                  const value = parseInt(e.target.value) || 5;
                  const updated = {
                    ...experienceSettings,
                    modules: {
                      ...experienceSettings.modules,
                      users: { ...experienceSettings.modules.users, displayLimit: value }
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Calendar Colors Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6">Calendar Colors</h2>
            <p className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-6`}>
              Set the color for each calendar's events.
            </p>

            {calendarIds.map((calendarId) => (
              <div key={calendarId} className="mb-6">
                <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                  {calendarId === 'primary' ? 'Primary Calendar' : calendarId}:
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={experienceSettings.modules.calendar.calendarColors?.[calendarId] || '#14b8a6'}
                    onChange={async (e) => {
                      const newColor = e.target.value;
                      const updated = {
                        ...experienceSettings,
                        modules: {
                          ...experienceSettings.modules,
                          calendar: {
                            ...experienceSettings.modules.calendar,
                            calendarColors: {
                              ...experienceSettings.modules.calendar.calendarColors,
                              [calendarId]: newColor
                            }
                          }
                        }
                      };
                      setExperienceSettings(updated);
                      await saveExperienceSettings(updated);
                    }}
                    className="w-20 h-10 rounded-lg cursor-pointer"
                  />
                  <span className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
                    {experienceSettings.modules.calendar.calendarColors?.[calendarId] || '#14b8a6'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Backup Settings */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl mt-6`}>
            <h2 className="text-2xl font-bold mb-6">Backup Settings</h2>
            <p className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-6`}>
              Configure automatic daily backups of your data. Backups are stored as zip files.
            </p>

            {/* Enable/Disable Backups */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Enable Automatic Backups:
              </label>
              <button
                onClick={async () => {
                  const updated = {
                    ...experienceSettings,
                    backup: {
                      ...experienceSettings.backup,
                      enabled: !experienceSettings.backup.enabled
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  experienceSettings.backup?.enabled
                    ? `${currentAccent.bg} text-white`
                    : themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {experienceSettings.backup?.enabled ? '✓ Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Backup Time */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Backup Time (HH:MM):
              </label>
              <input
                type="time"
                value={experienceSettings.backup?.backupTime || '00:00'}
                onChange={async (e) => {
                  const updated = {
                    ...experienceSettings,
                    backup: {
                      ...experienceSettings.backup,
                      backupTime: e.target.value
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className={`px-4 py-3 rounded-lg w-full ${themeMode === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-white/10 text-white'} border ${themeMode === 'light' ? 'border-gray-300' : 'border-white/20'} focus:outline-none focus:ring-2 ${currentAccent.ring}`}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'} mt-2`}>
                Backup will run daily at this time (server timezone)
              </p>
            </div>

            {/* Max Backups */}
            <div className="mb-6">
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Keep Most Recent Backups: {experienceSettings.backup?.maxBackups || 2}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={experienceSettings.backup?.maxBackups || 2}
                onChange={async (e) => {
                  const value = parseInt(e.target.value);
                  const updated = {
                    ...experienceSettings,
                    backup: {
                      ...experienceSettings.backup,
                      maxBackups: value
                    }
                  };
                  setExperienceSettings(updated);
                  await saveExperienceSettings(updated);
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${((experienceSettings.backup?.maxBackups || 2) - 1) / 9 * 100}%, ${themeMode === 'light' ? '#e5e7eb' : '#ffffff20'} ${((experienceSettings.backup?.maxBackups || 2) - 1) / 9 * 100}%, ${themeMode === 'light' ? '#e5e7eb' : '#ffffff20'} 100%)`
                }}
              />
              <p className={`text-xs ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-500'} mt-2`}>
                Older backups will be automatically deleted
              </p>
            </div>

            {/* Manual Backup Button */}
            <div className="mb-6">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:3001/api/backup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ maxBackups: experienceSettings.backup?.maxBackups || 2 })
                    });
                    const data = await response.json();
                    if (data.success) {
                      alert(`✅ Backup created: ${data.filename}`);
                    } else {
                      alert(`❌ Backup failed: ${data.error}`);
                    }
                  } catch (error) {
                    alert(`❌ Error: ${error.message}`);
                  }
                }}
                className={`${currentAccent.bg} ${currentAccent.hover} px-6 py-3 rounded-lg text-white font-medium transition`}
              >
                Create Backup Now
              </button>
            </div>

            {/* Backup List */}
            <div>
              <label className={`text-sm ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} mb-3 block font-semibold`}>
                Recent Backups:
              </label>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:3001/api/backups');
                    const data = await response.json();
                    if (data.success) {
                      if (data.backups.length === 0) {
                        alert('No backups found');
                      } else {
                        const backupList = data.backups
                          .map(b => `${b.filename} (${(b.size / 1024 / 1024).toFixed(2)} MB) - ${new Date(b.created).toLocaleString()}`)
                          .join('\n');
                        alert(`Backups:\n\n${backupList}`);
                      }
                    }
                  } catch (error) {
                    alert(`Error: ${error.message}`);
                  }
                }}
                className={`${themeMode === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'} px-4 py-2 rounded-lg text-sm transition`}
              >
                View Backups
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${themeMode === 'light' ? 'bg-gradient-to-br from-slate-100 via-gray-100 to-slate-100 text-gray-900' : 'bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white'} p-4 md:p-6 overflow-x-hidden`}>
      {/* Hockey Goal Animation */}
      {showHockeyAnimation && (
        <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden">
          {/* Ice rink background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-blue-800/20 to-blue-900/30"></div>

          {/* Hockey Player */}
          <div
            className="absolute bottom-20 left-1/3 text-6xl"
            style={{
              animation: 'slideRight 2s ease-out forwards'
            }}
          >
            🏒
          </div>

          {/* Hockey Puck */}
          <div
            className="absolute bottom-24 left-1/3 text-4xl"
            style={{
              animation: 'shootPuck 2s ease-out forwards'
            }}
          >
            ⚫
          </div>

          {/* Hockey Goalie */}
          <div className="absolute bottom-20 right-1/3 text-6xl opacity-70">
            🥅
          </div>

          {/* Goal Celebration Text */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
            style={{
              animation: 'popUp 3s ease-out forwards'
            }}
          >
            <div className="text-6xl font-black text-white drop-shadow-2xl" style={{
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.6)'
            }}>
              HE SHOOTS!
            </div>
            <div
              className="text-7xl font-black text-yellow-300 drop-shadow-2xl mt-4"
              style={{
                animation: 'pulse 0.5s ease-in-out 2s infinite',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.9), 0 0 40px rgba(255, 165, 0, 0.7)'
              }}
            >
              HE SCORES!
            </div>
          </div>

          {/* Confetti */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              {['🎉', '⭐', '✨', '🏆'][i % 4]}
            </div>
          ))}

          <style>{`
            @keyframes slideRight {
              from {
                transform: translateX(-500px);
                opacity: 1;
              }
              to {
                transform: translateX(400px);
                opacity: 1;
              }
            }

            @keyframes shootPuck {
              from {
                transform: translateX(-500px) translateY(0);
                opacity: 1;
              }
              to {
                transform: translateX(600px) translateY(-200px);
                opacity: 0;
              }
            }

            @keyframes popUp {
              0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
              }
              20% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 1;
              }
              80% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0;
              }
            }

            @keyframes fall {
              to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full">
        {/* Settings and Power Icons - Hidden when screensaver is actually running */}
        {!(screensaverActive || showScreensaverPreview) && (
        <div className="absolute top-6 right-6 z-[201] flex gap-3">
          <button
            onClick={() => {
              setCurrentImageIndex(0);
              setShowScreensaverPreview(!showScreensaverPreview);
            }}
            disabled={screensaverImages.length === 0}
            className={`${showScreensaverPreview ? currentAccent.bg + ' ' + currentAccent.hover : themeMode === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-white/10 hover:bg-white/20'} backdrop-blur-lg p-3 rounded-full transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            title={showScreensaverPreview ? 'Exit screensaver' : 'Start screensaver'}
          >
            <Power className={showScreensaverPreview ? 'text-white' : currentAccent.text} size={28} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className={`${themeMode === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-white/10 hover:bg-white/20'} backdrop-blur-lg p-3 rounded-full transition shadow-lg`}
          >
            <Settings className={currentAccent.text} size={28} />
          </button>
        </div>
        )}

        {/* Time and Weather Section */}
        <div className={`text-center mb-8 ${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-3xl p-8 shadow-2xl`}>
          <div className={`${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'} text-lg mb-2`}>{formatDate(currentTime)}</div>
          <div className={`text-8xl font-bold mb-6 bg-gradient-to-r ${currentAccent.gradient} bg-clip-text text-transparent`}>
            {formatTime(currentTime)}
          </div>
          <div className="flex items-center justify-center gap-4">
            {getWeatherIcon(weather.weatherCode)}
            <div className="text-4xl font-semibold">{weather.temperature !== null ? `${weather.temperature}°${temperatureUnit === 'celsius' ? 'C' : 'F'}` : 'Loading...'}</div>
            <div className={`text-xl ${themeMode === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{weather.condition}</div>
          </div>
          <div className={`flex items-center justify-center gap-4 mt-3 ${themeMode === 'light' ? 'text-gray-600' : 'text-slate-400'}`}>
            {weather.tempHigh !== null && weather.tempLow !== null && (
              <>
                <span className="text-sm">High: {weather.tempHigh}°{temperatureUnit === 'celsius' ? 'C' : 'F'}</span>
                <span className="text-sm">Low: {weather.tempLow}°{temperatureUnit === 'celsius' ? 'C' : 'F'}</span>
              </>
            )}
          </div>
          <div className={`text-sm ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-400'} mt-3`}>{weather.location || weatherLocation.location || 'Loading location...'}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Events */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className={currentAccent.text} size={24} />
                <h2 className="text-2xl font-bold">Calendar</h2>
              </div>
              <div className="flex gap-2">
                {isSignedIn ? (
                  <>
                    <button
                      onClick={loadCalendarEvents}
                      className={`${themeMode === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'} transition text-sm`}
                      disabled={calendarLoading}
                    >
                      {calendarLoading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                      onClick={handleSignoutClick}
                      className={`${themeMode === 'light' ? 'text-gray-600 hover:text-gray-900' : 'text-slate-400 hover:text-white'} transition text-sm`}
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleGoogleLogin()}
                    className={`${currentAccent.bg} ${currentAccent.hover} px-4 py-2 rounded-lg text-sm transition text-white`}
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
                    className={`${currentAccent.text} text-sm`}
                  >
                    Try Again
                  </button>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className={`text-center ${themeMode === 'light' ? 'text-gray-500' : 'text-slate-400'} py-8`}>
                  No upcoming events
                </div>
              ) : (
                <div className={`space-y-3 ${calendarEvents.length > experienceSettings.modules.calendar.displayLimit ? 'overflow-y-auto max-h-96 pr-2' : ''}`}>
                  {calendarEvents.map(event => (
                    <div
                      key={event.id}
                      className={`${themeMode === 'light' ? 'bg-gray-200' : 'bg-white/10'} p-4 rounded-xl border-l-4`}
                      style={{ borderLeftColor: event.color }}
                    >
                      <div className="font-semibold text-lg">{event.title}</div>
                      <div className={`${themeMode === 'light' ? 'text-gray-700' : 'text-slate-300'} text-sm mt-1`}>{event.time}</div>
                      <div className={`${themeMode === 'light' ? 'text-gray-500' : 'text-slate-400'} text-xs mt-1`}>{event.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className={`${currentAccent.bg} ${currentAccent.hover} p-2 rounded-full transition text-white`}
              >
                <Plus size={24} />
              </button>
            </div>

            {/* Period Filter Buttons */}
            <div className="flex gap-2 mb-4">
              {['Morning', 'Afternoon', 'Evening'].map(period => (
                <button
                  key={period}
                  onClick={() => togglePeriod(period)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    selectedPeriods.includes(period)
                      ? `${currentAccent.bg} text-white`
                      : themeMode === 'light' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className={`space-y-3 ${filteredTasks.length > experienceSettings.modules.tasks.displayLimit ? 'overflow-y-auto max-h-96 pr-2' : ''}`}>
              {filteredTasks.map(task => (
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
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold">Points</h2>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className={`${currentAccent.bg} ${currentAccent.hover} p-2 rounded-full transition text-white`}
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
            <div className={`space-y-3 ${displayedUsers.length > experienceSettings.modules.users.displayLimit ? 'overflow-y-auto max-h-96 pr-2' : ''}`}>
              {displayedUsers.map(user => (
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
          <div className={`${themeMode === 'light' ? 'bg-white/70' : 'bg-white/5'} backdrop-blur-lg rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Rewards</h2>
              <button
                onClick={() => setShowRewardModal(true)}
                className={`${currentAccent.bg} ${currentAccent.hover} p-2 rounded-full transition text-white`}
              >
                <Plus size={24} />
              </button>
            </div>
            <div className={`space-y-4 ${rewards.length > experienceSettings.modules.rewards.displayLimit ? 'overflow-y-auto max-h-96 pr-2' : ''}`}>
              {rewards.map(reward => (
                <div key={reward.id} className={`${themeMode === 'light' ? 'bg-gray-200' : 'bg-white/10'} p-4 rounded-xl`}>
                  <div className="mb-3">
                    <div className="font-semibold text-lg">{reward.name}</div>
                    <div className="text-yellow-400 text-sm">{reward.cost} points</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayedUsers.map(user => (
                      <button
                        key={user.name}
                        onClick={() => redeemReward(reward, user.name)}
                        disabled={userPoints[user.name] < reward.cost}
                        className={`px-4 py-2 rounded-lg font-medium transition text-white ${
                          userPoints[user.name] >= reward.cost
                            ? `${currentAccent.bg} ${currentAccent.hover}`
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
                          ? `${currentAccent.bg} text-white`
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
                          ? `${currentAccent.bg} text-white`
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
                  {['Morning', 'Afternoon', 'Evening'].map(period => (
                    <button
                      key={period}
                      onClick={() => setNewTask({...newTask, period})}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                        newTask.period === period
                          ? `${currentAccent.bg} text-white`
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
                className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition text-white`}
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
                className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition text-white`}
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
                      <div className="text-sm text-slate-400">
                        {user.type} • {user.points} points
                        {user.type === 'Parent' && user.pin && ` • PIN: ••••`}
                      </div>
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
                        ? `${currentAccent.bg} text-white`
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    Child
                  </button>
                  <button
                    onClick={() => setNewUser({...newUser, type: 'Parent'})}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      newUser.type === 'Parent'
                        ? `${currentAccent.bg} text-white`
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
                className={`w-full ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition text-white`}
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
                className={`flex-1 ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed text-white`}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal for Editing User */}
      {showPinVerifyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Enter Your PIN</h3>
              <button onClick={closePinVerifyModal}>
                <X size={24} className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-slate-300 mb-6">
              To edit this user's information, please enter your current PIN.
            </p>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pinVerifyInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setPinVerifyInput(value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinVerifyInput.length === 4) {
                  handlePinVerification();
                }
              }}
              className="w-full bg-white/10 p-4 rounded-lg text-white text-center text-2xl tracking-widest placeholder-slate-400 mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={closePinVerifyModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePinVerification}
                disabled={pinVerifyInput.length !== 4}
                className={`flex-1 ${currentAccent.bg} ${currentAccent.hover} py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed text-white`}
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


      {/* Screensaver Overlay - Must appear above all other content */}
      {(screensaverActive || showScreensaverPreview) && screensaverImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black z-[200] flex items-center justify-center cursor-pointer"
          onClick={() => {
            setScreensaverActive(false);
            setShowScreensaverPreview(false);
            setLastActivityTime(Date.now());
            setCurrentImageIndex(0);
          }}
        >
          {/* Screensaver Images with Crossfade */}
          {screensaverImages.map((img, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                opacity: index === currentImageIndex ? 1 : 0,
                pointerEvents: 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={img}
                alt={`Screensaver ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Weather/Time/Date Overlay - Rotates to different corners */}
          <div
            className={`absolute ${
              clockCorner === 'bottom-left' ? 'bottom-6 left-6' :
              clockCorner === 'bottom-right' ? 'bottom-6 right-6' :
              clockCorner === 'top-left' ? 'top-6 left-6' :
              'top-6 right-6'
            } bg-black/50 backdrop-blur-md rounded-2xl p-6 text-white z-10 cursor-pointer transition-all duration-500`}
            onClick={(e) => {
              e.stopPropagation();
              setScreensaverActive(false);
              setShowScreensaverPreview(false);
              setLastActivityTime(Date.now());
              setCurrentImageIndex(0);
            }}
          >
            <div className="text-sm text-slate-300 mb-1">{formatDate(currentTime)}</div>
            <div className={`text-5xl font-bold mb-3 bg-gradient-to-r ${currentAccent.gradient} bg-clip-text text-transparent`}>
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-slate-400 mb-3">{weather.location}</div>
            <div className="flex items-center gap-3">
              <div style={{ transform: 'scale(0.8)', transformOrigin: 'left' }}>
                {getWeatherIcon(weather.weatherCode)}
              </div>
              <div className="text-2xl font-semibold">{weather.temperature !== null ? `${weather.temperature}°${temperatureUnit === 'celsius' ? 'C' : 'F'}` : 'Loading...'}</div>
              <div className="text-lg text-slate-300">{weather.condition}</div>
            </div>
          </div>

          {/* Close button for preview mode - Hidden */}
        </div>
      )}
    </div>
  );
};

// Wrap with GoogleOAuthProvider
const App = () => {
  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);
  const [apiDetailsLoaded, setApiDetailsLoaded] = useState(false);

  useEffect(() => {
    // Load API details to get the correct client ID
    const loadApiDetailsForProvider = async () => {
      try {
        const response = await fetch(`${API_URL}/api/api-details`);
        const result = await response.json();
        if (result.success && result.data?.googleCalendar?.clientId) {
          const id = result.data.googleCalendar.clientId;
          setClientId(id);
          GOOGLE_CLIENT_ID = id;
          console.log('=== Google OAuth Configuration ===');
          console.log('Client ID:', id);
          console.log('Current URL:', window.location.href);
          console.log('Current Port:', window.location.port);
        }
      } catch (error) {
        console.error('Error loading API details in App wrapper:', error);
        console.log('=== Google OAuth Configuration ===');
        console.log('Client ID:', GOOGLE_CLIENT_ID);
        console.log('Current URL:', window.location.href);
        console.log('Current Port:', window.location.port);
      }
      setApiDetailsLoaded(true);
    };

    loadApiDetailsForProvider();
  }, []);

  // Don't render until API details are loaded
  if (!apiDetailsLoaded || clientId === 'NotFound.apps.googleusercontent.com') {
    return <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }} />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <FamilyDashboard />
    </GoogleOAuthProvider>
  );
};

export default App;
