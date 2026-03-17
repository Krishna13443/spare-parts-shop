const mongoose = require('mongoose');

const widgetSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled' },
  type: { type: String, required: true, enum: ['Table', 'Pie chart', 'Bar chart', 'Line chart', 'Area chart', 'Scatter plot chart', 'KPI'] },
  description: { type: String },
  width: { type: Number, required: true, default: 4, min: 1 },
  height: { type: Number, required: true, default: 4, min: 1 },
  position: { type: Number, default: 0 },
  dataSettings: {
    columns: [String], // for Table
    chartData: String, // for Pie
    xAxis: String,     // for others
    yAxis: String,     // for others
    sortBy: String,
    pagination: Number,
    applyFilter: { type: Boolean, default: false },
    showLegend: { type: Boolean, default: true }
  },
  styling: {
    fontSize: { type: Number, default: 14 },
    headerBackground: { type: String, default: '#54bd95' },
    chartColor: { type: String, default: '#c97d3c' }
  },
  createdBy: { type: String }
}, { timestamps: true, bufferCommands: false });

module.exports = mongoose.model('Widget', widgetSchema);
