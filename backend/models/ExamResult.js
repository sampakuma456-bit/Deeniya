const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  subject: { type: String, required: true },
  marks: { type: Number, required: true },
  totalMarks: { type: Number, default: 100 },
  grade: { type: String },
  examType: { type: String, default: 'Midterm' },
  date: { type: String }
}, { timestamps: true });

examResultSchema.pre('save', function () {
  if (!this.grade && this.totalMarks > 0) {
    const pct = (this.marks / this.totalMarks) * 100;
    if (pct >= 80) this.grade = 'A';
    else if (pct >= 70) this.grade = 'B';
    else if (pct >= 60) this.grade = 'C';
    else if (pct >= 50) this.grade = 'D';
    else this.grade = 'F';
  }
});

module.exports = mongoose.model('ExamResult', examResultSchema);
