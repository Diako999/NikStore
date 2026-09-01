import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

ChartJS.defaults.font.family = "'IRANSans', 'Tahoma', sans-serif"
ChartJS.defaults.font.size   = 12
ChartJS.defaults.color       = '#64748B'
ChartJS.defaults.plugins.legend.rtl    = true
ChartJS.defaults.plugins.legend.labels.usePointStyle = true
ChartJS.defaults.plugins.tooltip.rtl  = true
