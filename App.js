import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity, Animated,
} from 'react-native';

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [taskText, setTaskText] = useState('');
  const [taskAnimations, setTaskAnimations] = useState({});

  const addTask = () => {
    if (task.trim()) {
      const newTask = { id: Date.now().toString(), text: task, completed: false };

      // Initialize the animation value for the new task
      const animation = new Animated.Value(0);

      // Add the new task and its corresponding animation value
      setTasks((prevTasks) => {
        const updatedTasks = [...prevTasks, newTask];
        setTaskAnimations((prevAnimations) => ({
          ...prevAnimations,
          [newTask.id]: animation,
        }));
        return updatedTasks;
      });

      // Animate the task scale-in effect
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      saveTasks([...tasks, newTask]);
      setTask('');
    }
  };

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (taskId) => {
    const animation = taskAnimations[taskId];

    // Check if animation exists before trying to animate
    if (animation) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        const updatedAnimations = { ...taskAnimations };
        delete updatedAnimations[taskId];
        setTaskAnimations(updatedAnimations);
      });
    } else {
      // Handle error if animation is not available
      console.error('Animation not found for taskId:', taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    }
  };

  const startEditing = (id, text) => {
    setEditingId(id);
    setTaskText(text);
  };

  const saveEdit = () => {
    const updatedTasks = tasks.map((task) =>
      task.id === editingId ? { ...task, text: taskText } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setEditingId(null);
    setTaskText('');
  };

  const saveTasks = async (tasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error(error);
    }
  };

  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      saveTasks(tasks);
    }
  }, [tasks]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => {
          const animation = taskAnimations[item.id];

          // Use a scaling animation for each task
          const scale = animation ? animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }) : 1;

          return (
            <Animated.View style={[styles.taskContainer, { transform: [{ scale }] }]}>
              {editingId === item.id ? (
                <TextInput
                  style={styles.input}
                  value={taskText}
                  onChangeText={setTaskText}
                  onBlur={saveEdit} // Automatically save when losing focus
                />
              ) : (
                <TouchableOpacity onPress={() => toggleComplete(item.id)}>
                  <Text style={item.completed ? styles.completedTaskText : styles.taskText}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => startEditing(item.id, item.text)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text style={styles.deleteButton}>X</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#5C5CFF',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  editButton: {
    color: '#5C5CFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
