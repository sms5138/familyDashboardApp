import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVER_ADDRESS: '@server_address',
  TASKS: '@tasks',
  REWARDS: '@rewards',
  USER_POINTS: '@user_points',
};

class StorageService {
  constructor() {
    this.serverAddress = null;
  }

  async setServerAddress(address) {
    this.serverAddress = address;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER_ADDRESS, address);
    } catch (error) {
      console.error('Error saving server address:', error);
    }
  }

  async getServerAddress() {
    if (this.serverAddress) return this.serverAddress;

    try {
      const address = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_ADDRESS);
      this.serverAddress = address;
      return address;
    } catch (error) {
      console.error('Error getting server address:', error);
      return null;
    }
  }

  async getTasks() {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return tasksJson ? JSON.parse(tasksJson) : null;
    } catch (error) {
      console.error('Error getting tasks:', error);
      return null;
    }
  }

  async saveTasks(tasks) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  async getRewards() {
    try {
      const rewardsJson = await AsyncStorage.getItem(STORAGE_KEYS.REWARDS);
      return rewardsJson ? JSON.parse(rewardsJson) : null;
    } catch (error) {
      console.error('Error getting rewards:', error);
      return null;
    }
  }

  async saveRewards(rewards) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
    } catch (error) {
      console.error('Error saving rewards:', error);
    }
  }

  async getUserPoints() {
    try {
      const pointsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_POINTS);
      return pointsJson ? JSON.parse(pointsJson) : null;
    } catch (error) {
      console.error('Error getting user points:', error);
      return null;
    }
  }

  async saveUserPoints(points) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_POINTS, JSON.stringify(points));
    } catch (error) {
      console.error('Error saving user points:', error);
    }
  }
}

const storageService = new StorageService();
export default storageService;
