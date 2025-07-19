<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'

const idNumber = ref('')
const student = ref(null)
const checked = ref(false)
const timedIn = ref(false)
const logs = ref([])

const totalHours = ref({ hours: 0, minutes: 0, seconds: 0 })

const newStudent = ref({
  student_id: '',
  first_name: '',
  last_name: '',
})

const formatDate = (iso) => {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatTime = (iso) => {
  const date = new Date(iso)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const computeTotal = () => {
  let totalMilliseconds = 0

  logs.value.forEach((log) => {
    if (log.time_out) {
      const start = new Date(log.time_in)
      const end = new Date(log.time_out)
      totalMilliseconds += end - start
    }
  })

  const totalSeconds = totalMilliseconds / 1000
  totalHours.value.hours = (totalSeconds / 3600) | 0
  totalHours.value.minutes = ((totalSeconds % 3600) / 60) | 0
  totalHours.value.seconds = totalSeconds % 60 | 0
}

// 📝 Group logs per date (return only first two logs)
const groupedLogs = computed(() => {
  const groups = {}
  logs.value.forEach((log) => {
    const date = formatDate(log.time_in)
    if (!groups[date]) groups[date] = []
    if (groups[date].length < 2) groups[date].push(log) // Only 2 logs per day
  })
  return groups
})

const checkStudent = async () => {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', idNumber.value)
    .maybeSingle()

  student.value = data
  checked.value = true
  timedIn.value = false

  if (!data) {
    newStudent.value.student_id = idNumber.value
    return
  }

  const { data: logData } = await supabase
    .from('ojt_logs')
    .select('*')
    .eq('student_id', idNumber.value)
    .order('time_in', { ascending: true }) // earliest first

  logs.value = logData
  computeTotal()

  if (logData.length && !logData[logData.length - 1].time_out) {
    timedIn.value = true
  }
}

const registerStudent = async () => {
  const { error } = await supabase.from('students').insert({
    student_id: newStudent.value.student_id,
    first_name: newStudent.value.first_name,
    last_name: newStudent.value.last_name,
  })

  if (!error) {
    alert('🎉 Registered successfully!')
    checkStudent()
  } else {
    console.error('Registration error:', error)
    alert('❌ Error registering student.')
  }
}

const timeIn = async () => {
  const { error } = await supabase.from('ojt_logs').insert({
    student_id: idNumber.value,
    time_in: new Date(),
  })
  if (!error) {
    alert('✅ Time-in recorded!')
    checkStudent()
  } else {
    alert('❌ Failed to time in')
  }
}

const timeOut = async () => {
  const { data: latestLog } = await supabase
    .from('ojt_logs')
    .select('*')
    .eq('student_id', idNumber.value)
    .order('time_in', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('ojt_logs')
    .update({ time_out: new Date() })
    .eq('id', latestLog.id)

  if (!error) {
    alert('🕒 Time-out recorded!')
    checkStudent()
  } else {
    alert('❌ Failed to time out')
  }
}
</script>

<template>
  <div id="app">
    <h1>📋 OJT Time Tracker</h1>

    <div class="input-section">
      <label>Enter ID Number:</label>
      <input v-model="idNumber" placeholder="000-1234" />
      <button @click="checkStudent">Check</button>
    </div>

    <div v-if="student" class="student-section">
      <div class="center-section">
        <h2>{{ student.first_name }} {{ student.last_name }}</h2>
        <p class="center-text">
          Total hours:
          <b>{{ totalHours.hours }}</b> hours <b>{{ totalHours.minutes }}</b> minutes
          <b>{{ totalHours.seconds }}</b> seconds
        </p>
      </div>

      <div class="button-group">
        <button v-if="!timedIn" @click="timeIn" class="time-in">Time In</button>
        <button v-else @click="timeOut" class="time-out">Time Out</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Time In</th>
            <th>Time Out</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(dayLogs, date) in groupedLogs" :key="date">
            <td>{{ date }}</td>
            <td>{{ dayLogs[0] ? formatTime(dayLogs[0].time_in) : '-' }}</td>
            <td>{{ dayLogs[0] && dayLogs[0].time_out ? formatTime(dayLogs[0].time_out) : '-' }}</td>
            <td>{{ dayLogs[1] ? formatTime(dayLogs[1].time_in) : '-' }}</td>
            <td>{{ dayLogs[1] && dayLogs[1].time_out ? formatTime(dayLogs[1].time_out) : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="checked" class="register-section">
      <p>❌ Student not found.</p>
      <input v-model="newStudent.first_name" placeholder="First Name" />
      <input v-model="newStudent.last_name" placeholder="Last Name" />
      <button @click="registerStudent">Register</button>
    </div>
  </div>
</template>

<style scoped>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background: linear-gradient(to bottom right, #e0f7fa, #b2ebf2, #80deea);
  font-family: Arial, sans-serif;
}
.center-section {
  text-align: center;
}

#app {
  max-width: 600px;
  margin: auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
  background: linear-gradient(to bottom right, #e0f7fa, #b2ebf2, #80deea);
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #0277bd;
}

input {
  display: block;
  margin: 0.5rem 0;
  padding: 0.5rem;
  width: 100%;
  border: 1px solid #90caf9;
  border-radius: 4px;
}

button {
  background-color: #29b6f6;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0.5rem 0;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0288d1;
}

.button-group {
  display: flex;
  gap: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

th,
td {
  border: 1px solid #b3e5fc;
  text-align: center;
  padding: 0.5rem;
}

th {
  background-color: #4fc3f7;
  color: white;
}

tr:nth-child(even) {
  background-color: #e1f5fe;
}
</style>
