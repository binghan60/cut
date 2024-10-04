// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, update } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyDWAPV38GpQv528Gk6DcGuYq69vY4wdM_g',
	authDomain: 'milkbloodsugar.firebaseapp.com',
	projectId: 'milkbloodsugar',
	storageBucket: 'milkbloodsugar.appspot.com',
	messagingSenderId: '241255614066',
	appId: '1:241255614066:web:30d3896bd5a749ce99e4eb',
	measurementId: 'G-YS79XH5D3R',
	databaseURL: 'https://milkbloodsugar-default-rtdb.asia-southeast1.firebasedatabase.app', // Correct region
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const { createApp } = Vue;
createApp({
	data() {
		return {
			overlay: false,
			recordData: [],
			totalShowDay: 42,
			year: new Date().getFullYear(),
			month: new Date().getMonth() + 1,
			day: new Date().getDate(),
			currentYear: new Date().getFullYear(),
			currentMonth: new Date().getMonth() + 1,
			weekdays: ['一', '二', '三', '四', '五', '六', '日'],
			quickSugar: '',
			quickInsulin: '',
			mode: 'default',
			chart: '',
			sugarChart: '',
		};
	},
	computed: {
		daysInMonth() {
			return new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
		},
		blanks() {
			const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
			const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
			return Array.from({ length: adjustedFirstDay });
		},
		calendarRows() {
			const days = Array.from({ length: this.daysInMonth }, (_, i) => ({ date: i + 1 }));
			const blankDays = this.blanks.map(() => ({ date: null }));
			const allDays = [...blankDays, ...days];
			const totalCells = 42;
			while (allDays.length < totalCells) {
				allDays.push({ date: null });
			}
			const rows = [];
			for (let i = 0; i < totalCells; i += 7) {
				rows.push(allDays.slice(i, i + 7));
			}
			return rows;
		},
		birthday() {
			const startDate = new Date('2012/08/08');
			const today = new Date();
			const timeDifference = today - startDate;
			const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
			return daysDifference;
		},
	},
	methods: {
		previousMonth() {
			if (this.currentMonth === 0) {
				this.currentYear--;
				this.currentMonth = 11;
			} else {
				this.currentMonth--;
			}
		},
		nextMonth() {
			if (this.currentMonth === 11) {
				this.currentYear++;
				this.currentMonth = 0;
			} else {
				this.currentMonth++;
			}
		},
		quickRecord() {
			const currentHour = new Date().getHours();
			const timeOfDay = currentHour >= 6 && currentHour < 13 ? 'morning' : 'night';
			set(ref(db, `users/milk/${this.year}/${this.month}/${this.day}/${timeOfDay}`), { sugar: this.quickSugar, insulin: this.quickInsulin })
				.then(() => {
					this.overlay = false;
					this.quickSugar = '';
					this.quickInsulin = '';
				})
				.catch((error) => {
					console.error('Error adding data:', error);
				});
		},
		submit() {
			const monthData = this.recordData.slice(1).reduce((acc, curr, index) => {
				if (curr) {
					acc[index + 1] = curr; // index + 1 因為 slice 從 1 開始
				}
				return acc;
			}, {});
			update(ref(db, `users/milk/${this.currentYear}/${this.currentMonth + 1}/`), monthData)
				.then(() => {
					this.mode = 'default';
				})
				.catch((error) => {
					console.error('Error adding data:', error);
				});
		},
		createChart() {
			const ctx = document.getElementById('monthChart').getContext('2d');
			if (this.chart) {
				this.chart.destroy();
			}
			const days = Array.from({ length: this.recordData.length - 1 }, (_, i) => i + 1);
			const morningData = this.recordData.slice(1).map((entry) => {
				return entry && entry.morning.sugar ? parseFloat(entry.morning.sugar) : 0;
			});
			const nightData = this.recordData.slice(1).map((entry) => {
				return entry && entry.night.sugar ? parseFloat(entry.night.sugar) : 0;
			});
			const I1 = this.recordData.slice(1).map((entry) => {
				return entry && entry.morning.insulin ? parseFloat(entry.morning.insulin) : 0;
			});
			const I2 = this.recordData.slice(1).map((entry) => {
				return entry && entry.night.insulin ? parseFloat(entry.night.insulin) : 0;
			});
			if (morningData.length > 0 || nightData.length > 0) {
				this.chart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: days,
						datasets: [
							{
								label: '早上(血糖)',
								data: morningData,
								borderColor: 'rgba(10, 132, 255)',
								backgroundColor: 'rgba(75, 192, 192, 0)',
								fill: true,
								yAxisID: 'left-y-axis',
								pointRadius: 6, // 設定點的大小
								pointHoverRadius: 8, // 設定懸停時點的大小
								borderWidth: 4,
							},
							{
								label: '早上(胰島素)',
								data: I1, // 右邊 Y 軸的早上資料
								borderColor: 'rgba(10, 132, 255)',
								backgroundColor: 'rgba(10, 132, 255, 0.5)',
								type: 'bar',
								yAxisID: 'right-y-axis', // 指定使用右邊的 Y 軸
							},
							{
								label: '晚上(血糖)',
								data: nightData,
								borderColor: 'rgb(255, 99, 71)',
								backgroundColor: 'rgba(153, 102, 255, 0)',
								fill: true,
								yAxisID: 'left-y-axis',
								pointRadius: 6, // 設定點的大小
								pointHoverRadius: 8, // 設定懸停時點的大小
								borderWidth: 4,
							},
							{
								type: 'bar',
								label: '晚上(胰島素)',
								data: I2,
								borderColor: 'rgb(255, 99, 71)',
								backgroundColor: 'rgb(255, 99, 71,0.5)',
								yAxisID: 'right-y-axis',
							},
						],
					},
					options: {
						plugins: {
							title: {
								display: true,
								text: this.currentMonth + '月血糖走勢圖',
								font: {
									size: 20, // 標題的字體大小
								},
								padding: {
									top: 10,
									bottom: 0,
								},
								color: '#333', // 標題顏色
							},
						},
						scales: {
							'left-y-axis': {
								type: 'linear',
								position: 'left',
								title: {
									display: true,
								},
								beginAtZero: true,
							},
							'right-y-axis': {
								type: 'linear',
								position: 'right',
								grid: {
									drawOnChartArea: false, // 右邊不畫網格線
								},
								title: {
									display: true,
								},
								beginAtZero: true,
							},
						},
					},
				});
			} else {
				console.log('No valid data to display on chart');
			}
		},
		creatSugarChart() {
			const ctx = document.getElementById('sugarChart').getContext('2d');
			if (this.sugarChart) {
				this.sugarChart.destroy();
			}
			const days = Array.from({ length: this.recordData.length - 1 }, (_, i) => i + 1);
			const morningData = this.recordData.slice(1).map((entry) => {
				return entry && entry.morning.sugar ? parseFloat(entry.morning.sugar) : 0;
			});
			if (morningData.length > 0) {
				this.sugarChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: days,
						datasets: [
							{
								label: '早上',
								data: morningData,
								borderColor: '#0a84ff',
								backgroundColor: 'rgba(75, 192, 192, 0.2)',
								fill: true,
							},
						],
					},
					options: {
						plugins: {
							title: {
								display: true,
								text: this.currentMonth + '月血糖曲線',
								font: {
									size: 20,
								},
								padding: {
									top: 10,
									bottom: 0,
								},
								color: '#333',
							},
						},
						scales: {
							y: {
								beginAtZero: true,
							},
						},
					},
				});
			} else {
				console.log('No valid data to display on chart');
			}
		},
	},
	watch: {
		currentMonth: {
			handler(newValue) {
				onValue(
					ref(db, `users/milk/${this.currentYear}/${newValue + 1}`),
					(snapshot) => {
						if (snapshot.exists()) {
							this.recordData = snapshot.val();
						} else {
							this.recordData = [];
							const daysInMonth = new Date(this.currentYear, newValue + 1, 0).getDate();
							for (let i = 1; i <= daysInMonth; i++) {
								this.recordData[i] = { morning: { sugar: '', insulin: '' }, night: { sugar: '', insulin: '' } };
							}
							this.recordData.sugarCurve1 = [
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
							];
							this.recordData.sugarCurve2 = [
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
								{ time: '', sugar: '' },
							];
							set(ref(db, `users/milk/${this.currentYear}/${newValue + 1}`), this.recordData)
								.then(() => {})
								.catch((error) => {
									console.error('Error adding data:', error);
								});
						}
					},
					(error) => {
						console.error('Error reading Firebase data:', error);
					}
				);
			},
			immediate: true,
		},
		recordData: {
			handler() {
				this.createChart();
				this.creatSugarChart();
			},
			deep: true,
		},
	},
	mounted() {
		this.createChart();
		this.creatSugarChart();
	},
}).mount('#app');
